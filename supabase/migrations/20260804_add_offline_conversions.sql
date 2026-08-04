-- Add Google Ads Click ID and UTM Attribution Tracking Columns to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS gclid TEXT,
ADD COLUMN IF NOT EXISTS gbraid TEXT,
ADD COLUMN IF NOT EXISTS wbraid TEXT,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS won_at TIMESTAMP WITH TIME ZONE;

-- Add tracking columns to contact_submissions table as well
ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS gclid TEXT,
ADD COLUMN IF NOT EXISTS gbraid TEXT,
ADD COLUMN IF NOT EXISTS wbraid TEXT,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT;

-- Create index on gclid for fast lookup during offline conversion sync
CREATE INDEX IF NOT EXISTS idx_quotes_gclid ON public.quotes (gclid);
CREATE INDEX IF NOT EXISTS idx_quotes_won_at ON public.quotes (won_at);
