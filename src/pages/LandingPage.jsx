import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, Shield, Clock, Map } from 'lucide-react'
import Button from '../components/ui/Button'

export default function LandingPage() {
    return (
        <div className="font-sans">
            {/* Hero Section */}
            <div className="relative h-screen bg-slate-900 flex items-center">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/40 z-10" />
                    {/* Placeholder for Hero Image - using a nice gradient/pattern till we have an image */}
                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1600518464441-9154a4dea21b?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
                </div>

                <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
                            Next Generation <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-rose-400">
                                Moving Technology
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                            Experience a seamless move with AI-powered planning, real-time volume calculation, and transparent pricing. We are the Master Movers.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/quote">
                                <Button size="xl" className="w-full sm:w-auto text-lg px-8 py-4 shadow-xl shadow-primary-900/20">
                                    Start My Move <ArrowRight className="ml-2" />
                                </Button>
                            </Link>
                            <Link to="/services">
                                <Button variant="outline" size="xl" className="w-full sm:w-auto text-lg px-8 py-4 border-slate-500 text-white hover:bg-white/10 hover:border-white">
                                    View Services
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
        </div>
    )
}
