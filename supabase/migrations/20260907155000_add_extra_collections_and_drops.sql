-- Add extra_collections and extra_drops columns to quotes table
alter table public.quotes
  add column if not exists extra_collections jsonb default '[]'::jsonb,
  add column if not exists extra_drops jsonb default '[]'::jsonb;
