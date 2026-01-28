import React from 'react'
import { Globe, Ship, Plane, FileCheck, Map } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function InternationalMoversPage() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-slate-900 py-24 sm:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-slate-900 opacity-90" />
                </div>
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            International Moving Services
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-slate-300">
                            Moving abroad is a complex adventure. We simplify the logistics, customs, and shipping so you can focus on your new journey.
                        </p>
                        <div className="mt-10 flex items-center gap-x-6">
                            <Link
                                to="/quote"
                                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                            >
                                Get a Quote
                            </Link>
                            <Link to="/contact-us" className="text-sm font-semibold leading-6 text-white">
                                Contact International Desk <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-primary-600">Global Reach</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Seamless moves to any destination
                        </p>
                        <p className="mt-6 text-lg leading-8 text-slate-600">
                            With our extensive network of global partners, we ensure door-to-door service anywhere in the world.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <FileCheck className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Customs Clearance
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Navigate international regulations with ease. Our team handles all documentation and customs requirements to prevent delays.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Ship className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Sea Freight
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Cost-effective shipping for large household moves. We offer Full Container Load (FCL) and Less than Container Load (LCL) options.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Plane className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Air Freight
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Need your items faster? Our air freight services provide a quicker solution for essential items or smaller moves.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Map className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Tracking & Support
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Stay informed throughout the journey. We provide regular updates on your shipment's status until it arrives at your new home.
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
                            Ready for your international adventure?
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600">
                            Speak to our international moving specialists today for a detailed consultation and quote.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                to="/contact-us"
                                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                            >
                                Contact International Desk
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
