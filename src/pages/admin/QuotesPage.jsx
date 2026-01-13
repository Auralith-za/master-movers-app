import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Search, Filter, Eye, MessageCircle, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function QuotesPage() {
    const [quotes, setQuotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        fetchQuotes()
    }, [])

    const fetchQuotes = async () => {
        try {
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setQuotes(data || [])
        } catch (error) {
            console.error('Error fetching quotes:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-50 text-blue-700 ring-blue-600/20'
            case 'processing': return 'bg-purple-50 text-purple-700 ring-purple-600/20'
            case 'booked': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
            case 'on_hold': return 'bg-orange-50 text-orange-700 ring-orange-600/20'
            default: return 'bg-slate-50 text-slate-700 ring-slate-600/20'
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Quote Management</h2>
                    <p className="text-slate-500">Manage pending and active moving quotes.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-slate-600 hover:bg-gray-50 font-medium transition-colors">
                        <Filter size={18} /> Filter
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search client..."
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                </div>
            </div>

            {/* Quotes Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-gray-100">
                            <th className="px-6 py-4 font-semibold">Ref #</th>
                            <th className="px-6 py-4 font-semibold">Client</th>
                            <th className="px-6 py-4 font-semibold">Route</th>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Value</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading quotes...</td></tr>
                        ) : quotes.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-8 text-slate-400">No quotes found.</td></tr>
                        ) : (
                            quotes.map((quote) => (
                                <tr key={quote.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 text-sm font-mono text-slate-400">#{quote.id.toString().substring(0, 6)}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{quote.client_name}</div>
                                        <div className="text-xs text-slate-500">{quote.client_phone}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="text-slate-900">{quote.pickup_address?.split(',')[0]}</div>
                                        <div className="text-slate-400 text-xs">to {quote.dropoff_address?.split(',')[0]}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{quote.move_date}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {quote.total_price ? `R ${quote.total_price.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusColor(quote.status)}`}>
                                            {quote.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={`https://wa.me/${quote.client_phone?.replace(/\s+/g, '')}?text=Hello ${quote.client_name}, regarding your move...`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100"
                                                title="WhatsApp"
                                            >
                                                <MessageCircle size={16} />
                                            </a>
                                            <a
                                                href={`mailto:${quote.client_email}`}
                                                className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                                title="Email"
                                            >
                                                <Mail size={16} />
                                            </a>
                                            <Link
                                                to={`/admin/quotes/${quote.id}`}
                                                className="p-1.5 text-slate-600 bg-slate-100 rounded hover:bg-slate-200"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
