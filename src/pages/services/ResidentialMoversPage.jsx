import React from 'react'
import { Home, Package, Truck, HeartHandshake, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ResidentialMoversPage() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-slate-900 py-24 sm:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-900 to-slate-900 opacity-90" />
                </div>
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            Residential Moving Services
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-slate-300">
                            Moving home is a big life event. We make it easy, stress-free, and safe. From apartments to estates, we treat your belongings like our own.
                        </p>
                        <div className="mt-10 flex items-center gap-x-6">
                            <Link
                                to="/quote"
                                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                            >
                                Get a Quote
                            </Link>
                            <Link to="/contact-us" className="text-sm font-semibold leading-6 text-white">
                                Talk to an Expert <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-primary-600">Stress-Free Moving</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Local & Long Distance Moves
                        </p>
                        <p className="mt-6 text-lg leading-8 text-slate-600">
                            Whether you're moving down the street or across the country, our team provides the same high level of care and professionalism.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Package className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Professional Packing
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Our team can handle all your packing needs. We use high-quality materials to ensure your fragile items, dishes, and electronics travel safely.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Truck className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Modern Fleet
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Our vehicles are well-maintained, clean, and equipped with air-ride suspension to smooth out the bumps in the road for your cargo.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <HeartHandshake className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Care and Respect
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    We treat your home and belongings with respect. We use floor runners and padding to protect your property during the move.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Clock className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Timely Service
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    We value your time. Our team arrives on schedule and works efficiently to complete your move within the estimated timeframe.
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
                            Plan your home move today
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600">
                            Get a free, no-obligation quote instantly. Our simple process makes booking your move easier than ever.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                to="/quote"
                                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                            >
                                Get a Free Quote
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
