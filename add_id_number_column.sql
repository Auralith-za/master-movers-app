-- Add ID number column to quotes table
alter table public.quotes
  add column if not exists id_number text;

comment on column public.quotes.id_number is 'National ID or Passport number provided by client upon electronically signing terms & conditions';
