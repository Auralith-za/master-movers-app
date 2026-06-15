import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { quoteId, amount, customer, redirectUrl, cancelUrl } = await req.json()

        // 1. Retrieve credentials
        const merchantId = Deno.env.get('PAYFLEX_MERCHANT_ID')
        const apiKey = Deno.env.get('PAYFLEX_API_KEY')
        const isProduction = Deno.env.get('PAYFLEX_PRODUCTION') === 'true'

        if (!merchantId || !apiKey) {
            throw new Error("Missing PAYFLEX_MERCHANT_ID or PAYFLEX_API_KEY secrets in Supabase.")
        }

        // 2. Select the correct endpoint
        const gatewayUrl = isProduction
            ? 'https://api.payflex.co.za/payment/v2/checkout'
            : 'https://sandbox-api.payflex.co.za/payment/v2/checkout'

        // 3. Build callback/redirect URLs
        const originUrl = req.headers.get('origin') || 'http://localhost:5173'
        const successUrl = redirectUrl || `${originUrl}/payment/success?m_payment_id=${quoteId}&gateway=payflex`
        const failUrl = cancelUrl || `${originUrl}/payment/cancel?m_payment_id=${quoteId}&gateway=payflex`
        const callbackUrl = Deno.env.get('PAYFLEX_CALLBACK_URL') || `https://yrrskvzdpcdnwojstvcw.functions.supabase.co/payflex-callback`

        // Split customer name
        const clientName = customer?.name || 'Valued Client'
        const parts = clientName.trim().split(/\s+/)
        const firstName = parts[0] || 'Client'
        const lastName = parts.slice(1).join(' ') || 'Customer'

        // 4. Create Payflex payload
        const payload = {
            amount: Number(amount),
            currency: 'ZAR',
            merchantReference: quoteId,
            redirectUrl: successUrl,
            cancelUrl: failUrl,
            callbackUrl: callbackUrl,
            customer: {
                firstName: firstName,
                lastName: lastName,
                email: customer?.email || '',
                phone: customer?.phone || ''
            }
        }

        console.log(`Initiating Payflex checkout for Quote ${quoteId}, Amount: R${amount}`)

        // 5. Call Payflex API using Basic Auth
        const authHeader = `Basic ${btoa(merchantId + ':' + apiKey)}`
        const response = await fetch(gatewayUrl, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const result = await response.json()

        if (!response.ok) {
            console.error("Payflex API Error:", result)
            throw new Error(result.message || "Failed to create checkout session with Payflex.")
        }

        console.log("Payflex session created successfully!", result)

        return new Response(
            JSON.stringify({
                success: true,
                redirectUrl: result.redirectUrl,
                orderToken: result.orderToken,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error) {
        console.error("Error in payflex-checkout function:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
