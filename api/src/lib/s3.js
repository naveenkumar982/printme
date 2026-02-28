/**
 * S3 Upload Library for PrintME.
 *
 * Handles file uploads to AWS S3 (or local filesystem as fallback).
 * In production, set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
 * AWS_REGION, and S3_BUCKET in your .env.
 *
 * For local development, files are saved to /api/uploads/.
 */

import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

const USE_S3 = !!(process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET);

let s3Client = null;

/**
 * Lazily initialize S3 client (only when AWS creds are configured).
 */
async function getS3Client() {
    if (s3Client) return s3Client;

    const { S3Client } = await import('@aws-sdk/client-s3');
    s3Client = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
    return s3Client;
}

/**
 * Upload a file buffer to S3 or local filesystem.
 * @param {Buffer} buffer - File content
 * @param {string} originalName - Original filename
 * @param {string} folder - Subfolder (e.g., 'designs', 'products')
 * @param {string} contentType - MIME type
 * @returns {{ url: string, key: string }}
 */
export async function uploadFile(buffer, originalName, folder = 'uploads', contentType = 'image/png') {
    const ext = path.extname(originalName) || '.png';
    const key = `${folder}/${randomUUID()}${ext}`;

    if (USE_S3) {
        const { PutObjectCommand } = await import('@aws-sdk/client-s3');
        const client = await getS3Client();

        await client.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'max-age=31536000',
        }));

        const url = process.env.CDN_URL
            ? `${process.env.CDN_URL}/${key}`
            : `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;

        return { url, key };
    }

    // Local fallback — save to /api/uploads/
    const localDir = path.join(UPLOADS_DIR, folder);
    await fs.mkdir(localDir, { recursive: true });

    const localPath = path.join(UPLOADS_DIR, key);
    await fs.writeFile(localPath, buffer);

    const url = `/uploads/${key}`;
    return { url, key };
}

/**
 * Delete a file from S3 or local filesystem.
 * @param {string} key - The file key (path)
 */
export async function deleteFile(key) {
    if (!key) return;

    if (USE_S3) {
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const client = await getS3Client();

        await client.send(new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
        }));
        return;
    }

    // Local fallback
    const localPath = path.join(UPLOADS_DIR, key);
    await fs.unlink(localPath).catch(() => { });
}

/**
 * Generate a presigned URL for direct upload from the client.
 * Only available when S3 is configured.
 * @param {string} folder - Subfolder
 * @param {string} contentType - MIME type
 * @param {number} expiresIn - URL expiry in seconds (default 300)
 * @returns {{ url: string, key: string }}
 */
export async function getPresignedUploadUrl(folder, contentType, expiresIn = 300) {
    if (!USE_S3) {
        const err = new Error('Presigned URLs require S3 configuration');
        err.status = 501;
        throw err;
    }

    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const client = await getS3Client();

    const ext = contentType.split('/')[1] || 'png';
    const key = `${folder}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        ContentType: contentType,
    });

    const url = await getSignedUrl(client, command, { expiresIn });
    return { url, key };
}
