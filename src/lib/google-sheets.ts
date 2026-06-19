import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";

/**
 * Google Sheets + Drive utility using the creator's OAuth tokens.
 * 
 * When a creator connects their Google account in Settings,
 * this utility can:
 *   - Auto-create a Google Sheet in their Drive
 *   - Write registration data directly to their Sheet
 *   - Update statuses in their Sheet
 * 
 * Falls back to service account if OAuth is not available.
 */

// ---------- Auth Helpers ----------

/**
 * Get an authenticated Google client using the creator's OAuth tokens.
 * Falls back to service account if no OAuth tokens exist.
 */
async function getGoogleAuth(creatorId: string) {
  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("google_access_token, google_refresh_token")
    .eq("id", creatorId)
    .single();

  // If creator has connected Google via OAuth, use their token
  if (creator?.google_access_token) {
    const redirectUri = process.env.NODE_ENV === "production" 
      ? "https://freo.haicloplabs.in/api/google/callback"
      : "http://localhost:3000/api/google/callback";

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    oauth2Client.setCredentials({
      access_token: creator.google_access_token,
      refresh_token: creator.google_refresh_token,
    });

    // Auto-refresh: save new tokens when refreshed
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

    // Proactively refresh if token might be expired
    try {
      const tokenInfo = await oauth2Client.getAccessToken();
      if (tokenInfo.token && tokenInfo.token !== creator.google_access_token) {
        // Token was refreshed, save it
        const sb = await createClient();
        await sb.from("creators").update({
          google_access_token: tokenInfo.token,
          google_token_updated_at: new Date().toISOString(),
        }).eq("id", creatorId);
      }
    } catch (refreshError: any) {
      console.error("Failed to proactively refresh Google token:", refreshError?.message);
      // Continue anyway — the API call might still work with the existing token
    }

    return { auth: oauth2Client, isOAuth: true };
  }

  // Fallback: use service account
  const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credentialsBase64) {
    throw new Error("No Google credentials available. Connect your Google account in Settings.");
  }

  const credentialsJson = JSON.parse(Buffer.from(credentialsBase64, "base64").toString("utf-8"));

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentialsJson.client_email,
      private_key: credentialsJson.private_key,
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });

  return { auth, isOAuth: false };
}

// ---------- Sheet Auto-Creation ----------

/**
 * Auto-create a Google Sheet for an event in the creator's Drive.
 * Returns the spreadsheet ID.
 */
export async function autoCreateSheet(
  creatorId: string,
  eventName: string,
  formType: 'event' | 'survey' = 'event',
  driveFolderId?: string
): Promise<string> {
  const { auth } = await getGoogleAuth(creatorId);
  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  // 1. Create the spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `${eventName} — Registrations`,
      },
      sheets: [
        {
          properties: {
            title: "Registrations",
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    },
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId!;

    const baseHeaders = ["Name", "Phone", "Email"];
    if (formType !== "survey") baseHeaders.push("UTR ID");
    baseHeaders.push("Status", "Registered At", "Approved At");
    if (formType !== "survey") baseHeaders.push("Payment Screenshot URL");

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Registrations!A1:Z1",
      valueInputOption: "RAW",
      requestBody: {
        values: [baseHeaders],
      },
    });

  // 3. Format headers
  const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId || 0;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
                textFormat: { bold: true },
              },
            },
            fields: "userEnteredFormat(backgroundColor,textFormat)",
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: "ROWS", startIndex: 1, endIndex: 1000 },
            properties: { pixelSize: 60 },
            fields: "pixelSize",
          },
        },
        {
          autoResizeDimensions: {
            dimensions: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 10 },
          },
        },
      ],
    },
  });

  // 4. Move to Freo Events folder if creator has one
  if (driveFolderId) {
    try {
      // Get current parent
      const file = await drive.files.get({
        fileId: spreadsheetId,
        fields: "parents",
      });

      const previousParents = file.data.parents?.join(",") || "";

      await drive.files.update({
        fileId: spreadsheetId,
        addParents: driveFolderId,
        removeParents: previousParents,
        fields: "id, parents",
      });
    } catch (err) {
      console.error("Failed to move sheet to Freo folder:", err);
      // Non-critical — sheet still works, just not in the folder
    }
  }

  return spreadsheetId;
}

// ---------- Sheet Operations ----------

/**
 * Append a registration row to a Google Sheet.
 */
