import React from 'react'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Label from '../components/ui/Label'

export default function ContactPage() {
    return (
        <div className="bg-white min-h-screen py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Contact Info */}
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 mb-6">Get in Touch</h1>
                        <p className="text-lg text-slate-500 mb-10">
                            Have questions about your move? Our team is here to help. Reach out to us via phone, email, or visit one of our branches.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary-50 text-primary-600 rounded-lg">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Head Office (Johannesburg)</h3>
                                    <p className="text-slate-500 mt-1">
                                        123 Logistics Way, Prologis Park<br />
                                        Germiston, 1401
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary-50 text-primary-600 rounded-lg">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Phone Support</h3>
                                    <p className="text-slate-500 mt-1">
                                        +27 11 123 4567<br />
                                        <span className="text-xs">Mon-Fri: 08:00 - 17:00</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary-50 text-primary-600 rounded-lg">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Email</h3>
                                    <p className="text-slate-500 mt-1">
                                        hello@mastermovers.co.za<br />
                                        quotes@mastermovers.co.za
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-slate-50 rounded-xl">
                            <h3 className="font-bold text-slate-900 mb-2">Regional Branches</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold block text-slate-700">Cape Town</span>
                                    <span className="text-slate-500">Unit 5, Airport City</span>
                                </div>
                                <div>
                                    <span className="font-semibold block text-slate-700">Durban</span>
                                    <span className="text-slate-500">Riverhorse Valley</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-slate-50 p-8 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>
                        <form className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>First Name</Label>
                                    <Input placeholder="John" />
                                </div>
                                <div>
                                    <Label>Last Name</Label>
                                    <Input placeholder="Doe" />
                                </div>
                            </div>
                            <div>
                                <Label>Email Address</Label>
                                <Input type="email" placeholder="john@example.com" />
                            </div>
                            <div>
                                <Label>Phone Number</Label>
                                <Input type="tel" placeholder="+27 ..." />
                            </div>
                            <div>
                                <Label>Message</Label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 min-h-[120px]"
                                    placeholder="How can we help you?"
                                ></textarea>
                            </div>
                            <Button className="w-full justify-center">Send Message</Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
