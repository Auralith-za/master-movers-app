import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone, User, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../ui/Button'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const location = useLocation()

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navLinks = [
        { name: 'HOME', path: '/', dropdown: false },
        { name: 'ABOUT US', path: '/about', dropdown: false },
        {
            name: 'SERVICES',
            path: '/services',
            dropdown: true,
            subItems: [
                { name: 'Commercial Movers', path: '/services/commercial-movers' },
                { name: 'Residential Movers', path: '/services/residential-movers' },
                { name: 'International Movers', path: '/services/international-movers' },
                { name: 'View All Services', path: '/services' }
            ]
        },
        {
            name: 'STORAGE',
            path: '#',
            dropdown: true,
            subItems: [
                { name: 'Commercial Storage', path: '/services/storage/commercial' },
                { name: 'Cape Town Facility', path: '/services/storage/cape-town-storage' },
                { name: 'Durban Facility', path: '/services/storage/durban-storage' },
                { name: 'Johannesburg Facility', path: '/services/storage/johannesburg-storage' }
            ]
        },
        { name: 'AREAS WE SERVE', path: '/areas-we-serve', dropdown: false },
        { name: 'BLOG', path: '/blog', dropdown: false },
        { name: 'CONTACT US', path: '/contact-us', dropdown: false },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
            <nav className={`
                pointer-events-auto
                w-full max-w-7xl 
                transition-all duration-500 ease-in-out
                rounded-full
                ${scrolled
                    ? 'bg-white/70 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 py-3 px-8'
                    : 'bg-white/90 backdrop-blur-md shadow-sm border border-transparent py-4 px-10'
                }
                flex justify-between items-center
            `}>
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="flex items-center gap-1">
                        <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 transition-transform duration-300 group-hover:scale-105">
                            <span className="text-red-600">Master</span>Movers
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden xl:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <div key={link.name} className="relative group">
                            <Link
                                to={link.path}
                                className={`text-[11px] font-black tracking-[0.2em] transition-all duration-300 hover:text-red-600 flex items-center gap-1.5 ${isActive(link.path)
                                    ? 'text-red-600'
                                    : 'text-slate-500'
                                    }`}
                            >
                                {link.name}
                                {link.dropdown && (
                                    <ChevronDown size={12} className="group-hover:rotate-180 transition-transform duration-300" />
                                )}
                            </Link>

                            {link.dropdown && link.subItems && (
                                <div className="absolute top-full -left-4 pt-4 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 py-3 overflow-hidden">
                                        {link.subItems.map((subItem) => (
                                            <Link
                                                key={subItem.name}
                                                to={subItem.path}
                                                className="block px-6 py-2.5 text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            >
                                                {subItem.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Mobile Menu Button */}
                <div className="xl:hidden flex items-center">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 rounded-full text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Container */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="xl:hidden fixed top-20 inset-x-4 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-[80vh] overflow-y-auto pointer-events-auto"
                    >
                        <div className="px-6 py-8 space-y-4">
                            {navLinks.map((link) => (
                                <div key={link.name}>
                                    <Link
                                        to={link.path}
                                        onClick={() => !link.dropdown && setIsOpen(false)}
                                        className={`block px-4 py-3 rounded-2xl text-[11px] font-black tracking-[0.2em] transition-all ${isActive(link.path)
                                            ? 'bg-red-50 text-red-600'
                                            : 'text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            {link.name}
                                            {link.dropdown && <ChevronDown size={14} />}
                                        </div>
                                    </Link>
                                    {link.dropdown && link.subItems && (
                                        <div className="pl-6 space-y-2 mt-2">
                                            {link.subItems.map((subItem) => (
                                                <Link
                                                    key={subItem.name}
                                                    to={subItem.path}
                                                    onClick={() => setIsOpen(false)}
                                                    className="block px-4 py-2 text-[10px] font-bold text-slate-400 hover:text-red-600 uppercase tracking-widest"
                                                >
                                                    {subItem.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="pt-6 border-t border-gray-100 flex flex-col gap-4 mt-6">
                                <Link to="/quote" onClick={() => setIsOpen(false)}>
                                    <Button className="w-full justify-center bg-red-600 hover:bg-red-700 text-white rounded-full py-6 text-sm font-black uppercase tracking-widest border-none shadow-xl shadow-red-600/20">Get a Quote</Button>
                                </Link>
                                <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest py-2">
                                    <User size={14} /> Admin Login
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
