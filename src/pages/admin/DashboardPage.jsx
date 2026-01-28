import React, { useEffect, useState } from 'react'
import { TrendingUp, Users, Package, AlertCircle, FileText, Download, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import Button from '../../components/ui/Button'
import { useMoveStore } from '../../features/inventory/store/moveStore' // Just for access if needed

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [quotes, setQuotes] = useState([])
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingRevenue: 0,
        activeLeads: 0,
        pendingLeads: 0
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
        const totalRev = data.reduce((acc, curr) => {
            // Processing/Paid -> Count as Revenue
            // Pending -> Count as Pending Revenue
            return acc + (curr.status === 'paid' ? (Number(curr.total_price) || 0) : 0)
        }, 0)

        const pendingRev = data.reduce((acc, curr) => {
            return acc + (curr.status !== 'paid' ? (Number(curr.total_price) || 0) : 0)
        }, 0)

        const active = data.length
        const pending = data.filter(q => q.status !== 'paid').length

        setStats({
            totalRevenue: totalRev,
            pendingRevenue: pendingRev,
            activeLeads: active,
            pendingLeads: pending
        })
    }

    const handleExportExcel = () => {
        // Simple CSV Export
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

    const StatCard = ({ icon: Icon, label, value, subValue, color, bg }) => (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${bg}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Executive Overview</h2>
                    <p className="text-slate-500">Real-time business insights.</p>
                </div>
                <Button variant="outline" onClick={handleExportExcel} disabled={isLoading}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={TrendingUp}
                    label="Total Revenue"
                    value={`R ${stats.totalRevenue.toLocaleString()}`}
                    subValue="Paid quotes"
                    color="text-emerald-500"
                    bg="bg-emerald-50"
                />
                <StatCard
                    icon={AlertCircle}
                    label="Pending Revenue"
                    value={`R ${stats.pendingRevenue.toLocaleString()}`}
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
                    {/* Mock Graph Bars - In real app use Recharts */}
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
