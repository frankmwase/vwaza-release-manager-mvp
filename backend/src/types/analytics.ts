export interface IAnalyticsOverview {
    totalReleases: number;
    totalArtists: number;
    releasesByStatus: {
        status: string;
        count: number;
        percentage: number;
    }[];
}

export interface ITopArtist {
    artist_id: number;
    artist_email: string;
    release_count: number;
    published_count: number;
    pending_count: number;
}

export interface IGenreStats {
    genre: string;
    count: number;
    percentage: number;
}

export interface ITrendDataPoint {
    date: string;
    count: number;
}

export interface IRecentRelease {
    id: number;
    title: string;
    genre: string;
    status: string;
    artist_email: string;
    created_at: Date;
    track_count: number;
}

export interface IAnalyticsData {
    overview: IAnalyticsOverview;
    topArtists: ITopArtist[];
    genreStats: IGenreStats[];
    releaseTrends: ITrendDataPoint[];
    recentReleases: IRecentRelease[];
}
