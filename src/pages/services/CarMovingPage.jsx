import React from 'react'
import { Car, ShieldCheck, MapPin, Gauge, Key } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CarMovingPage() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-slate-900 py-24 sm:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 opacity-90" />
                    <img
                        src="https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2000&auto=format&fit=crop"
                        alt="Car Carrier on Highway"
                        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
                    />
                </div>
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 text-xs font-bold uppercase tracking-wide mb-6">
                            <Car size={14} />
                            Vehicle Transportation
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            Secure Car Moving Services
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-slate-300">
                            We transport your vehicle safely and efficiently across South Africa. From luxury sedans to family SUVs, your car is in expert hands.
                        </p>
                        <div className="mt-10 flex items-center gap-x-6">
                            <Link
                                to="/quote"
                                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Get a Vehicle Quote
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-indigo-600">Door-to-Door Service</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Why Choose Our Car Carriers?
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                                        <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Fully Insured Transit
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Every vehicle we transport is covered by comprehensive goods-in-transit insurance, giving you total peace of mind.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                                        <Gauge className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Real-Time Tracking
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Monitor your vehicle's journey with our advanced tracking systems. Know exactly where your car is at all times.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                                        <MapPin className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Nationwide Network
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    We cover all major routes including Johannesburg, Cape Town, Durban, and Port Elizabeth, as well as outlying areas.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                                        <Key className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Secure Handling
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    From handover to delivery, strict protocols ensure your vehicle is handled only by authorized, professional drivers.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    )
}
