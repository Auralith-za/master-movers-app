CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  max_uses integer DEFAULT NULL,
  times_used integer DEFAULT 0,
  expires_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow anon read active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

INSERT INTO public.coupons (code, discount_percent, description, is_active, max_uses)
VALUES 
  ('TESTMOVE10', 10, '10% off for testing', true, NULL),
  ('LAUNCH20', 20, '20% launch discount', true, 50),
  ('STAFF50', 50, 'Staff 50% testing discount', true, NULL)
ON CONFLICT (code) DO NOTHING;
