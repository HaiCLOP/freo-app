# Freo - Codebase Architecture & Overview

## About Freo
**Freo** is a premium, end-to-end event registration and management platform developed by HaiCLOP Labs. It was built to solve the complexities of managing paid events, specifically addressing the pain points of manual payment verification, attendee tracking, and at-the-door check-ins. 

Unlike generic form builders, Freo provides a complete ecosystem:
- **For Attendees:** A seamless, beautiful registration experience where they can securely upload their UPI payment screenshots and transaction IDs (UTRs).
- **For Event Creators:** A powerful web dashboard to review payments, bulk-approve attendees, and automatically sync all registration data directly to their personal Google Drive and Google Sheets in real-time.
- **For Event Staff:** A standalone mobile app (`freo_scanner`) used at the venue to scan digital tickets and prevent fraudulent or duplicate entries.

---

This document provides a comprehensive overview of the Freo ecosystem, its architecture, core features, and the primary technologies powering it. It serves as a guide for understanding how the different parts of the application communicate and function.

## 1. High-Level Architecture
Freo is composed of three main layers:
1. **The Web Dashboard & Public Pages (Next.js)**: Where creators manage events and where attendees register.
2. **The Mobile Scanner App (Flutter)**: A standalone application for event staff to scan QR tickets and validate attendees at the door.
3. **The Backend (Supabase)**: A PostgreSQL database handling authentication, row-level security (RLS), atomic transactions (RPCs), and file storage.

---

## 2. Technology Stack
- **Frontend Framework**: Next.js 15 (App Router), React, TypeScript.
- **Styling**: Tailwind CSS, generic vanilla CSS (`globals.css`), and Lucide React icons. UI design follows a premium, dark-mode aesthetic (black, white, neon accents like `#DDFE55`).
- **Backend & Database**: Supabase (PostgreSQL).
- **Authentication**: Supabase Auth (Email/Password, custom Google OAuth integration).
- **Storage**: Supabase Storage (Fallback) & Google Drive API (Primary for connected creators).
- **Mobile Application**: Flutter / Dart (`freo_scanner`).

---

## 3. Core Database Schema & Entities
The Supabase database is secured using strictly enforced **Row Level Security (RLS)**.

- `creators`: Stores event organizers. Contains their Google OAuth access/refresh tokens to enable API interactions on their behalf.
- `events`: Stores event details (name, date, banners, UPI QR codes, custom form fields, and Google Sheet ID). Tied to a specific `creator_id`.
- `registrations`: Stores individual attendee signups. Includes names, emails, UTR (Transaction IDs), payment screenshots, and approval statuses (`Pending`, `Approved`, `Rejected`).
- `sheet_queue`: A temporary table used for reliable Google Sheets syncing. If a direct write to Google Sheets fails during registration, the row is saved here and processed by a Vercel Cron Job.

---

## 4. Key Web Workflows

### A. Authentication & Google OAuth
- **Standard Login**: Email and password via Supabase Auth.
- **Custom Google OAuth**: Creators can link their Google accounts in the dashboard settings. This flow bypasses standard Supabase identity merging. Instead, it securely stores the `google_access_token` and `google_refresh_token` in the `creators` table, ensuring the web app has API access while mobile apps remain strictly email/password.

### B. Event Registration Flow (`src/app/e/[slug]/actions.ts`)
When an attendee submits a registration:
1. **File Upload**: Payment screenshots are uploaded to either Google Drive (if the creator is connected) or Supabase Storage.
2. **Database Insert**: The backend calls a highly atomic PostgreSQL RPC (`register_for_event`) to safely insert the registration and prevent duplicate UTR IDs.
3. **Google Sheets Sync**: The attendee's data (and an `=IMAGE()` formula of their screenshot) is appended to the creator's Google Sheet (`src/lib/google-sheets.ts`).
4. **Resiliency**: If the Sheets API fails (e.g., rate limits), the data is safely offloaded to the `sheet_queue` table to be retried automatically by the Cron endpoint (`/api/cron/sync-sheets`).

### C. Dashboard & Management (`src/app/dashboard`)
- **Event Creation**: Creators can define custom registration forms.
- **Registrations View**: A premium interface for creators to review pending payments, view raw Google Drive export images directly in the browser, and bulk approve/reject attendees.
- **Approvals**: Approving a user triggers Supabase to update the status and immediately updates the Google Sheet row.

---

## 5. Third-Party Integrations

### Google Drive & Google Sheets (`src/lib/google-drive.ts`, `src/lib/google-sheets.ts`)
Freo deeply integrates with Google Workspace:
- Event creation automatically generates a "Freo Events" folder and a dedicated Google Sheet in the creator's Drive.
- Payment screenshots are uploaded to Drive, returning an ID. 
- The web app dynamically converts Google Drive file IDs into `uc?export=view` URLs so they render directly as inline images inside Google Sheets using `=IMAGE()` and in the dashboard `<img>` tags.

### Email (Resend/SMTP)
Supabase handles transactional emails (account verification). An external SMTP provider (like Resend) is configured in the Supabase Dashboard to ensure reliable delivery without hitting rate limits.

---

## 6. The Mobile App (`freo_scanner`)
A dedicated iOS and Android application built with Flutter (`e:\freo\freo_scanner`). It is designed for event organizers and their volunteer staff to efficiently process attendees at the door.

### A. Architecture & Connection
- **Direct Database Access**: The mobile app uses the `supabase_flutter` package to securely connect directly to the Supabase PostgreSQL database, completely bypassing the Next.js web backend.
- **Authentication Strategy**: The app strictly relies on **Email and Password** authentication. Creators log in with the account they created on the web dashboard. (Note: Google OAuth is intentionally restricted to the web dashboard for API integrations).

### B. Core Features & Screens
- **Login Screen (`login_screen.dart`)**: Authenticates the creator and securely stores their session token on the device.
- **Event Dashboard**: Queries the `events` table to display all active events owned by the logged-in creator.
- **QR Ticket Scanner**: Utilizes the device camera to scan QR codes generated by the web platform.
  - The QR payload contains a unique identifier (usually the attendee's Registration ID).
  - The app queries the `registrations` table to verify the ticket is valid and that the payment status is `Approved`.
- **Check-in Validation**: Once a valid ticket is scanned, the app performs a real-time update to the `registrations` table, marking the attendee's `check_in_status` as `true` to prevent the same ticket from being used twice.

### C. Offline Resiliency (Future-proofing)
Because the app relies on live Supabase calls, a stable internet connection is recommended. However, the direct database structure allows for easy implementation of local caching via SQLite or Hive if offline syncing is required in the future.

---

## 7. Security Highlights
- **RLS (Row Level Security)**: Event attendees cannot query other attendees' data. Creators can only query events and registrations they explicitly own.
- **Sanitization**: Google Sheets integration heavily sanitizes user input (stripping `=`, `+`, `-`, `@`) to prevent CSV/Formula injection attacks, while explicitly allowing safe `=IMAGE()` rendering.
- **Legal Protection**: The platform explicitly disclaims liability for third-party data loss (Google Drive/Sheets) in the Privacy Policy and Terms of Service.

---

## 8. Development Commands
- **Run Web App**: `npm run dev`
- **Run Scanner App**: `flutter run`
- **Environment Variables Required**: Supabase URL/Key, Google OAuth Client ID/Secret, Vercel Cron Secret.
