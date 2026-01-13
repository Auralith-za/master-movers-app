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
        from: () => ({
            select: () => Promise.resolve({ data: [], error: null }),
            insert: () => ({
                select: () => Promise.resolve({ data: [{ id: 'mock-id-123', status: 'new' }], error: null }),
            }),
            // Add other methods as needed for basic crash prevention
        })
    }
