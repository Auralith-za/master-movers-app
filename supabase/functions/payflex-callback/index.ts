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
        const body = await req.json()
        console.log("PayFlex Callback received:", JSON.stringify(body))

        // PayFlex sends: merchantReference (our quoteId), orderStatus, orderId, token
        const { merchantReference, orderStatus, orderId, token } = body

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        if (orderStatus === 'Approved') {
            const { data, error } = await supabaseAdmin
                .from('quotes')
                .update({
                    status: 'booked_paid',
                    payment_status: 'paid',
                    payment_method: 'payflex',
                    transaction_id: orderId || token
                })
                .eq('id', merchantReference)
                .select()

            if (error) {
                console.error('PayFlex callback DB error:', error)
                throw error
            }

            console.log(`✅ Quote ${merchantReference} → booked_paid via PayFlex callback`, data)

        } else if (orderStatus === 'Declined' || orderStatus === 'Cancelled') {
            // Mark as cancelled so admin knows
            await supabaseAdmin
                .from('quotes')
                .update({ payment_status: 'failed', status: 'pending_payment' })
                .eq('id', merchantReference)

            console.log(`⚠️ PayFlex payment ${orderStatus} for Quote ${merchantReference}`)
        } else {
            console.log(`PayFlex callback status: ${orderStatus} for Quote ${merchantReference}`)
        }

        return new Response("OK", { status: 200, headers: corsHeaders })

    } catch (error) {
        console.error("Error in payflex-callback:", error)
        return new Response("Error processing callback", { status: 500, headers: corsHeaders })
    }
})
