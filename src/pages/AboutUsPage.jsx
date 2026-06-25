import React from 'react';
import ModernPageLayout from '../components/layout/ModernPageLayout';
import { Truck, Shield, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import SouthAfricaMap from '../components/ui/SouthAfricaMap';

export default function AboutUsPage() {
    const aboutSections = [
        {
            tag: "Areas We Serve",
            title: 'Moving You Anywhere within SA 🇿🇦',
            description: "From Cape Town to Limpopo, we've got you covered. Whether you're moving down the street in Sandton or relocating across the country to the Western Cape, MasterMovers has the fleet and the network to get you there.",
            features: [
                'JHB | Cape Town | Durban | International',
                'Long Distance & Inter-Provincial Moves',
                'Weekly Shuttles between JHB, DBN, and CPT',
                'Remote & Outlaying Area Services',
                'Secure Storage Hubs in Major Cities'
            ],
            customVisual: (
                <div className="relative rounded-3xl overflow-hidden aspect-square lg:aspect-[4/5] shadow-2xl group border border-slate-200">
                    <SouthAfricaMap />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-8 z-20 pointer-events-none">
                        <div className="text-white transform group-hover:-translate-y-2 transition-transform duration-500">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="text-red-500 animate-bounce" fill="currentColor" size={32} />
                                <span className="font-bold text-xl drop-shadow-md">Nationwide Coverage</span>
                            </div>
                            <p className="text-sm text-slate-200 drop-shadow-md">We effectively cover the entire South African map.</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            tag: "Technology",
            title: 'Smart Fleet & Real-Time Tracking',
            description: 'We combine decades of experience with cutting-edge technology to deliver the most reliable moving service in South Africa. Our real-time tracking and optimized routing ensure your belongings arrive on time, every time.',
            icon: Truck,
            iconTitle: 'Smart Logistics',
            iconText: 'Data-driven routes for maximum efficiency.'
        },
        {
            tag: "Security",
            title: 'Fully Insured & Protected',
            description: 'Your peace of mind is our top priority. Comprehensive transit insurance is included with every move, and our highly trained specialists handle your items with the utmost care and respect.',
            icon: Shield,
            iconTitle: 'Total Protection',
            iconText: 'Zero-stress moving with full coverage.'
        },
        {
            tag: "Efficiency",
            title: 'Precision Planning',
            description: 'Our proprietary AI engine calculates the exact volume, optimal truck size, and time needed for your move. This eliminates guesswork, prevents delays, and ensures you never encounter surprise costs.',
            icon: Clock,
            iconTitle: 'AI-Powered Accuracy',
            iconText: 'No hidden fees. Just precise quoting.'
        }
    ];

    return (
        <ModernPageLayout
            heroTitle="About MasterMovers"
            heroSubtitle="Decades of experience. Next-generation technology. We are South Africa's most trusted moving network."
            heroImage="/images/hero_truck.jpg"
            sections={aboutSections}
            ctaHeading="Experience the Difference"
            ctaSubheading="Join thousands of satisfied South Africans who have moved with us."
        />
    );
}
