-- Enable RLS on contact_submissions table
alter table public.contact_submissions enable row level security;

-- Allow public to insert contact form submissions
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'contact_submissions'
    and policyname = 'Allow public insert on contact_submissions'
  ) then
    execute $policy$
      create policy "Allow public insert on contact_submissions"
      on public.contact_submissions
      for insert
      to public
      with check (true);
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'contact_submissions'
    and policyname = 'Allow public select on contact_submissions'
  ) then
    execute $policy$
      create policy "Allow public select on contact_submissions"
      on public.contact_submissions
      for select
      to public
      using (true);
    $policy$;
  end if;
end $$;
