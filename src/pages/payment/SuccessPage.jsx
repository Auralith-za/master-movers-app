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

    const [showConfetti, setShowConfetti] = React.useState(true)

    useEffect(() => {
        // Track Purchase
        event({
            action: 'conversion',
            category: 'Sales',
            label: 'Purchase',
            value: 1
        })

        // clear the local store once the booking is successful
        resetMove()

        // Hide confetti after 5s
        const timer = setTimeout(() => setShowConfetti(false), 5000)
        return () => clearTimeout(timer)
    }, [resetMove])

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Confetti Placeholder (CSS animation) */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center">
                    <div className="w-full h-full absolute top-0 left-0 bg-[url('https://cdn.jsdelivr.net/gh/loonywizard/js-confetti@master/demo/images/ribbons.png')] opacity-20 animate-pulse"></div>
                </div>
            )}

            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center relative z-10 animate-in zoom-in-95 duration-500">
                <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in hover:scale-105 transition-transform duration-300">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                </div>

                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                    Payment Successful!
                </h2>
                <div className="w-16 h-1 bg-green-500 mx-auto rounded-full mb-6"></div>

                <p className="text-slate-500 mb-8 text-lg">
                    Thank you! Your move has been secured. <br />
                    We've sent a confirmation email with all the details.
                </p>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Booking Reference</p>
                    <p className="text-2xl font-mono font-bold text-slate-800 tracking-wider">{reference}</p>
                </div>

                <div className="space-y-3">
                    <Link to="/">
                        <Button className="w-full justify-center" size="lg">
                            Return to Home <ArrowRight className="ml-2" size={18} />
                        </Button>
                    </Link>
                    <Link to="/contact-us">
                        <Button variant="ghost" className="w-full justify-center text-slate-500 hover:text-slate-700">
                            Need Help? Contact Support
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
