import React from 'react'
import { Warehouse, Video, Key, Truck } from 'lucide-react'
import ModernPageLayout from '../../../components/layout/ModernPageLayout'

export default function JohannesburgStoragePage() {
    const jhbSections = [
        {
            title: '24/7 Surveillance',
            description: "Comprehensive CCTV coverage and on-site security personnel ensure that your property is watched over at all times.",
            icon: Video,
        },
        {
            title: 'Secure Access',
            description: 'Controlled gate access ensures that only authorized individuals can enter the facility, providing an extra layer of protection.',
            icon: Key,
        },
        {
            title: 'Drive-Up Units',
            description: 'Many of our units offer drive-up access, making loading and unloading heavy or bulky items a breeze.',
            icon: Truck,
        },
        {
            title: 'Clean Facilities',
            description: 'We take pride in maintaining clean, pest-free facilities to ensure your goods remain in the condition you left them.',
            icon: Warehouse,
        }
    ];

    return (
        <ModernPageLayout
            heroTitle="Johannesburg Storage"
            heroSubtitle="Convenient and secure storage solutions in Johannesburg. Easy access, affordable rates, and top-notch security."
            heroImage="https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&q=80&w=2000"
            sections={jhbSections}
            ctaHeading="Storage in the Heart of Business"
            ctaSubheading="Located centrally for easy access, our Johannesburg facilities cater to both residential and commercial clients with diverse storage needs."
        />
    )
}
