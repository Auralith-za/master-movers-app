import React, { useEffect, useState } from 'react'
import { Tag, Plus, ToggleLeft, ToggleRight, Trash2, Loader, Copy, CheckCircle, RefreshCw } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

async function callCouponManager(body) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/coupon-manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify(body)
    })
    return res.json()
}

const emptyForm = { code: '', discount_percent: '', description: '', max_uses: '', expires_at: '' }

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [showForm, setShowForm] = useState(false)
    const [copied, setCopied] = useState('')
    const [error, setError] = useState('')

    const fetchCoupons = async () => {
        setLoading(true)
        const data = await callCouponManager({ action: 'list' })
        setCoupons(data.coupons || [])
        setLoading(false)
    }

    useEffect(() => { fetchCoupons() }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!form.code || !form.discount_percent) { setError('Code and discount % are required.'); return }
        setSaving(true)
        setError('')
        const res = await callCouponManager({
            action: 'create',
            code: form.code,
            discount_percent: Number(form.discount_percent),
            description: form.description,
            max_uses: form.max_uses ? Number(form.max_uses) : null,
            expires_at: form.expires_at || null
        })
        if (res.error) { setError(res.error); setSaving(false); return }
        setForm(emptyForm)
        setShowForm(false)
        await fetchCoupons()
        setSaving(false)
    }

    const handleToggle = async (coupon) => {
        await callCouponManager({ action: 'toggle', coupon_id: coupon.id })
        fetchCoupons()
    }

    const handleDelete = async (coupon) => {
        if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return
        await callCouponManager({ action: 'delete', coupon_id: coupon.id })
        fetchCoupons()
    }

    const copyCode = (code) => {
        navigator.clipboard.writeText(code)
        setCopied(code)
        setTimeout(() => setCopied(''), 1500)
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                        <Tag size={24} className="text-red-600" /> Coupon Codes
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage percentage discount coupons for customers</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchCoupons} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors" title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => { setShowForm(v => !v); setError('') }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
                    >
                        <Plus size={16} /> New Coupon
                    </button>
                </div>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5">Create New Coupon</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Coupon Code *</label>
                            <input
                                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold uppercase tracking-widest focus:border-red-500 focus:outline-none"
                                placeholder="e.g. SUMMER20"
                                value={form.code}
                                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Discount % *</label>
                            <input
                                type="number" min="1" max="100"
                                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-red-500 focus:outline-none"
                                placeholder="e.g. 10"
                                value={form.discount_percent}
                                onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Description (shown to customer)</label>
                            <input
                                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                                placeholder="e.g. Summer promotion discount"
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Max Uses (leave blank = unlimited)</label>
                            <input
                                type="number" min="1"
                                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                                placeholder="e.g. 100"
                                value={form.max_uses}
                                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Expiry Date (leave blank = never)</label>
                            <input
                                type="date"
                                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
                                value={form.expires_at}
                                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                            />
                        </div>
                        {error && <p className="sm:col-span-2 text-red-500 text-sm font-bold">{error}</p>}
                        <div className="sm:col-span-2 flex gap-3 pt-2">
                            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50">
                                {saving ? <Loader size={15} className="animate-spin" /> : <Plus size={15} />} Create Coupon
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setError('') }} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Coupons Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-slate-400">
                        <Loader size={24} className="animate-spin mr-3" /> Loading coupons...
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="text-center py-16">
                        <Tag size={40} className="text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 font-bold text-sm">No coupons yet. Create your first one above.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-3">Code</th>
                                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3">Discount</th>
                                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3 hidden sm:table-cell">Description</th>
                                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3 hidden md:table-cell">Uses</th>
                                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3 hidden md:table-cell">Expires</th>
                                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3">Status</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {coupons.map(coupon => (
                                <tr key={coupon.id} className={`hover:bg-slate-50/50 transition-colors ${!coupon.is_active ? 'opacity-50' : ''}`}>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-slate-900 tracking-widest">{coupon.code}</span>
                                            <button onClick={() => copyCode(coupon.code)} className="text-slate-300 hover:text-slate-600 transition-colors" title="Copy">
                                                {copied === coupon.code ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="bg-red-100 text-red-700 font-black text-xs px-2.5 py-1 rounded-full">
                                            -{coupon.discount_percent}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-slate-500 hidden sm:table-cell max-w-[180px] truncate">{coupon.description || '—'}</td>
                                    <td className="px-4 py-4 text-slate-500 hidden md:table-cell">
                                        {coupon.times_used}/{coupon.max_uses ?? '∞'}
                                    </td>
                                    <td className="px-4 py-4 text-slate-500 hidden md:table-cell text-xs">
                                        {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('en-ZA') : 'Never'}
                                    </td>
                                    <td className="px-4 py-4">
                                        <button onClick={() => handleToggle(coupon)} title={coupon.is_active ? 'Deactivate' : 'Activate'} className="transition-colors">
                                            {coupon.is_active
                                                ? <ToggleRight size={22} className="text-emerald-500 hover:text-slate-400" />
                                                : <ToggleLeft size={22} className="text-slate-300 hover:text-emerald-500" />
                                            }
                                        </button>
                                    </td>
                                    <td className="px-4 py-4">
                                        <button onClick={() => handleDelete(coupon)} className="text-slate-300 hover:text-red-500 transition-colors" title="Delete">
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Tip */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 font-medium">
                💡 <strong>Testing tip:</strong> Use code <code className="bg-blue-100 px-1.5 py-0.5 rounded font-black">STAFF50</code> for a 50% discount, or <code className="bg-blue-100 px-1.5 py-0.5 rounded font-black">TESTMOVE10</code> for 10% off. These are seeded into the system automatically.
            </div>
        </div>
    )
}
