import React from 'react'
import { Warehouse, Calendar, Truck, ShieldCheck } from 'lucide-react'
import ModernPageLayout from '../../../components/layout/ModernPageLayout'

export default function CommercialStoragePage() {
    const storageSections = [
        {
            title: '24/7 Security',
            description: "Our facilities are monitored 24/7 with CCTV and access control systems. Rest assured your business assets are protected around the clock.",
            icon: ShieldCheck,
        },
        {
            title: 'Flexible Units',
            description: 'Scale up or down as your business needs change. We offer a variety of unit sizes to accommodate everything from office files to large equipment.',
            icon: Warehouse,
        },
        {
            title: 'Short & Long Term',
            description: 'Whether you need storage for a few weeks during a renovation or long-term archiving, we offer flexible rental terms to suit your schedule.',
            icon: Calendar,
        },
        {
            title: 'Logistics Support',
            description: 'Need help getting your items to or from storage? Our moving team can handle the collection and delivery, properly packing and inventorying your goods.',
            icon: Truck,
        }
    ];

    return (
        <ModernPageLayout
            heroTitle="Commercial Storage Solutions"
            heroSubtitle="Secure, flexible, and accessible storage for your business assets. From document archiving to excess inventory, we have the space you need."
            heroImage="https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&q=80&w=2000"
            sections={storageSections}
            ctaHeading="Secure your business assets"
            ctaSubheading="Get a competitive quote for commercial storage today."
        />
    )
}
