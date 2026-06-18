import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Settings, LogOut, Package, Phone, Tag, MessageSquare } from 'lucide-react'

export default function AdminLayout() {
    const navigate = useNavigate()

    const handleLogout = () => {
        // Mock logout
        navigate('/')
    }

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Phone, label: 'Leads / Call Backs', path: '/admin/leads' },
        { icon: FileText, label: 'Quotes', path: '/admin/quotes' },
        { icon: MessageSquare, label: 'Contact Forms', path: '/admin/contact-submissions' },
        { icon: Tag, label: 'Coupon Codes', path: '/admin/coupons' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ]

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
                <div className="p-4 border-b border-slate-800 flex flex-col gap-2 items-start justify-center">
                    <div className="bg-white p-2.5 rounded-xl w-full flex items-center justify-center shadow-inner">
                        <img 
                            src="/images/logo.png" 
                            alt="Master Movers" 
                            className="h-10 object-contain"
                        />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 px-1 mt-1">Admin Panel</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg w-full transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>
        </div>
    )
}
