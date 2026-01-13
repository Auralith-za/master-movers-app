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
        <div className="w-full mt-3">
            <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-4 mb-3">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-900 border-b border-indigo-200 pb-0.5">Pay in 4 Installments</span>
                    <span className="text-indigo-600 font-bold text-sm">Interest Free</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                    4 x R{(quote.total_price / 4).toFixed(2)}
                </p>
                <Button
                    variant="primary"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                    onClick={handlePayflexClick}
                >
                    Pay with Payflex
                </Button>
            </div>
        </div>
    )
}
