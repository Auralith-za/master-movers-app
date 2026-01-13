-- Create Quotes Table
create table public.quotes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Client Details
  client_name text,
  client_email text,
  client_phone text,
  
  -- Move Details
  pickup_address text,
  dropoff_address text,
  move_date date,
  distance_km numeric,
  
  -- Logistics
  status text default 'new', -- new, processing, on_hold, booked, completed
  trip_breakdown jsonb, -- { depotToPickup, pickupToDropoff, dropoffToDepot }
  
  -- Inventory & Access
  items_json jsonb, -- Full inventory object
  access_details jsonb, -- { origin: {...}, destination: {...} }
  
  -- Pricing & Payment
  total_volume numeric,
  total_price numeric,
  
  -- Payment Tracking
  payment_status text default 'pending', -- pending, paid, failed, cancelled
  payment_method text, -- payfast, payflex, eft
  transaction_id text -- external reference
);

-- Enable Row Level Security (RLS)
alter table public.quotes enable row level security;

-- Create Policy: Allow public to insert quotes (for the web form)
create policy "Allow public insert"
on public.quotes
for insert
to public
with check (true);

-- Create Policy: Allow authenticated users (Admin) to view/edit
create policy "Allow admin all"
on public.quotes
for all
to authenticated
using (true)
with check (true);

-- Optional: If you want to allow public read (debug only)
-- create policy "Allow public read" on public.quotes for select to public using (true);
