-- Migration to add waitlist support
ALTER TABLE registrations DROP CONSTRAINT registrations_status_check;
ALTER TABLE registrations ADD CONSTRAINT registrations_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted'));

-- Update the atomic capacity function to support waitlist
CREATE OR REPLACE FUNCTION register_for_event(
    p_event_id UUID,
    p_full_name TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_utr_id TEXT,
    p_payment_screenshot_url TEXT,
    p_custom_fields JSONB,
    p_waitlist_enabled BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_max_capacity INT;
    v_current_count INT;
    v_registration RECORD;
    v_status TEXT := 'pending';
BEGIN
    -- Lock the event row to serialize access and prevent concurrent capacity checks
    SELECT max_capacity INTO v_max_capacity
    FROM events WHERE id = p_event_id FOR UPDATE;

    IF v_max_capacity IS NULL THEN
        RAISE EXCEPTION 'Event not found';
    END IF;

    -- Count active registrations (exclude waitlisted and rejected from capacity)
    SELECT count(*) INTO v_current_count
    FROM registrations
    WHERE event_id = p_event_id AND status IN ('pending', 'approved');

    IF v_current_count >= v_max_capacity THEN
        IF p_waitlist_enabled THEN
            v_status := 'waitlisted';
        ELSE
            RAISE EXCEPTION 'Event sold out';
        END IF;
    END IF;

    -- Insert registration atomically
    INSERT INTO registrations (
        event_id, full_name, phone, email, utr_id, payment_screenshot_url, custom_fields, status
    ) VALUES (
        p_event_id, p_full_name, p_phone, p_email, p_utr_id, p_payment_screenshot_url, p_custom_fields, v_status
    ) RETURNING * INTO v_registration;

    RETURN row_to_json(v_registration)::jsonb;
END;
$$;
