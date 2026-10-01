import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const isUUID = (val?: string | null) =>
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(val).trim()))

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { quoteId, gateway, status, clientEmail } = await req.json()

        if (!quoteId && !clientEmail) {
            return new Response(
                JSON.stringify({ error: 'Missing quoteId or clientEmail' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Use service role key — bypasses RLS so the update always works
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        let targetId = quoteId
        if (!isUUID(targetId)) {
            // Attempt email lookup if quoteId is not a UUID
            const searchEmail = clientEmail || (typeof quoteId === 'string' && quoteId.includes('@') ? quoteId : null)
            if (searchEmail) {
                const { data: matched } = await supabaseAdmin
                    .from('quotes')
                    .select('id')
                    .ilike('client_email', searchEmail.trim())
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                if (matched) {
                    targetId = matched.id
                } else {
                    return new Response(
                        JSON.stringify({ error: 'Invalid quote ID format and no matching quote found' }),
                        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }
            } else {
                return new Response(
                    JSON.stringify({ error: 'Invalid quote ID format' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
        }

        // Allow caller to set a specific status (e.g. 'payment_cancelled') or default to 'booked_paid'
        const newStatus = status || 'booked_paid'
        const updatePayload = newStatus === 'payment_cancelled'
            ? { status: 'payment_cancelled', payment_status: 'cancelled' }
            : { status: 'booked_paid', payment_status: 'paid', payment_method: gateway || 'card' }

        const { data, error } = await supabaseAdmin
            .from('quotes')
            .update(updatePayload)
            .eq('id', targetId)
            .select()

        if (error) {
            console.error('confirm-payment DB error:', error)
            throw error
        }

        if (!data || data.length === 0) {
            console.warn(`confirm-payment: No record found for quoteId=${targetId}`)
            return new Response(
                JSON.stringify({ error: 'Quote not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const confirmedQuote = data[0]
        console.log(`✅ Quote ${targetId} → ${newStatus} via ${gateway || 'direct'}`)

        // If newly marked paid, insert activity record
        if (newStatus === 'booked_paid') {
            try {
                await supabaseAdmin.from('quote_activities').insert({
                    quote_id: targetId,
                    activity_type: 'payment_received',
                    description: `Payment confirmed via ${gateway || 'card'}`
                })
            } catch (actErr) {
                console.warn('Could not insert payment activity in confirm-payment:', actErr)
            }
        }

        return new Response(
            JSON.stringify({ success: true, quote: confirmedQuote }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('confirm-payment error:', error)
        return new Response(
            JSON.stringify({ error: error?.message || 'Server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
