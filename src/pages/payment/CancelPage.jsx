import React, { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import Button from '../../components/ui/Button'

export default function CancelPage() {
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const quoteId = searchParams.get('m_payment_id')
        if (!quoteId) return

        // Mark the quote as payment_cancelled on the backend using the service-role edge function
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
        fetch(`${supabaseUrl}/functions/v1/confirm-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ quoteId, status: 'payment_cancelled' })
        })
        .then(r => r.json())
        .then(result => {
            if (result.success) {
                console.log('✅ Quote marked as payment_cancelled:', quoteId)
            } else {
                console.warn('Cancel update result:', result)
            }
        })
        .catch(err => console.error('Cancel update error:', err))
    }, [])

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center">
                <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <XCircle className="h-12 w-12 text-red-600" />
                </div>

                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                    Payment Cancelled
                </h2>
                <p className="text-slate-500 mb-8">
                    The payment process was cancelled or failed. Your quote is still saved if you want to try again.
                </p>

                <div className="space-y-3">
                    <Link to="/quote">
                        <Button className="w-full justify-center" size="lg">
                            Return to Quote
                        </Button>
                    </Link>
                    <Link to="/contact-us">
                        <Button variant="ghost" className="w-full justify-center">
                            Contact Support
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
