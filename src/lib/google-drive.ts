import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";

/**
 * Google Drive utility — stores event files in the creator's personal Drive.
 * 
 * Folder structure:
 *   My Drive/
 *   └── Freo Events/
 *       ├── {event-slug}/
 *       │   ├── banner.jpg
 *       │   ├── upi-qr.png
 *       │   └── payment-screenshots/
 *       │       ├── 1234567890-payment.jpg
 *       │       └── ...
 *       └── {another-event}/
 *           └── ...
 */

/**
 * Get an authenticated Drive client for a creator.
 */
async function getDriveClient(creatorId: string) {
  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("google_access_token, google_refresh_token, google_drive_folder_id")
    .eq("id", creatorId)
    .single();

  if (!creator?.google_access_token) {
    throw new Error("Google account not connected. Please connect in Settings.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: creator.google_access_token,
    refresh_token: creator.google_refresh_token,
  });

  // Auto-refresh tokens
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      const sb = await createClient();
      await sb
        .from("creators")
        .update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token || creator.google_refresh_token,
          google_token_updated_at: new Date().toISOString(),
        })
        .eq("id", creatorId);
    }
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  return { drive, folderId: creator.google_drive_folder_id };
}

/**
 * Ensure the root "Freo Events" folder exists in the creator's Drive.
 * Creates it if missing and saves the ID.
 */
async function ensureRootFolder(creatorId: string): Promise<string> {
  const { drive, folderId } = await getDriveClient(creatorId);

  // Already have a folder ID saved
  if (folderId) {
    try {
      // Verify it still exists
      await drive.files.get({ fileId: folderId, fields: "id" });
      return folderId;
    } catch {
      // Folder was deleted — recreate
    }
  }

  // Search for existing "Freo Events" folder
  const searchRes = await drive.files.list({
    q: `name='Freo Events' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    spaces: "drive",
    fields: "files(id, name)",
  });

  if (searchRes.data.files && searchRes.data.files.length > 0) {
    const existingId = searchRes.data.files[0].id!;
    // Save for future use
    const supabase = await createClient();
    await supabase
      .from("creators")
      .update({ google_drive_folder_id: existingId })
      .eq("id", creatorId);
    return existingId;
  }

  // Create the folder
  const folderRes = await drive.files.create({
    requestBody: {
      name: "Freo Events",
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });

  const newFolderId = folderRes.data.id!;

  // Save to DB
  const supabase = await createClient();
  await supabase
    .from("creators")
    .update({ google_drive_folder_id: newFolderId })
    .eq("id", creatorId);

  return newFolderId;
}

/**
 * Ensure an event subfolder exists under "Freo Events".
 */
async function ensureEventFolder(
  creatorId: string,
  eventSlug: string
): Promise<string> {
  const rootFolderId = await ensureRootFolder(creatorId);
  const { drive } = await getDriveClient(creatorId);

  // Check if subfolder exists
  const searchRes = await drive.files.list({
    q: `name='${eventSlug}' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    spaces: "drive",
    fields: "files(id)",
  });

  if (searchRes.data.files && searchRes.data.files.length > 0) {
    return searchRes.data.files[0].id!;
  }

  // Create event subfolder
  const folderRes = await drive.files.create({
    requestBody: {
      name: eventSlug,
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootFolderId],
    },
    fields: "id",
  });

  return folderRes.data.id!;
}

/**
 * Upload a file to the creator's Google Drive.
 */
export async function uploadToDrive(
  creatorId: string,
  eventSlug: string,
  category: string,
  fileName: string,
  file: File,
  isPublic: boolean = false
): Promise<{ url: string; fileId: string }> {
  const eventFolderId = await ensureEventFolder(creatorId, eventSlug);
  const { drive } = await getDriveClient(creatorId);

  // For payment screenshots, create a sub-subfolder
  let parentId = eventFolderId;
  if (category === "payment-screenshots") {
    const searchRes = await drive.files.list({
      q: `name='Payment Screenshots' and '${eventFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      spaces: "drive",
      fields: "files(id)",
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      parentId = searchRes.data.files[0].id!;
    } else {
      const subFolder = await drive.files.create({
        requestBody: {
          name: "Payment Screenshots",
          mimeType: "application/vnd.google-apps.folder",
          parents: [eventFolderId],
        },
        fields: "id",
      });
      parentId = subFolder.data.id!;
    }
  }

  // Convert File to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload the file
  const uploadRes = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [parentId],
    },
    media: {
      mimeType: file.type || "application/octet-stream",
      body: require("stream").Readable.from(buffer),
    },
    fields: "id, webViewLink, webContentLink",
  });

  const fileId = uploadRes.data.id!;

  // Make publicly viewable if needed (banners, QR codes)
  if (isPublic) {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
  }

  // Return a direct viewable URL
  const url = isPublic
    ? `https://drive.google.com/uc?id=${fileId}&export=view`
    : fileId; // Store file ID for private files, resolve URL later

  return { url, fileId };
}

/**
 * Get a viewable URL for a Google Drive file.
 * For private files (payment screenshots), generates a temporary signed URL.
 */
export async function getDriveImageUrl(
  creatorId: string,
  fileIdOrUrl: string
): Promise<string> {
  // Already a URL
  if (fileIdOrUrl.startsWith("http")) return fileIdOrUrl;

  // It's a file ID — generate a direct URL
  const { drive } = await getDriveClient(creatorId);

  try {
    // First check if the file is publicly shared
    const file = await drive.files.get({
      fileId: fileIdOrUrl,
      fields: "id, shared, webContentLink",
    });

    if (file.data.shared) {
      return `https://drive.google.com/uc?id=${fileIdOrUrl}&export=view`;
    }

    // Removed insecure public permission creation.
    // Instead, return the secure web view link which requires the creator
    // to be logged into their Google account. This prevents PII leakage.
    return file.data.webViewLink || `https://drive.google.com/file/d/${fileIdOrUrl}/view`;
  } catch (error) {
    console.error("Failed to get Drive image URL:", error);
    return "";
  }
}
