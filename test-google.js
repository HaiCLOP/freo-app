import { google } from "googleapis";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function createGoogleSheetForEvent() {
  const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const credentialsJson = JSON.parse(Buffer.from(credentialsBase64, "base64").toString("utf-8"));

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentialsJson.client_email,
      private_key: credentialsJson.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    const sheetTitle = `Test Sheet`;
    console.log("Creating sheet...");
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: sheetTitle },
      },
    });
    console.log("Created", createResponse.data.spreadsheetId);
  } catch (e) {
    console.error("FATAL ERROR IN GOOGLE API:", JSON.stringify(e.response?.data || e.message, null, 2));
  }
}

createGoogleSheetForEvent();
