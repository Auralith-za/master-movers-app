import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { phone, template_name, parameters } = await req.json()

        // 1. Validate Input
        if (!phone) throw new Error("Missing phone number")

        // 2. Format Phone Number for Twilio (whatsapp:+1234567890)
        // Remove non-digits
        const cleanPhone = phone.replace(/\D/g, '')
        const toPhone = `whatsapp:${cleanPhone}`

        // 3. Get Secrets
        const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
        const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
        const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER') // e.g. "whatsapp:+14155238886"

        if (!accountSid || !authToken || !fromPhone) {
            throw new Error("Server Misconfiguration: Missing Twilio secrets")
        }

        // 4. Resolve Content (Body vs Template)
        // NOTE: For production Business Initiated conversations, you MUST use ContentSid or Templates.
        // For Sandbox/24h window, simple text Body works. 
        // We'll fallback to a simple text mapping based on template_name for now.

        let messageBody = ""
        switch (template_name) {
            case 'booking_confirmation':
                messageBody = "Your booking with Master Movers is confirmed! We look forward to moving you."
                break
            case 'move_reminder':
                messageBody = "Reminder: Your move with Master Movers is coming up soon. Please ensure you are packed and ready."
                break
            default:
                messageBody = `Update from Master Movers: ${template_name}`
        }

        console.log(`Sending Twilio WhatsApp to ${toPhone} from ${fromPhone}...`)

        // 5. Call Twilio API
        // https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

        const params = new URLSearchParams()
        params.append('To', toPhone)
        params.append('From', fromPhone)
        params.append('Body', messageBody)

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(accountSid + ':' + authToken)}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        })

        const result = await response.json()

        if (!response.ok) {
            console.error("Twilio API Error:", result)
            throw new Error(result.message || "Failed to send WhatsApp message")
        }

        console.log("Twilio WhatsApp sent successfully:", result.sid)

        return new Response(
            JSON.stringify({ success: true, sid: result.sid, status: result.status }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error) {
        console.error("Function Error:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
