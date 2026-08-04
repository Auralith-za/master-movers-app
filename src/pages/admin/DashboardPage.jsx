import React, { useEffect, useState } from 'react'
import { TrendingUp, Users, AlertCircle, FileText, Download, Search, X, Eye, ArrowRight, Calendar, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import Button from '../../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { generateProfessionalQuote } from '../../services/pdfService'
import { INVENTORY_ITEMS } from '../../features/inventory/data/mockItems'

export default function DashboardPage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(true)
    const [quotes, setQuotes] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingRevenue: 0,
        rejectedRevenue: 0,
        activeLeads: 0,
        pendingLeads: 0,
        rejectedLeads: 0
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) {
                setQuotes(data)
                calculateStats(data)
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const calculateStats = (data) => {
        const isPaid = (quote) => 
            ['paid', 'booked_paid', 'booked'].includes(quote.status) || 
            quote.payment_status === 'paid'

        const totalRev = data.reduce((acc, curr) => {
            return acc + (isPaid(curr) ? (Number(curr.total_price) || 0) : 0)
        }, 0)

        const pendingRev = data.reduce((acc, curr) => {
            return acc + (!isPaid(curr) && curr.status !== 'rejected' ? (Number(curr.total_price) || 0) : 0)
        }, 0)

        const rejectedRev = data.reduce((acc, curr) => {
            return acc + (curr.status === 'rejected' ? (Number(curr.total_price) || 0) : 0)
        }, 0)

        const active = data.length
        const pending = data.filter(q => !isPaid(q) && q.status !== 'rejected').length
        const rejected = data.filter(q => q.status === 'rejected').length

        setStats({
            totalRevenue: totalRev,
            pendingRevenue: pendingRev,
            rejectedRevenue: rejectedRev,
            activeLeads: active,
            pendingLeads: pending,
            rejectedLeads: rejected
        })
    }

    const handleExportExcel = () => {
        if (!quotes.length) return

        const headers = ['ID', 'Client Name', 'Date', 'From', 'To', 'Status', 'Total']
        const csvContent = [
            headers.join(','),
            ...quotes.map(q => [
                q.id,
                `"${q.client_name}"`,
                new Date(q.created_at).toLocaleDateString(),
                `"${q.pickup_address}"`,
                `"${q.dropoff_address}"`,
                q.status,
                q.total_price
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
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

    // Filter quotes for dashboard search engine
    const filteredQuotes = quotes.filter(quote => {
        const isPaid = quote.status === 'booked' || quote.status === 'paid' || quote.status === 'booked_paid' || quote.payment_status === 'paid'

        let matchesStatus = true
        if (statusFilter === 'paid') matchesStatus = isPaid
        else if (statusFilter === 'pending') matchesStatus = !isPaid && quote.status !== 'rejected'
        else if (statusFilter === 'rejected') matchesStatus = quote.status === 'rejected'
        else if (statusFilter === 'lead') matchesStatus = quote.status === 'lead'

        if (!matchesStatus) return false
        if (!searchQuery.trim()) return true

        const q = searchQuery.toLowerCase().trim()
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

    const handleDownloadPDF = async (e, quote) => {
        e.stopPropagation()
        try {
            const inventoryForPdf = quote.items_json?.items || quote.items_json || {}
            await generateProfessionalQuote({
                quoteId: quote.id,
                clientName: quote.client_name,
                clientEmail: quote.client_email,
                clientPhone: quote.client_phone,
                pickupAddress: quote.pickup_address,
                dropoffAddress: quote.dropoff_address,
                moveDate: quote.move_date,
                inventory: inventoryForPdf,
                total: quote.total_price || 0,
                vat: (quote.total_price || 0) * 0.15 / 1.15,
                subTotal: (quote.total_price || 0) / 1.15,
                discount: quote.items_json?.breakdown?.discount || 0,
                inventoryItems: INVENTORY_ITEMS,
                breakdown: quote.items_json?.breakdown || null,
                accessDetails: quote.access_details || {},
                generalNotes: quote.general_notes || quote.notes || quote.customer_comments || '',
                customProducts: quote.custom_products || [],
                extraCollections: quote.items_json?.extraCollections || quote.extra_collections || [],
                extraDrops: quote.items_json?.extraDrops || quote.extra_drops || []
            })
        } catch (err) {
            console.error('PDF error:', err)
            alert('Failed to generate PDF')
        }
    }

    const StatCard = ({ icon: Icon, label, value, subValue, color, bg }) => (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${bg}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1 whitespace-nowrap">{value}</p>
            {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Executive Overview</h2>
                    <p className="text-slate-500">Real-time business insights & client quote search.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigate('/admin/offline-conversions')}>
                        <Target className="mr-2 h-4 w-4 text-primary-600" />
                        Google Ads OCI
                    </Button>
                    <Button variant="outline" onClick={handleExportExcel} disabled={isLoading}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Dashboard Global Search Engine Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search quotes by client name, email, phone, ref #, or address..."
                            className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/10 text-sm font-semibold placeholder:font-normal placeholder:text-slate-400 focus:outline-none transition-all"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                        {['all', 'pending', 'paid', 'lead', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all whitespace-nowrap ${
                                    statusFilter === status
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Real-time Search Results Section */}
                {(searchQuery.trim().length > 0 || statusFilter !== 'all') && (
                    <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Search Results ({filteredQuotes.length} quote{filteredQuotes.length !== 1 ? 's' : ''} found)
                            </span>
                            {(searchQuery || statusFilter !== 'all') && (
                                <button 
                                    onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                                    className="text-xs font-bold text-red-600 hover:underline"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>

                        {filteredQuotes.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                                No client quotes match "{searchQuery}".
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto rounded-xl border border-slate-100">
                                {filteredQuotes.slice(0, 15).map((q) => (
                                    <div 
                                        key={q.id}
                                        onClick={() => navigate(`/admin/quotes/${q.id}`)}
                                        className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2.5 bg-slate-100 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 text-sm">{q.client_name || 'Unnamed Client'}</span>
                                                    <span className="font-mono text-xs text-slate-400">#{q.id.toString().substring(0, 6)}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ring-1 ring-inset ${getStatusColor(q.status)}`}>
                                                        {q.status?.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                    {q.client_email && <span>📧 {q.client_email}</span>}
                                                    {q.client_phone && <span>📞 {q.client_phone}</span>}
                                                    {q.move_date && <span className="flex items-center gap-1"><Calendar size={12} /> {q.move_date}</span>}
                                                </div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                                    <MapPin size={12} className="shrink-0 text-slate-400" />
                                                    <span className="truncate max-w-xs">{q.pickup_address?.split(',')[0] || 'N/A'}</span>
                                                    <span>→</span>
                                                    <span className="truncate max-w-xs">{q.dropoff_address?.split(',')[0] || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                                            <div className="text-right">
                                                <div className="font-bold text-slate-900 text-base whitespace-nowrap">
                                                    R {Number(q.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-[10px] text-slate-400">Incl VAT</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => handleDownloadPDF(e, q)}
                                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Download PDF"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <div className="p-2 text-slate-400 group-hover:text-red-600 transition-colors">
                                                    <ArrowRight size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={TrendingUp}
                    label="Total Revenue"
                    value={`R ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subValue="Paid quotes"
                    color="text-emerald-500"
                    bg="bg-emerald-50"
                />
                <StatCard
                    icon={AlertCircle}
                    label="Pending Revenue"
                    value={`R ${stats.pendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subValue="Potential income"
                    color="text-orange-500"
                    bg="bg-orange-50"
                />
                <StatCard
                    icon={Users}
                    label="Active Leads"
                    value={stats.activeLeads}
                    subValue="Total inquiries"
                    color="text-blue-500"
                    bg="bg-blue-50"
                />
                <StatCard
                    icon={AlertCircle}
                    label="Rejected Revenue"
                    value={`R ${stats.rejectedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subValue={`${stats.rejectedLeads} rejected quotes`}
                    color="text-red-500"
                    bg="bg-red-50"
                />
                <StatCard
                    icon={FileText}
                    label="Pending Actions"
                    value={stats.pendingLeads}
                    subValue="Requires follow-up"
                    color="text-purple-500"
                    bg="bg-purple-50"
                />
            </div>

            {/* Sales Performance */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900">Monthly Sales Performance</h3>
                    <select className="text-sm border-gray-200 rounded-md">
                        <option>Last 6 Months</option>
                        <option>This Year</option>
                    </select>
                </div>
                <div className="h-64 flex items-end justify-between gap-2 px-4 border-b border-gray-100 pb-4">
                    {[45, 60, 35, 78, 52, 85].map((h, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 w-full group">
                            <div className="relative w-full max-w-[40px] bg-indigo-50 hover:bg-indigo-100 rounded-t-lg transition-all duration-500" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h}%
                                </div>
                                <div className="absolute inset-x-0 bottom-0 top-auto bg-indigo-500 opacity-20 h-full rounded-t-lg"></div>
                            </div>
                            <span className="text-xs text-slate-400">
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
