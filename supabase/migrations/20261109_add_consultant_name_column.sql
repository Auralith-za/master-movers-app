-- Add consultant_name column to quotes table
alter table public.quotes
  add column if not exists consultant_name text;

comment on column public.quotes.consultant_name is 'Name of the consultant allocated to the quote';
