-- Add terms acceptance columns to quotes table
alter table public.quotes
  add column if not exists terms_accepted boolean default false,
  add column if not exists signature_json jsonb;

-- Allow public users to update terms acceptance fields on quotes
-- This is needed for customers on the public quote review page
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'quotes'
    and policyname = 'Allow public terms acceptance'
  ) then
    execute 'create policy "Allow public terms acceptance"
      on public.quotes
      for update
      to public
      using (true)
      with check (true)';
  end if;
end $$;
