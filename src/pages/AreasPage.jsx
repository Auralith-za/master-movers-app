import React from 'react'
import { MapPin, Truck } from 'lucide-react'

export default function AreasPage() {
    const branches = [
        { city: 'Johannesburg', type: 'Head Office', address: 'Germiston, Gauteng' },
        { city: 'Cape Town', type: 'Branch', address: 'Airport City, Western Cape' },
        { city: 'Durban', type: 'Branch', address: 'Riverhorse Valley, KZN' },
    ]

    const hubs = [
        'Pretoria', 'Bloemfontein', 'Port Elizabeth', 'East London',
        'George', 'Nelspruit', 'Polokwane', 'Kimberley'
    ]

    return (
        <div className="bg-slate-50 min-h-screen py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Areas We Serve</h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        With a national network of branches and logistics hubs, we cover every corner of South Africa.
                    </p>
                </div>

                {/* Map Visualization Placeholder */}
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-16 relative overflow-hidden h-[400px] flex items-center justify-center bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Map_of_South_Africa_with_provinces_shaded_by_population.svg/2000px-Map_of_South_Africa_with_provinces_shaded_by_population.svg.png')] bg-contain bg-center bg-no-repeat opacity-80">
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
                    <div className="relative z-10 text-center">
                        <MapPin size={48} className="text-primary-600 mx-auto mb-4 animate-bounce" />
                        <h2 className="text-2xl font-bold text-slate-900">National Coverage</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    {branches.map((branch, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border-l-4 border-primary-500">
                            <h3 className="text-xl font-bold text-slate-900 mb-1">{branch.city}</h3>
                            <span className="inline-block px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-bold uppercase rounded mb-4">
                                {branch.type}
                            </span>
                            <div className="flex items-center text-slate-500">
                                <MapPin size={18} className="mr-2" />
                                {branch.address}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-slate-900 text-white rounded-3xl p-12 text-center">
                    <h2 className="text-2xl font-bold mb-8">Logistics Hubs</h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {hubs.map((hub, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-800 px-6 py-3 rounded-full border border-slate-700">
                                <Truck size={16} className="text-primary-400" />
                                <span className="font-medium">{hub}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
