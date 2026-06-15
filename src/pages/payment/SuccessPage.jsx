import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, ArrowRight, User, Mail, Phone, Hash, MessageCircle, MapPin, Calendar, Package, Truck, Receipt } from 'lucide-react'
import Button from '../../components/ui/Button'
import { useMoveStore } from '../../features/inventory/store/moveStore'
import { supabase } from '../../lib/supabaseClient'
import { event, trackPurchaseConversion } from '../../lib/gtag'
import { emailService } from '../../services/emailService'
import { INVENTORY_ITEMS } from '../../features/inventory/data/mockItems'

export default function SuccessPage() {
    const [searchParams] = useSearchParams()
    const { reset, moveDetails, lastSavedQuote } = useMoveStore()
    const [capturedDetails, setCapturedDetails] = useState(null)
    const [quoteRecord, setQuoteRecord] = useState(null)

    const reference = searchParams.get('m_payment_id') || lastSavedQuote?.id || `MM-${Math.floor(1000 + Math.random() * 9000)}`

    const sendConfirmationEmail = async (quote) => {
        if (!quote) return
        try {
            const total = quote.total_price || quote.total || 0
            const subTotal = total / 1.15
            const vat = total - subTotal
            await emailService.sendQuoteEmail({
                type: 'booking_confirmation',
                quoteId: quote.id,
                clientName: quote.client_name,
                clientEmail: quote.client_email,
                clientPhone: quote.client_phone,
                moveDate: quote.move_date,
                pickupAddress: quote.pickup_address,
                dropoffAddress: quote.dropoff_address,
                total,
                vat,
                subTotal,
                inventory: quote.items_json || {},
                breakdown: quote.trip_breakdown || {},
                inventoryItems: INVENTORY_ITEMS,
                paymentMethod: quote.payment_method || 'card/eft'
            })
        } catch (error) {
            console.error('Confirmation email error:', error)
        }
    }

    useEffect(() => {
        if (moveDetails?.contactName) {
            setCapturedDetails({
                name: `${moveDetails.contactName} ${moveDetails.surname || ''}`.trim(),
                email: moveDetails.contactEmail,
                phone: moveDetails.contactPhone
            })
        }

        const quoteId = searchParams.get('m_payment_id') || lastSavedQuote?.id
        const gateway = searchParams.get('gateway') || 'payfast'

        if (quoteId) {
            supabase
                .from('quotes')
                .update({ status: 'booked_paid', payment_status: 'paid', payment_method: gateway })
                .eq('id', quoteId)
                .select()
                .then(({ data, error }) => {
                    if (!error && data?.length > 0) {
                        setQuoteRecord(data[0])
                        sendConfirmationEmail(data[0])
                        trackPurchaseConversion({
                            value: data[0]?.total_price || 0,
                            currency: 'ZAR',
                            transactionId: quoteId
                        })
                    }
                })
        }

        event({ action: 'purchase', category: 'Sales', label: 'Payment Completed', value: 1 })

        const timer = setTimeout(() => reset(), 3000)
        return () => clearTimeout(timer)
    }, [])

    // Derive display data — prefer DB record, fall back to store
    const displayName = quoteRecord?.client_name || capturedDetails?.name || ''
    const displayEmail = quoteRecord?.client_email || capturedDetails?.email || ''
    const displayPhone = quoteRecord?.client_phone || capturedDetails?.phone || ''
    const displayDate = quoteRecord?.move_date || moveDetails?.moveDate || ''
    const displayPickup = quoteRecord?.pickup_address || moveDetails?.pickupAddress || ''
    const displayDropoff = quoteRecord?.dropoff_address || moveDetails?.dropoffAddress || ''
    const displayTotal = quoteRecord?.total_price || lastSavedQuote?.total_price || 0
    const displaySubTotal = displayTotal / 1.15
    const displayVat = displayTotal - displaySubTotal

    // Count inventory items
    const itemsJson = quoteRecord?.items_json || {}
    const topItems = Object.entries(itemsJson)
        .filter(([, qty]) => Number(qty) > 0)
        .sort(([, a], [, b]) => Number(b) - Number(a))
        .slice(0, 5)
        .map(([key, qty]) => {
            const item = INVENTORY_ITEMS.find(i => i.key === key)
            return item ? { label: item.label, qty: Number(qty) } : { label: key, qty: Number(qty) }
        })
    const totalItems = Object.values(itemsJson).reduce((s, v) => s + Number(v), 0)

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-50 rounded-full opacity-60" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-slate-100 rounded-full opacity-60" />
            </div>

            <div className="max-w-2xl mx-auto relative z-10 space-y-5">

                {/* ── SUCCESS HEADER ─────────────────────────────────── */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center">
                    <div className="mx-auto h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
                        <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                        Payment Successful!
                    </h1>
                    <p className="text-slate-500 font-medium mb-6">
                        Your move is officially secured. A confirmation email is on its way to you.
                    </p>

                    {/* Booking Reference */}
                    <div className="bg-slate-900 rounded-2xl p-5 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Hash size={48} className="text-white" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Booking Reference</p>
                        <p className="text-xl font-mono font-bold text-white tracking-widest truncate">{reference}</p>
                    </div>
                </div>

                {/* ── QUOTE SUMMARY ──────────────────────────────────── */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-900 px-6 py-4 flex items-center gap-3">
                        <Receipt size={18} className="text-emerald-400" />
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">Quote Summary</h2>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Move Route */}
                        {(displayPickup || displayDropoff) && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Move Route</p>
                                <div className="space-y-2">
                                    {displayPickup && (
                                        <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                                            <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <MapPin size={12} className="text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Collection From</p>
                                                <p className="text-sm font-bold text-slate-800">{displayPickup}</p>
                                            </div>
                                        </div>
                                    )}
                                    {displayDropoff && (
                                        <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                                            <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Truck size={12} className="text-primary-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Delivery To</p>
                                                <p className="text-sm font-bold text-slate-800">{displayDropoff}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Move Date */}
                        {displayDate && (
                            <div className="flex items-center gap-3 py-3 border-t border-slate-100">
                                <Calendar size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Move Date</p>
                                    <p className="text-sm font-bold text-slate-800">{displayDate}</p>
                                </div>
                            </div>
                        )}

                        {/* Items Summary */}
                        {topItems.length > 0 && (
                            <div className="py-3 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Package size={14} className="text-slate-400" />
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                        Items ({totalItems} total)
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {topItems.map(({ label, qty }) => (
                                        <div key={label} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                                            <span className="text-xs text-slate-600 truncate">{label}</span>
                                            <span className="text-xs font-black text-slate-900 ml-2">×{qty}</span>
                                        </div>
                                    ))}
                                </div>
                                {Object.keys(itemsJson).filter(k => Number(itemsJson[k]) > 0).length > 5 && (
                                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                                        + {Object.keys(itemsJson).filter(k => Number(itemsJson[k]) > 0).length - 5} more items
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Pricing Breakdown */}
                        {displayTotal > 0 && (
                            <div className="border-t border-slate-100 pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Subtotal (excl. VAT)</span>
                                    <span>R {displaySubTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>VAT (15%)</span>
                                    <span>R {displayVat.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                    <span className="font-black text-slate-900 uppercase tracking-wide text-sm">Total Paid</span>
                                    <span className="text-2xl font-black text-emerald-600">R {Number(displayTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── CONTACT DETAILS ────────────────────────────────── */}
                {(displayName || displayEmail || displayPhone) && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                        <div className="bg-emerald-600 px-6 py-4 flex items-center gap-3">
                            <User size={18} className="text-white" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Your Details</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            {displayName && (
                                <div className="flex items-center gap-3">
                                    <User size={15} className="text-emerald-500 flex-shrink-0" />
                                    <span className="text-sm font-bold text-slate-800">{displayName}</span>
                                </div>
                            )}
                            {displayEmail && (
                                <div className="flex items-center gap-3">
                                    <Mail size={15} className="text-emerald-500 flex-shrink-0" />
                                    <span className="text-sm text-slate-600">{displayEmail}</span>
                                </div>
                            )}
                            {displayPhone && (
                                <div className="flex items-center gap-3">
                                    <Phone size={15} className="text-emerald-500 flex-shrink-0" />
                                    <span className="text-sm text-slate-600">{displayPhone}</span>
                                </div>
                            )}
                            <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-100">
                                📧 A confirmation email with your booking details has been sent to the address above.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── ACTIONS ────────────────────────────────────────── */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-3">
                    <Link to="/">
                        <Button className="w-full border-2 border-slate-900 text-slate-900 hover:bg-slate-50 font-black py-4 rounded-2xl uppercase tracking-widest text-sm" variant="outline" size="lg">
                            Return to Home <ArrowRight className="ml-2" size={18} />
                        </Button>
                    </Link>
                    <a href="tel:+27114937569" className="block">
                        <Button className="w-full bg-[#e31837] hover:bg-[#c0152f] text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm shadow-xl flex items-center justify-center gap-2" size="lg">
                            <MessageCircle size={18} /> Need Help? Call Us
                        </Button>
                    </a>
                    <p className="text-[11px] text-slate-400 text-center leading-relaxed italic">
                        Our operations team will contact you 48 hours before your move to confirm all logistics.
                    </p>
                </div>

            </div>
        </div>
    )
}
