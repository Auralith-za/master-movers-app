-- SQL Script to create job_applications table in Supabase
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    position TEXT NOT NULL,
    experience_years TEXT,
    license_type TEXT,
    availability TEXT,
    notes TEXT,
    status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'shortlisted', 'rejected', 'hired'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for public insert and select/update access
CREATE POLICY "Allow public insert to job_applications" 
    ON public.job_applications FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow public select job_applications" 
    ON public.job_applications FOR SELECT 
    USING (true);

CREATE POLICY "Allow public update job_applications" 
    ON public.job_applications FOR UPDATE 
    USING (true);

CREATE POLICY "Allow public delete job_applications" 
    ON public.job_applications FOR DELETE 
    USING (true);
