import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, serviceKey)

        const body = await req.json().catch(() => ({}))
        const { action, code, discount_type, discount_percent, discount_amount, description, max_uses, expires_at, coupon_id } = body

        // ── SETUP: Create table + seed via direct Postgres REST ──────────
        if (action === 'setup') {
            // Use the pg REST endpoint available to service role
            const setupSql = `
                CREATE TABLE IF NOT EXISTS public.coupons (
                  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                  code text NOT NULL UNIQUE,
                  discount_type text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
                  discount_percent integer,
                  discount_amount numeric,
                  description text DEFAULT '',
                  is_active boolean DEFAULT true,
                  max_uses integer DEFAULT NULL,
                  times_used integer DEFAULT 0,
                  expires_at timestamptz DEFAULT NULL,
                  created_at timestamptz DEFAULT now(),
                  CONSTRAINT coupons_discount_percent_check CHECK (
                    (discount_type = 'percent' AND discount_percent > 0 AND discount_percent <= 100) OR
                    (discount_type = 'fixed' AND discount_percent IS NULL AND discount_amount > 0)
                  )
                );
                ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
                DO $$ BEGIN
                  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'anon_read_active') THEN
                    CREATE POLICY anon_read_active ON public.coupons FOR SELECT USING (is_active = true);
                  END IF;
                END $$;
                INSERT INTO public.coupons (code, discount_type, discount_percent, description) VALUES
                  ('TESTMOVE10', 'percent', 10, '10% off for testing'),
                  ('LAUNCH20', 'percent', 20, '20% launch discount'),
                  ('STAFF50', 'percent', 50, 'Staff 50% testing discount')
                ON CONFLICT (code) DO NOTHING;
            `
            const pgRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json', 'apikey': serviceKey },
                body: JSON.stringify({ sql: setupSql })
            })

            // Fallback: Try via Supabase's query API
            const queryRes = await fetch(`${supabaseUrl.replace('supabase.co', 'supabase.co')}/pg/query`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: setupSql })
            }).catch(() => null)

            // Just try inserting the seed data - table may already exist from dashboard
            const seed = await supabase.from('coupons').upsert([
                { code: 'TESTMOVE10', discount_type: 'percent', discount_percent: 10, description: '10% off for testing' },
                { code: 'LAUNCH20', discount_type: 'percent', discount_percent: 20, description: '20% launch discount' },
                { code: 'STAFF50', discount_type: 'percent', discount_percent: 50, description: 'Staff 50% testing discount' }
            ], { onConflict: 'code' })

            return new Response(JSON.stringify({
                success: true,
                seed_result: seed.error ? seed.error.message : 'seeded',
                note: 'If table does not exist, please create it via Supabase Dashboard SQL editor using the migration file'
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ── VALIDATE COUPON (public) ──────────────────────────────────────
        if (action === 'validate') {
            if (!code) throw new Error('No coupon code provided')

            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', code.trim().toUpperCase())
                .eq('is_active', true)
                .maybeSingle()

            if (error) throw error
            if (!data) return new Response(JSON.stringify({ valid: false, error: 'Invalid or expired coupon code.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                return new Response(JSON.stringify({ valid: false, error: 'This coupon has expired.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            if (data.max_uses !== null && data.times_used >= data.max_uses) {
                return new Response(JSON.stringify({ valid: false, error: 'This coupon has reached its usage limit.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            return new Response(JSON.stringify({
                valid: true,
                discount_type: data.discount_type || 'percent',
                discount_percent: data.discount_percent,
                discount_amount: data.discount_amount,
                description: data.description,
                code: data.code
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ── LIST ALL COUPONS (admin) ──────────────────────────────────────
        if (action === 'list') {
            const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
            if (error) throw error
            return new Response(JSON.stringify({ coupons: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ── CREATE COUPON (admin) ─────────────────────────────────────────
        if (action === 'create') {
            if (!code) throw new Error('code is required')
            
            const payload: any = {
                code: code.trim().toUpperCase(),
                discount_type: discount_type || 'percent',
                description: description || '',
                max_uses: max_uses ? Number(max_uses) : null,
                expires_at: expires_at || null,
                is_active: true
            }

            if (payload.discount_type === 'percent') {
                if (!discount_percent) throw new Error('discount_percent is required for percent type')
                payload.discount_percent = Number(discount_percent)
            } else if (payload.discount_type === 'fixed') {
                if (!discount_amount) throw new Error('discount_amount is required for fixed type')
                payload.discount_amount = Number(discount_amount)
            } else {
                throw new Error('Invalid discount_type')
            }

            const { data, error } = await supabase.from('coupons').insert(payload).select().single()
            if (error) throw error
            return new Response(JSON.stringify({ success: true, coupon: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ── TOGGLE COUPON ACTIVE (admin) ──────────────────────────────────
        if (action === 'toggle') {
            if (!coupon_id) throw new Error('coupon_id required')
            const { data: current } = await supabase.from('coupons').select('is_active').eq('id', coupon_id).single()
            const { error } = await supabase.from('coupons').update({ is_active: !current?.is_active }).eq('id', coupon_id)
            if (error) throw error
            return new Response(JSON.stringify({ success: true, is_active: !current?.is_active }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ── DELETE COUPON (admin) ─────────────────────────────────────────
        if (action === 'delete') {
            if (!coupon_id) throw new Error('coupon_id required')
            const { error } = await supabase.from('coupons').delete().eq('id', coupon_id)
            if (error) throw error
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        throw new Error(`Unknown action: ${action}`)

    } catch (error: any) {
        console.error('coupon-manager error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
