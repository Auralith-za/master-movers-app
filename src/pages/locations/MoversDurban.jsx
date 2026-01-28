import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, Shield, Clock, Map, MapPin, Sparkles, Navigation, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import Button from '../../components/ui/Button'

export default function MoversDurban() {
    return (
        <div className="font-sans">
            {/* HERO SECTION */}
            <div className="relative h-[90vh] flex items-center">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-white/90 sm:bg-white/80 z-10" />
                    <div className="w-full h-full bg-[url('/images/hero_durban.jpg')] bg-cover bg-center" />
                </div>

                <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <div className="inline-block bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-bold tracking-widest mb-6 border border-red-100">
                            DURBAN'S PREMIER MOVING SERVICE
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                            Moving Durban <br />
                            <span className="text-red-600">Forward.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                            From the beachfront to the hills of Kloof. We specialize in residential and commercial moves across KZN with specific expertise in coastal relocation.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <Link to="/quote">
                                <Button size="xl" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 shadow-xl shadow-red-900/10 rounded-lg">
                                    Get Durban Quote <ArrowRight className="ml-2" />
                                </Button>
                            </Link>
                            <a href="#areas">
                                <Button variant="outline" size="xl" className="w-full sm:w-auto border-2 border-slate-900 text-slate-900 hover:bg-slate-50 rounded-lg font-bold">
                                    View Areas
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* TRUST INDICATORS - MATCHING HOME */}
            <div className="bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-wrap justify-center sm:justify-start gap-8 text-sm font-medium text-slate-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="text-red-600 h-5 w-5" />
                            KZN Specialists
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="text-red-600 h-5 w-5" />
                            Weekly JHB-DBN Shuttles
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="text-red-600 h-5 w-5" />
                            Secure Storage in Pinetown
                        </div>
                    </div>
                </div>
            </div>

            {/* FEATURES GRID */}
            <div className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Move With MasterMovers Durban?</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">
                            We understand the specific challenges of moving in KwaZulu-Natal, from humidity control to navigating steep driveways.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: Shield,
                                title: 'Coastal Protection',
                                desc: 'We use specialized moisture-resistant packaging to protect your wood and electronics from Durban\'s humidity.'
                            },
                            {
                                icon: Navigation,
                                title: 'Local Expertise',
                                desc: 'Our drivers know every corner of KZN, from the narrow Berea roads to the gated estates of Umhlanga.'
                            },
                            {
                                icon: Truck,
                                title: 'Long Distance Experts',
                                desc: 'Regular shared-load shuttles to Johannesburg and Cape Town make inter-city moving affordable.'
                            }
                        ].map((feature, i) => (
                            <div key={i} className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAP / AREAS SECTION */}
            <div id="areas" className="py-24 bg-slate-50 border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="grid grid-cols-2 gap-4">
                                {['Umhlanga Rocks', 'Durban North', 'Ballito & Salt Rock', 'Westville', 'Morningside & Berea', 'Hillcrest & Kloof', 'Pinetown', 'Amanzimtoti'].map(area => (
                                    <div key={area} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center gap-3 text-slate-700 font-medium hover:border-red-200 transition-colors">
                                        <MapPin size={16} className="text-red-500" />
                                        {area}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-900 mb-2">Don't see your area?</h4>
                                <p className="text-slate-600 text-sm mb-4">We service the entire eThekwini district and surrounding farm areas. Contact us for a custom quote.</p>
                                <Link to="/contact-us" className="text-red-600 font-semibold text-sm hover:underline">Contact Support →</Link>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide mb-6">
                                <Map size={14} />
                                Extensive Coverage
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                                Covering Every Corner of KZN
                            </h2>
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                Our Durban branch is centrally located to deploy teams rapidly North, South, and West. Whether you are moving a studio apartment in the Point Waterfront or a 5-bedroom home in Mount Edgecombe, we have the right vehicle for the job.
                            </p>
                            <Link to="/quote">
                                <Button variant="secondary" className="border-slate-200 hover:bg-white hover:border-red-200 hover:text-red-600">
                                    Check Availability
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ SECTION (Requested) */}
            <div className="py-24 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                        <p className="text-slate-500">
                            Common questions about moving in Durban.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <FAQItem
                            question="How much does a local move in Durban cost?"
                            answer="Local moves generally start from R2,500 for small loads. However, creating a precise quote depends on volume and access. Use our online quote tool for an instant estimate."
                        />
                        <FAQItem
                            question="Do you help with packing?"
                            answer="Yes! We offer full packing services. For coastal moves, we recommend our specialized wrapping for electronics and wooden furniture to prevent humidity damage."
                        />
                        <FAQItem
                            question="Can you move me from Durban to Cape Town?"
                            answer="Absolutely. We have weekly shared-load trucks running between Durban, Johannesburg, and Cape Town. This is often 30-40% cheaper than a dedicated truck."
                        />
                        <FAQItem
                            question="Do you have storage in Durban?"
                            answer="Yes, our secure storage facility is located in Pinetown/Westmead, offering climate-controlled units perfect for short or long-term storage."
                        />
                    </div>
                </div>
            </div>

            {/* CTA SECTION - MATCHING HOME */}
            <div className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605218427368-35b81a3dd64c?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Move in Durban?</h2>
                    <p className="text-xl text-slate-400 mb-10">
                        Get an instant quote in under 2 minutes. No site visit required.
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

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
            >
                <span className="font-semibold text-slate-900">{question}</span>
                {isOpen ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 bg-white text-slate-600 text-sm leading-relaxed border-t border-slate-100">
                    {answer}
                </div>
            </div>
        </div>
    )
}
