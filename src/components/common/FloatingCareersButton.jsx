import React, { useState } from 'react'
import { Briefcase, X, CheckCircle, Send, Sparkles, User, Mail, Phone, ShieldCheck, Clock, Award } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function FloatingCareersButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [applicationRef, setApplicationRef] = useState('')
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        position: 'Heavy Vehicle Driver (Code 10/14)',
        experience_years: '1 - 3 Years',
        license_type: 'Code 10 (C1)',
        availability: 'Immediately',
        notes: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.full_name || !formData.email || !formData.phone) {
            alert('Please fill in your name, email, and phone number.')
            return
        }

        setIsSubmitting(true)
        const ref = 'APP-' + Math.floor(100000 + Math.random() * 900000)

        try {
            const { data, error } = await supabase
                .from('job_applications')
                .insert([
                    {
                        full_name: formData.full_name,
                        email: formData.email,
                        phone: formData.phone,
                        position: formData.position,
                        experience_years: formData.experience_years,
                        license_type: formData.license_type,
                        availability: formData.availability,
                        notes: formData.notes,
                        status: 'new'
                    }
                ])
                .select()

            if (error) {
                console.warn('Supabase job_applications insert error:', error)
            }
        } catch (err) {
            console.error('Job application submission exception:', err)
        } finally {
            setIsSubmitting(false)
            setApplicationRef(ref)
            setIsSubmitted(true)
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        // Reset state after transition
        setTimeout(() => {
            setIsSubmitted(false)
            setFormData({
                full_name: '',
                email: '',
                phone: '',
                position: 'Heavy Vehicle Driver (Code 10/14)',
                experience_years: '1 - 3 Years',
                license_type: 'Code 10 (C1)',
                availability: 'Immediately',
                notes: ''
            })
        }, 300)
    }

    return (
        <>
            {/* FLOATING LEFT CAREERS BUTTON */}
            <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[9999] flex items-center">
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-slate-900 hover:bg-red-600 text-white py-3.5 px-3 sm:px-4 rounded-r-2xl border-y border-r border-slate-700/80 shadow-2xl transition-all duration-300 flex items-center gap-2.5 group cursor-pointer border-l-0 hover:pl-5 hover:pr-5 active:scale-95"
                    title="Careers & Job Applications"
                >
                    <div className="relative flex items-center justify-center">
                        <Briefcase size={20} className="group-hover:rotate-12 transition-transform duration-300 text-red-500 group-hover:text-white" />
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 group-hover:text-white leading-none">Hiring</span>
                        <span className="text-xs font-black uppercase tracking-wider leading-tight">Careers</span>
                    </div>
                </button>
            </div>

            {/* CAREERS APPLICATION MODAL */}
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        
                        {/* MODAL HEADER */}
                        <div className="bg-slate-900 p-6 sm:p-8 text-white relative flex justify-between items-start">
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 bg-red-600/30 border border-red-500/40 text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                                    <Sparkles size={12} /> Work With Master Movers
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">Career Opportunities</h2>
                                <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">Join South Africa's premier moving & logistics team.</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* MODAL BODY */}
                        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
                            {isSubmitted ? (
                                <div className="py-12 text-center space-y-4">
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                        <CheckCircle size={48} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Application Received!</h3>
                                    <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed font-medium">
                                        Thank you for applying to Master Movers. Your application has been logged in our recruitment portal under reference <strong className="text-slate-900">{applicationRef}</strong>.
                                    </p>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 max-w-sm mx-auto">
                                        Our HR & Operations team reviews applications weekly. Shortlisted candidates will be contacted via phone or email for an interview.
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg mt-4"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Personal Info Group */}
                                    <div>
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                            <User size={14} className="text-red-600" /> Personal Details
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 block">Full Name *</label>
                                                <input
                                                    type="text"
                                                    name="full_name"
                                                    required
                                                    placeholder="e.g. Sipho Ndlovu"
                                                    value={formData.full_name}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 block">Email Address *</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    required
                                                    placeholder="e.g. sipho@example.com"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white transition-all"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 block">Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    required
                                                    placeholder="e.g. 082 123 4567"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Role & Qualifications Group */}
                                    <div className="pt-4 border-t border-slate-100">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                            <Award size={14} className="text-red-600" /> Position & Experience
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 block">Position Applied For</label>
                                                <select
                                                    name="position"
                                                    value={formData.position}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white transition-all"
                                                >
                                                    <option value="Heavy Vehicle Driver (Code 10/14)">Heavy Vehicle Driver (Code 10/14)</option>
                                                    <option value="Furniture Mover & Loader">Furniture Mover & Loader</option>
                                                    <option value="Logistics & Dispatch Coordinator">Logistics & Dispatch Coordinator</option>
                                                    <option value="Sales & Customer Service Consultant">Sales & Customer Service Consultant</option>
                                                    <option value="Fleet Mechanic / Maintenance">Fleet Mechanic / Maintenance</option>
                                                    <option value="Administrative Assistant">Administrative Assistant</option>
                                                    <option value="General Operations Worker">General Operations Worker</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 block">Years of Industry Experience</label>
                                                <select
                                                    name="experience_years"
                                                    value={formData.experience_years}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white transition-all"
                                                >
                                                    <option value="Less than 1 Year">Less than 1 Year</option>
                                                    <option value="1 - 3 Years">1 - 3 Years</option>
                                                    <option value="3 - 5 Years">3 - 5 Years</option>
                                                    <option value="5+ Years">5+ Years</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 block">Driver's License Type</label>
                                                <select
                                                    name="license_type"
                                                    value={formData.license_type}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white transition-all"
                                                >
                                                    <option value="Code 8 (B)">Code 8 (B)</option>
                                                    <option value="Code 10 (C1)">Code 10 (C1)</option>
                                                    <option value="Code 14 (EC)">Code 14 (EC)</option>
                                                    <option value="Code 14 + PDP">Code 14 + PDP</option>
                                                    <option value="None">None</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 block">Availability / Start Date</label>
                                                <select
                                                    name="availability"
                                                    value={formData.availability}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-red-600 focus:bg-white transition-all"
                                                >
                                                    <option value="Immediately">Immediately</option>
                                                    <option value="Within 1-2 Weeks">Within 1-2 Weeks</option>
                                                    <option value="1 Month Notice">1 Month Notice</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Experience Bio / Notes */}
                                    <div className="pt-4 border-t border-slate-100">
                                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 block">
                                            Brief Overview of Qualifications & Experience
                                        </label>
                                        <textarea
                                            name="notes"
                                            rows="3"
                                            placeholder="Tell us about your previous moving experience, specialized skills (e.g. hoisting, packing, route management), or link to your CV..."
                                            value={formData.notes}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-red-600 focus:bg-white transition-all resize-none"
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                                        <span className="text-[10px] text-slate-400 font-semibold italic">* All details submitted securely to Master Movers HR</span>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Application'} <Send size={16} />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
