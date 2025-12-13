export interface IUser {
    id: number;
    email: string;
    password_hash: string;
    role: 'ARTIST' | 'ADMIN';
    created_at?: Date;
}

export interface IRelease {
    id: number;
    artist_id: number;
    title: string;
    genre: string;
    cover_url: string | null;
    status: 'DRAFT' | 'PROCESSING' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
    reject_reason?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export interface ITrack {
    id: number;
    release_id: number;
    title: string;
    audio_url: string;
    duration: number;
    isrc: string | null;
    created_at?: Date;
}
