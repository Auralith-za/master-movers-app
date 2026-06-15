import React, { useEffect, useState } from 'react'
import { Mail, Phone, User, MessageSquare, Clock, CheckCircle, Trash2, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const STATUS_COLORS = {
    new: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
    read: 'bg-slate-50 text-slate-600 ring-1 ring-slate-300',
    replied: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
}

export default function ContactSubmissionsPage() {
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    const fetchSubmissions = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('contact_submissions')
            .select('*')
            .order('created_at', { ascending: false })
        if (!error) setSubmissions(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchSubmissions() }, [])

    const markAs = async (id, status) => {
        await supabase.from('contact_submissions').update({ status }).eq('id', id)
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    }

    const filtered = submissions.filter(s => filter === 'all' || s.status === filter)
    const newCount = submissions.filter(s => s.status === 'new').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Contact Form Submissions</h1>
                    <p className="text-slate-500 text-sm mt-1">Messages received from the website contact form.</p>
                </div>
                <div className="flex items-center gap-3">
                    {newCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                            {newCount} New
                        </span>
                    )}
                    <button
                        onClick={fetchSubmissions}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                {['all', 'new', 'read', 'replied'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            filter === f
                                ? 'bg-slate-900 text-white shadow'
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {f} {f === 'all' ? `(${submissions.length})` : `(${submissions.filter(s => s.status === f).length})`}
                    </button>
                ))}
            </div>

            {/* Submissions */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                    <RefreshCw className="animate-spin mr-3" size={18} /> Loading...
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
                    <CheckCircle className="mx-auto text-emerald-400 mb-3" size={40} />
                    <p className="text-slate-500 font-medium">No submissions found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(sub => (
                        <div
                            key={sub.id}
                            className={`bg-white rounded-2xl border shadow-sm p-6 transition-all ${
                                sub.status === 'new' ? 'border-blue-200 shadow-blue-50' : 'border-slate-100'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    {/* Top row */}
                                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${STATUS_COLORS[sub.status] || STATUS_COLORS.read}`}>
                                            {sub.status}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock size={11} />
                                            {new Date(sub.created_at).toLocaleString('en-ZA', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    {/* Contact info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <User size={14} className="text-slate-400 shrink-0" />
                                            <span className="font-bold text-slate-800">{sub.name || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail size={14} className="text-slate-400 shrink-0" />
                                            <a href={`mailto:${sub.email}`} className="text-blue-600 hover:underline truncate">{sub.email || '—'}</a>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone size={14} className="text-slate-400 shrink-0" />
                                            <a href={`tel:${sub.phone}`} className="text-slate-700 hover:text-blue-600">{sub.phone || '—'}</a>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                                        <MessageSquare size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{sub.message}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 shrink-0">
                                    <a
                                        href={`mailto:${sub.email}`}
                                        onClick={() => markAs(sub.id, 'replied')}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl uppercase tracking-wide transition-colors"
                                    >
                                        <Mail size={12} /> Reply
                                    </a>
                                    {sub.status === 'new' && (
                                        <button
                                            onClick={() => markAs(sub.id, 'read')}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl uppercase tracking-wide transition-colors"
                                        >
                                            <CheckCircle size={12} /> Mark Read
                                        </button>
                                    )}
                                    <a
                                        href={`tel:${sub.phone}`}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-black rounded-xl uppercase tracking-wide transition-colors"
                                    >
                                        <Phone size={12} /> Call
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
