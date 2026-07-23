import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { quoteId, amount, customer, redirectUrl, cancelUrl } = await req.json()

        // 1. Retrieve credentials
        const merchantId = Deno.env.get('PAYFLEX_MERCHANT_ID')
        const apiKey = Deno.env.get('PAYFLEX_API_KEY')
        const isProduction = Deno.env.get('PAYFLEX_PRODUCTION') === 'true'

        console.log(`PayFlex mode: ${isProduction ? 'PRODUCTION' : 'UAT/SANDBOX'}`)

        if (!merchantId || !apiKey) {
            throw new Error("Missing PAYFLEX_MERCHANT_ID or PAYFLEX_API_KEY secrets in Supabase.")
        }

        // 2. Endpoints — sourced from official PayFlex WooCommerce plugin config.php
        // auth_url production : https://auth.payflex.co.za/auth/merchant
        // api_url  production : https://api.payflex.co.za
        // Order endpoint      : {api_url}/order/productSelect
        const authUrl = isProduction
            ? 'https://auth.payflex.co.za/auth/merchant'
            : 'https://auth-uat.payflex.co.za/auth/merchant'

        const apiBaseUrl = isProduction
            ? 'https://api.payflex.co.za'
            : 'https://api.uat.payflex.co.za'

        const gatewayUrl = `${apiBaseUrl}/order/productSelect`

        const tokenAudience = isProduction
            ? 'https://auth-production.payflex.co.za'
            : 'https://auth-dev.payflex.co.za'

        // 3. Build callback/redirect URLs
        const originUrl = req.headers.get('origin') || 'https://fanciful-cupcake-cb7c87.netlify.app'
        const successUrl = redirectUrl || `${originUrl}/payment/success?m_payment_id=${quoteId}&gateway=payflex`
        const failUrl = cancelUrl || `${originUrl}/payment/cancel?m_payment_id=${quoteId}&gateway=payflex`

        // 4. Clean & Split customer name
        const rawName = customer?.name || 'Valued Client'
        const clientName = rawName.replace(/\b(.+?)\s+\1\b/gi, '$1').trim()
        const parts = clientName.split(/\s+/)
        const firstName = parts[0] || 'Client'
        const lastName = parts.slice(1).join(' ') || 'Customer'

        // 5. Authenticate — confirmed working endpoint
        console.log(`Authenticating at: ${authUrl}`)
        const authResponse = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: merchantId,
                client_secret: apiKey,
                audience: tokenAudience,
                grant_type: 'client_credentials'
            })
        })

        const authContentType = authResponse.headers.get('content-type') || ''
        if (!authContentType.includes('application/json')) {
            const rawText = await authResponse.text()
            throw new Error(`PayFlex auth failed HTTP ${authResponse.status}: ${rawText.substring(0, 150)}`)
        }

        const authBody = await authResponse.json()
        if (!authResponse.ok || !authBody.access_token) {
            throw new Error(authBody.message || authBody.error_description || authBody.error || `Auth failed: HTTP ${authResponse.status}`)
        }

        const accessToken = authBody.access_token
        console.log(`✅ Authenticated! expires_in: ${authBody.expires_in}s`)

        // 6. Build order payload — matching official plugin OrderBodyObj exactly
        const amountFormatted = Number(amount).toFixed(2)
        const payload = {
            amount: amountFormatted,
            consumer: {
                phoneNumber: customer?.phone || '',
                givenNames: firstName,
                surname: lastName,
                email: customer?.email || ''
            },
            billing: {
                addressLine1: '',
                addressLine2: '',
                suburb: '',
                postcode: ''
            },
            shipping: {
                addressLine1: '',
                addressLine2: '',
                suburb: '',
                postcode: ''
            },
            description: `Master Movers Quote ${quoteId}`,
            items: [],
            merchant: {
                redirectConfirmUrl: successUrl,
                redirectCancelUrl: failUrl,
                // Server-side webhook — PayFlex POSTs here when payment is approved/declined
                notificationUrl: `${Deno.env.get('SUPABASE_URL') ?? 'https://yrrskvzdpcdnwojstvcw.supabase.co'}/functions/v1/payflex-callback`
            },
            merchantReference: String(quoteId),
            taxAmount: 0,
            shippingAmount: 0,
            merchantSystemInformation: {
                plugin_version: '1.0.0',
                ecommerce_platform: 'Master Movers Custom App'
            }
        }

        console.log(`Creating PayFlex order at: ${gatewayUrl} for R${amountFormatted}`)

        const response = await fetch(gatewayUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const contentType = response.headers.get("content-type") || ""
        const rawBody = await response.text()

        console.log(`Gateway HTTP ${response.status}: ${rawBody.substring(0, 400)}`)

        if (!contentType.includes("application/json")) {
            throw new Error(`PayFlex gateway error (HTTP ${response.status}): ${rawBody.substring(0, 150)}`)
        }

        const result = JSON.parse(rawBody)

        if (!response.ok) {
            throw new Error(result.message || result.error || `Payflex API error: ${response.status}`)
        }

        console.log("✅ PayFlex order created!", JSON.stringify(result))

        // Plugin expects: redirectUrl, orderId, token
        return new Response(
            JSON.stringify({
                success: true,
                redirectUrl: result.redirectUrl,
                orderToken: result.token,
                orderId: result.orderId,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error: any) {
        console.error("Error in payflex-checkout:", error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
