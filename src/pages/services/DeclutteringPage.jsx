import React from 'react'
import { Boxes, Trash2, Heart, Recycle, LayoutGrid } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DeclutteringPage() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-orange-900 py-24 sm:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-900 via-amber-900 to-slate-900 opacity-90" />
                    <img
                        src="https://images.unsplash.com/photo-1517164850305-99a3e65bb47e?q=80&w=2000&auto=format&fit=crop"
                        alt="Organized Room"
                        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
                    />
                </div>
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-200 border border-orange-500/30 text-xs font-bold uppercase tracking-wide mb-6">
                            <LayoutGrid size={14} />
                            Organization Expert
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            Professional Decluttering
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-orange-100">
                            Simplify your life before you move. Our compassionate team helps you sort, donate, recycle, and organize your belongings, so you only move what you love.
                        </p>
                        <div className="mt-10 flex items-center gap-x-6">
                            <Link
                                to="/quote"
                                className="rounded-md bg-orange-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                            >
                                Get Organized Today
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-orange-600">Reclaim Your Space</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            A Fresh Start
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
                                        <Heart className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Compassionate Sorting
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    We understand emotional attachments. Our team works with you patiently to decide what to keep, ensuring no regrets.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
                                        <Recycle className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Eco-Friendly Disposal
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    We responsible dispose of unwanted items through recycling centers and donation partnerships with local charities.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
                                        <Boxes className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Space Optimization
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Get expert advice on how to organize your remaining items to maximize space and functionality in your new home.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
                                        <Trash2 className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Junk Removal
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    We haul away the trash and broken items immediately, leaving you with a clean, clutter-free environment.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    )
}
