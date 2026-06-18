import React, { useMemo, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useMoveStore, calculateQuote } from '../inventory/store/moveStore'
import { INVENTORY_ITEMS } from '../inventory/data/mockItems'
import { Button } from '../../components/ui/Button'
import { FileText, CreditCard, Send, CheckCircle, Truck, MapPin, Sparkles, Phone } from 'lucide-react'
import { PRICING_CONSTANTS } from '../inventory/data/pricingRates'
import { generateProfessionalQuote } from '../../services/pdfService'
import { emailService } from '../../services/emailService'
import PayFastCheckout from '../payment/PayFastCheckout'
import PayflexCheckout from '../payment/PayflexCheckout'
import CouponInput from '../payment/CouponInput'
import { event, trackLeadConversion, trackQuoteSubmit } from '../../lib/gtag'
import { ChevronDown, ChevronUp, Plus, Minus, RotateCcw } from 'lucide-react'
import { LOCAL_VEHICLE_RATES } from '../inventory/data/pricingRates'
import clsx from 'clsx'
import { LeadCaptureModal } from './Step1Details'
import { supabase } from '../../lib/supabaseClient'

const SERVICE_KEYS = [
    { key: 'crateConstruction', label: 'Crate Construction' },
    { key: 'documentationFee', label: 'Documentation Charge' },
    { key: 'fuelSurcharge', label: 'Fuel Surcharge' },
    { key: 'hoisting', label: 'Hoisting' },
    { key: 'longCarry', label: 'Long Carry Surcharges' },
    { key: 'petTransport', label: 'Pet Transport / Kenneling' },
    { key: 'warehouseStorage', label: 'Warehouse Storage P/M' },
    { key: 'miscellaneous', label: 'Miscellaneous Charge' },
    { key: 'handling', label: 'Handling Charge' },
    { key: 'vehicleTransport', label: 'Vehicle Transport' },
    { key: 'reDelivery', label: 'Re-Delivery Charge' },
    { key: 'preSuppliedCartons', label: 'Pre-Supplied Cartons' },
    { key: 'preSuppliedMaterials', label: 'Pre-Supplied Materials' },
    { key: 'shuttleSurcharge', label: 'Shuttle Vehicle Surcharges' },
    { key: 'specialWrapping', label: 'Special Wrapping' },
    { key: 'suppliedPackedCartons', label: 'Supplied and Packed Cartons' },
    { key: 'plasticSleeves', label: 'Plastic Sleeves' },
    { key: 'weekendSurcharge', label: 'Saturday/Sunday Charge' }
]

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Step4Summary Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center text-red-600">
                    <h2 className="text-2xl font-bold mb-2">Something went wrong.</h2>
                    <p className="mb-4">We couldn't load your quote summary.</p>
                    <pre className="text-xs bg-red-50 p-4 rounded text-left overflow-auto max-w-lg mx-auto">
                        {this.state.error?.toString()}
                    </pre>
                    <button onClick={() => window.location.reload()} className="mt-4 underline">Reload Page</button>
                    <div className="mt-8">
                        <Button onClick={() => window.location.href = '/quote'} variant="secondary">Start Over</Button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function Step4SummaryContent({ submissionType = 'standard' }) {
    const navigate = useNavigate()
    const { moveDetails, accessDetails, inventory, submitQuote, lastSavedQuote, manualServiceCharges, updateManualServiceCharge, setMoveDetails } = useMoveStore()
    const location = useLocation()
    const basePath = location.pathname.startsWith('/quote-test') ? '/quote-test' : 
                     location.pathname.startsWith('/admin/quotes/new') ? '/admin/quotes/new' : '/quote';
    const [searchParams, setSearchParams] = useSearchParams()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [showServices, setShowServices] = useState(false)
    const [showAllItems, setShowAllItems] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [showLeadModal, setShowLeadModal] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    // Use sessionStorage key scoped to user email to survive StrictMode double-mounts and page refreshes
    const step4SessionKey = `mm_step4_lead_saved_${moveDetails.contactEmail || 'anon'}`

    const [isCalculating, setIsCalculating] = useState(false)
    const [calcMessage, setCalcMessage] = useState('Analyzing inventory volume...')
    const [appliedCoupon, setAppliedCoupon] = useState(null)
    const [appSettings, setAppSettings] = useState(null)

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
                if (data) setAppSettings(data);
            } catch (err) {
                console.error("Failed to fetch app settings:", err);
            }
        };
        fetchSettings();
    }, []);

    React.useEffect(() => {
        if (!isCalculating) return;
        const messages = [
            'Analyzing inventory volume...',
            'Calibrating route distance...',
            'Optimizing vehicle allocation...',
            'Finalizing move proposal...'
        ];
        let idx = 0;
        const msgInterval = setInterval(() => {
            idx = (idx + 1) % messages.length;
            setCalcMessage(messages[idx]);
        }, 400);

        const timer = setTimeout(() => {
            setIsCalculating(false);
        }, 1800);

        return () => {
            clearInterval(msgInterval);
            clearTimeout(timer);
        };
    }, [isCalculating]);

    // Calculate Totals
    const { totalVolume, total, vat, subTotal, discount, discountType, breakdown, packagingCost, requiresCrateFlag, requiresPhotoFlag, needsConsultation, isNationalMove } = useMemo(() => {
        try {
            return calculateQuote(inventory, moveDetails, accessDetails, INVENTORY_ITEMS, manualServiceCharges)
        } catch (e) {
            console.error("Calculation Error:", e)
            return { totalVolume: 0, total: 0, vat: 0, subTotal: 0, discount: 0, discountType: null, packagingCost: 0, requiresCrateFlag: false, requiresPhotoFlag: false, needsConsultation: false, isNationalMove: false, breakdown: { base: 0, transport: 0, volume: 0, access: 0, distance: 0, autoPackagingCost: 0 } }
        }
    }, [inventory, moveDetails, accessDetails, manualServiceCharges])

    // Apply coupon discount on top of calculated total
    const couponDiscount = appliedCoupon ? (total * appliedCoupon.discount_percent) / 100 : 0
    const discountedTotal = Math.max(0, total - couponDiscount)

    // Auto-save as 'lead' the moment customer reaches Step 4 — captures abandoners.
    // Uses sessionStorage to guard against duplicate inserts from:
    //   - React StrictMode double-invocation
    //   - Page refreshes (useRef resets, but sessionStorage persists)
    //   - Component unmount/remount from navigation
    // If a lastSavedQuote already exists in the store, it UPDATE that record instead.
    React.useEffect(() => {
        if (!moveDetails.contactName || submissionType === 'admin') return

        // Already captured a lead for this customer in this browser session
        if (sessionStorage.getItem(step4SessionKey)) {
            console.log('[Step4] Lead already captured this session, skipping duplicate insert.')
            return
        }

        // Mark as captured immediately (before async call) to prevent race conditions
        sessionStorage.setItem(step4SessionKey, '1')
        console.log('[Step4] Auto-saving as lead on arrival...')

        submitQuote({
            status: 'lead',
            submission_type: submissionType,
            // forceNew only if no existing quote from this session
            forceNew: !lastSavedQuote?.id
        }).then(result => {
            if (result.success) {
                console.log('[Step4] Lead captured:', result.data?.[0]?.id)
            } else {
                // Clear the flag so it can retry on next visit
                sessionStorage.removeItem(step4SessionKey)
                console.warn('[Step4] Lead save failed:', result.error)
            }
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moveDetails.contactName])

    if (isCalculating) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-slate-950 text-white overflow-hidden">
                {/* Background Lifestyle Image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
                    style={{ backgroundImage: "url('/images/lifestyle_moving.png')" }}
                />
                
                {/* Visual Glass Box */}
                <div className="relative z-10 bg-slate-900/80 backdrop-blur-md p-10 rounded-3xl border border-slate-700/50 max-w-md w-full text-center shadow-2xl flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full border-4 border-t-red-600 border-r-red-600 border-b-slate-800 border-l-slate-800 animate-spin" />
                    
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Generating Quote</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none mt-1">Calibrating MasterMovers Engine</p>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-red-600 h-full rounded-full animate-[loading-bar_1.8s_ease-out_forwards]" style={{ width: '0%' }} />
                    </div>

                    <p className="text-red-400 font-bold uppercase tracking-wider text-xs h-6">{calcMessage}</p>
                </div>

                <style>{`
                    @keyframes loading-bar {
                        0% { width: 0%; }
                        100% { width: 100%; }
                    }
                `}</style>
            </div>
        );
    }

    const sendProposalEmail = async (savedQuote) => {
        const targetQuote = savedQuote || lastSavedQuote
        if (!targetQuote) return

        emailService.sendQuoteEmail({
            type: 'quote_proposal',
            quoteId: targetQuote.id,
            clientName: `${moveDetails.contactName || ''} ${moveDetails.surname || ''}`.trim(),
            clientEmail: moveDetails.contactEmail,
            clientPhone: moveDetails.contactPhone,
            moveDate: moveDetails.moveDate,
            pickupAddress: moveDetails.pickupAddress,
            dropoffAddress: moveDetails.dropoffAddress,
            total: total,
            vat: vat,
            subTotal: subTotal,
            inventory: inventory,
            breakdown: breakdown,
            inventoryItems: INVENTORY_ITEMS,
            paymentMethod: moveDetails.paymentMethod || 'eft'
        }).catch(err => console.error("Non-blocking quote email error:", err))
    }

    const handleProceed = async () => {
        if (!isNationalMove && subTotal < PRICING_CONSTANTS.minOrder) {
            alert(`Minimum Charge Notice:\n\nOur minimum rate for a local move is R ${PRICING_CONSTANTS.minOrder.toLocaleString()}.00 + VAT (R ${(PRICING_CONSTANTS.minOrder * 1.15).toFixed(2)}).\n\nYour current quote (R ${subTotal.toFixed(2)} + VAT) is below this amount. Please add more items or services to proceed, or contact us for a custom arrangement.`)
            return
        }

        setIsSubmitting(true)
        try {
            // Save to backend — always UPDATE the existing lead record, never insert a new one
            const result = await submitQuote({
                status: (submissionType === 'admin') ? 'lead' : 'pending_payment',
                submission_type: submissionType,
                // Never force a new insert here — update the lead that was created on Step 4 entry
                forceNew: false
            })
            
            if (result.success && result.data?.[0]) {
                const savedQuote = result.data[0]

                if (submissionType !== 'admin') {
                    emailService.sendPendingQuoteAlert({
                        quoteId: savedQuote.id,
                        clientName: `${moveDetails.contactName || ''} ${moveDetails.surname || ''}`.trim(),
                        clientEmail: moveDetails.contactEmail,
                        clientPhone: moveDetails.contactPhone,
                        moveDate: moveDetails.moveDate,
                        pickupAddress: moveDetails.pickupAddress,
                        dropoffAddress: moveDetails.dropoffAddress,
                        total: discountedTotal || total,
                        vat: vat,
                        subTotal: subTotal,
                        inventory: inventory,
                        breakdown: breakdown,
                        inventoryItems: INVENTORY_ITEMS,
                        moveType: moveDetails.moveType || '',
                        paymentMethod: moveDetails.paymentMethod || 'not selected'
                    }).catch(err => console.error('Non-blocking admin alert error:', err))
                }

                // 2. Customer proposal email with PDF (separate — may take a moment)
                sendProposalEmail(savedQuote)
            }

            if (submissionType === 'admin' && result.success) {
                alert('Manual Quote Created Successfully!')
                navigate(`/admin/quotes/${result.data?.[0]?.id || ''}`)
                return
            }

            if (!result.success) {
                console.warn('Backend save failed (non-blocking):', result.error)
            }
        } catch (error) {
            console.warn('Submit error (non-blocking):', error)
        } finally {
            setIsSubmitting(false)
        }
        // 🔴 Google Ads Lead Conversion — Proceed to Payment (high-intent quote)
        if (submissionType !== 'admin') {
            trackLeadConversion({
                label: 'Proceed to Payment',
                value: discountedTotal || total || 0
            })
        }
        // Always show payment options for non-admin
        setSearchParams({ saved: 'true' })
    }

    // Auto-scroll to payment options when saved
    React.useEffect(() => {
        if (searchParams.get('saved') === 'true') {
            const paymentSection = document.getElementById('payment-options')
            if (paymentSection) {
                paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        }
    }, [searchParams])

    const handleCallBackRequest = async () => {
        // If contact info is missing, show the modal instead of submitting
        if (!moveDetails.contactName || !moveDetails.contactEmail) {
            setShowLeadModal(true)
            return
        }

        setIsSubmitting(true)
        try {
            const alreadySaved = searchParams.get('saved') === 'true'
            if (alreadySaved) {
                // If already saved, we still want to update the record with the request_call_back flag
                const result = await submitQuote({
                    status: 'lead',
                    request_call_back: true,
                    submission_type: submissionType
                })
                if (result.success) {
                    alert("We have received your request! A consultant will call you shortly.")
                    if (result.data?.[0]) {
                        sendProposalEmail(result.data[0])
                    }
                } else {
                    console.warn("Callback update failed:", result.error)
                    alert("Request Sent! We will call you shortly to discuss your move.")
                }
                return
            }

            // 🔴 Google Ads Lead Conversion — Call Back Request
            trackLeadConversion({
                label: 'Call Back Request',
                value: discountedTotal || total || 0
            })

            const result = await submitQuote({
                status: 'lead',
                request_call_back: true,
                submission_type: submissionType,
                // Update existing lead record instead of creating a duplicate
                forceNew: false
            })

            // Optimistic success — don't block user if Supabase is flaky
            setSearchParams({ saved: 'true' })
            alert("Request Sent! We will call you shortly to discuss your move.")

            if (result.success && result.data?.[0]) {
                const savedQuote = result.data[0]
                // Send customer proposal email (with PDF)
                sendProposalEmail(savedQuote)
                // Send urgent admin callback alert (no PDF, instant)
                emailService.sendCallbackEmail({
                    name: moveDetails.contactName,
                    email: moveDetails.contactEmail,
                    phone: moveDetails.contactPhone,
                    step: 'Step 4 — Quote Summary',
                    pickup: moveDetails.pickupAddress || '',
                    dropoff: moveDetails.dropoffAddress || '',
                    moveDate: moveDetails.moveDate || ''
                }).catch(err => console.error('Callback email error:', err))
            }

            if (!result.success) {
                console.warn("Callback save failed (non-blocking):", result.error)
            }
        } catch (error) {
            console.error("Call Back Error", error)
            // Still show success to user to prevent frustration
            setSearchParams({ saved: 'true' })
            alert("Request Sent! We will call you shortly to discuss your move.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSubmit = async (status, extraData = {}) => {
        setIsSubmitting(true)
        try {
            const result = await submitQuote({
                status,
                packaging_cost: packagingCost || 0,
                crate_required: requiresCrateFlag || false,
                photo_required: requiresPhotoFlag || false,
                submission_type: submissionType,
                ...extraData
            })

            if (result.success && result.data?.[0]) {
                sendProposalEmail(result.data[0])
            }

            // Non-blocking success
            if (!result.success) {
                console.error('Submit error:', result.error)
            }
            return true // Always return true to close modals
        } catch (err) {
            console.error('Submit exception:', err)
            return true
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleGeneratePDF = () => {
        setIsGenerating(true)
        try {
            // 🔴 Google Ads — PDF download engagement
            trackQuoteSubmit({ value: discountedTotal || total || 0 })

            generateProfessionalQuote({
                quoteId: lastSavedQuote?.id || `MM-${Math.floor(Math.random() * 10000)}`,
                clientName: `${moveDetails.contactName || ''} ${moveDetails.surname || ''}`.trim(),
                clientEmail: moveDetails.contactEmail,
                clientPhone: moveDetails.contactPhone,
                pickupAddress: moveDetails.pickupAddress,
                dropoffAddress: moveDetails.dropoffAddress,
                moveDate: moveDetails.moveDate,
                inventory: inventory,
                breakdown: breakdown,
                total: total,
                vat: vat,
                subTotal: subTotal,
                inventoryItems: INVENTORY_ITEMS,
                isSharedLoad: breakdown.isSharedLoad
            })

        } catch (err) {
            console.error('PDF Generation error:', err)
            alert("Could not generate PDF. Please try again.")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">

            {/* Reject Reason Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
                        <div className="text-4xl text-center mb-3">💬</div>
                        <h3 className="text-xl font-black text-center text-slate-900 mb-1">Thanks for your feedback</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">
                            Please let us know why you're not proceeding today — our team will follow up with you.
                        </p>
                        <textarea
                            className="w-full rounded-xl border-2 border-gray-200 p-4 text-sm text-slate-700 focus:border-[#e31837] focus:outline-none resize-none h-28 mb-4"
                            placeholder="e.g. Price is too high, need to think about it, wrong dates..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                        />
                        <div className="flex flex-col gap-3">
                            <button
                                className="w-full py-4 rounded-2xl bg-[#e31837] hover:bg-[#c0152f] text-white font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50"
                                disabled={isSubmitting}
                                onClick={async () => {
                                    const success = await handleSubmit('rejected', {
                                        reject_reason: rejectReason || 'No reason provided',
                                        status: 'rejected'
                                    })
                                    if (success) {
                                        setShowRejectModal(false)
                                        alert("Thank you! A sales representative will be in touch to help find the best solution for you. ✅")
                                        navigate('/')
                                    }
                                }}
                            >
                                {isSubmitting ? 'Saving...' : 'Submit & Close'}
                            </button>
                            <button
                                className="w-full py-3 text-slate-400 text-sm hover:text-slate-600"
                                onClick={() => setShowRejectModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-8 bg-white border border-slate-100 p-4 sm:p-6 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <img src="/images/logo.png" alt="Master Movers" className="h-10 sm:h-12 object-contain shrink-0" />
                        <div className="min-w-0">
                            <h2 className="text-base sm:text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">Move Proposal</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5 hidden sm:block">Official Pricing &amp; Summary</p>
                        </div>
                    </div>
                    <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 shrink-0">
                        Step 4 of 4
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Quote Card or Maintenance Banner */}
                {appSettings && appSettings.pricing_active === false ? (
                    <div className="bg-amber-50 rounded-2xl shadow-xl border border-amber-200 overflow-hidden p-8 text-center animate-in fade-in slide-in-from-top-4">
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-amber-900 mb-2 uppercase tracking-tight">
                            {appSettings.maintenance_heading || 'Pricing Temporarily Unavailable'}
                        </h2>
                        <p className="text-amber-800/80 mb-8 max-w-md mx-auto font-medium leading-relaxed">
                            {appSettings.maintenance_message || 'We are currently updating our pricing engine. Please contact the Master Movers team to complete your quote.'}
                        </p>
                        <a 
                            href="tel:+27114937569"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:-translate-y-1"
                        >
                            <Phone size={20} /> Call Master Movers
                        </a>
                    </div>
                ) : (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold">Estimated Quote</h2>
                                <p className="text-slate-400 text-sm mt-1">Based on provided inventory & distance.</p>
                            </div>
                            <div className="text-right">
                                {appliedCoupon ? (
                                    <>
                                        <div className="text-lg font-bold text-slate-500 line-through">R {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div className="text-3xl font-bold text-emerald-400">R {discountedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">-{appliedCoupon.discount_percent}% Applied!</div>
                                    </>
                                ) : (
                                    <div className="text-3xl font-bold text-primary-500">R {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                )}
                                <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">Incl. VAT</div>
                                <div className="text-[10px] text-slate-500 mt-1 italic">* Pricing valid for 7 days from date of issue.</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Coupon discount line */}
                        {appliedCoupon && (
                            <div className="flex justify-between items-center py-2 border-b border-emerald-100 bg-emerald-50 -mx-6 px-6">
                                <span className="text-emerald-700 font-black text-xs uppercase tracking-widest flex items-center gap-1.5">
                                    🏷️ Coupon: {appliedCoupon.code}
                                </span>
                                <span className="font-black text-emerald-600">- R {couponDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        {/* Base Transport row removed as per request */}
                        {packagingCost > 0 && (
                            <div className="space-y-2 py-4 border-b border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Protective Packaging</span>
                                    <span className="font-bold text-slate-900">+ R {packagingCost.toFixed(2)}</span>
                                </div>
                                <div className="pl-4 space-y-1">
                                    {moveDetails.st7Boxes > 0 && (
                                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                            <span>{moveDetails.st7Boxes}x ST7 Boxes</span>
                                            <span>Included</span>
                                        </div>
                                    )}
                                    {moveDetails.linenBoxes > 0 && (
                                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                            <span>{moveDetails.linenBoxes}x Linen Boxes</span>
                                            <span>Included</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                        <span>Delivery & Handling Fee</span>
                                        <span>Included</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {(requiresCrateFlag || requiresPhotoFlag) && (
                            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 animate-in fade-in slide-in-from-top-2">
                                <h4 className="text-amber-800 font-bold text-sm mb-2 flex items-center gap-2">Quote Attention Required</h4>
                                <ul className="text-xs text-amber-900 space-y-1 list-disc pl-4">
                                    {requiresCrateFlag && <li>Some items require a custom crate. Our team will contact you to finalize the crate pricing.</li>}
                                    {requiresPhotoFlag && <li>Some items require photo verification. Please be prepared to send photos to the sales team.</li>}
                                </ul>
                            </div>
                        )}

                        {/* Coupon Input */}
                        <div className="pt-3 border-t border-gray-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Promo Code</p>
                            <CouponInput
                                appliedCoupon={appliedCoupon}
                                onApply={(coupon) => setAppliedCoupon(coupon)}
                                onRemove={() => setAppliedCoupon(null)}
                            />
                        </div>

                        {/* Payment Method Selection */}
                        <div className="pt-4 border-t border-gray-100 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Payment Method</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <label className={clsx(
                                    "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                                    moveDetails.paymentMethod === 'eft' ? "bg-slate-50 border-slate-900 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={moveDetails.paymentMethod === 'eft'}
                                            onChange={() => setMoveDetails({ paymentMethod: 'eft' })}
                                            className="w-4 h-4 text-slate-900 border-gray-300"
                                        />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">EFT / Debit Card</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">Standard Rate</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Free</span>
                                </label>

                                <label className={clsx(
                                    "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                                    moveDetails.paymentMethod === 'payflex' ? "bg-indigo-50 border-indigo-600 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={moveDetails.paymentMethod === 'payflex'}
                                            onChange={() => setMoveDetails({ paymentMethod: 'payflex' })}
                                            className="w-4 h-4 text-indigo-600 border-gray-300"
                                        />
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Payflex (Interest Free)</p>
                                            <p className="text-[9px] text-indigo-600 font-bold uppercase">Service fees apply</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Service Fee</span>
                                </label>
                            </div>
                        </div>

                        {discount > 0 && (
                            <div className="flex justify-between items-center py-4 border-b border-green-100 bg-green-50 px-4 -mx-4 rounded-xl">
                                <span className="text-green-800 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                    <Sparkles size={16} className="animate-pulse" /> {discountType}
                                </span>
                                <span className="font-black text-green-700 text-xl">- R {discount.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-gray-50 space-y-3">
                        {!isSubmitting && !searchParams.get('saved') ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-center gap-2 mb-2 animate-pulse">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded">Pay in 4 available</span>
                                    <span className="text-[10px] font-bold text-slate-400">with Payflex</span>
                                </div>
                                <Button
                                    size="lg"
                                    className="w-full flex justify-between items-center group bg-[#e31837] hover:bg-[#c0152f] shadow-xl shadow-red-600/20"
                                    onClick={handleProceed}
                                    isLoading={isSubmitting}
                                >
                                    <span className="font-black uppercase tracking-widest text-sm">
                                        {submissionType === 'admin' ? 'Finalize Manual Quote' : 'Proceed to Payment'}
                                    </span>
                                    {submissionType === 'admin' ? <Send size={18} /> : <CreditCard size={18} className="opacity-70 group-hover:opacity-100 transition-opacity" />}
                                </Button>

                                {submissionType !== 'admin' && (
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={isSubmitting}
                                        className="w-full py-4 rounded-xl border-2 border-slate-900 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-[#e31837] hover:border-[#e31837] transition-all shadow-lg text-center"
                                    >
                                        Reject Payment / Pay Later
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div id="payment-options" className="space-y-6 animate-in fade-in slide-in-from-top-4 scroll-mt-24">
                                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-full text-emerald-600 shadow-sm">
                                            <CheckCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-emerald-900 font-black uppercase tracking-widest text-[10px]">Quote Secured</p>
                                            <p className="text-emerald-700 text-sm font-medium">Reference: <span className="font-bold">MM-{Math.floor(Math.random() * 10000)}</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="text-center">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select Payment Method</h3>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">100% Secure Checkout</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        {/* PayFast Option */}
                                        {moveDetails.paymentMethod === 'eft' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 px-2">
                                                    <div className="w-1 h-4 bg-red-600 rounded-full" />
                                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Card / Instant EFT</h4>
                                                </div>
                                                <PayFastCheckout
                                                    quote={{
                                                        id: lastSavedQuote?.id || 'QUOTE-' + Date.now(),
                                                        total_price: discountedTotal,
                                                        pickup_address: moveDetails.pickupAddress,
                                                        dropoff_address: moveDetails.dropoffAddress,
                                                        client_name: moveDetails.contactName,
                                                        client_email: moveDetails.contactEmail
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Payflex Option */}
                                        {moveDetails.paymentMethod === 'payflex' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 px-2">
                                                    <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Interest-Free Credit</h4>
                                                </div>
                                                <PayflexCheckout
                                                    quote={{
                                                        id: lastSavedQuote?.id || 'QUOTE-' + Date.now(),
                                                        total_price: discountedTotal,
                                                        client_name: moveDetails.contactName,
                                                        client_email: moveDetails.contactEmail,
                                                        client_phone: moveDetails.contactPhone
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-red-600 font-bold" onClick={handleGeneratePDF} isLoading={isGenerating}>
                                <FileText size={16} className="mr-2" /> Download PDF
                            </Button>
                            <Button variant="secondary" onClick={handleCallBackRequest} isLoading={isSubmitting}>
                                <div className="flex items-center text-xs font-bold uppercase">
                                    <span className="relative flex h-3 w-3 mr-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    Last chance, Old Schoolers?
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
                )}

                {/* Summary Details */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <MapPin size={18} className="text-red-600" /> Move Route
                            </h3>
                        </div>
                        <div className="space-y-4 pl-4 border-l-2 border-gray-100 relative">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-red-600 border-2 border-white ring-1 ring-gray-200" />
                                <p className="text-xs text-slate-500 uppercase">Pickup</p>
                                <p className="font-medium text-slate-900">{moveDetails.pickupAddress || 'Not set'}</p>
                                <div className="text-sm text-slate-500 mt-1">
                                    {accessDetails.origin?.type || 'House'} • Stairs: {accessDetails.origin?.stairs ? 'Yes' : 'No'}
                                </div>
                            </div>
                            <div className="relative pt-6">
                                <div className="absolute -left-[21px] top-7 w-3 h-3 rounded-full bg-slate-900 border-2 border-white ring-1 ring-gray-200" />
                                <p className="text-xs text-slate-500 uppercase">Dropoff</p>
                                <p className="font-medium text-slate-900">{moveDetails.dropoffAddress || 'Not set'}</p>
                                <div className="text-sm text-slate-500 mt-1">
                                    {accessDetails.destination?.type || 'House'} • Stairs: {accessDetails.destination?.stairs ? 'Yes' : 'No'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Truck size={18} className="text-red-600" /> Top Items
                        </h3>
                        <ul className="space-y-3 text-sm">
                            {Object.entries(inventory || {})
                                .slice(0, showAllItems ? undefined : 8)
                                .map(([idKey, qty]) => {
                                    const [id, variation] = idKey.split('_')
                                    const item = INVENTORY_ITEMS.find(i => i.id === id)
                                    if (!item) return null;
                                    const hasShield = item.autoPackagingType || (variation === 'Glass' || variation === 'Marble')
                                    return (
                                        <li key={idKey} className="pb-2 border-b border-gray-50 last:border-0">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 font-medium">{qty}x {item?.name} {variation ? <span className="text-slate-400 text-xs ml-1 font-normal uppercase">({variation})</span> : ''}</span>
                                                <span className="font-black text-slate-300 uppercase text-[10px]">Included</span>
                                            </div>
                                            {hasShield && (
                                                <div className="flex justify-between mt-0.5 pl-4">
                                                    <span className="text-[11px] text-green-700 italic">↳ Protective wrapping included</span>
                                                </div>
                                            )}
                                            {item.requiresPhoto && (
                                                <div className="flex justify-between mt-0.5 pl-4">
                                                    <span className="text-[11px] text-purple-600 italic">↳ Price subject to photo verification</span>
                                                </div>
                                            )}
                                        </li>
                                    )
                                })}
                            {Object.keys(inventory || {}).length > 8 && (
                                <li
                                    className="text-xs text-red-600 font-medium pt-2 cursor-pointer hover:underline"
                                    onClick={() => setShowAllItems(v => !v)}
                                >
                                    {showAllItems
                                        ? '▲ Show less'
                                        : `+ ${Object.keys(inventory).length - 8} more items (expand)`
                                    }
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Move Notes / Special Instructions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Sparkles className="text-red-600" size={18} />
                            Move Notes
                        </h3>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes / Special Instructions (If none, please say none)</label>
                            <textarea
                                name="generalNotes"
                                required
                                value={moveDetails.generalNotes}
                                onChange={(e) => setMoveDetails({ generalNotes: e.target.value })}
                                placeholder="Please describe any special items, tight spaces, or specific requirements..."
                                className="w-full min-h-[100px] p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all text-sm bg-slate-50"
                            />
                        </div>
                    </div>

                    <Button variant="ghost" className="w-full" onClick={() => navigate(`${basePath}/inventory`)}>
                        Start Over / Edit Inventory
                    </Button>

                    {/* Support Contact */}
                    <div className="pt-6 border-t border-slate-100 mt-6 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Need immediate help with your quote?</p>
                        <p className="text-sm font-black text-slate-900 group">
                            Call us at any time: <a href="tel:+27114937569" className="text-red-600 hover:underline">+27 11 493 7569</a>
                        </p>
                        <p className="text-sm font-black text-slate-900 group mt-2">
                            <a href="mailto:info@mastermovers.co.za" className="text-sm font-medium hover:text-red-600 underline underline-offset-4">info@mastermovers.co.za</a>
                        </p>
                    </div>

                    {/* General Disclaimer */}
                    <div className="mt-8 bg-slate-50 border border-slate-200 p-6 rounded-2xl text-center shadow-sm">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-black flex items-center justify-center gap-2">
                            <CheckCircle size={14} className="text-slate-400" />
                            Important Notice
                        </p>
                        <p className="text-sm font-medium text-slate-600 mt-2 max-w-2xl mx-auto leading-relaxed">
                            Prices of quotes are not final until approved by the Master Movers team to see if inventory and location were entered correctly.
                        </p>
                    </div>
                </div>
                {/* Contact Modal for late lead capture */}
                <LeadCaptureModal 
                    isOpen={showLeadModal} 
                    onClose={() => setShowLeadModal(false)}
                    isLoading={isSubmitting}
                    initialData={moveDetails}
                    onSubmit={async (formData) => {
                        setIsSubmitting(true)
                        try {
                            // Update store
                            const contactName = `${formData.name} ${formData.surname}`
                            setMoveDetails({
                                contactName: contactName,
                                contactEmail: formData.email,
                                contactPhone: formData.phone
                            })
                            // Submit lead
                            await submitQuote({ 
                                status: 'lead', 
                                request_call_back: true,
                                client_name: contactName,
                                client_email: formData.email,
                                client_phone: formData.phone,
                                forceNew: true
                            })
                            return true
                        } catch (err) {
                            console.error("Late lead submission error:", err)
                            return false
                        } finally {
                            setIsSubmitting(false)
                        }
                    }}
                />
            </div>
        </div>
    )
}

export default function Step4Summary({ submissionType = 'standard' }) {
    return (
        <ErrorBoundary>
            <Step4SummaryContent submissionType={submissionType} />
        </ErrorBoundary>
    )
}
