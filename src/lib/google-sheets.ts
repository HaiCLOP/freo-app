import { google } from "googleapis";

export async function initializeGoogleSheet(spreadsheetId: string) {
  const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credentialsBase64) return;

  const credentialsJson = JSON.parse(Buffer.from(credentialsBase64, "base64").toString("utf-8"));
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentialsJson.client_email,
      private_key: credentialsJson.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    // 1. Get the first sheet's ID and name
    const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const firstSheet = sheetInfo.data.sheets?.[0];
    if (!firstSheet) return;
    
    const sheetId = firstSheet.properties?.sheetId;
    const sheetName = firstSheet.properties?.title;

    // 2. Add headers if we assume it's blank (row 1)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:J1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            "Name",
            "Phone",
            "Email",
            "Herbalife ID",
            "Sponsor",
            "UTR ID",
            "Status",
            "Registered At",
            "Approved At",
            "Payment Screenshot URL"
          ],
        ],
      },
    });

    // 3. Format header row and rename sheet to "Registrations"
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: sheetId,
                title: "Registrations",
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: "title,gridProperties.frozenRowCount",
            },
          },
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                  textFormat: { bold: true },
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat)",
            },
          },
          // Set row height for rows 1 to 1000 to 60px
          {
            updateDimensionProperties: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: 1,
                endIndex: 1000,
              },
              properties: {
                pixelSize: 60,
              },
              fields: "pixelSize",
            },
          },
          // Set column width for Payment Screenshot URL (column 9, index 9) to 120px
          {
            updateDimensionProperties: {
              range: {
                sheetId: sheetId,
                dimension: "COLUMNS",
                startIndex: 9,
                endIndex: 10,
              },
              properties: {
                pixelSize: 120,
              },
              fields: "pixelSize",
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Failed to initialize Google Sheet:", error);
  }
}

export async function appendRowToSheet(spreadsheetId: string, values: any[]) {
  if (!spreadsheetId) return;
  const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credentialsBase64) return;

  const credentialsJson = JSON.parse(Buffer.from(credentialsBase64, "base64").toString("utf-8"));

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentialsJson.client_email,
      private_key: credentialsJson.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    // Check if headers exist (checking A1)
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "A1:A1",
    });

    const hasHeaders = getRes.data.values && getRes.data.values.length > 0 && getRes.data.values[0][0];

    if (!hasHeaders) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "A1:J1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [
            [
              "Name",
              "Phone",
              "Email",
              "Herbalife ID",
              "Sponsor",
              "UTR ID",
              "Status",
              "Registered At",
              "Approved At",
              "Payment Screenshot URL"
            ],
          ],
        },
      });
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "A:J",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    });
  } catch (error) {
    console.error("Failed to append row to Google Sheet:", error);
  }
}

export async function updateRowStatusInSheet(
  spreadsheetId: string,
  utrId: string,
  status: string,
  approvedAt: string = "",
  email?: string,
  name?: string
) {
  if (!spreadsheetId) return;
  const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credentialsBase64) return;

  const credentialsJson = JSON.parse(Buffer.from(credentialsBase64, "base64").toString("utf-8"));

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentialsJson.client_email,
      private_key: credentialsJson.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "A:J",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return;

    // Find the row matching UTR ID or fallback to Email / Name
    const rowIndex = rows.findIndex((row, idx) => {
      if (idx === 0) return false;
      const sheetUtr = row[5]?.toString().trim().toLowerCase();
      const targetUtr = utrId?.toString().trim().toLowerCase();
      const sheetEmail = row[2]?.toString().trim().toLowerCase();
      const targetEmail = email?.toString().trim().toLowerCase();
      const sheetName = row[0]?.toString().trim().toLowerCase();
      const targetName = name?.toString().trim().toLowerCase();

      // Match by UTR if both are present
      if (targetUtr && sheetUtr === targetUtr) return true;
      // Fallback: match by email and name
      if (targetEmail && sheetEmail === targetEmail) {
        if (!targetName || sheetName === targetName) return true;
      }
      return false;
    });
    
    if (rowIndex === -1) {
      console.warn(`Row with UTR ID ${utrId} / Email ${email} not found in Google Sheet`);
      return;
    }

    // Row number is 1-indexed (rowIndex + 1)
    const rowNum = rowIndex + 1;

    // Update Status (Column G)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `G${rowNum}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[status]],
      },
    });

    // Update Approved At (Column I)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `I${rowNum}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[approvedAt || ""]],
      },
    });
  } catch (error) {
    console.error("Failed to update status in Google Sheet:", error);
  }
}
