import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone, User, ChevronDown } from 'lucide-react'
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
        { name: 'ABOUT US', path: '#', dropdown: true },
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
        { name: 'PACKING MATERIALS', path: '/packing-materials', dropdown: false },
        { name: 'AREAS WE SERVE', path: '/areas-we-serve', dropdown: false },
        { name: 'BLOG', path: '/blog', dropdown: false },
        { name: 'CONTACT US', path: '/contact-us', dropdown: false },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 bg-white shadow-sm py-4`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        {/* Using text logo to match reference style more closely if needed, but keeping the 'MM' icon for now as a brand mark */}
                        <div className="flex items-center gap-1">
                            <span className="text-2xl font-bold tracking-tighter text-slate-900">
                                <span className="text-red-600">Master</span>Movers
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden xl:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <div key={link.name} className="relative group">
                                <Link
                                    to={link.path}
                                    className={`text-xs font-bold tracking-widest transition-colors hover:text-red-600 flex items-center gap-1 ${isActive(link.path)
                                        ? 'text-red-600'
                                        : 'text-slate-600'
                                        }`}
                                >
                                    {link.name}
                                    {link.dropdown && <ChevronDown size={14} />}
                                </Link>

                                {link.dropdown && link.subItems && (
                                    <div className="absolute top-full left-0 pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                        <div className="bg-white rounded-lg shadow-lg border border-slate-100 py-2">
                                            {link.subItems.map((subItem) => (
                                                <Link
                                                    key={subItem.name}
                                                    to={subItem.path}
                                                    className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-red-600"
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
                            className="p-2 rounded-md text-slate-900"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="xl:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg h-screen overflow-y-auto">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {navLinks.map((link) => (
                            <div key={link.name}>
                                <Link
                                    to={link.path}
                                    onClick={() => !link.dropdown && setIsOpen(false)}
                                    className={`block px-3 py-3 rounded-lg text-sm font-bold tracking-widest ${isActive(link.path)
                                        ? 'bg-red-50 text-red-600'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        {link.name}
                                        {link.dropdown && <ChevronDown size={16} />}
                                    </div>
                                </Link>
                                {link.dropdown && link.subItems && (
                                    <div className="pl-4 space-y-1 mt-1">
                                        {link.subItems.map((subItem) => (
                                            <Link
                                                key={subItem.name}
                                                to={subItem.path}
                                                onClick={() => setIsOpen(false)}
                                                className="block px-3 py-2 text-sm text-slate-500 hover:text-red-600"
                                            >
                                                {subItem.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="pt-4 border-t border-gray-100 flex flex-col gap-3 mt-4">
                            <Link to="/quote" onClick={() => setIsOpen(false)}>
                                <Button className="w-full justify-center bg-red-600 hover:bg-red-700 text-white border-none">Get a Quote</Button>
                            </Link>
                            <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 text-slate-400 text-sm py-2">
                                <User size={16} /> Admin Login
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
