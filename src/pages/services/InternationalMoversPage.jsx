import React from 'react'
import { Globe, Ship, Plane, FileCheck, Map } from 'lucide-react'
import ModernPageLayout from '../../components/layout/ModernPageLayout'

export default function InternationalMoversPage() {
    const internationalSections = [
        {
            tag: "Documentation",
            title: 'Customs Clearance',
            description: "Navigate international regulations with ease. Our team handles all documentation and customs requirements to prevent delays.",
            features: [
                'Full documentation support.',
                'Expertise in local import regulations.'
            ],
            icon: FileCheck,
            iconTitle: 'Paperwork Handled',
            iconText: 'Breeze through international borders.'
        },
        {
            tag: "Logistics",
            title: 'Sea Freight',
            description: 'Cost-effective shipping for large household moves. We offer Full Container Load (FCL) and Less than Container Load (LCL) options.',
            image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&q=80&w=1200",
        },
        {
            tag: "Speed",
            title: 'Air Freight',
            description: 'Need your items faster? Our air freight services provide a quicker solution for essential items or smaller moves.',
            icon: Plane,
            iconTitle: 'Express Delivery',
            iconText: 'Fastest transit times available.'
        },
        {
            tag: "Visibility",
            title: 'Tracking & Support',
            description: 'Stay informed throughout the journey. We provide regular updates on your shipment\'s status until it arrives at your new home.',
            image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200",
        }
    ];

    return (
        <ModernPageLayout
            heroTitle="International Movers"
            heroSubtitle="Moving abroad is a complex adventure. We simplify the logistics, customs, and shipping so you can focus on your new journey."
            heroImage="/images/nationwide_sa.jpg"
            sections={internationalSections}
            ctaHeading="Ready for your international adventure?"
            ctaSubheading="Speak to our international moving specialists today for a detailed consultation and quote."
        />
    )
}
