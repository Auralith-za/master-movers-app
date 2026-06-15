import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Auto-setup: create coupons table if not exists (runs via Postgres connection)
        const body = await req.json().catch(() => ({}))
        const { action, code, discount_percent, description, max_uses, expires_at, coupon_id } = body

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

            // Check expiry
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                return new Response(JSON.stringify({ valid: false, error: 'This coupon has expired.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            // Check usage limit
            if (data.max_uses !== null && data.times_used >= data.max_uses) {
                return new Response(JSON.stringify({ valid: false, error: 'This coupon has reached its usage limit.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            return new Response(JSON.stringify({
                valid: true,
                discount_percent: data.discount_percent,
                description: data.description,
                code: data.code
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ── APPLY COUPON (increment usage) ───────────────────────────────
        if (action === 'apply') {
            if (!code) throw new Error('No coupon code provided')
            await supabase.from('coupons').update({ times_used: supabase.raw('times_used + 1') }).eq('code', code.trim().toUpperCase())
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ── LIST ALL COUPONS (admin) ──────────────────────────────────────
        if (action === 'list') {
            const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
            if (error) throw error
            return new Response(JSON.stringify({ coupons: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ── CREATE COUPON (admin) ─────────────────────────────────────────
        if (action === 'create') {
            if (!code || !discount_percent) throw new Error('code and discount_percent are required')
            const { data, error } = await supabase.from('coupons').insert({
                code: code.trim().toUpperCase(),
                discount_percent: Number(discount_percent),
                description: description || '',
                max_uses: max_uses ? Number(max_uses) : null,
                expires_at: expires_at || null,
                is_active: true
            }).select().single()
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
