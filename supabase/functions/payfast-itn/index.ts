import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        // PayFast details
        const formData = await req.formData()
        const paymentStatus = formData.get('payment_status')
        const customStr1 = formData.get('m_payment_id') // We stored Quote ID here

        console.log(`Received PayFast ITN: ${paymentStatus} for Quote ${customStr1}`)

        if (paymentStatus === 'COMPLETE') {
            // Initialize Supabase Client (Admin Mode)
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // Update Quote
            const { error } = await supabaseAdmin
                .from('quotes')
                .update({
                    payment_status: 'paid',
                    payment_method: 'payfast',
                    transaction_id: formData.get('pf_payment_id')
                })
                .eq('id', customStr1)

            if (error) {
                console.error('Database Update Error:', error)
                throw error
            }
        }

        return new Response("OK", { status: 200 })

    } catch (error) {
        console.error(error)
        return new Response("Error", { status: 500 })
    }
})
