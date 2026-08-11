import React, { useState } from 'react'
import { Briefcase, X, CheckCircle, Send, Sparkles, User, Upload, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { emailService } from '../../services/emailService'

export default function FloatingCareersButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [applicationRef, setApplicationRef] = useState('')
    const [cvFile, setCvFile] = useState(null)
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        notes: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        // 5MB limit check
        if (file.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB limit. Please select a smaller CV file.')
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            setCvFile({
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                type: file.type,
                base64: reader.result,
                rawFile: file
            })
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.full_name || !formData.email || !formData.phone) {
            alert('Please fill in your name, email, and phone number.')
            return
        }

        setIsSubmitting(true)
        const ref = 'APP-' + Math.floor(100000 + Math.random() * 900000)

        let cvUrl = null
        // 1. Upload CV to Supabase storage bucket 'resumes' if file present
        if (cvFile?.rawFile) {
            try {
                const fileExt = cvFile.name.split('.').pop()
                const filePath = `resumes/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
                const { data: storageData, error: storageErr } = await supabase.storage
                    .from('resumes')
                    .upload(filePath, cvFile.rawFile, { cacheControl: '3600', upsert: true })

                if (!storageErr && storageData) {
                    const { data: publicUrlData } = supabase.storage
                        .from('resumes')
                        .getPublicUrl(filePath)
                    cvUrl = publicUrlData?.publicUrl || null
                }
            } catch (storageException) {
                console.warn('Storage bucket upload notice:', storageException)
            }
        }

        // 2. Primary insert to job_applications table (isolated try/catch)
        try {
            await supabase
                .from('job_applications')
                .insert([
                    {
                        full_name: formData.full_name,
                        email: formData.email,
                        phone: formData.phone,
                        position: 'General Applicant',
                        notes: formData.notes,
                        cv_name: cvFile?.name || null,
                        cv_url: cvUrl,
                        // Only save base64 string if reasonably sized (< 300KB) to prevent PostgREST 413 payload rejection
                        cv_data: (cvFile?.base64 && cvFile.base64.length < 400000) ? cvFile.base64 : null,
                        status: 'new'
                    }
                ])
        } catch (jobTableErr) {
            console.warn('job_applications table insert exception (non-fatal):', jobTableErr)
        }

        // 3. Backup insert to contact_submissions table (isolated try/catch, guaranteed table)
        const appMessage = `[JOB APPLICATION]
Applicant: ${formData.full_name}
Phone: ${formData.phone}
Email: ${formData.email}
CV Attached: ${cvFile?.name || 'No CV file attached'}
${cvUrl ? `CV Download Link: ${cvUrl}` : ''}

Candidate Overview & Notes:
${formData.notes || 'No extra notes provided.'}`

        try {
            await supabase
                .from('contact_submissions')
                .insert([
                    {
                        name: `[JOB APPLICATION] ${formData.full_name}`,
                        email: formData.email,
                        phone: formData.phone,
                        message: appMessage,
                        status: 'new'
                    }
                ])
        } catch (contactTableErr) {
            console.warn('contact_submissions insert notice:', contactTableErr)
        }

        // 4. Send instant admin email alert using contact_message route (isolated try/catch)
        try {
            await emailService.sendContactEmail({
                name: `[JOB APPLICATION] ${formData.full_name}`,
                email: formData.email,
                phone: formData.phone,
                message: appMessage
            })
        } catch (emailErr) {
            console.warn('Job application email alert notice:', emailErr)
        }

        setIsSubmitting(false)
        setApplicationRef(ref)
        setIsSubmitted(true)
    }

    const handleClose = () => {
        setIsOpen(false)
        setTimeout(() => {
            setIsSubmitted(false)
            setCvFile(null)
            setFormData({
                full_name: '',
                email: '',
                phone: '',
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
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        
                        {/* MODAL HEADER */}
                        <div className="bg-slate-900 p-6 sm:p-8 text-white relative flex justify-between items-start">
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 bg-red-600/30 border border-red-500/40 text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                                    <Sparkles size={12} /> Work With Master Movers
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">Career Application</h2>
                                <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">Submit your details &amp; CV to join our team.</p>
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
                                        Thank you for applying to Master Movers. Your application reference is <strong className="text-slate-900">{applicationRef}</strong>.
                                    </p>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 max-w-sm mx-auto">
                                        Our recruitment team reviews applications regularly. Shortlisted candidates will be contacted directly.
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
                                                    placeholder="e.g. John Smith"
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
                                                    placeholder="e.g. john@example.com"
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

                                    {/* CV UPLOAD FIELD */}
                                    <div className="pt-4 border-t border-slate-100">
                                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                            <span>Upload CV / Resume (PDF or Word)</span>
                                            <span className="text-slate-400 font-normal">Max 5MB</span>
                                        </label>
                                        {cvFile ? (
                                            <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                                                <div className="flex items-center gap-2 text-emerald-900 font-bold truncate">
                                                    <FileText size={18} className="text-emerald-600 shrink-0" />
                                                    <span className="truncate">{cvFile.name}</span>
                                                    <span className="text-[10px] text-emerald-600 font-normal">({cvFile.size})</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setCvFile(null)}
                                                    className="p-1 text-emerald-700 hover:text-red-600 transition-colors"
                                                    title="Remove file"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 cursor-pointer transition-all">
                                                <Upload size={20} className="text-slate-400 mb-1" />
                                                <span className="text-xs font-bold text-slate-700">Click to upload your CV / Resume</span>
                                                <span className="text-[10px] text-slate-400">Supports PDF, DOC, DOCX</span>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>

                                    {/* Experience Bio / Notes */}
                                    <div className="pt-4 border-t border-slate-100">
                                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 block">
                                            Brief Overview of Experience / Cover Note
                                        </label>
                                        <textarea
                                            name="notes"
                                            rows="3"
                                            placeholder="Tell us about your previous experience, qualifications, or position interested in..."
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
