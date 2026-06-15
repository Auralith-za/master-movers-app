import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        // PayFast sends ITN as application/x-www-form-urlencoded (form data)
        const formData = await req.formData()
        const paymentStatus = formData.get('payment_status')
        const mPaymentId = formData.get('m_payment_id')   // Quote ID stored here
        const pfPaymentId = formData.get('pf_payment_id') // PayFast transaction reference
        const amountGross = formData.get('amount_gross')

        console.log(`PayFast ITN received — status: ${paymentStatus}, quoteId: ${mPaymentId}, pfPaymentId: ${pfPaymentId}`)

        if (paymentStatus === 'COMPLETE') {
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            const { data, error } = await supabaseAdmin
                .from('quotes')
                .update({
                    status: 'booked_paid',          // ← was missing before
                    payment_status: 'paid',
                    payment_method: 'payfast',
                    transaction_id: pfPaymentId,
                    amount_paid: amountGross ? Number(amountGross) : undefined
                })
                .eq('id', mPaymentId)
                .select()

            if (error) {
                console.error('PayFast ITN DB update error:', error)
                throw error
            }

            console.log(`✅ Quote ${mPaymentId} → booked_paid via PayFast ITN`, data)
        } else {
            console.log(`PayFast ITN: payment NOT complete. Status: ${paymentStatus}`)
        }

        // PayFast requires a 200 OK text response
        return new Response("OK", { status: 200 })

    } catch (error) {
        console.error('PayFast ITN error:', error)
        return new Response("Error", { status: 500 })
    }
})
