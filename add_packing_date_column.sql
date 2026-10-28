-- Migration to add packing_date column to public.quotes table
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS packing_date date;
