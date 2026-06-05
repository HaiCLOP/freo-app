-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CREATORS TABLE
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    notification_email TEXT,
    notification_email_verified BOOLEAN DEFAULT false,
    notification_email_token TEXT,
    notification_email_token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. EVENTS TABLE
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    banner_url TEXT,
    date TIMESTAMPTZ NOT NULL,
    venue TEXT NOT NULL,
    price NUMERIC NOT NULL, -- INR
    max_capacity INT NOT NULL,
    upi_qr_url TEXT,
    upi_id TEXT,
    form_config JSONB DEFAULT '[]'::jsonb, -- array of field objects
    google_sheet_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. REGISTRATIONS TABLE
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    herbalife_id TEXT,
    sponsor_name TEXT,
    payment_screenshot_url TEXT,
    utr_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    ticket_code TEXT UNIQUE,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    checked_in_at TIMESTAMPTZ,
    registered_at TIMESTAMPTZ DEFAULT now(),
    approved_at TIMESTAMPTZ
);

-- SETUP ROW LEVEL SECURITY
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Creators Policies
CREATE POLICY "Creators can view their own data"
    ON creators FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Creators can update their own data"
    ON creators FOR UPDATE
    USING (auth.uid() = id);

-- Events Policies
CREATE POLICY "Anyone can view active events"
    ON events FOR SELECT
    USING (is_active = true);

CREATE POLICY "Creators can view all their events"
    ON events FOR SELECT
    USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert their events"
    ON events FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their events"
    ON events FOR UPDATE
    USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their events"
    ON events FOR DELETE
    USING (auth.uid() = creator_id);

-- Registrations Policies
CREATE POLICY "Anyone can insert registrations"
    ON registrations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Creators can view registrations for their events"
    ON registrations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = registrations.event_id
            AND events.creator_id = auth.uid()
        )
    );

CREATE POLICY "Creators can update registrations for their events"
    ON registrations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = registrations.event_id
            AND events.creator_id = auth.uid()
        )
    );

CREATE POLICY "Creators can delete registrations for their events"
    ON registrations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = registrations.event_id
            AND events.creator_id = auth.uid()
        )
    );

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('event-banners', 'event-banners', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('upi-qr-codes', 'upi-qr-codes', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', false);

-- STORAGE POLICIES FOR EVENT-BANNERS (Public)
CREATE POLICY "Anyone can view event banners"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-banners');

CREATE POLICY "Creators can upload event banners"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'event-banners' AND auth.role() = 'authenticated');

CREATE POLICY "Creators can delete their event banners"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'event-banners' AND auth.role() = 'authenticated');

-- STORAGE POLICIES FOR UPI-QR-CODES (Public)
CREATE POLICY "Anyone can view UPI QR codes"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'upi-qr-codes');

CREATE POLICY "Creators can upload UPI QR codes"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'upi-qr-codes' AND auth.role() = 'authenticated');

CREATE POLICY "Creators can delete their UPI QR codes"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'upi-qr-codes' AND auth.role() = 'authenticated');

-- STORAGE POLICIES FOR PAYMENT-SCREENSHOTS (Private)
CREATE POLICY "Anyone can upload payment screenshots"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'payment-screenshots');

CREATE POLICY "Creators can view their event payment screenshots"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'payment-screenshots' AND auth.role() = 'authenticated');
