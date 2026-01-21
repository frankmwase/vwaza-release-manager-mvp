import fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import fjwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import path from 'path';
import fastifyStatic from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import { db } from './db';
import { authRoutes } from './routes/auth';
import { itemRoutes } from './routes/items';

import { FastifyRequest, FastifyReply } from 'fastify';

dotenv.config();

const server = fastify({ logger: true });

// Rate Limiting: 100 requests per minute
server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
});

server.setErrorHandler((error: any, request, reply) => {
    server.log.error(error);
    const statusCode = error.statusCode || 500;
    const message = error.validation ? 'Validation Error' : error.message || 'Internal Server Error';
    reply.status(statusCode).send({
        status: 'error',
        code: statusCode,
        message,
        details: error.validation
    });
});

server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
});
server.register(multipart);
server.register(fjwt, {
    secret: process.env.JWT_SECRET || 'supersecret'
});

// Registering static with serve: false to use sendFile manually
server.register(fastifyStatic, {
    root: path.join(__dirname, '../uploads'),
    serve: false,
    decorateReply: true
});

server.get<{ Params: { filename: string }, Querystring: { token?: string } }>('/uploads/:filename', async (request, reply) => {
    const { filename } = request.params;

    // Custom Auth: Check Header OR Query Param (for img/audio tags)
    let token = request.headers.authorization?.replace('Bearer ', '');

    if (!token && request.query.token) {
        token = request.query.token;
    }

    if (!token) {
        return reply.status(401).send({ message: 'Missing token' });
    }

    try {
        request.user = server.jwt.verify(token);
    } catch (err) {
        return reply.status(401).send({ message: 'Invalid token' });
    }

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return reply.status(400).send({ message: 'Invalid filename' });
    }


    // This route is only for local dev fallback or if storage provider mimics fs.
    return reply.sendFile(filename, path.join(__dirname, '../uploads'));
});

server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
});

server.register(authRoutes);
server.register(itemRoutes);


server.get('/health', async (request, reply) => {
    try {
        const result = await db.query('SELECT NOW()');
        return { status: 'ok', time: result.rows[0].now };
    } catch (err) {
        server.log.error(err);
        return reply.status(500).send({ status: 'error', message: 'Database connection failed' });
    }
});

// Graceful shutdown
server.addHook('onClose', async (instance) => {
    await db.end();
});

export { server };
