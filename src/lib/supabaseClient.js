import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase URL or Key. functionality will be limited.')
}

// Create a safe client or a mock to prevent app crash
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : {
        from: () => {
            const chain = {
                select: () => chain,
                order: () => chain,
                eq: () => chain,
                single: () => Promise.resolve({ data: null, error: null }),
                insert: () => chain,
                then: (resolve) => resolve({ data: [], error: null }) // Allow await
            }
            return chain
        }
    }
