import React from 'react'
import { Truck, Box, Briefcase, Globe, Home, ShieldCheck } from 'lucide-react'

export default function ServicesPage() {
    const services = [
        {
            icon: Home,
            title: 'Residential Moves',
            desc: 'Whether you are moving next door or across the country, our team ensures your household goods are packed, transported, and delivered with the utmost care.',
            features: ['Professional Packing', 'Furniture Protection', 'Same-day Options']
        },
        {
            icon: Briefcase,
            title: 'Corporate Relocation',
            desc: 'Minimize downtime with our efficient office moving services. We handle IT equipment, office furniture, and sensitive documents with precision.',
            features: ['After-hours Service', 'IT Infrastructure Handling', 'Project Management']
        },
        {
            icon: Globe,
            title: 'International Moves',
            desc: 'Moving abroad? We navigate customs, shipping logistics, and international regulations to get your belongings safely to your new home.',
            features: ['Customs Clearance', 'Global Partner Network', 'Air & Sea Freight']
        },
        {
            icon: Box,
            title: 'Storage Solutions',
            desc: 'Secure, climate-controlled storage facilities for your short-term or long-term needs. 24/7 security and easy access options available.',
            features: ['Climate Controlled', '24/7 Monitoring', 'Flexible Terms']
        },
        {
            icon: Truck,
            title: 'Vehicle Transport',
            desc: 'Safe and reliable transportation for your car, motorcycle, or boat. We use specialized carriers to ensure your vehicle arrives in pristine condition.',
            features: ['Door-to-Door', 'Enclosed & Open Carriers', 'Full Insurance']
        },
        {
            icon: ShieldCheck,
            title: 'Packing Services',
            desc: 'Let our experts handle the packing. We use high-quality materials and proven techniques to protect your most fragile and valuable items.',
            features: ['Full & Partial Packing', 'Custom Crating', 'Unpacking Service']
        }
    ]

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Hero Section */}
            <div className="relative isolate overflow-hidden bg-slate-900 py-24 sm:py-32">
                <img
                    src="/images/hero_services.jpg"
                    alt="Services Hero"
                    className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
                />
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">Our Services</h1>
                    <p className="mt-6 text-lg leading-8 text-slate-300 max-w-2xl mx-auto">
                        Comprehensive moving solutions tailored to your unique needs. From small apartments to large corporate offices, we handle it all.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-6">
                                <service.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                            <p className="text-slate-500 mb-6">{service.desc}</p>
                            <ul className="space-y-2">
                                {service.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center text-sm text-slate-600">
                                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
