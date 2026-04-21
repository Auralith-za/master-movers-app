import React from 'react'
import { Truck, Box, Briefcase, Globe, Home, ShieldCheck } from 'lucide-react'
import ModernPageLayout from '../components/layout/ModernPageLayout'

export default function ServicesPage() {
    const servicesData = [
        {
            tag: "Service 01",
            title: 'Residential Moves',
            description: 'Whether you are moving next door or across the country, our team ensures your household goods are packed, transported, and delivered with the utmost care.',
            features: ['Professional Packing', 'Furniture Protection', 'Same-day Options'],
            icon: Home,
            iconTitle: 'Home Relocations',
            iconText: 'Stress-free moving for families everywhere.',
            image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&q=80&w=1200"
        },
        {
            tag: "Service 02",
            title: 'Corporate Relocation',
            description: 'Minimize downtime with our efficient office moving services. We handle IT equipment, office furniture, and sensitive documents with precision.',
            features: ['After-hours Service', 'IT Infrastructure Handling', 'Project Management'],
            image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200",
        },
        {
            tag: "Service 03",
            title: 'International Moves',
            description: 'Moving abroad? We navigate customs, shipping logistics, and international regulations to get your belongings safely to your new home.',
            features: ['Customs Clearance', 'Global Partner Network', 'Air & Sea Freight'],
            icon: Globe,
            iconTitle: 'Global Reach',
            iconText: 'Connecting you to over 150 countries safely.',
            image: "https://images.unsplash.com/photo-1454165833767-13a69a48f060?auto=format&fit=crop&q=80&w=1200"
        },
        {
            tag: "Service 04",
            title: 'Storage Solutions',
            description: 'Secure, climate-controlled storage facilities for your short-term or long-term needs. 24/7 security and easy access options available.',
            features: ['Climate Controlled', '24/7 Monitoring', 'Flexible Terms'],
            image: "https://images.unsplash.com/photo-1581452174360-1e582e0571f1?auto=format&fit=crop&q=80&w=1200",
        },
        {
            tag: "Service 05",
            title: 'Vehicle Transport',
            description: 'Safe and reliable transportation for your car, motorcycle, or boat. We use specialized carriers to ensure your vehicle arrives in pristine condition.',
            features: ['Door-to-Door', 'Enclosed & Open Carriers', 'Full Insurance'],
            icon: Truck,
            iconTitle: 'Auto Transport',
            iconText: 'Dedicated carriers for ultimate protection.',
            image: "https://images.unsplash.com/photo-1542361345-89e58247f2d5?auto=format&fit=crop&q=80&w=1200"
        },
        {
            tag: "Service 06",
            title: 'Packing Services',
            description: 'Let our experts handle the packing. We use high-quality materials and proven techniques to protect your most fragile and valuable items.',
            features: ['Full & Partial Packing', 'Custom Crating', 'Unpacking Service'],
            image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
        }
    ];

    return (
        <ModernPageLayout
            heroTitle="Our Services"
            heroSubtitle="Comprehensive moving solutions tailored to your unique needs. From small apartments to large corporate offices, we handle it all."
            heroImage="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000"
            sections={servicesData}
            ctaHeading="Let's Get Moving"
            ctaSubheading="Ready for a stress-free transition? Get your customized quote today."
        />
    )
}
