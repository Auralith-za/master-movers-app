import React from 'react'
import { Warehouse, Lock, Calendar, Truck, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CommercialStoragePage() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-slate-900 py-24 sm:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src="/images/hero_storage.jpg"
                        alt="Storage Hero"
                        className="absolute inset-0 h-full w-full object-cover opacity-30"
                    />
                </div>
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            Commercial Storage Solutions
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-slate-300">
                            Secure, flexible, and accessible storage for your business assets. From document archiving to excess inventory, we have the space you need.
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
                        <h2 className="text-base font-semibold leading-7 text-primary-600">Business Storage</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            More than just space
                        </p>
                        <p className="mt-6 text-lg leading-8 text-slate-600">
                            We provide tailored storage solutions designed to support your business operations, not just store your stuff.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    24/7 Security
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Our facilities are monitored 24/7 with CCTV and access control systems. Rest assured your business assets are protected around the clock.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Warehouse className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Flexible Units
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Scale up or down as your business needs change. We offer a variety of unit sizes to accommodate everything from office files to large equipment.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Calendar className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Short & Long Term
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Whether you need storage for a few weeks during a renovation or long-term archiving, we offer flexible rental terms to suit your schedule.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Truck className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Logistics Support
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Need help getting your items to or from storage? Our moving team can handle the collection and delivery, properly packing and inventorying your goods.
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
                            Secure your business assets
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600">
                            Get a competitive quote for commercial storage today.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                to="/quote"
                                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                            >
                                Request Storage Quote
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
