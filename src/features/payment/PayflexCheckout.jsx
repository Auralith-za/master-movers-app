import React, { useState } from 'react'
import Button from '../../components/ui/Button'

export default function PayflexCheckout({ quote }) {
    const [isLoading, setIsLoading] = useState(false)

    // Redirect to Payflex via server-side session initiation
    const handlePayflexClick = async () => {
        setIsLoading(true)
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
            const payflexCheckoutUrl = `${supabaseUrl}/functions/v1/payflex-checkout`

            const response = await fetch(payflexCheckoutUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    quoteId: quote.id || 'TEST-' + Date.now(),
                    amount: Number(quote.total_price || quote.total).toFixed(2),
                    customer: {
                        name: quote.client_name || 'Client',
                        email: quote.client_email || '',
                        phone: quote.client_phone || ''
                    }
                })
            })

            // Safely parse JSON — if the edge function crashes, Supabase may return HTML
            let data
            const contentType = response.headers.get('content-type') || ''
            if (contentType.includes('application/json')) {
                data = await response.json()
            } else {
                const rawText = await response.text()
                console.error('Payflex returned non-JSON response:', rawText)
                throw new Error(`Payment service error (HTTP ${response.status}). Please try again or contact support.`)
            }

            if (!response.ok) throw new Error(data.error || 'Failed to initiate Payflex session')

            if (data.redirectUrl) {
                // Redirect user to Payflex production site
                window.location.href = data.redirectUrl
            } else {
                throw new Error('No redirect URL returned from Payflex')
            }
        } catch (error) {
            console.error('Payflex checkout error:', error)
            alert('Payflex checkout error: ' + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 text-center">
                <div className="flex flex-col items-center gap-2 mb-4">
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        Payflex Installments
                    </span>
                    <h4 className="text-2xl font-black text-slate-900 italic uppercase">
                        4 x R{((quote.total_price || quote.total || 0) / 4).toFixed(2)}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">Interest-free. Pay over 6 weeks.</p>
                </div>

                <Button
                    variant="ghost"
                    size="lg"
                    className="w-full bg-[#1A1A1A] hover:bg-slate-900 text-white shadow-xl shadow-indigo-100 font-black uppercase tracking-widest py-6"
                    onClick={handlePayflexClick}
                    isLoading={isLoading}
                >
                    Checkout with Payflex
                </Button>
            </div>
        </div>
    )
}
