import React from 'react'
import { Dog, Cat, Heart, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PetMovingPage() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-emerald-900 py-24 sm:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-green-900 to-slate-900 opacity-90" />
                    <img
                        src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2000&auto=format&fit=crop"
                        alt="Happy Dogs"
                        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
                    />
                </div>
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 text-xs font-bold uppercase tracking-wide mb-6">
                            <Dog size={14} />
                            Pet Travel Specialists
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            Pet Moving & Travel
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-emerald-100">
                            We don't just move boxes, we move families. Our specialized pet travel service ensures your furry friends arrive safely, comfortably, and happily.
                        </p>
                        <div className="mt-10 flex items-center gap-x-6">
                            <Link
                                to="/quote"
                                className="rounded-md bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                            >
                                Get a Pet Travel Quote
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-emerald-600">VIP Travel</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Comfort & Care First
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                                        <Heart className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Animal Lovers
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Our drivers and handlers are dedicated animal lovers trained in pet first aid and behavior, providing frequent hydration and comfort stops.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                                        <Truck className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Climate Controlled
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Pets travel in modern, temperature-controlled vehicles designed specifically for animal transport, never in a standard freight truck.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                                        <Cat className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Custom Crates
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    We supply airline-approved travel crates of all sizes, ensuring your pet has enough room to stand, turn, and lie down comfortably.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                                        <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Vet Checks & Paperwork
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Moving internationally? We assist with all veterinary certificates, vaccinations, and quarantine documentation required for travel.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    )
}
