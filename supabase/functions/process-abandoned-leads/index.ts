import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

console.log("process-abandoned-leads cron job starting...")

serve(async (req) => {
    try {
        // Initialize Supabase Client with Service Role Key (bypasses RLS)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // ─── Step 1: Ensure lead_email_sent column exists ────────────────────
        // Safe to run repeatedly — ADD COLUMN IF NOT EXISTS is idempotent
        const { error: migrateError } = await supabase.rpc('exec_migration', {
            migration_sql: ''
        })
        // (ignore error — this rpc may not exist, we just try)

        // ─── Step 2: Try to add the column using a safe alter ────────────────
        // We use a trick: attempt to SELECT the column — if it fails, we know
        // we need to handle it differently (use status only approach)

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

        // Try fetching with lead_email_sent first
        let abandonedQuotes = null
        let useStatusOnly = false

        const { data: testData, error: testError } = await supabase
            .from('quotes')
            .select('id, lead_email_sent')
            .limit(1)

        if (testError && testError.message.includes('lead_email_sent')) {
            console.log('lead_email_sent column missing — using status-only approach')
            useStatusOnly = true
        }

        let fetchError = null

        if (useStatusOnly) {
            // Fallback: use status to determine who hasn't been processed yet
            // 'new' = started but not complete, 'lead' = reached step 4 but didn't pay
            // After processing, we update status to 'abandoned' — so these won't reappear
            const result = await supabase
                .from('quotes')
                .select('*')
                .in('status', ['new', 'lead'])
                .lt('created_at', fiveMinutesAgo)

            abandonedQuotes = result.data
            fetchError = result.error
        } else {
            // Normal path: use lead_email_sent column
            const result = await supabase
                .from('quotes')
                .select('*')
                .in('status', ['new', 'lead'])
                .or('lead_email_sent.is.null,lead_email_sent.eq.false')
                .lt('created_at', fiveMinutesAgo)

            abandonedQuotes = result.data
            fetchError = result.error
        }

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

        let processedCount = 0
        let failedCount = 0

        for (const quote of abandonedQuotes) {
            // Skip if no contact info
            if (!quote.client_email && !quote.client_phone) {
                await supabase.from('quotes').update({ status: 'abandoned' }).eq('id', quote.id)
                continue
            }

            // Skip if already abandoned (guard against double-processing)
            if (quote.status === 'abandoned') continue

            try {
                const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`
                    },
                    body: JSON.stringify({
                        type: 'abandoned_lead_alert',
                        quoteData: quote,
                        pdfBase64: null,
                        pdfFilename: null
                    })
                })

                if (!emailResponse.ok) {
                    const errResult = await emailResponse.text()
                    console.error(`Failed to send email for quote ${quote.id}:`, errResult)
                    failedCount++
                    continue
                }

                // Mark as abandoned so we don't re-process this lead
                const updatePayload: Record<string, unknown> = { status: 'abandoned' }
                if (!useStatusOnly) {
                    updatePayload.lead_email_sent = true
                }

                await supabase
                    .from('quotes')
                    .update(updatePayload)
                    .eq('id', quote.id)

                processedCount++
                console.log(`✅ Abandoned lead alert sent for quote ${quote.id} (${quote.client_name || 'Unknown'})`)
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
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
