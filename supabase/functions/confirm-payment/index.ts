import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { quoteId, gateway, status } = await req.json()

        if (!quoteId) {
            return new Response(
                JSON.stringify({ error: 'Missing quoteId' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Use service role key — bypasses RLS so the update always works
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Allow caller to set a specific status (e.g. 'payment_cancelled') or default to 'booked_paid'
        const newStatus = status || 'booked_paid'
        const updatePayload = newStatus === 'payment_cancelled'
            ? { status: 'payment_cancelled', payment_status: 'cancelled' }
            : { status: 'booked_paid', payment_status: 'paid', payment_method: gateway || 'card' }

        const { data, error } = await supabaseAdmin
            .from('quotes')
            .update(updatePayload)
            .eq('id', quoteId)
            .select()

        if (error) {
            console.error('confirm-payment DB error:', error)
            throw error
        }

        if (!data || data.length === 0) {
            console.warn(`confirm-payment: No record found for quoteId=${quoteId}`)
            return new Response(
                JSON.stringify({ error: 'Quote not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`✅ Quote ${quoteId} → ${newStatus} via ${gateway || 'direct'}`)
        return new Response(
            JSON.stringify({ success: true, quote: data[0] }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('confirm-payment error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