export async function appendRowToSheet(
  creatorId: string,
  spreadsheetId: string,
  values: (string | number | boolean | null)[] | Record<string, any>
) {
  if (!spreadsheetId) return;

  try {
    const { auth } = await getGoogleAuth(creatorId);
    const sheets = google.sheets({ version: "v4", auth });

    let finalArray: any[] = [];

    if (!Array.isArray(values)) {
      // It's a Record. Fetch headers to map it correctly.
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Registrations!1:1",
      });
      const headers = headerRes.data.values?.[0] || [];
      
      finalArray = headers.map(header => {
        const val = values[header];
        return val !== undefined && val !== null ? val : "";
      });

      if (headers.length === 0) {
        // Fallback if headers are completely missing
        finalArray = Object.values(values);
      }
    } else {
      finalArray = values; // Legacy array fallback
    }

    // Sanitize values to prevent Spreadsheet Formula Injection (CSV Injection)
    // Any value starting with =, +, -, or @ could be interpreted as a formula.
    const sanitizedValues = finalArray.map(val => {
      if (typeof val === 'string') {
        // Allow explicit IMAGE and HYPERLINK formulas for screenshots
        if (val.startsWith('=IMAGE(') || val.startsWith('=HYPERLINK(')) {
          return val;
        }
        if (/^[=+\-@]/.test(val)) {
          return "'" + val; // Prefix with single quote to force plain text
        }
      }
      return val;
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Registrations!A:Z", // Changed to Z to allow for more custom fields
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [sanitizedValues],
      },
    });
  } catch (error) {
    console.error("Failed to append row to Google Sheet:", error);
    throw error;
  }
}

/**
 * Update the status of a registration in the Sheet.
 */
export async function updateRowStatusInSheet(
  creatorId: string,
  spreadsheetId: string,
  utrId: string,
  status: string,
  approvedAt: string = "",
  email?: string,
  name?: string
) {
  if (!spreadsheetId) return;

  try {
    const { auth } = await getGoogleAuth(creatorId);
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Registrations!A:J",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return;

    const headers = rows[0] || [];
    const utrIdx = headers.indexOf("UTR ID");
    const emailIdx = headers.indexOf("Email");
    const nameIdx = headers.indexOf("Name");
    const statusIdx = headers.indexOf("Status");
    const approvedAtIdx = headers.indexOf("Approved At");

    const indexToCol = (index: number) => {
      let temp, letter = '';
      while (index >= 0) {
        temp = index % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        index = (index - temp - 26) / 26;
      }
      return letter;
    };

    // Find the row matching UTR ID or fallback to Email/Name
    const rowIndex = rows.findIndex((row, idx) => {
      if (idx === 0) return false; // skip header
      const sheetUtr = utrIdx !== -1 ? row[utrIdx]?.toString().trim().toLowerCase() : undefined;
      const targetUtr = utrId?.toString().trim().toLowerCase();
      
      const sheetEmail = emailIdx !== -1 ? row[emailIdx]?.toString().trim().toLowerCase() : undefined;
      const targetEmail = email?.toString().trim().toLowerCase();
      
      const sheetName = nameIdx !== -1 ? row[nameIdx]?.toString().trim().toLowerCase() : undefined;
      const targetName = name?.toString().trim().toLowerCase();

      if (targetUtr && sheetUtr === targetUtr) return true;
      if (targetEmail && sheetEmail === targetEmail) {
        if (!targetName || sheetName === targetName) return true;
      }
      return false;
    });

    if (rowIndex === -1) {
      console.warn(`Row with UTR ID ${utrId} / Email ${email} not found`);
      return;
    }

    const rowNum = rowIndex + 1;

    // Dynamically update Status and Approved At using column indices
    const updateData = [];
    if (statusIdx !== -1) {
      updateData.push({ range: `Registrations!${indexToCol(statusIdx)}${rowNum}`, values: [[status]] });
    }
    if (approvedAtIdx !== -1) {
      updateData.push({ range: `Registrations!${indexToCol(approvedAtIdx)}${rowNum}`, values: [[approvedAt || ""]] });
    }

    if (updateData.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: "USER_ENTERED",
          data: updateData,
        },
      });
    }
  } catch (error) {
    console.error("Failed to update Google Sheet row:", error);
    throw error;
  }
}

/**
 * Synchronize the Google Sheet headers with the latest dynamic form configuration.
 * Retains the 8 standard columns and dynamically appends custom field labels.
 */
export async function syncSheetHeaders(creatorId: string, spreadsheetId: string, formConfig: any[], formType: 'event' | 'survey' = 'event') {
  if (!spreadsheetId) return;

  try {
    const { auth } = await getGoogleAuth(creatorId);
    const sheets = google.sheets({ version: "v4", auth });

    const headers = ["Name", "Phone", "Email"];
    if (formType !== "survey") headers.push("UTR ID");
    headers.push("Status", "Registered At", "Approved At");
    if (formType !== "survey") headers.push("Payment Screenshot URL");

    if (formConfig && Array.isArray(formConfig)) {
      for (const field of formConfig) {
        if (["name", "phone", "email"].includes(field.id)) continue;
        if (["section_divider", "page_break", "hyperlink"].includes(field.type)) continue;
        headers.push(field.label || field.id);
      }
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Registrations!A1",
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    });
  } catch (error) {
    console.error("Failed to sync sheet headers:", error);
  }
}
