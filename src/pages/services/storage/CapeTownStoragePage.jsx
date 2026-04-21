import React from 'react'
import { Warehouse, MapPin, ShieldCheck, Box } from 'lucide-react'
import ModernPageLayout from '../../../components/layout/ModernPageLayout'

export default function CapeTownStoragePage() {
    const facilitySections = [
        {
            title: 'Secure & Monitored',
            description: "State-of-the-art security systems, including CCTV and armed response, ensure your belongings are safe.",
            icon: ShieldCheck,
        },
        {
            title: 'Convenient Locations',
            description: 'Easily accessible facilities located near major transport routes in Cape Town for quick pick-up and drop-off.',
            icon: MapPin,
        },
        {
            title: 'Packing Supplies',
            description: 'We offer a full range of packing materials on-site, including boxes, tape, and bubble wrap, to help you organize your unit.',
            icon: Box,
        },
        {
            title: 'Clean & Dry',
            description: 'Our units are professionally maintained, clean, and dry to prevent any damage from moisture or pests.',
            icon: Warehouse,
        }
    ];

    return (
        <ModernPageLayout
            heroTitle="Cape Town Storage"
            heroSubtitle="Secure, convenient, and affordable storage facilities in the heart of the Western Cape."
            heroImage="https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&q=80&w=2000"
            sections={facilitySections}
            ctaHeading="Why Store with Us in Cape Town?"
            ctaSubheading="Our Cape Town facilities are designed to handle the unique needs of the region, from seasonal goods to household overflow."
        />
    )
}
