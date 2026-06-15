import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        const body = await req.json()
        console.log("Received Payflex Webhook Notification:", body)

        const { merchantReference, status, payflexReference } = body

        if (status === 'APPROVED') {
            // Initialize Supabase Client in Admin mode
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // Update database status of the quote
            const { error } = await supabaseAdmin
                .from('quotes')
                .update({
                    payment_status: 'paid',
                    payment_method: 'payflex',
                    status: 'booked_paid',
                    transaction_id: payflexReference
                })
                .eq('id', merchantReference)

            if (error) {
                console.error("Database Update Error on Payflex callback:", error)
                throw error
            }

            console.log(`Successfully updated Quote ${merchantReference} to paid via Payflex callback.`)
        } else {
            console.log(`Payflex Payment for Quote ${merchantReference} was not APPROVED. Status: ${status}`)
        }

        return new Response("OK", { status: 200 })

    } catch (error) {
        console.error("Error in payflex-callback function:", error)
        return new Response("Error processing callback", { status: 500 })
    }
})
