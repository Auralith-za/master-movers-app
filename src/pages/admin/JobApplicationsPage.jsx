import React, { useEffect, useState } from 'react'
import { Briefcase, Search, Filter, Eye, CheckCircle, XCircle, Clock, Trash2, Phone, Mail, Award, Calendar, RefreshCw, UserCheck, Download, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import Button from '../../components/ui/Button'

export default function JobApplicationsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [applications, setApplications] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedApp, setSelectedApp] = useState(null)
    const [stats, setStats] = useState({
        total: 0,
        new: 0,
        shortlisted: 0,
        rejected: 0,
        hired: 0
    })

    useEffect(() => {
        fetchApplications()
    }, [])

    const fetchApplications = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('job_applications')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.warn('Error fetching job applications from Supabase:', error)
                setApplications([])
            } else if (data) {
                setApplications(data)
                computeStats(data)
            }
        } catch (err) {
            console.error('Exception fetching job applications:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const computeStats = (data) => {
        const total = data.length
        const newApps = data.filter(a => a.status === 'new' || !a.status).length
        const shortlisted = data.filter(a => a.status === 'shortlisted').length
        const rejected = data.filter(a => a.status === 'rejected').length
        const hired = data.filter(a => a.status === 'hired').length

        setStats({ total, new: newApps, shortlisted, rejected, hired })
    }

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const { error } = await supabase
                .from('job_applications')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) {
                console.error('Error updating application status:', error)
                alert('Could not update status: ' + error.message)
            } else {
                setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
                computeStats(applications.map(a => a.id === id ? { ...a, status: newStatus } : a))
                if (selectedApp && selectedApp.id === id) {
                    setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null)
                }
            }
        } catch (err) {
            console.error('Status update exception:', err)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this job application?')) return
        try {
            const { error } = await supabase
                .from('job_applications')
                .delete()
                .eq('id', id)

            if (error) {
                console.error('Error deleting application:', error)
                alert('Could not delete application')
            } else {
                const filtered = applications.filter(a => a.id !== id)
                setApplications(filtered)
                computeStats(filtered)
                if (selectedApp && selectedApp.id === id) setSelectedApp(null)
            }
        } catch (err) {
            console.error('Delete exception:', err)
        }
    }

    const filteredApplications = applications.filter(app => {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
            (app.full_name || '').toLowerCase().includes(query) ||
            (app.email || '').toLowerCase().includes(query) ||
            (app.phone || '').toLowerCase().includes(query) ||
            (app.position || '').toLowerCase().includes(query)

        if (statusFilter === 'all') return matchesSearch
        return matchesSearch && (app.status === statusFilter || (statusFilter === 'new' && !app.status))
    })

    const getStatusBadge = (status) => {
        switch (status) {
            case 'shortlisted':
                return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">Shortlisted</span>
            case 'hired':
                return <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">Hired</span>
            case 'rejected':
                return <span className="bg-red-100 text-red-800 border border-red-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">Rejected</span>
            case 'reviewed':
                return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">Reviewed</span>
            default:
                return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">New Application</span>
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto">
            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Job Applications</h1>
                            <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-widest mt-0.5">Recruitment &amp; Talent Portal</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchApplications}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* STATS METRICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Applications</span>
                        <Briefcase size={18} className="text-slate-400" />
                    </div>
                    <p className="text-3xl font-black text-slate-900">{stats.total}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">New / Unreviewed</span>
                        <Clock size={18} className="text-amber-500" />
                    </div>
                    <p className="text-3xl font-black text-amber-600">{stats.new}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Shortlisted Candidates</span>
                        <UserCheck size={18} className="text-emerald-500" />
                    </div>
                    <p className="text-3xl font-black text-emerald-600">{stats.shortlisted}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Declined / Rejected</span>
                        <XCircle size={18} className="text-red-500" />
                    </div>
                    <p className="text-3xl font-black text-red-600">{stats.rejected}</p>
                </div>
            </div>

            {/* FILTERS & SEARCH */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by candidate name, email, phone, or position..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {['all', 'new', 'reviewed', 'shortlisted', 'hired', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                    statusFilter === status
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* APPLICATIONS LIST / TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                        Loading Job Applications...
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Briefcase size={36} className="mx-auto mb-3 opacity-40" />
                        <p className="font-bold uppercase tracking-wider text-xs">No Job Applications Found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search or status filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">Applied Date</th>
                                    <th className="px-6 py-4">Candidate</th>
                                    <th className="px-6 py-4">Position Applied For</th>
                                    <th className="px-6 py-4">Experience &amp; License</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredApplications.map(app => (
                                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{app.full_name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                                                <span>{app.phone}</span>
                                                <span>•</span>
                                                <span className="text-slate-400">{app.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-800 text-xs bg-slate-100 px-3 py-1 rounded-lg inline-block">
                                                {app.position}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-600">
                                            <div>Exp: <strong>{app.experience_years || 'N/A'}</strong></div>
                                            <div className="text-slate-400 text-[11px]">License: {app.license_type || 'None'}</div>
                                            {(app.cv_url || app.cv_data) && (
                                                <a
                                                    href={app.cv_url || app.cv_data}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download={app.cv_name || 'Candidate_CV'}
                                                    className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors"
                                                >
                                                    <Download size={10} /> CV Attached
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(app.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedApp(app)}
                                                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                                                    title="View Application Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <select
                                                    value={app.status || 'new'}
                                                    onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                                    className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-xl px-2 py-1.5 focus:outline-none"
                                                >
                                                    <option value="new">New</option>
                                                    <option value="reviewed">Reviewed</option>
                                                    <option value="shortlisted">Shortlist</option>
                                                    <option value="hired">Hired</option>
                                                    <option value="rejected">Reject</option>
                                                </select>
                                                <button
                                                    onClick={() => handleDelete(app.id)}
                                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                                                    title="Delete Application"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* APPLICATION DETAIL MODAL */}
            {selectedApp && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-8 max-h-[90vh] overflow-y-auto space-y-6">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Application</span>
                                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{selectedApp.full_name}</h3>
                                <p className="text-xs text-slate-500 font-semibold mt-1">Submitted on {new Date(selectedApp.created_at).toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phone</span>
                                    <p className="font-bold text-slate-900 mt-0.5">
                                        <a href={`tel:${selectedApp.phone}`} className="text-red-600 hover:underline flex items-center gap-1.5">
                                            <Phone size={12} /> {selectedApp.phone}
                                        </a>
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email</span>
                                    <p className="font-bold text-slate-900 mt-0.5">
                                        <a href={`mailto:${selectedApp.email}`} className="text-red-600 hover:underline flex items-center gap-1.5 truncate">
                                            <Mail size={12} /> {selectedApp.email}
                                        </a>
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-semibold">Applied Position:</span>
                                    <strong className="text-slate-900">{selectedApp.position}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-semibold">Industry Experience:</span>
                                    <strong className="text-slate-900">{selectedApp.experience_years || 'N/A'}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-semibold">Driver's License:</span>
                                    <strong className="text-slate-900">{selectedApp.license_type || 'None'}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-semibold">Start Availability:</span>
                                    <strong className="text-emerald-600">{selectedApp.availability || 'Immediate'}</strong>
                                </div>
                            </div>

                            {(selectedApp.cv_url || selectedApp.cv_data) ? (
                                <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-600 text-white rounded-xl">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-xs">{selectedApp.cv_name || 'Candidate_Resume'}</p>
                                            <p className="text-[10px] text-slate-500">CV Document attached to application</p>
                                        </div>
                                    </div>
                                    <a
                                        href={selectedApp.cv_url || selectedApp.cv_data}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={selectedApp.cv_name || 'Candidate_CV'}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
                                    >
                                        <Download size={14} /> Download CV
                                    </a>
                                </div>
                            ) : (
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs text-center font-medium">
                                    No CV file was uploaded with this application.
                                </div>
                            )}

                            {selectedApp.notes && (
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Qualifications &amp; Experience Notes</span>
                                    <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-2xl text-slate-800 leading-relaxed font-medium">
                                        "{selectedApp.notes}"
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Change Status:</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'shortlisted')}
                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700"
                                    >
                                        Shortlist
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}
                                        className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-700"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
