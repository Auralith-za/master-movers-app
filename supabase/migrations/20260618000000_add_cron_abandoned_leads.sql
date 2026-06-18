-- Add updated_at and lead_email_sent to quotes
alter table public.quotes
  add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  add column if not exists lead_email_sent boolean default false;

-- Create function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create trigger
drop trigger if exists update_quotes_updated_at on public.quotes;
create trigger update_quotes_updated_at
    before update on public.quotes
    for each row
    execute function public.update_updated_at_column();
