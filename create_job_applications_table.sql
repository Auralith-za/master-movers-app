-- SQL Script to create job_applications table and resumes storage bucket in Supabase (Idempotent)

-- 1. Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    position TEXT DEFAULT 'General Applicant',
    experience_years TEXT,
    license_type TEXT,
    availability TEXT,
    notes TEXT,
    cv_name TEXT,
    cv_url TEXT,
    cv_data TEXT,
    status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'shortlisted', 'rejected', 'hired'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Safely drop existing policies before re-creating
DROP POLICY IF EXISTS "Allow public insert to job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "Allow public select job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "Allow public update job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "Allow public delete job_applications" ON public.job_applications;

-- Create policies
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


-- 2. Storage Bucket for Resumes / CVs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public insert to resumes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from resumes bucket" ON storage.objects;

CREATE POLICY "Allow public insert to resumes bucket" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Allow public select from resumes bucket" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'resumes');
