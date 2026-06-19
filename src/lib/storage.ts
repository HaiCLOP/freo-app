/**
 * Unified storage layer.
 * - If creator has Google connected → uploads to their Google Drive
 * - Otherwise → falls back to Supabase Storage (1GB free)
 * 
 * This lets creators start free and simply connect Google for unlimited storage.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Helper for storage operations that bypasses restrictive RLS
function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Upload a file to the appropriate storage backend.
 * 
 * @param creatorId - The event creator's user ID
 * @param eventSlug - Event slug for folder naming
 * @param category - File category for organization
 * @param fileName - File name
 * @param file - The File to upload
 * @param isPublic - Whether the file should be publicly accessible
 * @returns URL or file reference string to store in DB
 */
export async function uploadFile(
  creatorId: string,
  eventSlug: string,
  category: "banner" | "upi-qr" | "payment-screenshots" | "custom-files",
  fileName: string,
  file: File,
  isPublic: boolean = false
): Promise<string> {
  // Check if creator has Google connected
  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("google_access_token")
    .eq("id", creatorId)
    .single();

  if (creator?.google_access_token) {
    // Use Google Drive
    try {
      const { uploadToDrive } = await import("@/lib/google-drive");
      const result = await uploadToDrive(creatorId, eventSlug, category, fileName, file, isPublic);
      return result.url;
    } catch (googleError: any) {
      console.error("Google Drive upload failed, falling back to Supabase Storage:", googleError?.message);
      // Fall through to Supabase Storage below instead of throwing
    }
  }

  // Fallback: Supabase Storage
  const bucketMap: Record<string, string> = {
    "banner": "event-banners",
    "upi-qr": "upi-qr-codes",
    "payment-screenshots": "payment-screenshots",
    "custom-files": "payment-screenshots",
  };

  const bucket = bucketMap[category] || "payment-screenshots";
  const key = `${eventSlug}/${fileName}`;

  const adminClient = getAdminClient();

  // Convert File to Buffer to avoid Next.js Native File issues with Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data, error } = await adminClient.storage
    .from(bucket)
    .upload(key, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  if (isPublic) {
    const { data: urlData } = adminClient.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  return data.path;
}

/**
 * Get a viewable URL for a stored file (typically payment screenshots).
 * Works with both Google Drive file IDs and Supabase Storage paths.
 */
export async function getFileUrl(
  creatorId: string,
  fileRef: string,
  bucket: string = "payment-screenshots",
  expiresIn: number = 3600
): Promise<string> {
  // If it's already a full URL, return as-is
  if (fileRef.startsWith("http")) return fileRef;

  // Check if creator has Google connected
  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("google_access_token")
    .eq("id", creatorId)
    .single();

  if (creator?.google_access_token) {
    // Google Drive file ID
    const { getDriveImageUrl } = await import("@/lib/google-drive");
    return getDriveImageUrl(creatorId, fileRef);
  }

  // Supabase Storage signed URL
  const adminClient = getAdminClient();
  const { data, error } = await adminClient.storage
    .from(bucket)
    .createSignedUrl(fileRef, expiresIn);

  if (error || !data) return "";
  return data.signedUrl;
}

/**
 * Get viewable URLs for multiple files in batch.
 */
export async function getFileUrls(
  creatorId: string,
  fileRefs: string[],
  bucket: string = "payment-screenshots",
  expiresIn: number = 3600
): Promise<Record<string, string>> {
  const urlMap: Record<string, string> = {};

  // Separate into full URLs and refs
  const fullUrls: string[] = [];
  const refs: string[] = [];

  fileRefs.forEach(ref => {
    if (ref.startsWith("http")) {
      urlMap[ref] = ref;
      fullUrls.push(ref);
    } else {
      refs.push(ref);
    }
  });

  if (refs.length === 0) return urlMap;

  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("google_access_token")
    .eq("id", creatorId)
    .single();

  if (creator?.google_access_token) {
    const { getDriveImageUrl } = await import("@/lib/google-drive");
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < refs.length; i += BATCH_SIZE) {
      const batch = refs.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (ref) => {
          try {
            const url = await getDriveImageUrl(creatorId, ref);
            return { ref, url };
          } catch {
            return { ref, url: "" };
          }
        })
      );
      
      batchResults.forEach(({ ref, url }) => {
        if (url) urlMap[ref] = url;
      });
    }
    
    return urlMap;
  }

  // Supabase batch signed URLs
  const adminClient = getAdminClient();
  const { data } = await adminClient.storage
    .from(bucket)
    .createSignedUrls(refs, expiresIn);

  if (data) {
    data.forEach((su) => {
      if (su.path && su.signedUrl) {
        urlMap[su.path] = su.signedUrl;
      }
    });
  }

  return urlMap;
}
