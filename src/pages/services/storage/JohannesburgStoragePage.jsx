import React from 'react'
import { Warehouse, Video, Key, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function JohannesburgStoragePage() {
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
                            Johannesburg Storage
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-slate-300">
                            Convenient and secure storage solutions in Johannesburg. Easy access, affordable rates, and top-notch security.
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
                        <h2 className="text-base font-semibold leading-7 text-primary-600">Central Hub</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Storage in the Heart of Business
                        </p>
                        <p className="mt-6 text-lg leading-8 text-slate-600">
                            Located centrally for easy access, our Johannesburg facilities cater to both residential and commercial clients with diverse storage needs.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Video className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    24/7 Surveillance
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Comprehensive CCTV coverage and on-site security personnel ensure that your property is watched over at all times.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Key className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Secure Access
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Controlled gate access ensures that only authorized individuals can enter the facility, providing an extra layer of protection.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Truck className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Drive-Up Units
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Many of our units offer drive-up access, making loading and unloading heavy or bulky items a breeze.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Warehouse className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Clean Facilities
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    We take pride in maintaining clean, pest-free facilities to ensure your goods remain in the condition you left them.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    )
}
