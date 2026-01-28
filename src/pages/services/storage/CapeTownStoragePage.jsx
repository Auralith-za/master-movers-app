import React from 'react'
import { Warehouse, MapPin, ShieldCheck, Box } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CapeTownStoragePage() {
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
                            Cape Town Storage
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-slate-300">
                            Secure, convenient, and affordable storage facilities in the heart of the Western Cape.
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
                        <h2 className="text-base font-semibold leading-7 text-primary-600">Local Facilities</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Why Store with Us in Cape Town?
                        </p>
                        <p className="mt-6 text-lg leading-8 text-slate-600">
                            Our Cape Town facilities are designed to handle the unique needs of the region, from seasonal goods to household overflow.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Secure & Monitored
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    State-of-the-art security systems, including CCTV and armed response, ensure your belongings are safe.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <MapPin className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Convenient Locations
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Easily accessible facilities located near major transport routes in Cape Town for quick pick-up and drop-off.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Box className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Packing Supplies
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    We offer a full range of packing materials on-site, including boxes, tape, and bubble wrap, to help you organize your unit.
                                </dd>
                            </div>
                            <div className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-slate-900">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                        <Warehouse className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    Clean & Dry
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-slate-600">
                                    Our units are professionally maintained, clean, and dry to prevent any damage from moisture or pests.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    )
}
