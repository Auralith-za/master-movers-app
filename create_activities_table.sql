-- Create Activities Table for Tracking
create table public.quote_activities (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  quote_id uuid references public.quotes(id) on delete cascade not null,
  activity_type text not null, -- 'whatsapp', 'email', 'note', 'status_change', 'edit'
  content text,
  user_id uuid default auth.uid() -- Optional: ID of admin who performed action
);

-- Enable RLS
alter table public.quote_activities enable row level security;

-- Policies
create policy "Allow admin all activities"
on public.quote_activities
for all
to authenticated
using (true)
with check (true);

-- Optional: Allow public insert if needed (e.g. system events), but usually admin only.
-- For now, authenticated is enough for admin panel.
