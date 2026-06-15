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

        console.log(`PayFlex mode: ${isProduction ? 'PRODUCTION' : 'UAT/SANDBOX'}`)

        if (!merchantId || !apiKey) {
            throw new Error("Missing PAYFLEX_MERCHANT_ID or PAYFLEX_API_KEY secrets in Supabase.")
        }

        // 2. Select the correct endpoint
        const gatewayUrl = isProduction
            ? 'https://api.payflex.co.za/payment/v2/checkout'
            : 'https://api.uat.payflex.co.za/payment/v2/checkout'

        // 3. Build callback/redirect URLs
        const originUrl = req.headers.get('origin') || 'https://fanciful-cupcake-cb7c87.netlify.app'
        const successUrl = redirectUrl || `${originUrl}/payment/success?m_payment_id=${quoteId}&gateway=payflex`
        const failUrl = cancelUrl || `${originUrl}/payment/cancel?m_payment_id=${quoteId}&gateway=payflex`
        const callbackUrl = `https://yrrskvzdpcdnwojstvcw.functions.supabase.co/payflex-callback`

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

        console.log(`Initiating Payflex authentication for Quote ${quoteId}`)
        console.log('Gateway URL:', gatewayUrl)

        // 5. Retrieve Bearer Token from Auth0
        const tokenAudience = isProduction
            ? 'https://auth-production.payflex.co.za'
            : 'https://auth-dev.payflex.co.za'

        // 5. Retrieve Bearer Token — try multiple auth endpoints in order
        const tokenAudience = isProduction
            ? 'https://auth-production.payflex.co.za'
            : 'https://auth-dev.payflex.co.za'

        // PayFlex uses Auth0 but the tenant domain varies. We try all known endpoints in order.
        const authEndpoints = [
            'https://payflex.eu.auth0.com/oauth/token',   // Documented endpoint
            'https://auth.payflex.co.za/oauth/token',     // Custom domain (returns real auth responses)
            'https://identity.payflex.co.za/oauth/token', // Alternative custom domain
        ]

        const authPayload = JSON.stringify({
            client_id: merchantId,
            client_secret: apiKey,
            audience: tokenAudience,
            grant_type: 'client_credentials'
        })

        let authBody: any = null
        let lastAuthError = ''

        for (const endpoint of authEndpoints) {
            console.log(`Trying auth endpoint: ${endpoint}`)
            try {
                const authResponse = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: authPayload
                })

                const authContentType = authResponse.headers.get('content-type') || ''
                if (!authContentType.includes('application/json')) {
                    const rawText = await authResponse.text()
                    console.warn(`${endpoint} returned HTTP ${authResponse.status} non-JSON:`, rawText.substring(0, 200))
                    lastAuthError = `HTTP ${authResponse.status} from ${endpoint}`
                    continue // Try next endpoint
                }

                const body = await authResponse.json()

                if (authResponse.ok && body.access_token) {
                    console.log(`✅ Authentication succeeded via ${endpoint}`)
                    authBody = body
                    break
                }

                // Got JSON error — record it but try next endpoint
                lastAuthError = body.error_description || body.error || body.message || `HTTP ${authResponse.status}`
                console.warn(`${endpoint} auth failed:`, lastAuthError)

            } catch (fetchErr: any) {
                lastAuthError = fetchErr.message
                console.warn(`${endpoint} fetch error:`, fetchErr.message)
            }
        }

        if (!authBody || !authBody.access_token) {
            throw new Error(`PayFlex authentication failed on all endpoints. Last error: ${lastAuthError}. Please verify your PAYFLEX_MERCHANT_ID and PAYFLEX_API_KEY secrets are correct for the PRODUCTION environment.`)
        }

        const accessToken = authBody.access_token
        if (!accessToken) {
            throw new Error("No access token returned from Payflex Identity Server.")
        }

        console.log(`Successfully authenticated! Creating Payflex checkout session...`)

        // 6. Call Payflex API using Bearer Token
        let result: any
        try {
            const response = await fetch(gatewayUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            const contentType = response.headers.get("content-type") || ""
            if (!contentType.includes("application/json")) {
                const rawBody = await response.text()
                console.error(`Non-JSON response from Payflex gateway (HTTP ${response.status}):`, rawBody.substring(0, 500))
                throw new Error(`Payflex gateway returned an invalid response (HTTP ${response.status}). Please check your PayFlex merchant account is active.`)
            }

            result = await response.json()

            if (!response.ok) {
                console.error("Payflex API Error:", JSON.stringify(result))
                throw new Error(result.message || result.error || `Payflex API error: ${response.status}`)
            }
        } catch (gatewayError: any) {
            console.error("Payflex gateway error:", gatewayError.message)
            throw new Error(`PayFlex gateway error: ${gatewayError.message}`)
        }

        console.log("Payflex session created successfully!", JSON.stringify(result))

        return new Response(
            JSON.stringify({
                success: true,
                redirectUrl: result.redirectUrl,
                orderToken: result.orderToken,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error: any) {
        console.error("Error in payflex-checkout function:", error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
