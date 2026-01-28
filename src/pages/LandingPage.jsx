import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, Shield, Clock, Map, MapPin, Sparkles } from 'lucide-react'
import Button from '../components/ui/Button'

export default function LandingPage() {
    return (
        <div className="font-sans">
            {/* Hero Section */}
            <div className="relative h-screen flex items-center">
                <div className="absolute inset-0 overflow-hidden">
                    {/* Light/White Overlay */}
                    <div className="absolute inset-0 bg-white/80 sm:bg-white/60 z-10" />
                    {/* Bright Interior Background */}
                    <div className="w-full h-full bg-[url('/images/hero_truck.jpg')] bg-cover bg-center" />
                </div>

                <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-10 duration-1000">

                        {/* Tag */}
                        <div className="inline-block bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-bold tracking-widest mb-6 border border-red-100">
                            NEXT GENERATION MOVING TECHNOLOGY
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                            We Are The <br />
                            <span className="text-red-600">
                                Master Movers.
                            </span>
                        </h1>

                        {/* Description */}
                        <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                            Experience South Africa's most advanced moving service. Plan your move with our AI-powered assistant, visualize your truck load in real-time, and get instant, transparent pricing.
                        </p>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <Link to="/quote">
                                <Button size="xl" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 shadow-xl shadow-red-900/10 rounded-lg">
                                    Start My Move <ArrowRight className="ml-2" />
                                </Button>
                            </Link>
                            <Link to="/services">
                                <Button variant="outline" size="xl" className="w-full sm:w-auto border-2 border-slate-900 text-slate-900 hover:bg-slate-50 rounded-lg font-bold">
                                    View Services
                                </Button>
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-500">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded-full bg-red-100 text-red-600">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                Accredited
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded-full bg-red-100 text-red-600">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                Insured
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded-full bg-red-100 text-red-600">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                Nationwide
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modern Discount Banner */}
            <div className="relative bg-white pt-10 pb-5">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10">
                        <div className="absolute -top-24 -left-20 h-64 w-64 rounded-full bg-red-600/20 blur-3xl"></div>
                        <div className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl"></div>

                        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                                    <Sparkles className="h-6 w-6 text-white" />
                                </div>
                                <div className="text-center sm:text-left">
                                    <h3 className="text-lg font-bold text-white">Mid-Month Madness!</h3>
                                    <p className="text-sm text-slate-300">
                                        Book between the <span className="font-bold text-white">5th - 24th</span> and get <span className="font-bold text-yellow-400">10% OFF</span>
                                    </p>
                                </div>
                            </div>
                            <Link to="/quote">
                                <Button size="md" variant="primary" className="font-bold whitespace-nowrap shadow-lg shadow-red-900/20">
                                    Claim Discount <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose MasterMovers?</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">
                            We combine decades of experience with cutting-edge technology to deliver the most reliable moving service in South Africa.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: Truck,
                                title: 'Smart Fleet',
                                desc: 'Real-time tracking and optimized routing to ensure your belongings arrive on time, every time.'
                            },
                            {
                                icon: Shield,
                                title: 'Fully Insured',
                                desc: 'Comprehensive transit insurance included with every move for your peace of mind.'
                            },
                            {
                                icon: Clock,
                                title: 'Precision Planning',
                                desc: 'Our AI engine calculates the exact volume and time needed, eliminating guesswork and surprise costs.'
                            }
                        ].map((feature, i) => (
                            <div key={i} className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            {/* Nationwide Coverage Section */}
            <div className="py-24 bg-slate-50 border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                <img
                                    src="/images/nationwide_sa.jpg"
                                    alt="Map of South Africa"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-8">
                                    <div className="text-white">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="text-red-500" fill="currentColor" />
                                            <span className="font-bold">Nationwide Network</span>
                                        </div>
                                        <p className="text-sm text-slate-200">From Cape Town to Limpopo, we've got you covered.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide mb-6">
                                <Map size={14} />
                                Serving Entire South Africa
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                                Moving You Anywhere within SA 🇿🇦
                            </h2>
                            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                                Whether you're moving down the street in Sandton or relocating across the country to the Western Cape, MasterMovers has the fleet and the network to get you there.
                            </p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    'Long Distance & Inter-Provincial Moves',
                                    'Weekly Shuttles between JHB, DBN, and CPT',
                                    'Remote & Outlying Area Services',
                                    'Secure Storage Hubs in Major Cities'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/quote">
                                <Button variant="secondary" className="border-slate-200 hover:bg-white hover:border-red-200 hover:text-red-600">
                                    Check My Route
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to make your move?</h2>
                    <p className="text-xl text-slate-400 mb-10">
                        Get an instant quote in under 2 minutes using our advanced inventory wizard.
                    </p>
                    <Link to="/quote">
                        <Button size="xl" className="bg-white text-slate-900 hover:bg-slate-100 hover:scale-105 transform transition-all shadow-2xl">
                            Get Instant Quote
                        </Button>
                    </Link>
                </div>
            </div>
        </div >
    )
}
