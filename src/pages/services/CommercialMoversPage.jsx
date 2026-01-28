import React from 'react'
import { CheckCircle2, Building2, Monitor, Clock, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CommercialMoversPage() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-slate-900 py-24 sm:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-90" />
                </div>
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            Commercial Moving Services
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-slate-300">
                            Minimize downtime and maximize efficiency. We specialize in seamless office relocations, ensuring your business is back up and running in no time.
                        </p>
                        <div className="mt-10 flex items-center gap-x-6">
                            <Link
                                to="/quote"
                                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                            >
                                Get a Quote
                            </Link>
                            <Link to="/contact-us" className="text-sm font-semibold leading-6 text-white">
                                Contact Sales <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-primary-600">Expert Office Moves</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Everything you need for a smooth transition
                        </p>
                        <p className="mt-6 text-lg leading-8 text-slate-600">
                            We understand that time is money. Our commercial moving team is trained to handle complex office moves with precision and speed.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Building2 className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Office Furniture Handling
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Expert disassembly and reassembly of desks, cubicles, and shelving units. We ensure everything is set up exactly how you want it in your new space.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Monitor className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    IT Equipment Protection
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Specialized packing and transport for computers, servers, and sensitive electronics to prevent damage and data loss.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Clock className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    After-Hours Service
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    We offer evening and weekend moves to ensure your business operations are not disrupted during standard working hours.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Shield className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Confidentiality & Security
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Your documents and assets are safe with us. Our team is vetted and trained to handle sensitive business information with care.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-slate-50 py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Ready to move your business?
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600">
                            Get a customized quote for your commercial move today. Our experts are standing by to assist you.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                to="/quote"
                                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                            >
                                Start Your Quote
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
