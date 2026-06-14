-- Create a table to track daily usage of Resend API keys
CREATE TABLE IF NOT EXISTS public.resend_key_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_index INTEGER NOT NULL CHECK (key_index >= 1 AND key_index <= 4),
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(key_index, usage_date)
);

-- Enable RLS (Service role only access)
ALTER TABLE public.resend_key_usage ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access on resend_key_usage" 
ON public.resend_key_usage 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Function to safely increment usage and return the updated row
CREATE OR REPLACE FUNCTION increment_resend_usage(p_key_index INTEGER, p_usage_date DATE)
RETURNS INTEGER AS $$
DECLARE
    v_new_count INTEGER;
BEGIN
    INSERT INTO public.resend_key_usage (key_index, usage_date, usage_count)
    VALUES (p_key_index, p_usage_date, 1)
    ON CONFLICT (key_index, usage_date)
    DO UPDATE SET 
        usage_count = public.resend_key_usage.usage_count + 1,
        updated_at = NOW()
    RETURNING usage_count INTO v_new_count;
    
    RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
