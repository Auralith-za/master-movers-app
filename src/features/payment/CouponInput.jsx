import React, { useState } from 'react'
import { Tag, CheckCircle, XCircle, Loader } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/**
 * CouponInput — lets customers enter a promo code and applies a % discount.
 * Props:
 *  onApply(coupon) — called with { code, discount_percent, description } when valid
 *  onRemove()      — called when the coupon is removed
 *  appliedCoupon   — the currently applied coupon object (or null)
 */
export default function CouponInput({ onApply, onRemove, appliedCoupon }) {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleValidate = async () => {
        const trimmed = code.trim().toUpperCase()
        if (!trimmed) return
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${SUPABASE_URL}/functions/v1/coupon-manager`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ action: 'validate', code: trimmed })
            })
            const data = await res.json()
            if (data.valid) {
                onApply({ 
                    code: data.code, 
                    discount_type: data.discount_type,
                    discount_percent: data.discount_percent, 
                    discount_amount: data.discount_amount,
                    description: data.description 
                })
                setCode('')
            } else {
                setError(data.error || 'Invalid coupon code.')
            }
        } catch (e) {
            setError('Could not validate coupon. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleValidate()
    }

    // ── Applied state ────────────────────────────────────────────────────
    if (appliedCoupon) {
        return (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                    <div>
                        <p className="text-emerald-900 font-black text-sm uppercase tracking-widest">
                            {appliedCoupon.code}
                            <span className="ml-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                                {appliedCoupon.discount_type === 'fixed' 
                                    ? `-R ${appliedCoupon.discount_amount}` 
                                    : `-${appliedCoupon.discount_percent}%`}
                            </span>
                        </p>
                        {appliedCoupon.description && (
                            <p className="text-emerald-700 text-[11px] mt-0.5">{appliedCoupon.description}</p>
                        )}
                    </div>
                </div>
                <button
                    onClick={onRemove}
                    className="text-slate-400 hover:text-red-500 transition-colors ml-2 shrink-0"
                    title="Remove coupon"
                >
                    <XCircle size={18} />
                </button>
            </div>
        )
    }

    // ── Input state ──────────────────────────────────────────────────────
    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={code}
                        onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
                        onKeyDown={handleKeyDown}
                        placeholder="PROMO CODE"
                        className="w-full pl-9 pr-3 py-3 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:outline-none text-sm font-bold uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-normal transition-colors"
                    />
                </div>
                <button
                    onClick={handleValidate}
                    disabled={loading || !code.trim()}
                    className="px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-black uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                >
                    {loading ? <Loader size={15} className="animate-spin" /> : 'Apply'}
                </button>
            </div>
            {error && (
                <p className="text-red-500 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                    <XCircle size={13} /> {error}
                </p>
            )}
        </div>
    )
}
