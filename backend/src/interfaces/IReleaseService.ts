import { MultipartFile } from '@fastify/multipart';
import { ICreateReleaseBody, IFileUploadRequest, IUpdateReleaseStatusBody } from '../types/requests';

export interface IReleaseService {
    list(user: { id: number; role: string }): Promise<any[]>;
    createDraft(user: { id: number }, body: ICreateReleaseBody): Promise<any>;
    uploadTrack(releaseId: number, file: MultipartFile): Promise<any>;
    submit(releaseId: number): Promise<any>;
    review(user: { role: string }, releaseId: number, body: IUpdateReleaseStatusBody): Promise<any>;
    getDetails(releaseId: number): Promise<any>;
    uploadCover(file: MultipartFile): Promise<{ url: string }>;
}
