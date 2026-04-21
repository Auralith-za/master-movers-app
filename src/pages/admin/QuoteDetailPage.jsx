import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { 
    ArrowLeft, MessageCircle, Mail, MapPin, Calendar, Box, Truck, 
    Building, Package, Download, Save, X, Edit2, AlertCircle, 
    Plus, Trash2, Send, History, User, Lock, ExternalLink, ShieldCheck, Copy
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { INVENTORY_ITEMS } from '../../features/inventory/data/mockItems'
import { calculateQuote } from '../../features/inventory/store/moveStore'
import { generateProfessionalQuote } from '../../services/pdfService'
import clsx from 'clsx'

export default function QuoteDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [quote, setQuote] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [activities, setActivities] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [newNote, setNewNote] = useState('')

    useEffect(() => {
        if (id) {
            fetchQuote()
            fetchActivities()
        }
    }, [id])

    const fetchQuote = async () => {
        try {
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setQuote(data)
            
            // Fix items_json if it's nested or legacy
            const rawItems = data.items_json?.items || data.items_json || {}
            setEditForm({
                ...data,
                items_json: rawItems
            })
        } catch (error) {
            console.error('Error fetching quote:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchActivities = async () => {
        try {
            const { data, error } = await supabase
                .from('quote_activities')
                .select('*')
                .eq('quote_id', id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setActivities(data || [])
        } catch (error) {
            console.error('Error fetching activities:', error)
            setActivities([])
        }
    }

    const logActivity = async (type, content) => {
        try {
            const { error } = await supabase
                .from('quote_activities')
                .insert([{
                    quote_id: id,
                    activity_type: type,
                    content: content
                }])

            if (error) {
                setActivities(prev => [{
                    id: Math.random(),
                    created_at: new Date().toISOString(),
                    activity_type: type,
                    content: content
                }, ...prev])
                return true
            }

            await fetchActivities()
            return true
        } catch (error) {
            console.error('Error logging activity:', error)
            return false
        }
    }

    const handleSaveNote = async () => {
        if (!newNote.trim()) return
        const success = await logActivity('note', newNote)
        if (success) setNewNote('')
    }

    // Re-calculate live price during editing
    const recalculatedData = useMemo(() => {
        if (!isEditing) return null
        
        // Prepare data for calculateQuote
        const inventory = {}
        Object.entries(editForm.items_json || {}).forEach(([itemId, qty]) => {
            const [id, variation] = itemId.split('_')
            const item = INVENTORY_ITEMS.find(i => i.id === id)
            if (item) {
                inventory[itemId] = {
                    ...item,
                    quantity: Number(qty),
                    id: itemId // keep the full key
                }
            }
        })

        const moveDetails = {
            pickupCity: editForm.pickup_address,
            dropoffCity: editForm.dropoff_address,
            distanceKm: editForm.distance_km,
            moveDate: editForm.move_date,
            packagingOption: editForm.packaging_option || 'none'
        }

        const accessDetails = editForm.access_details || {}
        
        return calculateQuote(inventory, moveDetails, accessDetails, INVENTORY_ITEMS)
    }, [editForm.items_json, editForm.pickup_address, editForm.dropoff_address, editForm.move_date, editForm.packaging_option, isEditing])

    const handleUpdateQuantity = (itemId, newQty) => {
        const updatedItems = { ...editForm.items_json }
        if (newQty <= 0) {
            delete updatedItems[itemId]
        } else {
            updatedItems[itemId] = newQty
        }
        setEditForm({ ...editForm, items_json: updatedItems })
    }

    const handleAddItem = (item) => {
        const updatedItems = { ...editForm.items_json }
        updatedItems[item.id] = (updatedItems[item.id] || 0) + 1
        setEditForm({ ...editForm, items_json: updatedItems })
        setSearchQuery('')
    }

    const handleSave = async () => {
        try {
            const finalPrice = recalculatedData?.total || editForm.total_price
            const finalVolume = recalculatedData?.totalVolume || editForm.total_volume

            const { error } = await supabase
                .from('quotes')
                .update({
                    client_name: editForm.client_name,
                    client_phone: editForm.client_phone,
                    client_email: editForm.client_email,
                    pickup_address: editForm.pickup_address,
                    dropoff_address: editForm.dropoff_address,
                    move_date: editForm.move_date,
                    status: editForm.status,
                    rejection_reason: editForm.rejection_reason,
                    team_notes: editForm.team_notes,
                    items_json: editForm.items_json,
                    total_price: finalPrice,
                    total_volume: finalVolume,
                    customer_comments: editForm.customer_comments
                })
                .eq('id', id)

            if (error) throw error

            setQuote({ ...editForm, total_price: finalPrice, total_volume: finalVolume })
            await logActivity('edit', `Quote adjusted manually in backend. New Total: R ${finalPrice.toFixed(2)}`)
            setIsEditing(false)
            alert('Quote updated successfully!')
        } catch (error) {
            console.error('Error updating quote:', error)
            alert('Failed to update quote')
        }
    }

    const handleResendQuote = async () => {
        if (!confirm('Regenerate and resend quote to client?')) return
        
        const inventoryForPdf = quote.items_json?.items || quote.items_json || {}
        const reviewLink = `${window.location.origin}/quote/review/${id}`
        
        generateProfessionalQuote({
            quoteId: quote.id,
            clientName: quote.client_name,
            clientEmail: quote.client_email,
            clientPhone: quote.client_phone,
            pickupAddress: quote.pickup_address,
            dropoffAddress: quote.dropoff_address,
            moveDate: quote.move_date,
            inventory: inventoryForPdf,
            total: quote.total_price,
            vat: (quote.total_price || 0) * 0.15 / 1.15,
            subTotal: (quote.total_price || 0) / 1.15,
            inventoryItems: INVENTORY_ITEMS
        })

        await logActivity('system', `Quote PDF resubmitted to client. Payment Link: ${reviewLink}`)
        alert('Quote resent successfully!')
    }

    const copyPaymentLink = () => {
        const link = `${window.location.origin}/quote/review/${id}`
        navigator.clipboard.writeText(link)
        alert('Payment link copied to clipboard!')
    }

    const filteredItems = useMemo(() => {
        if (!searchQuery) return []
        return INVENTORY_ITEMS.filter(i => 
            i.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
    }, [searchQuery])

    const downloadInventoryPDF = () => {
        const inventoryForPdf = quote.items_json?.items || quote.items_json || {}

        generateProfessionalQuote({
            quoteId: quote.id,
            clientName: quote.client_name,
            clientEmail: quote.client_email,
            clientPhone: quote.client_phone,
            pickupAddress: quote.pickup_address,
            dropoffAddress: quote.dropoff_address,
            moveDate: quote.move_date,
            inventory: inventoryForPdf,
            total: quote.total_price,
            vat: (quote.total_price || 0) * 0.15 / 1.15,
            subTotal: (quote.total_price || 0) / 1.15,
            inventoryItems: INVENTORY_ITEMS
        })
    }

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
    if (!quote) return <div className="p-8 text-center"><p className="text-red-500">Quote not found</p></div>

    const displayInventory = isEditing ? editForm.items_json : (quote.items_json?.items || quote.items_json || {})
    const isManualEditable = quote.status === 'lead' || quote.status === 'new' || quote.status === 'processing'

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/admin/quotes')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft size={20} className="mr-2" /> Back to Quotes
                </button>
                <div className="flex gap-2">
                    <button onClick={handleResendQuote} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800">
                        <Send size={18} className="mr-2" /> Resend Quote
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-slate-900">Quote #{quote.id.toString().substring(0, 6)}</h1>
                        <span className={clsx(
                            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                            quote.status === 'booked' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                        )}>
                            {quote.status}
                        </span>
                        {quote.terms_accepted && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                <ShieldCheck size={12} /> Terms Accepted
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 mt-1">Submission via: <span className="font-semibold text-slate-700 uppercase">{quote.items_json?.submission_type || 'QuoteWizard'}</span></p>
                </div>

                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">
                                <X size={18} className="mr-2" /> Discard
                            </button>
                            <button onClick={handleSave} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium shadow-sm hover:bg-emerald-700">
                                <Save size={18} className="mr-2" /> Save Quote
                            </button>
                        </>
                    ) : (
                        isManualEditable ? (
                            <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100">
                                <Edit2 size={18} className="mr-2" /> Edit Quote
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-lg font-medium cursor-not-allowed">
                                <Lock size={18} /> Quote Locked
                            </div>
                        )
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COL - DETAILS & INVENTORY */}
                <div className="lg:col-span-2 space-y-6">

                    {/* DUAL COMMENTS SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <MessageCircle size={18} className="text-red-500" /> Customer Comments (Front)
                            </h3>
                            {isEditing ? (
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    value={editForm.customer_comments || ''}
                                    onChange={e => setEditForm({...editForm, customer_comments: e.target.value})}
                                    placeholder="Comments visible to client..."
                                />
                            ) : (
                                <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100 italic">
                                    {quote.customer_comments || "No comments from client."}
                                </p>
                            )}
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Lock size={18} className="text-indigo-500" /> Internal Team Notes (Back)
                            </h3>
                            {isEditing ? (
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    value={editForm.team_notes || ''}
                                    onChange={e => setEditForm({...editForm, team_notes: e.target.value})}
                                    placeholder="Internal notes ONLY..."
                                />
                            ) : (
                                <p className="text-sm text-slate-600 bg-indigo-50/30 p-4 rounded-lg border border-indigo-100">
                                    {quote.team_notes || "No internal notes yet."}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* INVENTORY EDITOR */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Package size={20} className="text-primary-600" /> Inventory Breakdown
                            </h3>
                            {isEditing && (
                                <div className="relative">
                                    <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary-500">
                                        <Plus size={16} className="text-slate-400" />
                                        <input 
                                            placeholder="Add item..." 
                                            className="bg-transparent border-none outline-none text-sm w-40"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    {filteredItems.length > 0 && (
                                        <div className="absolute right-0 top-full mt-1 w-64 bg-white shadow-xl border border-gray-100 rounded-lg z-50 p-1 overflow-hidden">
                                            {filteredItems.map(item => (
                                                <button 
                                                    key={item.id}
                                                    onClick={() => handleAddItem(item)}
                                                    className="w-full text-left p-2 hover:bg-slate-50 text-sm rounded transition-colors"
                                                >
                                                    {item.name} ({item.volume}ft³)
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500">
                                        <th className="px-6 py-3 font-medium">Item Name</th>
                                        <th className="px-6 py-3 font-medium w-32 text-center">Quantity</th>
                                        <th className="px-6 py-3 font-medium w-24 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {Object.entries(displayInventory).map(([itemId, qty]) => {
                                        const [id] = itemId.split('_')
                                        const item = INVENTORY_ITEMS.find(i => i.id === id)
                                        return (
                                            <tr key={itemId} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-lg">{item?.image || '📦'}</div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{item?.name || itemId}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{item?.category || 'General'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button onClick={() => handleUpdateQuantity(itemId, qty - 1)} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                                                                <Trash2 size={14} className={qty === 1 ? "text-red-500" : ""} />
                                                            </button>
                                                            <span className="font-bold min-w-[20px] text-center">{qty}</span>
                                                            <button onClick={() => handleUpdateQuantity(itemId, qty + 1)} className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors">
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center font-bold text-slate-900">{qty}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {isEditing && (
                                                        <button onClick={() => handleUpdateQuantity(itemId, 0)} className="text-red-400 hover:text-red-600 p-1">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ADDRESSES & TRIP */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <MapPin size={20} className="text-primary-600" /> Logistics Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pickup Address</label>
                                    {isEditing ? (
                                        <input 
                                            className="w-full text-sm border-b border-gray-300 focus:border-indigo-500 outline-none pb-1"
                                            value={editForm.pickup_address || ''}
                                            onChange={e => setEditForm({...editForm, pickup_address: e.target.value})}
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-900 leading-snug">{quote.pickup_address}</p>
                                    )}
                                </div>
                                <div className="pt-4 border-t border-gray-50 flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" />
                                    {isEditing ? (
                                        <input 
                                            type="date"
                                            className="text-sm font-medium border-none outline-none bg-indigo-50 rounded px-2"
                                            value={editForm.move_date || ''}
                                            onChange={e => setEditForm({...editForm, move_date: e.target.value})}
                                        />
                                    ) : (
                                        <p className="text-sm font-bold text-slate-800">{new Date(quote.move_date).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Dropoff Address</label>
                                    {isEditing ? (
                                        <input 
                                            className="w-full text-sm border-b border-gray-300 focus:border-indigo-500 outline-none pb-1"
                                            value={editForm.dropoff_address || ''}
                                            onChange={e => setEditForm({...editForm, dropoff_address: e.target.value})}
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-900 leading-snug">{quote.dropoff_address}</p>
                                    )}
                                </div>
                                <div className="pt-4 border-t border-gray-50 flex items-center gap-2">
                                    <Truck size={14} className="text-slate-400" />
                                    <p className="text-sm font-bold text-slate-800">{quote.distance_km} km total trip</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COL - PRICING & TIMELINE */}
                <div className="space-y-6">

                    {/* PRICING CARD */}
                    <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary-600/20 transition-all duration-700" />
                        
                        <div className="relative z-10">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Quote Value</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white">R {(isEditing ? recalculatedData?.total : quote.total_price)?.toLocaleString()}</span>
                                {isEditing && recalculatedData?.total !== quote.total_price && (
                                    <span className="text-emerald-400 text-xs font-bold animate-pulse">Recalculating...</span>
                                )}
                            </div>
                            
                            <div className="mt-8 space-y-3 pt-6 border-t border-white/10">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Inventory Volume</span>
                                    <span className="text-white font-bold tracking-wide">{(isEditing ? recalculatedData?.totalVolume : quote.total_volume)?.toFixed(2)} m³</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Vat Included (15%)</span>
                                    <span className="text-white font-bold tracking-wide">R {((isEditing ? recalculatedData?.vat : (quote.total_price * 0.15 / 1.15)) || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PAYMENT LINK CARD */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -mr-8 -mt-8" />
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <CreditCard size={18} className="text-red-500" /> Payment & Review
                        </h3>
                        <p className="text-xs text-slate-500 mb-6">Share this link with the client so they can review the quote, accept terms/sign, and pay online.</p>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={copyPaymentLink}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all"
                            >
                                <Copy size={14} /> Copy Link
                            </button>
                            <a 
                                href={`${window.location.origin}/quote/review/${id}`} 
                                target="_blank"
                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                                title="Preview Link"
                            >
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>

                    {/* CLIENT CARD */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl font-black">
                                {quote.client_name?.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 tracking-tight">{quote.client_name}</h4>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">{quote.client_email}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <a href={`tel:${quote.client_phone}`} className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all">
                                <MessageCircle size={16} /> WhatsApp Client
                            </a>
                        </div>
                    </div>

                    {/* ACTIVITY TIMELINE SECTION */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <History size={18} className="text-indigo-600" /> Timeline & Logs
                        </h3>

                        {/* Quick Manual Note */}
                        <div className="mb-8">
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 text-sm bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Add manual note..."
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSaveNote()}
                                />
                                <button 
                                    onClick={handleSaveNote}
                                    disabled={!newNote.trim()}
                                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    <Save size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 relative border-l border-slate-100 ml-2 pl-6">
                            {activities.length === 0 && <p className="text-xs text-slate-400 italic">No historical logs.</p>}
                            {activities.map((act) => (
                                <div key={act.id} className="relative">
                                    <div className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-indigo-200 border border-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.3)]" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(act.created_at).toLocaleString()}</p>
                                    <div className="mt-1 bg-slate-50 border border-slate-100 p-3 rounded-lg">
                                        <p className="text-xs font-bold text-indigo-700 uppercase mb-1 tracking-tighter opacity-70">{act.activity_type}</p>
                                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{act.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
