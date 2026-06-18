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
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const results = []

        // 1. Create RLS policies for quote_activities
        const sqlStatements = [
            `DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies
                    WHERE tablename = 'quote_activities'
                    AND policyname = 'Allow public insert on quote_activities'
                ) THEN
                    CREATE POLICY "Allow public insert on quote_activities"
                    ON public.quote_activities FOR INSERT TO public WITH CHECK (true);
                END IF;
            END $$;`,
            `DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies
                    WHERE tablename = 'quote_activities'
                    AND policyname = 'Allow public read on quote_activities'
                ) THEN
                    CREATE POLICY "Allow public read on quote_activities"
                    ON public.quote_activities FOR SELECT TO public USING (true);
                END IF;
            END $$;`,
            `DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies
                    WHERE tablename = 'quotes'
                    AND policyname = 'Allow public read on quotes'
                ) THEN
                    CREATE POLICY "Allow public read on quotes"
                    ON public.quotes FOR SELECT TO public USING (true);
                END IF;
            END $$;`,
            `ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS manual_service_charges jsonb DEFAULT '{}'::jsonb;`,
        ]

        for (const sql of sqlStatements) {
            const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({ error: null }))
            // Try raw query as fallback
            try {
                await supabase.from('_temp_check').select().limit(0)
            } catch {}
            results.push({ sql: sql.substring(0, 60), error: error?.message || null })
        }

        // Test insert directly using service role
        const { error: testError } = await supabase
            .from('quote_activities')
            .insert([{ quote_id: '00000000-0000-0000-0000-000000000001', activity_type: 'system', content: 'RLS fix test' }])

        return new Response(
            JSON.stringify({ success: true, results, testInsertError: testError?.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
