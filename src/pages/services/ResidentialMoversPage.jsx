import React from 'react'
import { Home, Package, Truck, HeartHandshake, Clock } from 'lucide-react'
import ModernPageLayout from '../../components/layout/ModernPageLayout'

export default function ResidentialMoversPage() {
    const residentialSections = [
        {
            tag: "Preparation",
            title: 'Professional Packing',
            description: "Our team can handle all your packing needs. We use high-quality materials to ensure your fragile items, dishes, and electronics travel safely.",
            features: [
                'High-quality packing materials.',
                'Specialized care for fragile items.'
            ],
            image: "https://cloudsplash.co.za/wp/wp-content/uploads/2026/03/How-to-Set-Up-a-Moving-Company-in-South-Africa.jpg",
            icon: Package,
            iconTitle: 'Expert Packing',
            iconText: 'Maximum protection for your valuables.'
        },
        {
            tag: "Transport",
            title: 'Modern Fleet',
            description: 'Our vehicles are well-maintained, clean, and equipped with air-ride suspension to smooth out the bumps in the road for your cargo.',
            image: "https://cloudsplash.co.za/wp/wp-content/uploads/2026/03/content-image-2.jpg.webp",
        },
        {
            tag: "Service",
            title: 'Care and Respect',
            description: 'We treat your home and belongings with respect. We use floor runners and padding to protect your property during the move.',
            image: "https://cloudsplash.co.za/wp/wp-content/uploads/2026/03/Home-moving-companies-in-Abu-Dhabi-5th-November.jpg",
            icon: HeartHandshake,
            iconTitle: 'White Glove Service',
            iconText: 'Treating your home like our own.'
        },
        {
            tag: "Efficiency",
            title: 'Timely Service',
            description: 'We value your time. Our team arrives on schedule and works efficiently to complete your move within the estimated timeframe.',
            image: "https://images.unsplash.com/photo-1542361345-89e58247f2d5?auto=format&fit=crop&q=80&w=1200",
        }
    ];

    return (
        <ModernPageLayout
            heroTitle="Residential Movers"
            heroSubtitle="Moving home is a big life event. We make it easy, stress-free, and safe. From apartments to estates, we treat your belongings like our own."
            heroImage="/images/lifestyle_moving.png"
            sections={residentialSections}
            ctaHeading="Plan your home move today"
            ctaSubheading="Get a free, no-obligation quote instantly. Our simple process makes booking your move easier than ever."
        />
    )
}
