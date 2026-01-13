import React from 'react'
import { Outlet } from 'react-router-dom'
import { Truck } from 'lucide-react'

export default function MainLayout() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary-600 p-2 rounded-lg text-white">
                            <Truck size={24} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">
                            Master<span className="text-primary-600">Movers</span> NextGen
                        </span>
                    </div>
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
                        <a href="#" className="hover:text-primary-600 transition-colors">How it works</a>
                        <a href="#" className="hover:text-primary-600 transition-colors">Services</a>
                        <a href="#" className="hover:text-primary-600 transition-colors">Contact</a>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    )
}
