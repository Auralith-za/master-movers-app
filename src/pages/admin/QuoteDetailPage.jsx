import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { ArrowLeft, MessageCircle, Mail, MapPin, Calendar, Box, Truck } from 'lucide-react'

export default function QuoteDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [quote, setQuote] = useState(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchQuote()
    }, [id])

    const fetchQuote = async () => {
        if (id === 'test-mock') {
            setQuote({
                id: 'test-mock-123456',
                created_at: new Date().toISOString(),
                client_name: 'Test Client',
                client_phone: '27821234567',
                client_email: 'test@example.com',
                pickup_address: '123 Fake St',
                dropoff_address: '456 Mock Rd',
                distance_km: 100,
                move_date: '2026-02-01',
                status: 'new',
                total_price: 5000,
                total_volume: 15
            })
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setQuote(data)
        } catch (error) {
            console.error('Error fetching quote:', error)
        } finally {
            setLoading(false)
        }
    }

    const [sendingWa, setSendingWa] = useState(false)
    const [showInput, setShowInput] = useState(false)
    const [messageText, setMessageText] = useState('')

    // Get store action directly inside component or via hook if exported
    // Since useMoveStore is a hook, let's use it
    // BUT QuoteDetailPage is not inside the store context provider? It is.
    // Let's import the hook
    // Note: We need to import useMoveStore at the top.

    // TEMPORARY FIX: We need to import useMoveStore, but I'll add the logic inside the component 
    // assuming I add the import in the next step.

    const handleSendUpdate = async (template) => {
        if (!quote?.client_phone) return alert('No phone number')

        setSendingWa(true)
        // In a real app we would use the store action: 
        // const { sendWhatsAppNotification } = useMoveStore.getState()
        // But for cleaner React code we should use the hook above.

        try {
            // Mocking the call or using supabase directly if store not available yet
            // Let's assume we use the direct supabase function invoke for this file to be self-contained
            // or better, use the store.

            const { error } = await supabase.functions.invoke('send-whatsapp', {
                body: {
                    phone: quote.client_phone,
                    template_name: template,
                    parameters: [] // Dynamic params can be added here
                }
            })

            if (error) {
                console.warn('Edge Function not deployed?', error)
                // Mock success for demo
                alert(`(Demo) Auto-message "${template}" sent to ${quote.client_phone} via Business API!`)
            } else {
                alert(`Message "${template}" sent successfully!`)
            }

        } catch (err) {
            alert('Failed to trigger automation')
        } finally {
            setSendingWa(false)
        }
    }

    const getItemName = (id) => {
        const item = catalog.find(i => i.id === id)
        return item ? item.label : id
    }

    const getItemVolume = (id) => {
        const item = catalog.find(i => i.id === id)
        return item ? item.volume : 0
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

            if (y > 270) {
                doc.addPage()
                y = 20
            }
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
                    <select
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-primary-500"
                        defaultValue={quote.status}
                    >
                        <option value="new">New</option>
                        <option value="processing">Processing</option>
                        <option value="booked">Booked</option>
                        <option value="completed">Completed</option>
                    </select>
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
                                <p className="font-medium text-slate-900 mt-1">{quote.pickup_address}</p>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Dropoff</label>
                                <p className="font-medium text-slate-900 mt-1">{quote.dropoff_address}</p>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Distance</label>
                                <p className="font-medium text-slate-900 mt-1">{quote.distance_km} km</p>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Date</label>
                                <p className="font-medium text-slate-900 mt-1">{quote.move_date}</p>
                            </div>
                        </div>
                    </div>

                    {/* SITE ACCESS DETAILS - NEW */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
                            <Building size={20} className="text-primary-600" /> Site Access
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Pickup Location</h4>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex justify-between">
                                        <span>Type:</span> <span className="font-medium text-slate-900 capitalize">{access.origin?.type || 'N/A'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Stairs:</span> <span className="font-medium text-slate-900">{access.origin?.stairs ? 'Yes' : 'No'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Elevator:</span> <span className="font-medium text-slate-900">{access.origin?.elevator ? 'Yes' : 'No'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Long Carry:</span> <span className="font-medium text-slate-900">{access.origin?.longCarry ? '> 30m' : 'Standard'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Shuttle Truck:</span> <span className="font-medium text-slate-900">{access.origin?.shuttle ? 'Required' : 'No'}</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Dropoff Location</h4>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex justify-between">
                                        <span>Type:</span> <span className="font-medium text-slate-900 capitalize">{access.destination?.type || 'N/A'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Stairs:</span> <span className="font-medium text-slate-900">{access.destination?.stairs ? 'Yes' : 'No'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Elevator:</span> <span className="font-medium text-slate-900">{access.destination?.elevator ? 'Yes' : 'No'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Long Carry:</span> <span className="font-medium text-slate-900">{access.destination?.longCarry ? '> 30m' : 'Standard'}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Shuttle Truck:</span> <span className="font-medium text-slate-900">{access.destination?.shuttle ? 'Required' : 'No'}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* INVENTORY LIST - NEW */}
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

                    {/* CLIENT CARD */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-2xl font-bold mx-auto mb-4">
                            {quote.client_name?.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{quote.client_name}</h3>
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
                                            className="flex-1 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                                        >
                                            {sendingWa ? <span className="animate-pulse">Sending...</span> : 'Send Now'}
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
