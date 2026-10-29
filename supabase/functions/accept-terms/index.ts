import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { quoteId, signatureName, idNumber, signatureIdNumber, signatureDate } = await req.json()
        const cleanIdNumber = (idNumber || signatureIdNumber || '').trim()

        if (!quoteId || !signatureName) {
            return new Response(
                JSON.stringify({ error: 'Missing quoteId or signatureName' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Use service role to bypass RLS — only updates acceptance fields
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const signatureJson = {
            name: signatureName,
            idNumber: cleanIdNumber,
            id_number: cleanIdNumber,
            date: signatureDate || new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('quotes')
            .update({
                terms_accepted: true,
                signature_json: signatureJson,
                status: 'pending_payment'
            })
            .eq('id', quoteId)
            .select()

        if (error) throw error

        // Log the activity
        await supabase.from('quote_activities').insert([{
            quote_id: quoteId,
            activity_type: 'system',
            content: `Client accepted and signed terms. Signature: ${signatureName}${cleanIdNumber ? ` (ID: ${cleanIdNumber})` : ''}`
        }])

        return new Response(
            JSON.stringify({ success: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('accept-terms error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
