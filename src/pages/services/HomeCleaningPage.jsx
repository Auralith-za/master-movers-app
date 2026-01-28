import React from 'react'
import { Sparkles, Home, Shield, ThumbsUp, Eraser } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HomeCleaningPage() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-teal-900 py-24 sm:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 opacity-90" />
                    <img
                        src="https://images.unsplash.com/photo-1581578731117-10d52b43b232?q=80&w=2000&auto=format&fit=crop"
                        alt="Clean Living Room"
                        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
                    />
                </div>
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-500/30 text-xs font-bold uppercase tracking-wide mb-6">
                            <Sparkles size={14} />
                            Professional Cleaning
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            Move-In / Move-Out Cleaning
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-teal-100">
                            Leave the dirty work to us. Our verified cleaning teams ensure your old home is spotless for inspection and your new home is sparkling ready for arrival.
                        </p>
                        <div className="mt-10 flex items-center gap-x-6">
                            <Link
                                to="/quote"
                                className="rounded-md bg-teal-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                            >
                                Get a Cleaning Quote
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-teal-600">Spotless Results</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Expert Cleaning Services
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600">
                                        <Eraser className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Deep Carpet Cleaning
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Revitalize carpets and remove stubborn stains with our industrial-grade steam cleaning equipment.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600">
                                        <Shield className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Vetted Staff
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    All our cleaners are background-checked, trained professionals you can trust in your home.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600">
                                        <ThumbsUp className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Deposit Back Guarantee
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    We follow strict agency checklists to ensure your rental property meets the standards required for your deposit return.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600">
                                        <Home className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Pre-Occupation Clean
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Ensure your new house is sanitized and fresh before you move your furniture in.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    )
}
