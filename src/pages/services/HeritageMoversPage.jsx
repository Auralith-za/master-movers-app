import React from 'react'
import { Armchair, Clock, Box, Shield, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HeritageMoversPage() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-stone-900 py-24 sm:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-slate-900 opacity-90" />
                    <img
                        src="https://images.unsplash.com/photo-1544604856-747d96a79836?q=80&w=2000&auto=format&fit=crop"
                        alt="Vintage Furniture"
                        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
                    />
                </div>
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-500/20 text-stone-200 border border-stone-500/30 text-xs font-bold uppercase tracking-wide mb-6">
                            <Clock size={14} />
                            Specialized Service
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            Old Home & Heritage Moves
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-stone-200">
                            Respectful, delicate moving services tailored for seniors, antiques, and heritage properties. We handle your history with the care it deserves.
                        </p>
                        <div className="mt-10 flex items-center gap-x-6">
                            <Link
                                to="/quote"
                                className="rounded-md bg-stone-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500"
                            >
                                Request a Consultation
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-stone-600">White Glove Service</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Preserving Precious Memories
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-stone-600">
                                        <Shield className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Custom Crating
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    We build custom wooden crates for safe transport of antiques, artwork, chandeliers, and high-value heirlooms.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-stone-600">
                                        <Heart className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Senior Relocation
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    We offer patient, supportive assistance for seniors downsizing or moving to retirement communities, managing the transition with dignity.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-stone-600">
                                        <Armchair className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Furniture Restoration
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Access to network of restoration experts who can repair or polish antique furniture before it arrives at your new home.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-stone-600">
                                        <Box className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    White Glove Delivery
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Full unpacking and setup service. We place every item exactly where you want it, making your new house feel like home instantly.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    )
}
