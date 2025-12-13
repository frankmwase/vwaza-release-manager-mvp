import { FastifyRequest } from 'fastify';

export interface IRegisterBody {
    email: string;
    password: string;
    role: 'ARTIST' | 'ADMIN';
}

export interface ILoginBody {
    email: string;
    password: string;
}

export interface ICreateReleaseBody {
    title: string;
    genre: string;
    cover_url: string | null;
}

export interface IUpdateReleaseStatusBody {
    status: 'PUBLISHED' | 'REJECTED';
    reject_reason?: string;
}

export interface IReleaseParams {
    id: string;
}

export interface IFileUploadRequest extends FastifyRequest {
    file: () => Promise<import('@fastify/multipart').MultipartFile | undefined>;
}
