import React, { useState } from 'react'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Label from '../components/ui/Label'
import { emailService } from '../services/emailService'
import { trackLeadConversion } from '../lib/gtag'
import { supabase } from '../lib/supabaseClient'

export default function ContactPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        if (!formData.firstName || !formData.email || !formData.message) {
            alert("Please fill in all required fields (First Name, Email, and Message).")
            return
        }
        setIsSubmitting(true)
        try {
            const name = `${formData.firstName} ${formData.lastName}`.trim()

            // 1. Save to DB (contact_submissions table) — always works regardless of email
            await supabase.from('contact_submissions').insert({
                name,
                email: formData.email,
                phone: formData.phone,
                message: formData.message,
                status: 'new'
            })

            // 2. Send admin email notification
            const res = await emailService.sendContactEmail({
                name,
                email: formData.email,
                phone: formData.phone,
                message: formData.message
            })

            // 3. Fire Google Ads lead conversion
            trackLeadConversion({ label: 'Contact Form Submit', value: 0 })

            alert("Message sent successfully! Our team will get back to you shortly.")
            setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' })

            if (!res.success) {
                console.warn('Email notification failed (submission still saved):', res.error)
            }
        } catch (error) {
            console.error("Contact form error:", error)
            alert("Failed to send message: " + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <div className="relative isolate overflow-hidden bg-slate-900 py-24 sm:py-32 mb-12">
                <img
                    src="/images/hero_contact.jpg"
                    alt="Contact Hero"
                    className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
                />
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">Get in Touch</h1>
                    <p className="mt-6 text-lg leading-8 text-slate-300 max-w-2xl mx-auto">
                        Have questions about your move? Our team is here to help. Reach out to us via phone, email, or visit one of our branches.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Contact Info */}
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-10">Contact Information</h2>

                        <div className="space-y-10">
                            {/* Johannesburg */}
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary-50 text-primary-600 rounded-lg shrink-0">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 border-b border-primary-100 pb-2 mb-2 inline-block">JOHANNESBURG (Head Office)</h3>
                                    <p className="text-sm font-semibold text-slate-700">Master Movers Johannesburg</p>
                                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                                        17 Indianapolis Blvd,<br />
                                        Gosforth Park, Germiston,<br />
                                        1401
                                    </p>
                                    <div className="mt-3 space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Phone size={16} className="text-primary-500" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Call us at any time</span>
                                                <span className="font-bold">+27 11 493 7569</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Mail size={16} className="text-primary-500" />
                                            <a href="mailto:sales1@mastermoversjhb.co.za" className="hover:text-primary-600">sales1@mastermoversjhb.co.za</a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cape Town */}
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary-50 text-primary-600 rounded-lg shrink-0">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 border-b border-primary-100 pb-2 mb-2 inline-block">CAPE TOWN</h3>
                                    <p className="text-sm font-semibold text-slate-700">Master Movers Cape Town</p>
                                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                                        Unit 1, Bosal Park,<br />
                                        77 Bofors Cir, Epping,<br />
                                        Cape Town, 7460
                                    </p>
                                    <div className="mt-3 space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Phone size={16} className="text-primary-500" />
                                            <span>+27 21 534 1582</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Mail size={16} className="text-primary-500" />
                                            <a href="mailto:sales@mastermoverscpt.co.za" className="hover:text-primary-600">sales@mastermoverscpt.co.za</a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Durban */}
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary-50 text-primary-600 rounded-lg shrink-0">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 border-b border-primary-100 pb-2 mb-2 inline-block">DURBAN</h3>
                                    <p className="text-sm font-semibold text-slate-700">Master Movers Kwazulu Natal</p>
                                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                                        Units 5 & 6 Raddical Park,<br />
                                        3 Gourly Rd, Ballito, 4420
                                    </p>
                                    <div className="mt-3 space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Phone size={16} className="text-primary-500" />
                                            <span>+27 31 700 8380</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Mail size={16} className="text-primary-500" />
                                            <a href="mailto:sales@mastermoversdbn.co.za" className="hover:text-primary-600">sales@mastermoversdbn.co.za</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-slate-50 p-8 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>
                        <form className="space-y-4" onSubmit={handleFormSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+27 ..."
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <Label htmlFor="message">Message</Label>
                                <textarea
                                    id="message"
                                    name="message"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 min-h-[120px] text-sm"
                                    placeholder="How can we help you?"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                ></textarea>
                            </div>
                            <Button
                                type="submit"
                                className="w-full justify-center"
                                isLoading={isSubmitting}
                            >
                                Send Message
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
