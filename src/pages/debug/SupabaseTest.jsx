import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function SupabaseTest() {
    const [status, setStatus] = useState('Testing...')
    const [envCheck, setEnvCheck] = useState({})
    const [writeTest, setWriteTest] = useState(null)

    useEffect(() => {
        runDiagnostics()
    }, [])

    const runDiagnostics = async () => {
        // 1. Check Env Vars
        const url = import.meta.env.VITE_SUPABASE_URL
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY

        const envStatus = {
            urlPresent: !!url,
            urlValue: url ? `${url.substring(0, 15)}...` : 'MISSING',
            keyPresent: !!key,
            keyValue: key ? `${key.substring(0, 10)}...` : 'MISSING'
        }
        setEnvCheck(envStatus)

        if (!url || !key) {
            setStatus('FAILED: Missing Environment Variables')
            return
        }

        // 2. Test Read
        try {
            const { data, error } = await supabase.from('quotes').select('count').limit(1)
            if (error) {
                setStatus(`READ FAILED: ${error.message} (${error.code})`)
            } else {
                setStatus('READ SUCCESS')
            }
        } catch (e) {
            setStatus(`CRASH: ${e.message}`)
        }

        // 3. Test Write (Mock Quote)
        try {
            const { data, error } = await supabase.from('quotes').insert([{
                client_name: 'Debug Test',
                status: 'test_entry',
                total_price: 123.45,
                // Add minimal required fields to pass validation if any
                pickup_address: 'Debug Test',
                dropoff_address: 'Debug Test',
                move_date: new Date().toISOString()
            }]).select()

            if (error) {
                setWriteTest(`WRITE FAILED: ${error.message} (${error.code}) - Details: ${JSON.stringify(error)}`)
            } else {
                setWriteTest('WRITE SUCCESS')
            }
        } catch (e) {
            setWriteTest(`WRITE CRASH: ${e.message}`)
        }
    }

    return (
        <div className="p-10 font-mono text-sm">
            <h1 className="text-xl font-bold mb-4">Supabase Diagnostics</h1>

            <div className="mb-6 p-4 bg-gray-100 rounded">
                <h2 className="font-bold mb-2">Environment</h2>
                <p>URL: {envCheck.urlValue} {envCheck.urlPresent ? '✅' : '❌'}</p>
                <p>Key: {envCheck.keyValue} {envCheck.keyPresent ? '✅' : '❌'}</p>
            </div>

            <div className="mb-6 p-4 border rounded">
                <h2 className="font-bold mb-2">Connection Status</h2>
                <div className={`text-lg ${status.includes('SUCCESS') ? 'text-green-600' : 'text-red-600'}`}>
                    {status}
                </div>
            </div>

            <div className="mb-6 p-4 border rounded">
                <h2 className="font-bold mb-2">Write Test</h2>
                <div className={`text-lg ${writeTest?.includes('SUCCESS') ? 'text-green-600' : 'text-red-600'}`}>
                    {writeTest || 'Running...'}
                </div>
            </div>

            <button onClick={runDiagnostics} className="px-4 py-2 bg-blue-500 text-white rounded">
                Re-run Test
            </button>
        </div>
    )
}
