import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import util from 'util';
import { MultipartFile } from '@fastify/multipart';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

const pump = util.promisify(pipeline);

export interface IFileStorage {
    upload(file: MultipartFile, folder: string): Promise<string>;
}

export class MockStorage implements IFileStorage {
    async upload(file: MultipartFile, folder: string): Promise<string> {
        // Consumer must resume stream if not using it, but we are pumping it.

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const filename = file.filename;
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, `${Date.now()}-${filename}`);
        const fileUrl = `/uploads/${path.basename(filePath)}`;

        await pump(file.file, fs.createWriteStream(filePath));

        return fileUrl;
    }
}

export class CloudinaryStorage implements IFileStorage {
    constructor() {
        // NOTE: CLOUDINARY_URL is automatically read by the SDK from process.env if present
        cloudinary.config({
            secure: true
        });
    }

    async upload(file: MultipartFile, folder: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `vwaza/${folder}`,
                    resource_type: 'auto', // auto detect image vs audio/video
                },
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error('Cloudinary upload failed'));
                    resolve(result.secure_url);
                }
            );

            file.file.pipe(uploadStream);
        });
    }
}

// Logic to select storage provider
export const storage = process.env.CLOUDINARY_URL
    ? new CloudinaryStorage()
    : new MockStorage();

console.log(`Using storage provider: ${process.env.CLOUDINARY_URL ? 'Cloudinary' : 'Local Mock'}`);
