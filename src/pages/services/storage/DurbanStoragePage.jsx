import React from 'react'
import { Warehouse, Container, Shield, Thermometer } from 'lucide-react'
import ModernPageLayout from '../../../components/layout/ModernPageLayout'

export default function DurbanStoragePage() {
    const durbanSections = [
        {
            title: 'Climate Control',
            description: "Specialized units that maintain consistent temperature and humidity levels, perfect for artwork, electronics, and wood furniture.",
            icon: Thermometer,
        },
        {
            title: 'Top-Tier Security',
            description: '24-hour guarded access, perimeter fencing, and constant surveillance ensure total peace of mind.',
            icon: Shield,
        },
        {
            title: 'Container Storage',
            description: 'Secure, sealed container storage options available for robust protection and larger volume needs.',
            icon: Container,
        },
        {
            title: 'Various Sizes',
            description: 'From small lockers to large warehouse spaces, we have the right size unit for your specific requirements.',
            icon: Warehouse,
        }
    ];

    return (
        <ModernPageLayout
            heroTitle="Durban Storage Facilities"
            heroSubtitle="Safe, climate-controlled storage solutions in Durban. Perfect for household goods and business inventory."
            heroImage="https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&q=80&w=2000"
            sections={durbanSections}
            ctaHeading="Designed for the Durban Climate"
            ctaSubheading="We understand the humidity challenges in Durban. That's why our top-tier facilities offer climate control to keep your valuables safe from moisture."
        />
    )
}
