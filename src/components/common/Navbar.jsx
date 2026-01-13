import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone, User } from 'lucide-react'
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
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services' },
        { name: 'Packing Materials', path: '/packing-materials' },
        { name: 'Areas We Serve', path: '/areas-we-serve' },
        { name: 'Contact Us', path: '/contact-us' },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            MM
                        </div>
                        <span className={`text-xl font-bold tracking-tight ${scrolled ? 'text-slate-900' : 'text-slate-900 lg:text-white'}`}>
                            MasterMovers
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-medium transition-colors hover:text-primary-500 ${isActive(link.path)
                                    ? 'text-primary-500'
                                    : (scrolled ? 'text-slate-600' : 'text-slate-100')
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="hidden lg:flex items-center gap-4">
                        <Link to="/login" className={`p-2 rounded-full transition-colors ${scrolled ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-white'}`}>
                            <User size={20} />
                        </Link>
                        <Link to="/quote">
                            <Button variant="primary" size="sm" className={scrolled ? '' : 'bg-white text-primary-700 hover:bg-slate-100'}>
                                Get A Quote
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`p-2 rounded-md ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="lg:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={`block px-3 py-3 rounded-lg text-base font-medium ${isActive(link.path)
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                            <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-slate-600 px-3">
                                <User size={18} /> Admin Login
                            </Link>
                            <Link to="/quote" onClick={() => setIsOpen(false)}>
                                <Button className="w-full justify-center bg-orange-500 hover:bg-orange-600 text-white border-none">Get a Quote</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
