import { AuthService } from '../../services/AuthService';
import { UserModel } from '../../models/UserModel';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('../../models/UserModel');
jest.mock('bcrypt');

describe('AuthService', () => {
    let authService: AuthService;
    let mockJwtSigner: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockJwtSigner = {
            sign: jest.fn().mockReturnValue('mock-jwt-token')
        };
        authService = new AuthService(mockJwtSigner);
    });

    describe('register', () => {
        it('should register a new user with valid data', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                role: 'ARTIST' as const
            };

            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            (UserModel.create as jest.Mock).mockResolvedValue(mockUser);

            const result = await authService.register({
                email: 'test@example.com',
                password: 'password123',
                role: 'ARTIST'
            });

            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(UserModel.create).toHaveBeenCalledWith('test@example.com', 'hashed-password', 'ARTIST');
            expect(mockJwtSigner.sign).toHaveBeenCalledWith({
                id: 1,
                email: 'test@example.com',
                role: 'ARTIST'
            });
            expect(result).toEqual({
                token: 'mock-jwt-token',
                user: mockUser
            });
        });

        it('should throw error for missing fields', async () => {
            await expect(authService.register({
                email: '',
                password: 'password123',
                role: 'ARTIST'
            })).rejects.toEqual({
                status: 400,
                message: 'Missing fields'
            });
        });

        it('should throw error for invalid role', async () => {
            await expect(authService.register({
                email: 'test@example.com',
                password: 'password123',
                role: 'INVALID' as any
            })).rejects.toEqual({
                status: 400,
                message: 'Invalid role'
            });
        });

        it('should throw error for duplicate email', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            (UserModel.create as jest.Mock).mockRejectedValue({ code: '23505' });

            await expect(authService.register({
                email: 'existing@example.com',
                password: 'password123',
                role: 'ARTIST'
            })).rejects.toEqual({
                status: 409,
                message: 'Email already exists'
            });
        });
    });

    describe('login', () => {
        it('should login user with valid credentials', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password_hash: 'hashed-password',
                role: 'ARTIST' as const
            };

            (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await authService.login({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(UserModel.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
            expect(mockJwtSigner.sign).toHaveBeenCalledWith({
                id: 1,
                email: 'test@example.com',
                role: 'ARTIST'
            });
            expect(result).toEqual({
                token: 'mock-jwt-token',
                user: {
                    id: 1,
                    email: 'test@example.com',
                    role: 'ARTIST'
                }
            });
        });

        it('should throw error for non-existent user', async () => {
            (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);

            await expect(authService.login({
                email: 'nonexistent@example.com',
                password: 'password123'
            })).rejects.toEqual({
                status: 401,
                message: 'Invalid credentials'
            });
        });

        it('should throw error for invalid password', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password_hash: 'hashed-password',
                role: 'ARTIST' as const
            };

            (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(authService.login({
                email: 'test@example.com',
                password: 'wrongpassword'
            })).rejects.toEqual({
                status: 401,
                message: 'Invalid credentials'
            });
        });
    });
});
