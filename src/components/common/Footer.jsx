import React from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, MapPin, Phone, Mail } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center text-white font-bold">
                                MM
                            </div>
                            <span className="text-xl font-bold text-white">MasterMovers</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-6">
                            Next generation moving technology. We make moving simple, transparent, and stress-free.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/" className="hover:text-primary-400 transition-colors">Home</Link></li>
                            <li><Link to="/services" className="hover:text-primary-400 transition-colors">Services</Link></li>
                            <li><Link to="/quote" className="hover:text-primary-400 transition-colors">Get a Quote</Link></li>
                            <li><Link to="/login" className="hover:text-primary-400 transition-colors">Admin Login</Link></li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Services</h3>
                        <ul className="space-y-2 text-sm">
                            <li>Local Moves</li>
                            <li>Long Distance</li>
                            <li>Office Relocations</li>
                            <li>Storage Solutions</li>
                            <li>Packing Services</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Contact Us</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-primary-500 mt-0.5" />
                                <span>123 Logistics Way,<br />Germiston, 1401</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-primary-500" />
                                <span>+27 11 123 4567</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-primary-500" />
                                <span>hello@mastermovers.co.za</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 text-xs text-center text-slate-500">
                    &copy; {new Date().getFullYear()} MasterMovers NextGen. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
