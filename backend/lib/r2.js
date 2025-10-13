import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

// Configure R2 client (S3-compatible)
const r2Client = new S3Client({
    region: "auto", // R2 uses 'auto' for region
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Upload a file to R2
 * @param {string} fileData - Base64 encoded file data
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<{url: string, key: string}>} - Public URL and storage key
 */
export const uploadFileToR2 = async (fileData, fileName, mimeType) => {
    try {
        // Remove base64 prefix if present
        const base64Data = fileData.replace(/^data:.+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Generate unique filename
        const fileExtension = fileName.split(".").pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const key = `discussion_files/${uniqueFileName}`;

        // Upload to R2 with public-read access
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
            CacheControl: 'public, max-age=31536000',
        });

        await r2Client.send(command);

        // Construct public URL - ensure no double slashes
        const publicUrl = process.env.R2_PUBLIC_URL.endsWith('/') 
            ? `${process.env.R2_PUBLIC_URL}${key}`
            : `${process.env.R2_PUBLIC_URL}/${key}`;

        return {
            url: publicUrl,
            key: key,
        };
    } catch (error) {
        console.error("Error uploading file to R2:", error);
        throw error;
    }
};

/**
 * Delete a file from R2
 * @param {string} key - The file key/path in R2
 * @returns {Promise<void>}
 */
export const deleteFileFromR2 = async (key) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        });

        await r2Client.send(command);
    } catch (error) {
        console.error("Error deleting file from R2:", error);
        throw error;
    }
};

/**
 * Extract the R2 key from a public URL
 * @param {string} url - The public URL
 * @returns {string} - The R2 key
 */
export const extractR2Key = (url) => {
    try {
        // Extract the key from the URL
        // Format: https://pub-xxx.r2.dev/discussion_files/filename.ext
        const urlObj = new URL(url);
        const key = urlObj.pathname.substring(1); // Remove leading slash
        return key;
    } catch (error) {
        console.error("Error extracting R2 key from URL:", error);
        // Fallback: assume the URL contains the key after the domain
        return url.split("/").slice(-2).join("/");
    }
};

export default r2Client;
