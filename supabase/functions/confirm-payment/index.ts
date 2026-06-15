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
        const { quoteId, gateway } = await req.json()

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

        const { data, error } = await supabaseAdmin
            .from('quotes')
            .update({
                status: 'booked_paid',
                payment_status: 'paid',
                payment_method: gateway || 'card'
            })
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

        console.log(`✅ Quote ${quoteId} confirmed as booked_paid via ${gateway}`)
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
