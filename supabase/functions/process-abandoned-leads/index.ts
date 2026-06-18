import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

console.log("Hello from process-abandoned-leads cron job!")

serve(async (req) => {
    try {
        // Initialize Supabase Client with Service Role Key (bypasses RLS)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Fetch quotes that:
        // - Have not yet had an email sent (lead_email_sent is false or null)
        // - Were last updated more than 2 minutes ago
        // - Are still in 'new' status (haven't completed checkout)
        // - Have either an email or phone number provided
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
        
        const { data: abandonedQuotes, error: fetchError } = await supabase
            .from('quotes')
            .select('*')
            .eq('status', 'new')
            .is('lead_email_sent', false)
            .lt('updated_at', twoMinutesAgo)

        if (fetchError) {
            console.error("Error fetching abandoned quotes:", fetchError)
            throw fetchError
        }

        if (!abandonedQuotes || abandonedQuotes.length === 0) {
            console.log("No new abandoned leads found.")
            return new Response(JSON.stringify({ success: true, message: "No leads to process" }), {
                headers: { 'Content-Type': 'application/json' },
            })
        }

        console.log(`Found ${abandonedQuotes.length} abandoned leads. Processing...`)

        // 2. Loop through each and trigger the send-email function locally
        let processedCount = 0;
        let failedCount = 0;

        for (const quote of abandonedQuotes) {
            // Check if they at least have an email or phone (to be useful)
            if (!quote.client_email && !quote.client_phone) {
                // Not enough info to contact them, just mark as sent to ignore in future
                await supabase.from('quotes').update({ lead_email_sent: true }).eq('id', quote.id)
                continue;
            }

            try {
                // Call our existing send-email function
                const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}` // Authenticate using service key
                    },
                    body: JSON.stringify({
                        type: 'abandoned_lead_alert',
                        quoteData: quote,
                        pdfBase64: null, // No PDF for cron jobs
                        pdfFilename: null
                    })
                })

                if (!emailResponse.ok) {
                    const errResult = await emailResponse.text()
                    console.error(`Failed to send email for quote ${quote.id}:`, errResult)
                    failedCount++
                    continue; // Do not mark as sent so we can retry next time
                }

                // 3. Mark as sent so we don't spam them
                await supabase
                    .from('quotes')
                    .update({ lead_email_sent: true, status: 'abandoned' })
                    .eq('id', quote.id)

                processedCount++
            } catch (err) {
                console.error(`Error processing quote ${quote.id}:`, err)
                failedCount++
            }
        }

        return new Response(
            JSON.stringify({ 
                success: true, 
                processed: processedCount, 
                failed: failedCount 
            }),
            { headers: { 'Content-Type': 'application/json' } },
        )

    } catch (err) {
        console.error("Fatal error processing abandoned leads:", err)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})
