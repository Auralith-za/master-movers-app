import React from 'react'

export default function PayflexWidget({ amount }) {
    const installment = (amount / 4).toFixed(2)

    return (
        <div className="mt-4 border border-indigo-100 bg-indigo-50/50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">Pay in 4 interest-free installments</span>
                    <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-sm">Payflex</span>
                </div>
                <p className="text-sm text-slate-600">
                    Pay <span className="font-bold text-slate-900">R{installment}</span> today and the rest over 6 weeks.
                </p>
            </div>
            {/* Visual branding */}
            <div className="hidden sm:block opacity-80">
                <svg width="60" height="20" viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Simplified Placeholder for Payflex Logo */}
                    <rect width="100" height="32" rx="4" fill="#3D38BA" />
                    <text x="50" y="22" fontFamily="Arial" fontSize="14" fill="white" textAnchor="middle" fontWeight="bold">PAYFLEX</text>
                </svg>
            </div>
        </div>
    )
}
