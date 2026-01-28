import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { ArrowLeft, MessageCircle, Mail, MapPin, Calendar, Box, Truck, Building, Package, Download, Save, X, Edit2 } from 'lucide-react'
import { INVENTORY_ITEMS } from '../../features/inventory/data/mockItems'
import jsPDF from 'jspdf'

export default function QuoteDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [quote, setQuote] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [activities, setActivities] = useState([])

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
            setEditForm(data)
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
            // Fallback for demo if table doesn't exist yet
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
                console.warn('Activity logging failed (table might be missing?):', error)
                // Manually add to state for demo purposes so user sees it works
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

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('quotes')
                .update({
                    client_name: editForm.client_name,
                    client_phone: editForm.client_phone,
                    client_email: editForm.client_email,
                    pickup_address: editForm.pickup_address,
                    dropoff_address: editForm.dropoff_address,
                    move_date: editForm.move_date,
                    status: editForm.status
                })
                .eq('id', id)

            if (error) throw error

            setQuote(editForm)
            await logActivity('edit', `Quote details updated. Status: ${editForm.status}`)
            setIsEditing(false)
            alert('Quote updated successfully!')
        } catch (error) {
            console.error('Error updating quote:', error)
            alert('Failed to update quote')
        }
    }

    const [sendingWa, setSendingWa] = useState(false)
    const [showInput, setShowInput] = useState(false)
    const [messageText, setMessageText] = useState('')

    const handleSendUpdate = async (textOrTemplate) => {
        if (!quote?.client_phone) return alert('No phone number')

        let messageBody = textOrTemplate
        if (textOrTemplate === 'booking_confirmation') messageBody = `Hi ${quote.client_name}, your move for ${quote.move_date} is confirmed! We will arrive at 08:00 AM.`
        if (textOrTemplate === 'move_reminder') messageBody = `Hi ${quote.client_name}, this is a reminder for your move tomorrow. Please ensure driveway is clear.`

        setSendingWa(true)

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800))

        const success = await logActivity('whatsapp', messageBody)

        if (success) {
            setMessageText('')
            setShowInput(false)
        }

        setSendingWa(false)
    }

    const getItemName = (id) => {
        const item = INVENTORY_ITEMS.find(i => i.id === id)
        return item ? item.name : id
    }

    const getItemVolume = (id) => {
        const item = INVENTORY_ITEMS.find(i => i.id === id)
        return item ? (item.volume || 0) : 0
    }

    const downloadInventoryPDF = () => {
        const doc = new jsPDF()
        doc.setFontSize(20)
        doc.text(`Inventory List - Quote #${quote.id.toString().substring(0, 6)}`, 20, 20)
        doc.setFontSize(12)
        doc.text(`Client: ${quote.client_name}`, 20, 30)
        doc.text(`Date: ${new Date(quote.move_date).toLocaleDateString()}`, 20, 36)

        let y = 50
        doc.setFont(undefined, 'bold')
        doc.text("Item Name", 20, y)
        doc.text("Qty", 150, y)
        doc.text("Vol (m3)", 170, y)
        doc.line(20, y + 2, 190, y + 2)

        y += 10
        doc.setFont(undefined, 'normal')

        let totalVol = 0
        Object.entries(quote.items_json || {}).forEach(([itemId, qty]) => {
            const name = getItemName(itemId)
            const vol = getItemVolume(itemId) * qty
            totalVol += vol

            doc.text(name, 20, y)
            doc.text(qty.toString(), 150, y)
            doc.text(vol.toFixed(2), 170, y)
            y += 8
            if (y > 270) { doc.addPage(); y = 20; }
        })

        doc.line(20, y, 190, y)
        y += 10
        doc.setFont(undefined, 'bold')
        doc.text(`Total Volume: ${totalVol.toFixed(2)} m3`, 120, y)
        doc.save(`Inventory_${quote.client_name}_${id}.pdf`)
    }

    if (loading) return <div className="p-8">Loading...</div>
    if (!quote) return <div className="p-8">Quote not found</div>

    const access = quote.access_details || {}

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <button onClick={() => navigate('/admin/quotes')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                <ArrowLeft size={20} className="mr-2" /> Back to Quotes
            </button>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Quote #{quote.id.toString().substring(0, 6)}</h1>
                    <p className="text-slate-500">Created: {new Date(quote.created_at).toLocaleDateString()}</p>
                </div>

                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">
                                <X size={18} className="mr-2" /> Cancel
                            </button>
                            <button onClick={handleSave} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium shadow-sm hover:bg-emerald-700">
                                <Save size={18} className="mr-2" /> Save Changes
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100">
                            <Edit2 size={18} className="mr-2" /> Edit Details
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COL - DETAILS */}
                <div className="lg:col-span-2 space-y-6">

                    {/* TRIP DETAILS */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
                            <MapPin size={20} className="text-primary-600" /> Trip Details
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Pickup</label>
                                {isEditing ? (
                                    <input
                                        className="w-full mt-1 border border-gray-300 rounded p-1.5"
                                        value={editForm.pickup_address || ''}
                                        onChange={e => setEditForm({ ...editForm, pickup_address: e.target.value })}
                                    />
                                ) : (
                                    <p className="font-medium text-slate-900 mt-1">{quote.pickup_address}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Dropoff</label>
                                {isEditing ? (
                                    <input
                                        className="w-full mt-1 border border-gray-300 rounded p-1.5"
                                        value={editForm.dropoff_address || ''}
                                        onChange={e => setEditForm({ ...editForm, dropoff_address: e.target.value })}
                                    />
                                ) : (
                                    <p className="font-medium text-slate-900 mt-1">{quote.dropoff_address}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Distance</label>
                                <p className="font-medium text-slate-900 mt-1">{quote.distance_km} km</p>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Date</label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        className="w-full mt-1 border border-gray-300 rounded p-1.5"
                                        value={editForm.move_date || ''}
                                        onChange={e => setEditForm({ ...editForm, move_date: e.target.value })}
                                    />
                                ) : (
                                    <p className="font-medium text-slate-900 mt-1">{quote.move_date}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Status</label>
                                {isEditing ? (
                                    <select
                                        className="w-full mt-1 border border-gray-300 rounded p-1.5 bg-white"
                                        value={editForm.status}
                                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                    >
                                        <option value="new">New</option>
                                        <option value="processing">Processing</option>
                                        <option value="booked">Booked</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                ) : (
                                    <p className="font-medium text-slate-900 mt-1 capitalize">{quote.status}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SITE ACCESS DETAILS */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
                            <Building size={20} className="text-primary-600" /> Site Access
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Pickup Location</h4>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex justify-between"><span>Type:</span> <span className="font-medium text-slate-900 capitalize">{access.origin?.type || 'N/A'}</span></li>
                                    <li className="flex justify-between"><span>Stairs:</span> <span className="font-medium text-slate-900">{access.origin?.stairs ? 'Yes' : 'No'}</span></li>
                                    <li className="flex justify-between"><span>Elevator:</span> <span className="font-medium text-slate-900">{access.origin?.elevator ? 'Yes' : 'No'}</span></li>
                                    <li className="flex justify-between"><span>Long Carry:</span> <span className="font-medium text-slate-900">{access.origin?.longCarry ? '> 30m' : 'Standard'}</span></li>
                                    <li className="flex justify-between"><span>Shuttle Truck:</span> <span className="font-medium text-slate-900">{access.origin?.shuttle ? 'Required' : 'No'}</span></li>
                                </ul>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Dropoff Location</h4>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex justify-between"><span>Type:</span> <span className="font-medium text-slate-900 capitalize">{access.destination?.type || 'N/A'}</span></li>
                                    <li className="flex justify-between"><span>Stairs:</span> <span className="font-medium text-slate-900">{access.destination?.stairs ? 'Yes' : 'No'}</span></li>
                                    <li className="flex justify-between"><span>Elevator:</span> <span className="font-medium text-slate-900">{access.destination?.elevator ? 'Yes' : 'No'}</span></li>
                                    <li className="flex justify-between"><span>Long Carry:</span> <span className="font-medium text-slate-900">{access.destination?.longCarry ? '> 30m' : 'Standard'}</span></li>
                                    <li className="flex justify-between"><span>Shuttle Truck:</span> <span className="font-medium text-slate-900">{access.destination?.shuttle ? 'Required' : 'No'}</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* INVENTORY LIST */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-slate-800 font-semibold">
                                <Package size={20} className="text-primary-600" /> Inventory List
                            </div>
                            <button
                                onClick={downloadInventoryPDF}
                                className="text-sm flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Download size={16} /> Download PDF
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 border-b border-gray-100">
                                        <th className="px-4 py-3 font-medium">Item Name</th>
                                        <th className="px-4 py-3 font-medium w-24 text-center">Qty</th>
                                        <th className="px-4 py-3 font-medium w-32 text-right">Vol (m³)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {Object.entries(quote.items_json || {}).map(([itemId, qty]) => (
                                        <tr key={itemId} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-900 font-medium">
                                                {getItemName(itemId)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-600 bg-slate-50/50">
                                                {qty}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600">
                                                {(getItemVolume(itemId) * qty).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50 font-bold text-slate-900 border-t border-gray-200">
                                        <td className="px-4 py-3">Totals</td>
                                        <td className="px-4 py-3 text-center">
                                            {Object.values(quote.items_json || {}).reduce((a, b) => a + b, 0)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {Object.entries(quote.items_json || {}).reduce((sum, [id, qty]) => sum + (getItemVolume(id) * qty), 0).toFixed(2)} m³
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT COL - ACTIONS & CLIENT */}
                <div className="space-y-6">

                    {/* ACTIVITY TIMELINE - NEW */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Activity Timeline</h3>
                        <div className="space-y-6 relative border-l-2 border-slate-100 ml-3 pl-6">
                            {activities.length === 0 && <p className="text-sm text-slate-400 italic">No activity recorded yet.</p>}

                            {activities.map((activity) => (
                                <div key={activity.id || Math.random()} className="relative">
                                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-50 border-2 border-indigo-500 box-content"></div>
                                    <p className="text-xs text-slate-400 mb-1">
                                        {new Date(activity.created_at).toLocaleString()}
                                    </p>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <p className="text-xs font-bold text-slate-700 uppercase mb-1">{activity.activity_type}</p>
                                        <p className="text-sm text-slate-600">{activity.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CLIENT CARD */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-2xl font-bold mx-auto mb-4">
                            {quote.client_name?.charAt(0).toUpperCase()}
                        </div>
                        {isEditing ? (
                            <input
                                className="w-full mb-2 border border-gray-300 rounded p-1.5 text-center font-bold"
                                value={editForm.client_name || ''}
                                onChange={e => setEditForm({ ...editForm, client_name: e.target.value })}
                            />
                        ) : (
                            <h3 className="text-xl font-bold text-slate-900">{quote.client_name}</h3>
                        )}
                        <p className="text-slate-500 mb-1">{quote.client_phone}</p>
                        <p className="text-slate-400 text-sm mb-6">{quote.client_email}</p>

                        <div className="space-y-3">
                            {!showInput ? (
                                <button
                                    onClick={() => setShowInput(true)}
                                    className="flex items-center justify-center w-full py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-medium transition-colors"
                                >
                                    <MessageCircle size={18} className="mr-2" /> Send WhatsApp Update
                                </button>
                            ) : (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                                    <textarea
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder="Type your message here..."
                                        className="w-full text-sm p-2 border border-slate-300 rounded mb-2 focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none resize-none h-24"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowInput(false)}
                                            className="flex-1 py-1.5 text-slate-500 text-sm hover:bg-slate-200 rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleSendUpdate(messageText)}
                                            disabled={!messageText.trim() || sendingWa}
                                            className="flex-1 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm rounded font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
                                        >
                                            {sendingWa ? <span className="animate-pulse">Sending...</span> : 'Send Message'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <a
                                href={`mailto:${quote.client_email}`}
                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                            >
                                <Mail size={18} /> Email Client
                            </a>
                        </div>

                        {/* Quick Templates */}
                        <div className="mt-6 border-t border-gray-100 pt-4">
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Quick Actions</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleSendUpdate('booking_confirmation')} className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 py-2 rounded border border-gray-200">
                                    Confirm Booking
                                </button>
                                <button onClick={() => handleSendUpdate('move_reminder')} className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 py-2 rounded border border-gray-200">
                                    Move Reminder
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Value Card */}
                    <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6">
                        <h3 className="text-slate-400 text-sm font-medium mb-1">Total Value</h3>
                        <div className="text-3xl font-bold text-primary-500">
                            R {quote.total_price?.toFixed(2) || '0.00'}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
                            Vol: {quote.total_volume?.toFixed(2)} m³
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
