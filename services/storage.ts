
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME || '';
const R2_PUBLIC_DOMAIN = import.meta.env.VITE_R2_PUBLIC_DOMAIN || '';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  }, 
});

export const uploadBase64Image = async (base64Data: string, fileName: string): Promise<string> => {
  try {
    const base64Content = base64Data.split(',')[1] || base64Data;
    const binaryString = window.atob(base64Content);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const contentType = base64Data.split(';')[0].split(':')[1] || 'image/png';

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: bytes,
      ContentType: contentType,
    });

    await s3Client.send(command);

    if (R2_PUBLIC_DOMAIN) {
        return `${R2_PUBLIC_DOMAIN}/${fileName}`;
    }
    return fileName;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw error;
  }
};
