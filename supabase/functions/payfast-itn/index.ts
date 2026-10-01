import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const isUUID = (val?: string | null) =>
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(val).trim()))

serve(async (req) => {
    try {
        // PayFast sends ITN as application/x-www-form-urlencoded (form data)
        const formData = await req.formData()
        const paymentStatus = formData.get('payment_status')?.toString() || ''
        const mPaymentId = formData.get('m_payment_id')?.toString() || ''
        const pfPaymentId = formData.get('pf_payment_id')?.toString() || ''
        const amountGross = formData.get('amount_gross')?.toString() || ''
        const emailAddress = formData.get('email_address')?.toString() || ''
        const nameFirst = formData.get('name_first')?.toString() || ''

        console.log(`PayFast ITN received — status: ${paymentStatus}, quoteId: ${mPaymentId}, pfPaymentId: ${pfPaymentId}, email: ${emailAddress}`)

        if (paymentStatus === 'COMPLETE') {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

            let targetQuote: any = null

            // 1. Try matching by UUID if mPaymentId is a valid UUID
            if (isUUID(mPaymentId)) {
                const { data } = await supabaseAdmin
                    .from('quotes')
                    .select('*')
                    .eq('id', mPaymentId)
                    .maybeSingle()
                if (data) targetQuote = data
            }

            // 2. Fallback: match by customer email if mPaymentId wasn't found or wasn't a valid UUID
            if (!targetQuote && emailAddress) {
                console.log(`PayFast ITN: Attempting fallback match by email: ${emailAddress}`)
                const { data } = await supabaseAdmin
                    .from('quotes')
                    .select('*')
                    .ilike('client_email', emailAddress.trim())
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                if (data) {
                    targetQuote = data
                    console.log(`PayFast ITN: Successfully matched quote ${targetQuote.id} by email ${emailAddress}`)
                }
            }

            if (targetQuote) {
                const { data: updatedData, error: updateError } = await supabaseAdmin
                    .from('quotes')
                    .update({
                        status: 'booked_paid',
                        payment_status: 'paid',
                        payment_method: 'payfast',
                        transaction_id: pfPaymentId,
                        amount_paid: amountGross ? Number(amountGross) : undefined
                    })
                    .eq('id', targetQuote.id)
                    .select()

                if (updateError) {
                    console.error('PayFast ITN DB update error:', updateError)
                    throw updateError
                }

                console.log(`✅ Quote ${targetQuote.id} → booked_paid via PayFast ITN`, updatedData)

                // Log payment activity
                try {
                    await supabaseAdmin.from('quote_activities').insert({
                        quote_id: targetQuote.id,
                        activity_type: 'payment_received',
                        description: `PayFast payment of R${amountGross || '0'} confirmed via ITN (${pfPaymentId})`
                    })
                } catch (actErr) {
                    console.warn('Could not insert payment activity (non-fatal):', actErr)
                }

                // Dispatch booking confirmed admin alert email
                if (supabaseUrl && supabaseServiceKey) {
                    try {
                        const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${supabaseServiceKey}`
                            },
                            body: JSON.stringify({
                                type: 'booking_confirmed_alert',
                                quoteData: {
                                    id: targetQuote.id,
                                    client_name: targetQuote.client_name,
                                    client_email: targetQuote.client_email,
                                    client_phone: targetQuote.client_phone,
                                    pickup_address: targetQuote.pickup_address,
                                    dropoff_address: targetQuote.dropoff_address,
                                    move_date: targetQuote.move_date,
                                    total_price: targetQuote.total_price,
                                    payment_method: 'payfast',
                                    transaction_id: pfPaymentId
                                }
                            })
                        })
                        console.log(`PayFast ITN: send-email response status: ${emailRes.status}`)
                    } catch (emailErr) {
                        console.error('PayFast ITN: send-email alert failed (non-fatal):', emailErr)
                    }
                }
            } else {
                console.error(`PayFast ITN: Could not locate quote for mPaymentId=${mPaymentId}, email=${emailAddress}, name=${nameFirst}`)
            }
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
