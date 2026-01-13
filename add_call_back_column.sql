-- Add Request Call Back column to quotes table
alter table public.quotes 
add column if not exists request_call_back boolean default false;
