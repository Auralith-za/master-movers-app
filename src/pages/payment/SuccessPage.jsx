import React, { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Button from '../../components/ui/Button'
// ... existing imports
import { event } from '../../lib/gtag'

export default function SuccessPage() {
    const [searchParams] = useSearchParams()
    const { resetMove } = useMoveStore()

    // In a real scenario, we might verify using the ID, but for now we just show success
    // The ID might come from the URL ?pf_payment_id=... or a custom ref param
    const reference = searchParams.get('m_payment_id') || 'REF-User'

    // ... existing code ...

    useEffect(() => {
        // Track Purchase
        event({
            action: 'conversion',
            category: 'Sales',
            label: 'Purchase',
            value: 1 // You can pass actual value here if available in store/url
        })

        // clear the local store once the booking is successful
        resetMove()
    }, [resetMove])

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center">
                <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                </div>

                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                    Payment Successful!
                </h2>
                <p className="text-slate-500 mb-8">
                    Your move has been successfully booked. We have sent a confirmation email to you.
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8">
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Reference Number</p>
                    <p className="text-lg font-mono font-bold text-slate-700">{reference}</p>
                </div>

                <div className="space-y-3">
                    <Link to="/">
                        <Button className="w-full justify-center" size="lg">
                            Return to Home
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
