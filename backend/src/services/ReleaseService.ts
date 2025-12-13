import { MultipartFile } from '@fastify/multipart';
import { IReleaseService } from '../interfaces/IReleaseService';
import { ReleaseModel } from '../models/ReleaseModel';
import { TrackModel } from '../models/TrackModel';
import { storage } from './storage';
import { ICreateReleaseBody, IUpdateReleaseStatusBody } from '../types/requests';

// In-memory queue simulation helper
async function processRelease(releaseId: number) {
    console.log(`Processing release ${releaseId}...`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10s delay

    await ReleaseModel.updateStatus(releaseId, 'PENDING_REVIEW');
    console.log(`Release ${releaseId} processed. Ready for review.`);
}

export class ReleaseService implements IReleaseService {
    async list(user: { id: number; role: string }) {
        const { id, role } = user;
        const filters = role === 'ARTIST' ? { artistId: id } : {};
        return await ReleaseModel.findAll(filters);
    }

    async createDraft(user: { id: number }, body: ICreateReleaseBody) {
        const { title, genre, cover_url } = body;
        const artist_id = user.id;

        return await ReleaseModel.create({ artist_id, title, genre, cover_url });
    }

    async uploadTrack(releaseId: number, file: MultipartFile) {
        // Consumer must resume stream if not using it, but we are pumping it.
        // Actually, storage.upload handles the stream.

        if (!file) {
            throw { status: 400, message: 'No file uploaded' };
        }

        const url = await storage.upload(file, 'tracks');

        //TODO: Extract metadata (duration, isrc) using a library like music-metadata
        //TODO: filemname sanitization
        const title = file.filename; // Simple title from filename

        return await TrackModel.create({
            release_id: releaseId,
            title,
            audio_url: url,
            duration: 180, // Mock duration
            isrc: 'US1234567890' // Mock ISRC
        });
    }

    async submit(releaseId: number) {
        const release = await ReleaseModel.updateStatus(releaseId, 'PROCESSING');
        if (!release) throw { status: 404, message: 'Release not found' };

        // Trigger async processing
        //TODO : Create a separate service
        processRelease(releaseId);

        return release;
    }

    async review(user: { role: string }, releaseId: number, body: IUpdateReleaseStatusBody) {
        const { status } = body;

        if (user.role !== 'ADMIN') {
            throw { status: 403, message: 'Admin only' };
        }

        return await ReleaseModel.updateStatus(releaseId, status);
    }

    async getDetails(releaseId: number) {
        const release = await ReleaseModel.findById(releaseId);
        if (!release) throw { status: 404, message: 'Release not found' };

        const tracks = await TrackModel.findByReleaseId(releaseId);

        return { ...release, tracks };
    }

    async uploadCover(file: MultipartFile) {
        if (!file) throw { status: 400, message: 'No file' };
        const url = await storage.upload(file, 'covers');
        return { url };
    }
}
