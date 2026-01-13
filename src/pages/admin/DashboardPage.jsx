import React from 'react'
import { TrendingUp, Users, Package, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
    // Mock Data
    const stats = [
        { label: 'Total Revenue', value: 'R 450,200', change: '+12%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Active Quotes', value: '24', change: '+5', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Pending Actions', value: '7', change: '-2', icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'Conversion Rate', value: '68%', change: '+3%', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Executive Overview</h2>
                <p className="text-slate-500">Welcome back, Admin.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent Activity / Placeholders for Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[300px] flex items-center justify-center relative overflow-hidden">
                    <h3 className="absolute top-6 left-6 font-bold text-slate-900">Sales Performance</h3>
                    <div className="w-full h-40 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                        [Sales Graph Placeholder]
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[300px] flex items-center justify-center relative overflow-hidden">
                    <h3 className="absolute top-6 left-6 font-bold text-slate-900">Quote Conversion</h3>
                    <div className="w-full h-40 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                        [Donut Chart Placeholder]
                    </div>
                </div>
            </div>
        </div>
    )
}

import { FileText } from 'lucide-react' // Fix missing import
