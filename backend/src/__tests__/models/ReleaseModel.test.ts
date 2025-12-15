import { ReleaseModel } from '../../models/ReleaseModel';
import { db } from '../../db';

// Mock the database
jest.mock('../../db', () => ({
    db: {
        query: jest.fn()
    }
}));

describe('ReleaseModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Status Transitions', () => {
        it('should update status from DRAFT to PROCESSING', async () => {
            const mockRelease = {
                id: 1,
                status: 'PROCESSING',
                title: 'Test Release',
                genre: 'Hip-Hop',
                artist_id: 1
            };

            (db.query as jest.Mock).mockResolvedValue({ rows: [mockRelease] });

            const result = await ReleaseModel.updateStatus(1, 'PROCESSING');

            expect(db.query).toHaveBeenCalledWith(
                'UPDATE releases SET status = $1, reject_reason = $2 WHERE id = $3 RETURNING *',
                ['PROCESSING', null, 1]
            );
            expect(result).toEqual(mockRelease);
            expect(result?.status).toBe('PROCESSING');
        });

        it('should update status to REJECTED with reason', async () => {
            const mockRelease = {
                id: 1,
                status: 'REJECTED',
                reject_reason: 'Quality issues',
                title: 'Test Release'
            };

            (db.query as jest.Mock).mockResolvedValue({ rows: [mockRelease] });

            const result = await ReleaseModel.updateStatus(1, 'REJECTED', 'Quality issues');

            expect(db.query).toHaveBeenCalledWith(
                'UPDATE releases SET status = $1, reject_reason = $2 WHERE id = $3 RETURNING *',
                ['REJECTED', 'Quality issues', 1]
            );
            expect(result?.status).toBe('REJECTED');
            expect(result?.reject_reason).toBe('Quality issues');
        });

        it('should update status to PUBLISHED', async () => {
            const mockRelease = {
                id: 1,
                status: 'PUBLISHED',
                title: 'Test Release'
            };

            (db.query as jest.Mock).mockResolvedValue({ rows: [mockRelease] });

            const result = await ReleaseModel.updateStatus(1, 'PUBLISHED');

            expect(result?.status).toBe('PUBLISHED');
        });
    });

    describe('Validation', () => {
        it('should create release with valid data', async () => {
            const mockRelease = {
                id: 1,
                artist_id: 1,
                title: 'Test Album',
                genre: 'Hip-Hop, R&B',
                cover_url: 'http://example.com/cover.jpg',
                status: 'DRAFT'
            };

            (db.query as jest.Mock).mockResolvedValue({ rows: [mockRelease] });

            const result = await ReleaseModel.create({
                artist_id: 1,
                title: 'Test Album',
                genre: 'Hip-Hop, R&B',
                cover_url: 'http://example.com/cover.jpg'
            });

            expect(db.query).toHaveBeenCalledWith(
                'INSERT INTO releases (artist_id, title, genre, cover_url, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [1, 'Test Album', 'Hip-Hop, R&B', 'http://example.com/cover.jpg', 'DRAFT']
            );
            expect(result).toEqual(mockRelease);
        });

        it('should find release by ID', async () => {
            const mockRelease = {
                id: 1,
                title: 'Test Release',
                status: 'DRAFT'
            };

            (db.query as jest.Mock).mockResolvedValue({ rows: [mockRelease] });

            const result = await ReleaseModel.findById(1);

            expect(db.query).toHaveBeenCalledWith('SELECT * FROM releases WHERE id = $1', [1]);
            expect(result).toEqual(mockRelease);
        });

        it('should return null for non-existent release', async () => {
            (db.query as jest.Mock).mockResolvedValue({ rows: [] });

            const result = await ReleaseModel.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('Query Operations', () => {
        it('should find all releases for an artist', async () => {
            const mockReleases = [
                { id: 1, title: 'Release 1', artist_id: 1 },
                { id: 2, title: 'Release 2', artist_id: 1 }
            ];

            (db.query as jest.Mock).mockResolvedValue({ rows: mockReleases });

            const result = await ReleaseModel.findAll({ artistId: 1 });

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM releases WHERE artist_id = $1 ORDER BY created_at DESC',
                [1]
            );
            expect(result).toEqual(mockReleases);
            expect(result).toHaveLength(2);
        });

        it('should find all releases without filter', async () => {
            const mockReleases = [
                { id: 1, title: 'Release 1' },
                { id: 2, title: 'Release 2' }
            ];

            (db.query as jest.Mock).mockResolvedValue({ rows: mockReleases });

            const result = await ReleaseModel.findAll();

            expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM releases ORDER BY created_at DESC',
                []
            );
            expect(result).toEqual(mockReleases);
        });
    });
});
