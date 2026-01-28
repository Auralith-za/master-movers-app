import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Package } from 'lucide-react'
import Button from '../components/ui/Button'

export default function PackingMaterialsPage() {
    const navigate = useNavigate()

    const materials = [
        {
            name: 'Stock 4 Carton',
            size: '300 x 230 x 300mm',
            use: 'Heavy items like books, tools, canned goods, wine bottles.',
            price: 'R 25.00'
        },
        {
            name: 'Stock 5 Carton',
            size: '450 x 300 x 300mm',
            use: 'General household items, kitchenware, toys, shoes.',
            price: 'R 32.00'
        },
        {
            name: 'Stock 6 Carton',
            size: '600 x 400 x 400mm',
            use: 'Light, bulky items like linen, bedding, cushions, lampshades.',
            price: 'R 45.00'
        },
        {
            name: 'Wardrobe Carton',
            size: '500 x 500 x 1000mm',
            use: 'Hanging clothes. Includes a rail.',
            price: 'R 180.00'
        },
        {
            name: 'Bubble Wrap',
            size: '100m Roll',
            use: 'Wrapping fragile items, electronics, pictures, mirrors.',
            price: 'R 450.00'
        },
        {
            name: 'Buff Tape',
            size: '48mm x 50m',
            use: 'Sealing boxes securely.',
            price: 'R 25.00'
        }
    ]

    return (
        <div className="flex flex-col min-h-screen">
            {/* Main Content Area */}
            <div className="bg-slate-50 py-24 flex-grow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold text-slate-900 mb-4">Packing Materials</h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            High-quality boxes and packaging supplies to ensure your belongings stay safe during transit. Order online or visit our branches.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                        {materials.map((item, index) => (
                            <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                {/* Visual Placeholder for Box Image */}
                                <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100 opacity-50" />
                                    <Package size={64} className="text-slate-300 group-hover:scale-110 transition-transform duration-300" />
                                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-slate-900 shadow-sm">
                                        {item.price}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{item.name}</h3>
                                    <p className="text-xs font-mono text-slate-400 mb-4 bg-slate-50 inline-block px-2 py-1 rounded">
                                        {item.size}
                                    </p>
                                    <p className="text-slate-600 text-sm mb-6 min-h-[40px]">
                                        {item.use}
                                    </p>
                                    <Button variant="outline" className="w-full justify-center">Add to Quote</Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Section: Professional Packing CTA */}
                    <div className="mt-20 bg-slate-900 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold mb-4">Don't want to pack yourself?</h2>
                                <p className="text-slate-300 mb-8 leading-relaxed">
                                    Packing is the most time-consuming part of moving. Our professional ladies packing team can pack your entire home in a day, ensuring everything is wrapped perfectly for transit.
                                </p>
                                <Button
                                    className="bg-white text-slate-900 hover:bg-slate-100 border-none font-semibold"
                                    onClick={() => navigate('/services')}
                                >
                                    View Packing Services
                                </Button>
                            </div>
                            <div className="border-l border-slate-700 pl-8 md:pl-12">
                                <h4 className="text-primary-500 font-bold tracking-wider text-sm uppercase mb-3">Pro Tip</h4>
                                <p className="text-slate-400 italic font-light text-lg">
                                    "Always label your boxes on the side, not the top. This way, you can see what's inside even when they are stacked."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section: Move Readiness CTA (Full Width) */}
            <div className="bg-primary-600 py-20">
                <div className="max-w-4xl mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to make your move?</h2>
                    <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">
                        Get a free, instant quote using our NextGen moving planner. It calculates volume, recommends trucks, and provides accurate pricing in seconds.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            className="bg-white text-primary-600 hover:bg-primary-50 border-none font-bold h-12 px-8"
                            onClick={() => navigate('/quote')}
                        >
                            Get Instant Quote
                        </Button>
                        <Button
                            variant="outline"
                            className="border-white text-white hover:bg-white/10 h-12 px-8"
                            onClick={() => navigate('/contact')}
                        >
                            Contact Us
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
