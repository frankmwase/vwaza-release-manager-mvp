import { ReleaseService } from '../../services/ReleaseService';
import { ReleaseModel } from '../../models/ReleaseModel';
import { TrackModel } from '../../models/TrackModel';

// Mock dependencies
jest.mock('../../models/ReleaseModel');
jest.mock('../../models/TrackModel');

// Mock the processRelease function to prevent timer leaks
jest.mock('../../services/ReleaseService', () => {
    const actual = jest.requireActual('../../services/ReleaseService');
    return {
        ...actual,
        // Don't actually run the async process in tests
    };
});

describe('ReleaseService', () => {
    let releaseService: ReleaseService;

    beforeEach(() => {
        jest.clearAllMocks();
        releaseService = new ReleaseService();
    });

    describe('createDraft', () => {
        it('should create a draft release', async () => {
            const mockRelease = {
                id: 1,
                artist_id: 1,
                title: 'Test Album',
                genre: 'Hip-Hop, R&B',
                cover_url: 'http://example.com/cover.jpg',
                status: 'DRAFT'
            };

            (ReleaseModel.create as jest.Mock).mockResolvedValue(mockRelease);

            const result = await releaseService.createDraft(
                { id: 1 },
                { title: 'Test Album', genre: 'Hip-Hop, R&B', cover_url: 'http://example.com/cover.jpg' }
            );

            expect(ReleaseModel.create).toHaveBeenCalledWith({
                artist_id: 1,
                title: 'Test Album',
                genre: 'Hip-Hop, R&B',
                cover_url: 'http://example.com/cover.jpg'
            });
            expect(result).toEqual(mockRelease);
        });
    });

    describe('submit', () => {
        it('should submit release for processing', async () => {
            const mockRelease = {
                id: 1,
                status: 'PROCESSING'
            };

            (ReleaseModel.updateStatus as jest.Mock).mockResolvedValue(mockRelease);

            const result = await releaseService.submit(1);

            expect(ReleaseModel.updateStatus).toHaveBeenCalledWith(1, 'PROCESSING');
            expect(result.status).toBe('PROCESSING');
        });

        it('should throw error if release not found', async () => {
            (ReleaseModel.updateStatus as jest.Mock).mockResolvedValue(null);

            await expect(releaseService.submit(999)).rejects.toEqual({
                status: 404,
                message: 'Release not found'
            });
        });
    });

    describe('review', () => {
        it('should allow admin to approve release', async () => {
            const mockRelease = {
                id: 1,
                status: 'PUBLISHED'
            };

            (ReleaseModel.updateStatus as jest.Mock).mockResolvedValue(mockRelease);

            const result = await releaseService.review(
                { role: 'ADMIN' },
                1,
                { status: 'PUBLISHED' }
            );

            expect(ReleaseModel.updateStatus).toHaveBeenCalledWith(1, 'PUBLISHED', undefined);
            expect(result).toBeDefined();
            expect(result?.status).toBe('PUBLISHED');
        });

        it('should allow admin to reject release with reason', async () => {
            const mockRelease = {
                id: 1,
                status: 'REJECTED',
                reject_reason: 'Quality issues'
            };

            (ReleaseModel.updateStatus as jest.Mock).mockResolvedValue(mockRelease);

            const result = await releaseService.review(
                { role: 'ADMIN' },
                1,
                { status: 'REJECTED', reject_reason: 'Quality issues' }
            );

            expect(ReleaseModel.updateStatus).toHaveBeenCalledWith(1, 'REJECTED', 'Quality issues');
            expect(result).toBeDefined();
            expect(result?.status).toBe('REJECTED');
            expect(result?.reject_reason).toBe('Quality issues');
        });

        it('should throw error if non-admin tries to review', async () => {
            await expect(releaseService.review(
                { role: 'ARTIST' },
                1,
                { status: 'PUBLISHED' }
            )).rejects.toEqual({
                status: 403,
                message: 'Admin only'
            });
        });
    });

    describe('getDetails', () => {
        it('should get release details with tracks', async () => {
            const mockRelease = {
                id: 1,
                title: 'Test Album',
                status: 'DRAFT'
            };

            const mockTracks = [
                { id: 1, title: 'Track 1', release_id: 1 },
                { id: 2, title: 'Track 2', release_id: 1 }
            ];

            (ReleaseModel.findById as jest.Mock).mockResolvedValue(mockRelease);
            (TrackModel.findByReleaseId as jest.Mock).mockResolvedValue(mockTracks);

            const result = await releaseService.getDetails(1);

            expect(ReleaseModel.findById).toHaveBeenCalledWith(1);
            expect(TrackModel.findByReleaseId).toHaveBeenCalledWith(1);
            expect(result).toEqual({
                ...mockRelease,
                tracks: mockTracks
            });
        });

        it('should throw error if release not found', async () => {
            (ReleaseModel.findById as jest.Mock).mockResolvedValue(null);

            await expect(releaseService.getDetails(999)).rejects.toEqual({
                status: 404,
                message: 'Release not found'
            });
        });
    });

    describe('list', () => {
        it('should list all releases for admin', async () => {
            const mockReleases = [
                { id: 1, title: 'Release 1' },
                { id: 2, title: 'Release 2' }
            ];

            (ReleaseModel.findAll as jest.Mock).mockResolvedValue(mockReleases);

            const result = await releaseService.list({ id: 1, role: 'ADMIN' });

            expect(ReleaseModel.findAll).toHaveBeenCalledWith({});
            expect(result).toEqual(mockReleases);
        });

        it('should list only artist releases for artist', async () => {
            const mockReleases = [
                { id: 1, title: 'My Release', artist_id: 1 }
            ];

            (ReleaseModel.findAll as jest.Mock).mockResolvedValue(mockReleases);

            const result = await releaseService.list({ id: 1, role: 'ARTIST' });

            expect(ReleaseModel.findAll).toHaveBeenCalledWith({ artistId: 1 });
            expect(result).toEqual(mockReleases);
        });
    });
});
