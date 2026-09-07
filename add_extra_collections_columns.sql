-- Run this in your Supabase SQL Editor if extra_collections or extra_drops column errors occur:
alter table public.quotes
  add column if not exists extra_collections jsonb default '[]'::jsonb,
  add column if not exists extra_drops jsonb default '[]'::jsonb;
