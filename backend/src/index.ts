import fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import fjwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import path from 'path';
import fastifyStatic from '@fastify/static';
import { db } from './db';
import { authRoutes } from './routes/auth';
import { releaseRoutes } from './routes/releases';
import { log } from 'console';

dotenv.config();

const server = fastify({ logger: true });

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

    return reply.sendFile(filename, path.join(__dirname, '../uploads'));
});

import { FastifyRequest, FastifyReply } from 'fastify';

server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
});

server.register(authRoutes);
server.register(releaseRoutes);

server.get('/health', async (request, reply) => {
    try {
        const result = await db.query('SELECT NOW()');
        return { status: 'ok', time: result.rows[0].now };
    } catch (err) {
        server.log.error(err);
        return reply.status(500).send({ status: 'error', message: 'Database connection failed' });
    }
});

const start = async () => {
    try {
        const PORT = process.env.PORT || 3000;
        await server.listen({ port: Number(PORT), host: '0.0.0.0' });
        console.log(`Server listening at http://localhost:${PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
