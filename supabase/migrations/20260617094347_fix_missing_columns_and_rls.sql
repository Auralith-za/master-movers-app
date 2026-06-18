-- Add missing columns to quotes table
alter table public.quotes
  add column if not exists manual_service_charges jsonb default '{}'::jsonb,
  add column if not exists internal_notes text,
  add column if not exists rejection_reason text,
  add column if not exists packaging_option text default 'none',
  add column if not exists st7_boxes integer default 0,
  add column if not exists linen_boxes integer default 0,
  add column if not exists insurance_enabled boolean default false,
  add column if not exists is_shared_load boolean default false,
  add column if not exists custom_products jsonb default '[]'::jsonb,
  add column if not exists request_call_back boolean default false,
  add column if not exists submission_type text default 'standard',
  add column if not exists distance_km numeric default 0;

-- Allow anon (public admin panel) to insert and read quote activities
-- The admin uses mock auth so it runs as anon role
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'quote_activities'
    and policyname = 'Allow public insert on quote_activities'
  ) then
    execute $policy$
      create policy "Allow public insert on quote_activities"
      on public.quote_activities
      for insert
      to public
      with check (true)
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'quote_activities'
    and policyname = 'Allow public read on quote_activities'
  ) then
    execute $policy$
      create policy "Allow public read on quote_activities"
      on public.quote_activities
      for select
      to public
      using (true)
    $policy$;
  end if;
end $$;

-- Also allow anon to update quotes (for admin edits and terms acceptance)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'quotes'
    and policyname = 'Allow public read on quotes'
  ) then
    execute $policy$
      create policy "Allow public read on quotes"
      on public.quotes
      for select
      to public
      using (true)
    $policy$;
  end if;
end $$;
