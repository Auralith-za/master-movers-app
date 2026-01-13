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

        // 2. (Mock) integration with Twilio / Meta API
        // In production, you would fetch fetch('https://graph.facebook.com/...')
        console.log(`Sending WhatsApp to ${phone} using template ${template_name || 'default'}`, parameters)

        // Simulate success
        return new Response(
            JSON.stringify({ success: true, message: "WhatsApp sent successfully (Mock)" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
