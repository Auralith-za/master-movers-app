import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Phone, Mail, CheckCircle, Clock } from 'lucide-react'

export default function LeadsPage() {
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLeads()
    }, [])

    const fetchLeads = async () => {
        try {
            // Fetch quotes where request_call_back is TRUE
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('request_call_back', true)
                .order('created_at', { ascending: false })

            if (error) throw error
            setLeads(data || [])
        } catch (error) {
            console.error('Error fetching leads:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkContacted = async (leadId) => {
        if (!confirm('Mark this lead as contacted?')) return

        try {
            // Update the lead to remove the flag or change status
            const { error } = await supabase
                .from('quotes')
                .update({
                    request_call_back: false,
                    status: 'processing'
                })
                .eq('id', leadId)

            if (error) throw error

            // Remove from list locally
            setLeads(leads.filter(l => l.id !== leadId))
            alert('Lead updated!')
        } catch (error) {
            console.error('Error updating lead:', error)
            alert('Failed to update lead')
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Call Back Requests</h2>
                    <p className="text-slate-500">Clients requesting urgent contact.</p>
                </div>
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium border border-orange-100 flex items-center gap-2">
                    <Clock size={16} />
                    Pending: {leads.length}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <p className="text-slate-400 col-span-3 text-center py-10">Loading leads...</p>
                ) : leads.length === 0 ? (
                    <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                        <div className="mx-auto w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle size={24} />
                        </div>
                        <h3 className="text-slate-900 font-medium">All Caught Up!</h3>
                        <p className="text-slate-500 text-sm">No pending call back requests.</p>
                    </div>
                ) : (
                    leads.map((lead) => (
                        <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>

                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-slate-900">{lead.client_name || 'Unknown Client'}</h3>
                                    <p className="text-xs text-slate-400">{new Date(lead.created_at).toLocaleString()}</p>
                                </div>
                                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded font-medium">
                                    New Lead
                                </span>
                            </div>

                            <div className="space-y-2 mb-5">
                                <div className="text-sm text-slate-600 flex items-center gap-2">
                                    <Phone size={14} className="text-slate-400" />
                                    {lead.client_phone}
                                </div>
                                <div className="text-sm text-slate-600 flex items-center gap-2">
                                    <Mail size={14} className="text-slate-400" />
                                    {lead.client_email}
                                </div>
                                <div className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded">
                                    Moving from <strong>{lead.pickup_address?.split(',')[0]}</strong> <br />
                                    to <strong>{lead.dropoff_address?.split(',')[0]}</strong>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <a
                                    href={`tel:${lead.client_phone}`}
                                    className="flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                                >
                                    <Phone size={16} /> Call
                                </a>
                                <button
                                    onClick={() => handleMarkContacted(lead.id)}
                                    className="flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                                >
                                    <CheckCircle size={16} /> Done
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
