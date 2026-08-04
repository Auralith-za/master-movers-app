import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { 
    Download, 
    CheckCircle, 
    Clock, 
    HelpCircle, 
    Filter, 
    RefreshCw, 
    ArrowUpRight, 
    DollarSign,
    Target,
    Calendar,
    FileSpreadsheet,
    Copy,
    Check
} from 'lucide-react'

export default function OfflineConversionsPage() {
    const [quotes, setQuotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [conversionName, setConversionName] = useState('Won Deal')
    const [timeZone, setTimeZone] = useState('+0200')
    const [currency, setCurrency] = useState('ZAR')
    const [dateRange, setDateRange] = useState('all') // '7d', '30d', '90d', 'all'
    const [statusFilterMode, setStatusFilterMode] = useState('all_won') // 'all_won', 'paid_only', 'booked_only', 'completed_only'
    const [onlyGclid, setOnlyGclid] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState(null)

    useEffect(() => {
        fetchWonQuotes()
    }, [])

    const fetchWonQuotes = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            setQuotes(data || [])
        } catch (err) {
            console.error('Error fetching quotes for offline conversions:', err)
        } finally {
            setLoading(false)
        }
    }

    // Filter won/closed deals based on selected status mode
    const wonStatuses = ['booked', 'paid', 'booked_paid', 'completed']

    const filteredQuotes = quotes.filter(quote => {
        const isPaid = quote.status === 'paid' || quote.status === 'booked_paid' || quote.payment_status === 'paid'
        const isBooked = quote.status === 'booked'
        const isCompleted = quote.status === 'completed'
        const isAnyWon = wonStatuses.includes(quote.status) || quote.payment_status === 'paid'

        if (statusFilterMode === 'paid_only' && !isPaid) return false
        if (statusFilterMode === 'booked_only' && !isBooked) return false
        if (statusFilterMode === 'completed_only' && !isCompleted) return false
        if (statusFilterMode === 'all_won' && !isAnyWon) return false

        // Only GCLID filter
        if (onlyGclid && !quote.gclid && !quote.gbraid && !quote.wbraid) return false

        // Date range filter
        if (dateRange !== 'all') {
            const quoteDate = new Date(quote.won_at || quote.created_at)
            const now = new Date()
            const diffDays = (now - quoteDate) / (1000 * 60 * 60 * 24)

            if (dateRange === '7d' && diffDays > 7) return false
            if (dateRange === '30d' && diffDays > 30) return false
            if (dateRange === '90d' && diffDays > 90) return false
        }

        return true
    })

    // Metrics calculations
    const totalWonDeals = filteredQuotes.length
    const gclidTrackedDeals = filteredQuotes.filter(q => q.gclid || q.gbraid || q.wbraid).length
    const totalWonRevenue = filteredQuotes.reduce((sum, q) => sum + (Number(q.total_price) || 0), 0)
    const avgDealValue = totalWonDeals > 0 ? totalWonRevenue / totalWonDeals : 0

    /**
     * Format timestamp to Google Ads OCI standard:
     * yyyy-MM-dd HH:mm:ss+HHMM (e.g., 2026-08-04 14:30:00+0200)
     */
    const formatOciTimestamp = (rawDateStr) => {
        if (!rawDateStr) return ''
        const d = new Date(rawDateStr)
        if (isNaN(d.getTime())) return ''

        const pad = (n) => String(n).padStart(2, '0')
        const year = d.getFullYear()
        const month = pad(d.getMonth() + 1)
        const day = pad(d.getDate())
        const hours = pad(d.getHours())
        const minutes = pad(d.getMinutes())
        const seconds = pad(d.getSeconds())

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${timeZone}`
    }

    /**
     * Export Standard Google Ads OCI CSV
     */
    const handleExportStandardOciCsv = () => {
        // Rows with GCLID
        const validRows = filteredQuotes.filter(q => q.gclid)

        if (validRows.length === 0) {
            alert('No won deals with Google Click IDs (GCLID) found for the selected filter.')
            return
        }

        // Header required by Google Ads for time zone specification
        const fileContent = [
            `Parameters:TimeZone=${timeZone}`,
            'Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency',
            ...validRows.map(q => {
                const convTime = formatOciTimestamp(q.won_at || q.created_at)
                const val = Number(q.total_price || 0).toFixed(2)
                return `${q.gclid},${conversionName},${convTime},${val},${currency}`
            })
        ].join('\n')

        downloadCsv(fileContent, `google_ads_offline_conversions_${new Date().toISOString().split('T')[0]}.csv`)
    }

    /**
     * Export Full Audit CSV (Includes all won deals, GCLID, GBRAID, WBRAID, Client Details, UTMs)
     */
    const handleExportAuditCsv = () => {
        if (filteredQuotes.length === 0) {
            alert('No won deals found for the selected filter.')
            return
        }

        const headers = [
            'Quote ID',
            'Client Name',
            'Client Email',
            'Client Phone',
            'Status',
            'Deal Value (ZAR)',
            'GCLID',
            'GBRAID',
            'WBRAID',
            'UTM Source',
            'UTM Campaign',
            'Won Date',
            'Created Date'
        ]

        const rows = filteredQuotes.map(q => [
            q.id,
            `"${q.client_name || ''}"`,
            `"${q.client_email || ''}"`,
            `"${q.client_phone || ''}"`,
            q.status,
            Number(q.total_price || 0).toFixed(2),
            q.gclid || '',
            q.gbraid || '',
            q.wbraid || '',
            q.utm_source || '',
            q.utm_campaign || '',
            q.won_at || '',
            q.created_at || ''
        ])

        const fileContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        downloadCsv(fileContent, `master_movers_won_deals_audit_${new Date().toISOString().split('T')[0]}.csv`)
    }

    const downloadCsv = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold uppercase tracking-wider border border-primary-500/30">
                            <Target size={14} className="text-primary-400" /> Google Ads OCI Loop
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Offline Conversion Tracking
                        </h1>
                        <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                            Feed actual won deal values and revenues back into Google Ads to train smart bidding on high-value customers, closing the loop on long sales cycles.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleExportStandardOciCsv}
                            className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary-600/30 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Download size={18} /> Export Google Ads OCI CSV
                        </button>
                        <button
                            onClick={handleExportAuditCsv}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2"
                        >
                            <FileSpreadsheet size={16} /> Audit Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Won Deals</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{totalWonDeals}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <CheckCircle size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GCLID Tracked Leads</p>
                        <h3 className="text-2xl font-black text-primary-600 mt-1">{gclidTrackedDeals}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            {totalWonDeals > 0 ? Math.round((gclidTrackedDeals / totalWonDeals) * 100) : 0}% attribution rate
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                        <Target size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Won Revenue</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">
                            R {totalWonRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Won Deal Value</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">
                            R {avgDealValue.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <ArrowUpRight size={24} />
                    </div>
                </div>
            </div>

            {/* OCI Configuration & Filters Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-primary-600" />
                        <h2 className="font-bold text-slate-900">OCI Export Settings & Filters</h2>
                    </div>
                    <button 
                        onClick={fetchWonQuotes}
                        className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <RefreshCw size={12} /> Refresh Data
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Conversion Action Name
                        </label>
                        <input
                            type="text"
                            value={conversionName}
                            onChange={(e) => setConversionName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:border-primary-500 focus:outline-none transition-all"
                            placeholder="e.g. Won Deal"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Must match exact name in Google Ads</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Timezone Format
                        </label>
                        <select
                            value={timeZone}
                            onChange={(e) => setTimeZone(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:border-primary-500 focus:outline-none transition-all"
                        >
                            <option value="+0200">+0200 (South Africa SAST)</option>
                            <option value="+0000">+0000 (UTC)</option>
                            <option value="+0100">+0100 (CET)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Date Range Filter
                        </label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:border-primary-500 focus:outline-none transition-all"
                        >
                            <option value="all">All Time</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Deal Status Filter
                        </label>
                        <select
                            value={statusFilterMode}
                            onChange={(e) => setStatusFilterMode(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:border-primary-500 focus:outline-none transition-all"
                        >
                            <option value="all_won">All Won Deals (Paid, Booked & Completed)</option>
                            <option value="paid_only">Paid & Booked/Paid Only</option>
                            <option value="booked_only">Booked Only</option>
                            <option value="completed_only">Completed Only</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Attribution Filter
                        </label>
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="onlyGclid"
                                checked={onlyGclid}
                                onChange={(e) => setOnlyGclid(e.target.checked)}
                                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                            />
                            <label htmlFor="onlyGclid" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                Only show deals with GCLID
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Won Deals Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Won Deals & GCLID Attribution</h3>
                        <p className="text-xs text-slate-500">Showing {filteredQuotes.length} closed moves ready for conversion upload.</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                                <th className="p-4">Client</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Deal Value</th>
                                <th className="p-4">Google Click ID (GCLID)</th>
                                <th className="p-4">UTM Campaign</th>
                                <th className="p-4">Won Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400">
                                        Loading won deals...
                                    </td>
                                </tr>
                            ) : filteredQuotes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400">
                                        No won deals matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredQuotes.map((q, idx) => (
                                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 font-semibold text-slate-900">
                                            <div>{q.client_name || 'Anonymous'}</div>
                                            <div className="text-xs text-slate-400 font-normal">{q.client_email || q.client_phone || 'No contact info'}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                <CheckCircle size={12} /> {q.status}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-slate-900">
                                            R {Number(q.total_price || 0).toLocaleString('en-ZA')}
                                        </td>
                                        <td className="p-4 font-mono text-xs">
                                            {q.gclid ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200 max-w-[200px] truncate">
                                                        {q.gclid}
                                                    </span>
                                                    <button
                                                        onClick={() => copyToClipboard(q.gclid, idx)}
                                                        className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                                                        title="Copy GCLID"
                                                    >
                                                        {copiedIndex === idx ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            ) : q.gbraid || q.wbraid ? (
                                                <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-[11px] font-semibold">
                                                    {q.gbraid ? 'GBRAID' : 'WBRAID'} Captured
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">Organic / Direct</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-slate-600">
                                            {q.utm_campaign ? (
                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
                                                    {q.utm_campaign}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                                            {q.won_at ? new Date(q.won_at).toLocaleString() : new Date(q.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
