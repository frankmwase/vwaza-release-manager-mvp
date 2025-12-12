import { FastifyInstance } from 'fastify';
import { ReleaseController } from '../controllers/ReleaseController';
import { ICreateReleaseBody, IFileUploadRequest, IReleaseParams, IUpdateReleaseStatusBody } from '../types/requests';

export async function releaseRoutes(fastify: FastifyInstance) {

    // List Releases
    fastify.get('/releases', {
        preValidation: [fastify.authenticate]
    }, ReleaseController.list);

    // Create Release Draft
    fastify.post<{ Body: ICreateReleaseBody }>('/releases', {
        preValidation: [fastify.authenticate]
    }, ReleaseController.createDraft);

    // Upload Track
    fastify.post<{ Params: IReleaseParams }>('/releases/:id/tracks', {
        preValidation: [fastify.authenticate]
    }, ReleaseController.uploadTrack as any); 
    //TODO: Check Typescript signature mismatch
    // Casting as any for Multipart compatibility issues with strict types temporarily or we fix the controller signature match

    // Submit Release (Start Processing)
    fastify.put<{ Params: IReleaseParams }>('/releases/:id/submit', {
        preValidation: [fastify.authenticate]
    }, ReleaseController.submit);

    // Admin: Approve/Reject
    fastify.put<{ Body: IUpdateReleaseStatusBody, Params: IReleaseParams }>('/releases/:id/review', {
        preValidation: [fastify.authenticate]
    }, ReleaseController.review);

    // Get Release Details (with tracks)
    fastify.get<{ Params: IReleaseParams }>('/releases/:id', {
        preValidation: [fastify.authenticate]
    }, ReleaseController.getDetails);

    // Upload Cover Art Endpoint
    fastify.post('/upload/cover', {
        preValidation: [fastify.authenticate]
    }, ReleaseController.uploadCover as any);

}
