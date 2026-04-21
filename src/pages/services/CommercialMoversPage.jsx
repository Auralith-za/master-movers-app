import React from 'react'
import { CheckCircle2, Building2, Monitor, Clock, Shield } from 'lucide-react'
import ModernPageLayout from '../../components/layout/ModernPageLayout'

export default function CommercialMoversPage() {
    const commercialSections = [
        {
            tag: "Office Transitions",
            title: 'Expert Office Moves',
            description: "We understand that time is money. Our commercial moving team is trained to handle complex office moves with precision and speed, ensuring your business is back up and running in no time.",
            features: [
                'Expert disassembly and reassembly of desks, cubicles, and shelving units.',
                'We ensure everything is set up exactly how you want it in your new space.'
            ],
            image: "https://cloudsplash.co.za/wp/wp-content/uploads/2026/03/234605207.jpeg",
            icon: Building2,
            iconTitle: 'Furniture Handling',
            iconText: 'Seamless setup in your new office.'
        },
        {
            tag: "Tech Security",
            title: 'IT Equipment Protection',
            description: 'Specialized packing and transport for computers, servers, and sensitive electronics to prevent damage and data loss.',
            image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200",
        },
        {
            tag: "Zero Downtime",
            title: 'After-Hours Service',
            description: 'We offer evening and weekend moves to ensure your business operations are not disrupted during standard working hours.',
            image: "https://cloudsplash.co.za/wp/wp-content/uploads/2026/03/2.jpg",
            icon: Clock,
            iconTitle: 'Flexible Scheduling',
            iconText: 'We work when you rest.'
        },
        {
            tag: "Confidentiality",
            title: 'Security & Privacy',
            description: 'Your documents and assets are safe with us. Our team is vetted and trained to handle sensitive business information with care.',
            image: "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&q=80&w=1200",
        }
    ];

    return (
        <ModernPageLayout
            heroTitle="Commercial Movers"
            heroSubtitle="Minimize downtime and maximize efficiency. Seamless office relocations built for modern businesses."
            heroImage="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=2000"
            sections={commercialSections}
            ctaHeading="Ready to move your business?"
            ctaSubheading="Get a customized quote for your commercial move today. Our experts are standing by."
        />
    )
}
