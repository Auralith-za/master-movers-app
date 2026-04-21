import React, { useRef } from 'react'
import Button from '../../components/ui/Button'

export default function PayflexCheckout({ quote }) {
    // Placeholder for Payflex Redirect
    const handlePayflexClick = () => {
        // In a real implementation this would likely POST to Payflex API or redirect
        alert('DEMO MODE: Payflex Widget Integration would appear here. Requires Merchant ID.')
        // window.location.href = 'https://payflex.co.za/...'
    }

    return (
        <div className="w-full">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 text-center">
                <div className="flex flex-col items-center gap-2 mb-4">
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        Payflex Installments
                    </span>
                    <h4 className="text-2xl font-black text-slate-900 italic uppercase">
                        4 x R{(quote.total_price / 4).toFixed(2)}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">Interest-free. Pay over 6 weeks.</p>
                </div>

                <Button
                    variant="ghost"
                    size="lg"
                    className="w-full bg-[#1A1A1A] hover:bg-slate-900 text-white shadow-xl shadow-indigo-100 font-black uppercase tracking-widest py-6"
                    onClick={handlePayflexClick}
                >
                    Checkout with Payflex
                </Button>
            </div>
        </div>
    )
}
