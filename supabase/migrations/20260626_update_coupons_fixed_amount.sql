ALTER TABLE public.coupons ADD COLUMN discount_type text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed'));
ALTER TABLE public.coupons ADD COLUMN discount_amount numeric;
ALTER TABLE public.coupons ALTER COLUMN discount_percent DROP NOT NULL;
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_percent_check;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_discount_percent_check CHECK (
  (discount_type = 'percent' AND discount_percent > 0 AND discount_percent <= 100) OR
  (discount_type = 'fixed' AND discount_percent IS NULL AND discount_amount > 0)
);
