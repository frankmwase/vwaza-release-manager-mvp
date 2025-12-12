import { FastifyReply, FastifyRequest } from 'fastify';
import { ReleaseModel } from '../models/ReleaseModel';
import { TrackModel } from '../models/TrackModel';
import { storage } from '../services/storage';
import { ICreateReleaseBody, IFileUploadRequest, IReleaseParams, IUpdateReleaseStatusBody } from '../types/requests';

// In-memory queue simulation helper
async function processRelease(releaseId: number) {
    console.log(`Processing release ${releaseId}...`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10s delay

    await ReleaseModel.updateStatus(releaseId, 'PENDING_REVIEW');
    console.log(`Release ${releaseId} processed. Ready for review.`);
}

export class ReleaseController {
    static async list(request: FastifyRequest, reply: FastifyReply) {
        //NOTE: Authenticate decorator attaches user, but TypeScript needs declaration merging or assertion
        const { id, role } = request.user;
        const filters = role === 'ARTIST' ? { artistId: id } : {};
        return await ReleaseModel.findAll(filters);
    }

    static async createDraft(request: FastifyRequest<{ Body: ICreateReleaseBody }>, reply: FastifyReply) {
        const { title, genre, cover_url } = request.body;
        const artist_id = request.user.id;

        return await ReleaseModel.create({ artist_id, title, genre, cover_url });
    }

    static async uploadTrack(request: IFileUploadRequest & FastifyRequest<{ Params: IReleaseParams }>, reply: FastifyReply) {
        const releaseId = parseInt(request.params.id);
        const data = await request.file();

        if (!data) {
            return reply.status(400).send({ message: 'No file uploaded' });
        }

        const url = await storage.upload(data, 'tracks');

        //TODO: Extract metadata (duration, isrc) using a library like music-metadata
        //TODO: filemname sanitization
        const title = data.filename; // Simple title from filename

        return await TrackModel.create({
            release_id: releaseId,
            title,
            audio_url: url,
            duration: 180, // Mock duration
            isrc: 'US1234567890' // Mock ISRC
        });
    }

    static async submit(request: FastifyRequest<{ Params: IReleaseParams }>, reply: FastifyReply) {
        const releaseId = parseInt(request.params.id);

        const release = await ReleaseModel.updateStatus(releaseId, 'PROCESSING');
        if (!release) return reply.status(404).send();

        // Trigger async processing
        //TODO : Create a separate service
        processRelease(releaseId);

        return release;
    }

    static async review(request: FastifyRequest<{ Body: IUpdateReleaseStatusBody, Params: IReleaseParams }>, reply: FastifyReply) {
        const { status } = request.body;
        const releaseId = parseInt(request.params.id);

        if (request.user.role !== 'ADMIN') {
            return reply.status(403).send({ message: 'Admin only' });
        }

        return await ReleaseModel.updateStatus(releaseId, status);
    }

    static async getDetails(request: FastifyRequest<{ Params: IReleaseParams }>, reply: FastifyReply) {
        const releaseId = parseInt(request.params.id);

        const release = await ReleaseModel.findById(releaseId);
        if (!release) return reply.status(404).send();

        const tracks = await TrackModel.findByReleaseId(releaseId);

        return { ...release, tracks };
    }

    static async uploadCover(request: IFileUploadRequest, reply: FastifyReply) {
        const data = await request.file();
        if (!data) return reply.status(400).send({ message: 'No file' });
        const url = await storage.upload(data, 'covers');
        return { url };
    }
}
