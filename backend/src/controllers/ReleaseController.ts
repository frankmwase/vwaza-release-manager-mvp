import { FastifyReply, FastifyRequest } from 'fastify';
import { ICreateReleaseBody, IFileUploadRequest, IReleaseParams, IUpdateReleaseStatusBody } from '../types/requests';
import { ReleaseService } from '../services/ReleaseService';

export class ReleaseController {
    private static releaseService = new ReleaseService();

    static async list(request: FastifyRequest, reply: FastifyReply) {
        const { id, role } = request.user;
        return await ReleaseController.releaseService.list({ id, role });
    }

    static async createDraft(request: FastifyRequest<{ Body: ICreateReleaseBody }>, reply: FastifyReply) {
        const user = { id: request.user.id };
        return await ReleaseController.releaseService.createDraft(user, request.body);
    }

    static async uploadTrack(request: IFileUploadRequest & FastifyRequest<{ Params: IReleaseParams }>, reply: FastifyReply) {
        const releaseId = parseInt(request.params.id);
        const data = await request.file();

        if (!data) {
            return reply.status(400).send({ message: 'No file uploaded' });
        }

        try {
            return await ReleaseController.releaseService.uploadTrack(releaseId, data);
        } catch (err: any) {
            const status = err.status || 500;
            return reply.status(status).send({ message: err.message || 'Internal Server Error' });
        }
    }

    static async submit(request: FastifyRequest<{ Params: IReleaseParams }>, reply: FastifyReply) {
        const releaseId = parseInt(request.params.id);

        try {
            return await ReleaseController.releaseService.submit(releaseId);
        } catch (err: any) {
            const status = err.status || 500;
            return reply.status(status).send({ message: err.message || 'Internal Server Error' });
        }
    }

    static async review(request: FastifyRequest<{ Body: IUpdateReleaseStatusBody, Params: IReleaseParams }>, reply: FastifyReply) {
        const releaseId = parseInt(request.params.id);
        const user = { role: request.user.role };

        try {
            return await ReleaseController.releaseService.review(user, releaseId, request.body);
        } catch (err: any) {
            const status = err.status || 500;
            return reply.status(status).send({ message: err.message || 'Internal Server Error' });
        }
    }

    static async getDetails(request: FastifyRequest<{ Params: IReleaseParams }>, reply: FastifyReply) {
        const releaseId = parseInt(request.params.id);

        try {
            return await ReleaseController.releaseService.getDetails(releaseId);
        } catch (err: any) {
            const status = err.status || 500;
            return reply.status(status).send({ message: err.message || 'Internal Server Error' });
        }
    }

    static async uploadCover(request: IFileUploadRequest, reply: FastifyReply) {
        const data = await request.file();
        if (!data) return reply.status(400).send({ message: 'No file' });

        try {
            return await ReleaseController.releaseService.uploadCover(data);
        } catch (err: any) {
            const status = err.status || 500;
            return reply.status(status).send({ message: err.message || 'Internal Server Error' });
        }
    }
}
