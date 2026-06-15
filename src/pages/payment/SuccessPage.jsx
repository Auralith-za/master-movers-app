import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, ArrowRight, User, Mail, Phone, Hash, MessageCircle } from 'lucide-react'
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

    // Capture reference from URL (PayFast returns m_payment_id)
    const reference = searchParams.get('m_payment_id') || `MM-${Math.floor(1000 + Math.random() * 9000)}`

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
                total: total,
                vat: vat,
                subTotal: subTotal,
                inventory: quote.items_json || {},
                breakdown: quote.trip_breakdown || {},
                inventoryItems: INVENTORY_ITEMS,
                paymentMethod: quote.payment_method || 'card/eft'
            })
            console.log("Payment confirmation email triggered.")
        } catch (error) {
            console.error("Error triggering confirmation email:", error)
        }
    }

    useEffect(() => {
        // 1. Capture details from store BEFORE resetting
        if (moveDetails && moveDetails.contactName) {
            setCapturedDetails({
                name: moveDetails.contactName + ' ' + (moveDetails.surname || ''),
                email: moveDetails.contactEmail,
                phone: moveDetails.contactPhone
            })
        }

        // 2. Proactively update database status to 'booked_paid'
        // Try priority: 1. URL Param (from PayFast) 2. Last Saved Quote from Store
        const quoteId = searchParams.get('m_payment_id') || lastSavedQuote?.id
        const gateway = searchParams.get('gateway') || 'payfast'

        console.log("SuccessPage: Attempting status update for Quote ID:", quoteId)

        if (quoteId) {
            supabase
                .from('quotes')
                .update({ 
                    status: 'booked_paid',
                    payment_status: 'paid',
                    payment_method: gateway
                })
                .eq('id', quoteId)
                .select()
                .then(({ data, error }) => {
                    if (error) {
                        console.error("Error updating paid status in DB:", error)
                        alert("Note: We've recorded your payment locally, but there was a sync issue with the server. Our team will verify this manually.")
                    } else {
                        console.log("SUCCESS: Quote status verified and updated to booked_paid", data)
                                        if (data && data.length > 0) {
                            sendConfirmationEmail(data[0])
                            // 🔴 Google Ads Purchase Conversion
                            trackPurchaseConversion({
                                value: data[0]?.total_price || 0,
                                currency: 'ZAR',
                                transactionId: quoteId
                            })
                        }
                    }
                })
        } else {
            console.warn("SuccessPage: No Quote ID found in URL or Store. Status update skipped.")
        }

        // 3. Track Purchase (Legacy GA4 event — kept for backwards compat)
        event({
            action: 'purchase',
            category: 'Sales',
            label: 'Payment Completed',
            value: 1
        })

        // 4. Reset the store after a long enough delay to ensure users see details
        const timer = setTimeout(() => {
            reset()
        }, 2000)

        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl text-center relative z-10 animate-in zoom-in-95 duration-500 border border-slate-100">
                <div className="mx-auto h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>

                <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                    Payment Successful!
                </h2>
                <p className="text-slate-500 mb-8 font-medium">
                    Thank you! Your move has been secured. Our team will contact you shortly to finalize the logistics.
                </p>

                {/* Reference Card */}
                <div className="bg-slate-900 rounded-2xl p-6 mb-6 text-left shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Hash size={48} className="text-white" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Booking Reference</p>
                    <p className="text-2xl font-mono font-bold text-white tracking-widest">{reference}</p>
                </div>

                {/* Contact Details Card */}
                {capturedDetails && (
                    <div className="bg-emerald-50/50 rounded-2xl p-6 mb-8 text-left border border-emerald-100">
                        <p className="text-[10px] text-emerald-700 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            Confirmation Details
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <User size={16} className="text-emerald-600" />
                                <span className="text-sm font-bold text-slate-700">{capturedDetails.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-emerald-600" />
                                <span className="text-sm font-medium text-slate-600">{capturedDetails.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-emerald-600" />
                                <span className="text-sm font-medium text-slate-600">{capturedDetails.phone}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <Link to="/">
                        <Button className="w-full border-2 border-slate-900 text-slate-900 hover:bg-slate-50 font-black py-4 rounded-2xl uppercase tracking-widest text-sm transition-all" variant="outline" size="lg">
                            Return to Home <ArrowRight className="ml-2" size={18} />
                        </Button>
                    </Link>
                    
                    <div className="pt-4 border-t border-slate-100 mt-6">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-4">Immediate Assistance</p>
                        <a href="tel:+27110000000" className="block">
                            <Button className="w-full bg-[#e31837] hover:bg-[#c0152f] text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm shadow-xl flex items-center justify-center gap-2" size="lg">
                                <MessageCircle size={18} /> Contact a Human
                            </Button>
                        </a>
                        <p className="text-[11px] text-slate-400 mt-4 leading-relaxed italic">
                            Your move is now officially in our system. You'll receive a confirmation email within the next 5 minutes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
