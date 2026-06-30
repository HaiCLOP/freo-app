-- Add form_type to events table to distinguish between standard events and survey forms
ALTER TABLE events ADD COLUMN form_type TEXT DEFAULT 'event';
