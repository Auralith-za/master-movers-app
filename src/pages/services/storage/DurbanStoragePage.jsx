import React from 'react'
import { Warehouse, Container, Shield, Thermometer } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DurbanStoragePage() {
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
                            Durban Storage Facilities
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-slate-300">
                            Safe, climate-controlled storage solutions in Durban. Perfect for household goods and business inventory.
                        </p>
                        <div className="mt-10 flex items-center gap-x-6">
                            <Link
                                to="/quote"
                                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                            >
                                Get Storage Quote
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-primary-600">Coastal Storage</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Designed for the Durban Climate
                        </p>
                        <p className="mt-6 text-lg leading-8 text-slate-600">
                            We understand the humidity challenges in Durban. That's why our top-tier facilities offer climate control to keep your valuables safe from moisture.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Thermometer className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Climate Control
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Specialized units that maintain consistent temperature and humidity levels, perfect for artwork, electronics, and wood furniture.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Shield className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Top-Tier Security
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    24-hour guarded access, perimeter fencing, and constant surveillance ensure total peace of mind.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Container className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Container Storage
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Secure, sealed container storage options available for robust protection and larger volume needs.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Warehouse className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Various Sizes
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    From small lockers to large warehouse spaces, we have the right size unit for your specific requirements.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    )
}
