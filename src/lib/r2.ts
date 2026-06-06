import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

/**
 * Upload a file to Cloudflare R2.
 * @param key - The storage path (e.g., "payment-screenshots/event123/1234.png")
 * @param file - The File or Buffer to upload
 * @param contentType - MIME type of the file
 * @returns The storage key (store this in Supabase DB)
 */
export async function uploadToR2(
  key: string,
  file: File | Buffer,
  contentType: string
): Promise<string> {
  const body = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return key;
}

/**
 * Get a time-limited signed URL for private files (e.g., payment screenshots).
 * @param key - The storage key
 * @param expiresIn - Seconds until expiry (default 1 hour)
 */
export async function getR2SignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(r2, command, { expiresIn });
}

/**
 * Get the public URL for publicly accessible files (e.g., banners, QR codes).
 * Requires the R2 bucket to have a public access domain configured.
 */
export function getR2PublicUrl(key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
