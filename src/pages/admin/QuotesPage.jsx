import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Search, Eye, Mail, Plus, CreditCard, Copy, CheckCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useMoveStore } from '../../features/inventory/store/moveStore'
import { emailService } from '../../services/emailService'
import { INVENTORY_ITEMS } from '../../features/inventory/data/mockItems'

export default function QuotesPage() {
    const navigate = useNavigate()
    const [quotes, setQuotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')

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
            case 'pending_payment': return 'bg-amber-50 text-amber-700 ring-amber-600/20'
            case 'booked':
            case 'paid':
            case 'booked_paid': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
            case 'on_hold': return 'bg-orange-50 text-orange-700 ring-orange-600/20'
            case 'rejected': return 'bg-red-50 text-red-700 ring-red-600/10'
            case 'lead': return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20'
            case 'payment_cancelled': return 'bg-red-100 text-red-800 ring-red-600/30'
            default: return 'bg-slate-50 text-slate-700 ring-slate-600/20'
        }
    }

    const filteredQuotes = quotes.filter(quote => {
        const isPaid = quote.status === 'booked' || quote.status === 'paid' || quote.status === 'booked_paid' || quote.payment_status === 'paid'

        let matchesFilter = true
        if (filter === 'paid') matchesFilter = isPaid
        else if (filter === 'pending') matchesFilter = !isPaid && quote.status !== 'rejected'
        else if (filter === 'rejected') matchesFilter = quote.status === 'rejected'

        if (!matchesFilter) return false
        if (!searchTerm.trim()) return true

        const q = searchTerm.toLowerCase().trim()
        const clientName = (quote.client_name || quote.items_json?.contactName || quote.items_json?.client_name || '').toLowerCase()
        const clientEmail = (quote.client_email || quote.items_json?.contactEmail || quote.items_json?.client_email || '').toLowerCase()
        const clientPhone = (quote.client_phone || quote.items_json?.contactPhone || quote.items_json?.client_phone || '').toLowerCase()
        const quoteId = (quote.id || '').toString().toLowerCase()
        const pickup = (quote.pickup_address || quote.items_json?.pickupAddress || '').toLowerCase()
        const dropoff = (quote.dropoff_address || quote.items_json?.dropoffAddress || '').toLowerCase()
        const moveDate = (quote.move_date || quote.items_json?.moveDate || '').toLowerCase()
        const status = (quote.status || '').toLowerCase()

        return (
            clientName.includes(q) ||
            clientEmail.includes(q) ||
            clientPhone.includes(q) ||
            quoteId.includes(q) ||
            pickup.includes(q) ||
            dropoff.includes(q) ||
            moveDate.includes(q) ||
            status.includes(q)
        )
    })

    const handleAutomatedEmail = async (quote) => {
        if (!quote.client_email) {
            alert('Client email is missing.');
            return;
        }
        
        const confirmSend = confirm(`Send automated proposal email with PDF to ${quote.client_email}?`);
        if (!confirmSend) return;

        try {
            const inventoryForPdf = quote.items_json?.items || quote.items_json || {}
            
            const result = await emailService.sendQuoteEmail({
                type: 'quote_proposal',
                quoteId: quote.id,
                clientName: quote.client_name,
                clientEmail: quote.client_email,
                clientPhone: quote.client_phone,
                pickupAddress: quote.pickup_address,
                dropoffAddress: quote.dropoff_address,
                moveDate: quote.move_date,
                inventory: inventoryForPdf,
                total: quote.total_price,
                vat: (quote.total_price || 0) * 0.15 / 1.15,
                subTotal: (quote.total_price || 0) / 1.15,
                inventoryItems: INVENTORY_ITEMS,
                breakdown: quote.items_json?.breakdown || null,
                accessDetails: quote.access_details || {},
                extraCollections: quote.items_json?.extraCollections || quote.extra_collections || [],
                extraDrops: quote.items_json?.extraDrops || quote.extra_drops || []
            });

            if (result.success) {
                alert('Email sent successfully!');
            } else {
                alert('Failed to send email: ' + result.error);
            }
        } catch (error) {
            console.error('Email error:', error);
            alert('Error sending email: ' + error.message);
        }
    }

    const handleSendToPayLink = async (quote) => {
        if (!quote.client_email) {
            alert('Client email is missing — cannot send payment link.')
            return
        }

        const SITE_URL = 'https://mastermovers.co.za'
        const paymentLink = `${SITE_URL}/quote-review?id=${quote.id}`

        const confirmed = confirm(
            `Send payment link to ${quote.client_email}?\n\nLink: ${paymentLink}\n\nThe customer will be able to view their full quote summary and pay via PayFast or Payflex.`
        )
        if (!confirmed) return

        try {
            // Send via Resend email
            const result = await emailService.sendEmail({
                type: 'payment_link',
                to: quote.client_email,
                quoteData: quote,
                paymentLink
            })

            // Also update status to pending_payment if still 'lead'
            if (quote.status === 'lead' || quote.status === 'new') {
                await supabase
                    .from('quotes')
                    .update({ status: 'pending_payment' })
                    .eq('id', quote.id)
                fetchQuotes()
            }

            alert(`✅ Payment link sent to ${quote.client_email}!`)
        } catch (error) {
            console.error('Send to pay error:', error)
            // Fallback: just copy link to clipboard
            try {
                await navigator.clipboard.writeText(paymentLink)
                alert(`Email failed — but the payment link has been copied to your clipboard!\n\n${paymentLink}`)
            } catch {
                alert(`Payment link (copy manually):\n${paymentLink}`)
            }
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Quote Management</h2>
                    <p className="text-slate-500">Track and manage client quotes.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => {
                            const { reset } = useMoveStore.getState();
                            reset();
                            navigate('/admin/quotes/new');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-all shadow-lg"
                    >
                        <Plus size={18} /> New Manual Quote
                    </button>
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search name, email, ref #..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'all' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    All Quotes
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'pending' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Pending / Pipeline
                </button>
                <button
                    onClick={() => setFilter('paid')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'paid' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Booked / Paid
                </button>
                <button
                    onClick={() => setFilter('rejected')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'rejected' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Rejected
                </button>
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
                            {filter === 'rejected' && <th className="px-6 py-4 font-semibold">Rejection Reason</th>}
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading quotes...</td></tr>
                        ) : filteredQuotes.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-8 text-slate-400">No quotes found for this filter.</td></tr>
                        ) : (
                            filteredQuotes.map((quote) => (
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
                                    <td className="px-6 py-4 text-sm">
                                        <div className="text-slate-700 font-medium">
                                            {quote.created_at
                                                ? new Date(quote.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: '2-digit' })
                                                : '—'
                                            }
                                        </div>
                                        {quote.move_date && (
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                📅 Move: {quote.move_date}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {quote.total_price ? `R ${Number(quote.total_price).toFixed(2)}` : '-'}
                                    </td>
                                    {filter === 'rejected' && (
                                        <td className="px-6 py-4 text-sm text-red-600 font-medium italic">
                                            {quote.rejection_reason || quote.items_json?.rejection_reason || 'No reason provided'}
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusColor(quote.status)}`}>
                                            {quote.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* Send to Pay — only for pending/lead quotes */}
                                            {(quote.status === 'pending_payment' || quote.status === 'lead' || quote.status === 'new') && (
                                                <button
                                                    onClick={() => handleSendToPayLink(quote)}
                                                    className="p-1.5 text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100 flex items-center gap-1"
                                                    title="Send Payment Link to Client"
                                                >
                                                    <CreditCard size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleAutomatedEmail(quote)}
                                                className="p-1.5 text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100"
                                                title="Send Proposal Email"
                                            >
                                                <Mail size={16} />
                                            </button>
                                            <a
                                                href={`mailto:${quote.client_email}`}
                                                className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                                title="Open Email Client"
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
