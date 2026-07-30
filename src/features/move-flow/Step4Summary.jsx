import React, { useMemo, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useMoveStore, calculateQuote, parseInventoryKey } from '../inventory/store/moveStore'
import { INVENTORY_ITEMS } from '../inventory/data/mockItems'
import { Button } from '../../components/ui/Button'
import { FileText, CreditCard, Send, CheckCircle, Truck, MapPin, Sparkles, Phone, ChevronDown, ChevronUp, Plus, Minus, RotateCcw } from 'lucide-react'
import { PRICING_CONSTANTS, LOCAL_VEHICLE_RATES, PACKAGING_RATES } from '../inventory/data/pricingRates'
import { generateProfessionalQuote } from '../../services/pdfService'
import { emailService } from '../../services/emailService'
import PayFastCheckout from '../payment/PayFastCheckout'
import PayflexCheckout from '../payment/PayflexCheckout'
import CouponInput from '../payment/CouponInput'
import { event, trackLeadConversion, trackQuoteSubmit } from '../../lib/gtag'
import clsx from 'clsx'
import { LeadCaptureModal } from './Step1Details'
import { supabase } from '../../lib/supabaseClient'
import { formatClientName, cleanClientName } from '../../utils/quoteHelpers'

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
    const isTestPath = location.pathname.startsWith('/quote-test') || location.pathname.startsWith('/admin/quotes/new')
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
    const [appSettings, setAppSettings] = useState(null)
    const [isLoadingSettings, setIsLoadingSettings] = useState(true)

    // Use sessionStorage key scoped to user email to survive StrictMode double-mounts and page refreshes
    const step4SessionKey = `mm_step4_lead_saved_${moveDetails.contactEmail || 'anon'}`

    const [isCalculating, setIsCalculating] = useState(false)
    const [calcMessage, setCalcMessage] = useState('Analyzing inventory volume...')
    const [appliedCoupon, setAppliedCoupon] = useState(null)

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
                if (data) setAppSettings(data);
            } catch (err) {
                console.error("Failed to fetch app settings:", err);
            } finally {
                setIsLoadingSettings(false);
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
    const { totalVolume, total, vat, subTotal, discount, discountType, breakdown, packagingCost, standardInsurance, requiresCrateFlag, requiresPhotoFlag, needsConsultation, isNationalMove, needsQuoteRequest, isMonthEnd, isMinQuote } = useMemo(() => {
        try {
            return calculateQuote(inventory, moveDetails, accessDetails, INVENTORY_ITEMS, manualServiceCharges)
        } catch (e) {
            console.error("Calculation Error:", e)
            return { totalVolume: 0, total: 0, vat: 0, subTotal: 0, discount: 0, discountType: null, packagingCost: 0, standardInsurance: 0, requiresCrateFlag: false, requiresPhotoFlag: false, needsConsultation: false, isNationalMove: false, needsQuoteRequest: false, isMonthEnd: false, isMinQuote: false, breakdown: { base: 0, transport: 0, volume: 0, access: 0, distance: 0, autoPackagingCost: 0 } }
        }
    }, [inventory, moveDetails, accessDetails, manualServiceCharges])

    // Apply coupon discount on top of calculated total (blocked during month-end or minimum rate quotes)
    const canApplyCoupon = !isMonthEnd && !isMinQuote
    const couponDiscount = (appliedCoupon && canApplyCoupon) ? (
        appliedCoupon.discount_type === 'fixed' ? appliedCoupon.discount_amount : (total * appliedCoupon.discount_percent) / 100
    ) : 0
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
            clientName: formatClientName(moveDetails.contactName, moveDetails.surname),
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
            alert(`Minimum Charge Notice:\n\nOur minimum rate for a local move is R ${PRICING_CONSTANTS.minOrder.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.00 + VAT (R ${(PRICING_CONSTANTS.minOrder * 1.15).toFixed(2)}).\n\nYour current quote (R ${subTotal.toFixed(2)} + VAT) is below this amount. Please add more items or services to proceed, or contact us for a custom arrangement.`)
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
            
            // Use returned data OR fall back to the lastSavedQuote already in store
            // (Supabase RLS may block SELECT on insert/update, returning success but null data)
            const savedQuote = result.data?.[0] || lastSavedQuote
            if (result.success && savedQuote) {

                if (submissionType !== 'admin') {
                    emailService.sendPendingQuoteAlert({
                        quoteId: savedQuote.id,
                        clientName: formatClientName(moveDetails.contactName, moveDetails.surname),
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

    const handleCustomQuoteRequest = async () => {
        setIsSubmitting(true)
        try {
            const result = await submitQuote({
                status: 'lead',
                request_call_back: true,
                forceNew: false
            })
            
            const savedQuote = result.data?.[0] || lastSavedQuote
            if (result.success && savedQuote) {
                await emailService.sendCallbackEmail({
                    name: formatClientName(moveDetails.contactName, moveDetails.surname),
                    email: moveDetails.contactEmail,
                    phone: moveDetails.contactPhone,
                    step: 'Step 4 - Custom Quote Redirect (>80km or Outline)',
                    pickup: moveDetails.pickupAddress,
                    dropoff: moveDetails.dropoffAddress,
                    moveDate: moveDetails.moveDate
                })
            }
        } catch (error) {
            console.error('Error submitting custom quote request:', error)
        } finally {
            setIsSubmitting(false)
            setSearchParams({ saved: 'true' })
        }
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
                    name: formatClientName(moveDetails.contactName, moveDetails.surname),
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
                clientName: formatClientName(moveDetails.contactName, moveDetails.surname),
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
                accessDetails: accessDetails,
                moveDetails: moveDetails,
                generalNotes: moveDetails.generalNotes || moveDetails.notes || '',
                extraCollections: moveDetails.extraCollections || [],
                extraDrops: moveDetails.extraDrops || [],
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
                {isLoadingSettings ? (
                    <div className="bg-slate-50 rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col justify-center items-center min-h-[300px] animate-pulse">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin mb-4"></div>
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Pricing...</div>
                    </div>
                ) : !isTestPath && appSettings && appSettings.pricing_active === false ? (
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
                ) : needsQuoteRequest ? (
                    /* Custom Rate Request Card for Outline or Depot > 80km */
                    <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden text-white flex flex-col justify-between">
                        <div className="p-8 text-center bg-slate-950/40 border-b border-slate-800">
                            <div className="w-16 h-16 bg-red-950/50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-900/50 animate-pulse">
                                <Phone size={32} />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Custom Rate Required</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none mt-1">Extended Depot Logistics</p>
                        </div>
                        
                        <div className="p-8 space-y-6 flex-grow text-left">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Because your move involves outline provinces/regions or collection/delivery logistics extending over 80km from our central depots, we require custom route scheduling to offer you the most accurate and competitive price.
                            </p>
                            
                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/40 text-xs text-slate-400 space-y-2">
                                <div className="flex justify-between">
                                    <span>Pickup Address:</span>
                                    <strong className="text-slate-200">{moveDetails.pickupAddress?.split(',')[0]}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span>Dropoff Address:</span>
                                    <strong className="text-slate-200">{moveDetails.dropoffAddress?.split(',')[0]}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span>Logistics Type:</span>
                                    <strong className="text-red-400">Outline / Long Distance (&gt;80km)</strong>
                                </div>
                            </div>
                            
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-4 rounded-xl">
                                <strong>No Payment Required Now:</strong> Submit your details below, and one of our dedicated coordinators will email your professional quote shortly.
                            </div>
                        </div>

                        <div className="p-6 bg-slate-950/40 border-t border-slate-800 space-y-3">
                            {searchParams.get('saved') === 'true' ? (
                                <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs p-4 rounded-xl text-center">
                                    <strong>✓ Thank you! Your request has been received.</strong><br/>
                                    One of our consultants will contact you shortly with your custom quote.
                                </div>
                            ) : (
                                <Button
                                    size="lg"
                                    className="w-full flex justify-between items-center group bg-[#e31837] hover:bg-[#c0152f] shadow-xl shadow-red-600/20 py-6"
                                    onClick={handleCustomQuoteRequest}
                                    isLoading={isSubmitting}
                                >
                                    <span className="font-black uppercase tracking-widest text-sm">Submit Quote Request</span>
                                    <Send size={18} />
                                </Button>
                            )}
                        </div>
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
                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Subtotal (ex-VAT)</div>
                                        <div className="text-sm font-bold text-slate-300">R {subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-2 mb-1">VAT (15%)</div>
                                        <div className="text-sm font-bold text-slate-300">R {vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        {breakdown?.payflexSurcharge > 0 && (
                                            <>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-2 mb-1">Payflex Surcharge (7%)</div>
                                                <div className="text-sm font-bold text-slate-300">R {breakdown.payflexSurcharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                            </>
                                        )}
                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-2 mb-1">Total (incl. VAT)</div>
                                        <div className="text-lg font-bold text-slate-500 line-through">R {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div className="text-3xl font-bold text-emerald-400">R {discountedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">
                                            {appliedCoupon.discount_type === 'fixed' ? `-R ${appliedCoupon.discount_amount}` : `-${appliedCoupon.discount_percent}%`} Coupon Applied!
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Subtotal (ex-VAT)</div>
                                        <div className="text-sm font-bold text-slate-300">R {subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-2 mb-1">VAT (15%)</div>
                                        <div className="text-sm font-bold text-slate-300">R {vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        {breakdown?.payflexSurcharge > 0 && (
                                            <>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-2 mb-1">Payflex Surcharge (7%)</div>
                                                <div className="text-sm font-bold text-slate-300">R {breakdown.payflexSurcharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                            </>
                                        )}
                                        <div className="w-full border-t border-slate-700 my-2"></div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Total (incl. VAT)</div>
                                        <div className="text-3xl font-bold text-primary-500">R {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </>
                                )}
                                <div className="text-[10px] text-slate-500 mt-2 italic">* Pricing valid for 7 days from date of issue.</div>
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
                        {packagingCost > 0 && (() => {
                            const isBoxesOnly = moveDetails.packagingOption === 'boxes_only'
                            const rates = isBoxesOnly ? PACKAGING_RATES.sendMeBoxesOnly : PACKAGING_RATES.boxesAndPacking
                            const st7Qty   = moveDetails.st7Boxes || 0
                            const linenQty = moveDetails.linenBoxes || 0
                            const st7Total   = st7Qty   * rates.st7
                            const linenTotal = linenQty * rates.linen
                            const deliveryFee = isBoxesOnly ? (rates.deliveryFee || 0) : 0
                            return (
                                <div className="space-y-2 py-4 border-b border-gray-100">
                                    <div className="flex justify-between items-center bg-slate-100 rounded-lg p-4 mb-2">
                                        <span className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Box Supplies & Packing</span>
                                        <span className="font-bold text-slate-900">+ R {packagingCost.toFixed(2)}</span>
                                    </div>
                                    <div className="pl-4 space-y-1.5 mt-1">
                                        {st7Qty > 0 && (
                                            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                <span>{st7Qty}× ST7 Boxes <span className="text-slate-300 font-medium normal-case">@ R{rates.st7.toFixed(2)} ea</span></span>
                                                <span className="text-slate-500">R {st7Total.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {linenQty > 0 && (
                                            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                <span>{linenQty}× Linen Boxes <span className="text-slate-300 font-medium normal-case">@ R{rates.linen.toFixed(2)} ea</span></span>
                                                <span className="text-slate-500">R {linenTotal.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {deliveryFee > 0 && (
                                            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                <span>Delivery &amp; Handling Fee</span>
                                                <span className="text-slate-500">R {deliveryFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })()}

                        {/* Heavy Item Crew */}
                        {breakdown.crew > 0 && (
                            <div className="space-y-2 py-4 border-b border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                                        Heavy Item Logistics
                                    </span>
                                    <span className="font-bold text-slate-900">+ R {breakdown.crew.toFixed(2)}</span>
                                </div>
                                <div className="pl-4 space-y-1.5 mt-1">
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                        <span>Specialist Crew (Heavy Items)</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Protective Wrapping & Sleeves */}
                        {(breakdown.wrappingCost > 0 || breakdown.plasticSleeveCost > 0) && (
                            <div className="space-y-2 py-4 border-b border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Specialized Wrapping & Covers</span>
                                    <span className="font-bold text-slate-900">+ R {(breakdown.wrappingCost + breakdown.plasticSleeveCost).toFixed(2)}</span>
                                </div>
                                <div className="pl-4 space-y-1.5 mt-1">
                                    {breakdown.wrappingCost > 0 && (
                                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                            <span>Specialized Furniture Wrapping</span>
                                            <span className="text-slate-500">R {breakdown.wrappingCost.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {breakdown.plasticSleeveCost > 0 && (
                                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                            <span>Mattress / Couch Plastic Sleeves <span className="text-slate-300 font-medium normal-case">@ R55.00 ea</span></span>
                                            <span className="text-slate-500">R {breakdown.plasticSleeveCost.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Access & Special Services */}
                        {breakdown.access > 0 && (
                            <div className="space-y-2 py-4 border-b border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Access & Special Services</span>
                                    <span className="font-bold text-slate-900">+ R {breakdown.access.toFixed(2)}</span>
                                </div>
                                <div className="pl-4 space-y-1.5 mt-1">
                                    {breakdown.detailedAccess && breakdown.detailedAccess.length > 0 ? (
                                        breakdown.detailedAccess.map((detail, index) => {
                                            const parts = detail.split(':')
                                            const label = parts[0]?.trim()
                                            const value = parts[1]?.trim()
                                            return (
                                                <div key={index} className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                    <span>{label}</span>
                                                    <span className="text-slate-500">{value}</span>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                            <span>Standard Access</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Shuttle Vehicle Fee */}
                        {breakdown.shuttleCost > 0 && (
                            <div className="space-y-2 py-4 border-b border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                                        Shuttle Vehicle Surcharge
                                    </span>
                                    <span className="font-bold text-slate-900">+ R {breakdown.shuttleCost.toFixed(2)}</span>
                                </div>
                                <div className="pl-4 space-y-1.5 mt-1">
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                        <span>Required due to site restrictions or carry distance &gt; 90m</span>
                                        <span className="text-slate-500">R {breakdown.shuttleCost.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Move Protection is bundled into Transport Services */}
                        
                        {/* Documentation Fee */}
                        {breakdown.documentationFee > 0 && (
                            <div className="space-y-2 py-4 border-b border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                                        Documentation Fee
                                    </span>
                                    <span className="font-bold text-slate-900">+ R {breakdown.documentationFee.toFixed(2)}</span>
                                </div>
                                <div className="pl-4 space-y-1.5 mt-1">
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                        <span>Standard Documentation & Admin</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Master Movers Storage Fee */}
                        {breakdown.storageCost > 0 && (
                            <div className="space-y-2 py-4 border-b border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                                        📦 Master Movers Storage (Monthly Fee)
                                    </span>
                                    <span className="font-bold text-slate-900">+ R {breakdown.storageCost.toFixed(2)}</span>
                                </div>
                                <div className="pl-4 space-y-1.5 mt-1">
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                        <span>{breakdown.storageDestination} Depot · {totalVolume?.toFixed(2)} ft³ × R1.50/cuft/mo{breakdown.storageCost === (PRICING_CONSTANTS.minStorageFee || 450) && (totalVolume * 1.5 < (PRICING_CONSTANTS.minStorageFee || 450)) ? ` (Min. R${PRICING_CONSTANTS.minStorageFee || 450}/mo)` : ''}</span>
                                        <span className="text-slate-500">R {breakdown.storageCost.toFixed(2)}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">Note: Delivery out of storage is not included</p>
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
                                isDisabled={!canApplyCoupon}
                                disabledReason={
                                    isMonthEnd ? 'Discounts are disabled during month-end periods (days 1-4 & 25-31).' :
                                    isMinQuote ? 'Discounts cannot be applied to minimum-rate quotes.' : ''
                                }
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
                                            <p className="text-[9px] text-indigo-600 font-bold uppercase">Pay in 4 · No interest</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest bg-indigo-100 px-2 py-0.5 rounded-full">+7% Applied</span>
                                        <div className="group relative">
                                            <div className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[9px] font-black cursor-help hover:bg-indigo-300 transition-colors">i</div>
                                            <div className="absolute right-0 bottom-full mb-2 w-56 bg-slate-900 text-white text-[10px] font-medium rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50 leading-relaxed">
                                                A <strong>7% surcharge</strong> is added when paying via Payflex. This covers the platform commission charged to Master Movers by Payflex, which is passed on to the client.
                                                <div className="absolute right-2 top-full border-8 border-transparent border-t-slate-900" />
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {discount > 0 && (
                            <div className="flex justify-between items-center py-4 border-b border-green-100 bg-green-50 px-4 -mx-4 rounded-xl">
                                <div>
                                    <span className="text-green-800 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                        <Sparkles size={16} className="animate-pulse" /> Mid-Month Discount (10%)
                                    </span>
                                    <span className="text-green-600 text-[10px] font-bold">Applied on ex-VAT subtotal</span>
                                </div>
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
                                                        client_name: formatClientName(moveDetails.contactName, moveDetails.surname) || 'Anonymous',
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
                                                        client_name: formatClientName(moveDetails.contactName, moveDetails.surname) || 'Anonymous',
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
                        <div className="space-y-4 pl-4 border-l-2 border-slate-200 relative">
                            {/* Primary Pickup */}
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-red-600 border-2 border-white ring-1 ring-gray-200" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Pickup</p>
                                <p className="font-bold text-slate-900 text-sm">{moveDetails.pickupAddress || 'Not set'}</p>
                                {moveDetails.pickupUnitComplex && (
                                    <p className="text-xs text-slate-500 font-medium">Unit/Complex: {moveDetails.pickupUnitComplex}</p>
                                )}
                                <div className="text-xs text-slate-600 mt-1 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    {(() => {
                                        const a = accessDetails.origin || {}
                                        const parts = [(a.type || 'House').toUpperCase()]
                                        if (a.floorLevel > 0) parts.push(`Floor ${a.floorLevel}`)
                                        if (a.elevator) parts.push('Elevator: Yes')
                                        if (a.stairs) parts.push('Stairs: Yes')
                                        if (a.longCarryMeters > 0) parts.push(`Long Carry: ${a.longCarryMeters}m`)
                                        if (a.specialConditions?.hoisting) parts.push('Hoisting Required')
                                        if (a.specialConditions?.shuttle) parts.push('Shuttle Required')
                                        if (a.notes) parts.push(`Notes: ${a.notes}`)
                                        return parts.join(' • ')
                                    })()}
                                </div>
                            </div>

                            {/* Additional Collections */}
                            {(moveDetails.extraCollections || []).map((coll, idx) => (
                                <div key={coll.id || idx} className="relative pt-4">
                                    <div className="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-red-400 border-2 border-white ring-1 ring-gray-200" />
                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Additional Collection #{idx + 2}</p>
                                    <p className="font-bold text-slate-900 text-sm">{coll.address || 'Not set'}</p>
                                    {coll.unitComplex && <p className="text-xs text-slate-500 font-medium">Unit/Complex: {coll.unitComplex}</p>}
                                    <div className="text-xs text-slate-600 mt-1 font-medium bg-red-50/50 p-2 rounded-lg border border-red-100">
                                        {(() => {
                                            const a = accessDetails[`extra_coll_${idx}`] || {}
                                            const parts = [(a.type || 'House').toUpperCase()]
                                            if (a.floorLevel > 0) parts.push(`Floor ${a.floorLevel}`)
                                            if (a.elevator) parts.push('Elevator: Yes')
                                            if (a.stairs) parts.push('Stairs: Yes')
                                            if (a.longCarryMeters > 0) parts.push(`Long Carry: ${a.longCarryMeters}m`)
                                            if (a.specialConditions?.hoisting) parts.push('Hoisting Required')
                                            if (a.notes) parts.push(`Notes: ${a.notes}`)
                                            return parts.join(' • ')
                                        })()}
                                    </div>
                                </div>
                            ))}

                            {/* Primary Dropoff */}
                            <div className="relative pt-4">
                                <div className="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-slate-900 border-2 border-white ring-1 ring-gray-200" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Dropoff</p>
                                <p className="font-bold text-slate-900 text-sm">{moveDetails.dropoffAddress || (moveDetails.storageDestination ? `Master Movers Storage (${moveDetails.storageDestination})` : 'Not set')}</p>
                                {moveDetails.dropoffUnitComplex && (
                                    <p className="text-xs text-slate-500 font-medium">Unit/Complex: {moveDetails.dropoffUnitComplex}</p>
                                )}
                                <div className="text-xs text-slate-600 mt-1 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    {(() => {
                                        const a = accessDetails.destination || {}
                                        const parts = [(a.type || 'House').toUpperCase()]
                                        if (a.floorLevel > 0) parts.push(`Floor ${a.floorLevel}`)
                                        if (a.elevator) parts.push('Elevator: Yes')
                                        if (a.stairs) parts.push('Stairs: Yes')
                                        if (a.longCarryMeters > 0) parts.push(`Long Carry: ${a.longCarryMeters}m`)
                                        if (a.specialConditions?.hoisting) parts.push('Hoisting Required')
                                        if (a.specialConditions?.shuttle) parts.push('Shuttle Required')
                                        if (a.notes) parts.push(`Notes: ${a.notes}`)
                                        return parts.join(' • ')
                                    })()}
                                </div>
                            </div>

                            {/* Additional Drop-offs */}
                            {(moveDetails.extraDrops || []).map((drop, idx) => (
                                <div key={drop.id || idx} className="relative pt-4">
                                    <div className="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-slate-600 border-2 border-white ring-1 ring-gray-200" />
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Additional Drop-off #{idx + 2}</p>
                                    <p className="font-bold text-slate-900 text-sm">{drop.address || 'Not set'}</p>
                                    {drop.unitComplex && <p className="text-xs text-slate-500 font-medium">Unit/Complex: {drop.unitComplex}</p>}
                                    <div className="text-xs text-slate-600 mt-1 font-medium bg-slate-100 p-2 rounded-lg border border-slate-200">
                                        {(() => {
                                            const a = accessDetails[`extra_drop_${idx}`] || {}
                                            const parts = [(a.type || 'House').toUpperCase()]
                                            if (a.floorLevel > 0) parts.push(`Floor ${a.floorLevel}`)
                                            if (a.elevator) parts.push('Elevator: Yes')
                                            if (a.stairs) parts.push('Stairs: Yes')
                                            if (a.longCarryMeters > 0) parts.push(`Long Carry: ${a.longCarryMeters}m`)
                                            if (a.specialConditions?.hoisting) parts.push('Hoisting Required')
                                            if (a.notes) parts.push(`Notes: ${a.notes}`)
                                            return parts.join(' • ')
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-slate-900 mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Truck size={18} className="text-red-600" /> Inventory Items by Room
                            </span>
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                                {Object.values(inventory || {}).reduce((a, b) => a + b, 0)} Items Total
                            </span>
                        </h3>
                        {(() => {
                            const grouped = {}
                            Object.entries(inventory || {}).forEach(([idKey, qty]) => {
                                if (!qty || qty <= 0) return
                                const parsed = parseInventoryKey(idKey)
                                const item = INVENTORY_ITEMS.find(i => i.id === parsed.itemId)
                                const roomCategory = parsed.room || item?.category || 'General Furniture'
                                if (!grouped[roomCategory]) grouped[roomCategory] = []
                                grouped[roomCategory].push({ idKey, itemId: parsed.itemId, variation: parsed.variation, room: roomCategory, item, qty })
                            })

                            if (Object.keys(grouped).length === 0) {
                                return <p className="text-xs text-slate-400">No inventory items added.</p>
                            }

                            return (
                                <div className="space-y-4 text-sm">
                                    {Object.entries(grouped).map(([room, itemsList]) => {
                                        const roomQty = itemsList.reduce((acc, i) => acc + i.qty, 0)
                                        return (
                                            <div key={room} className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
                                                <div className="bg-slate-50/80 px-4 py-2 flex items-center justify-between border-b border-slate-100">
                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                                        🏠 {room}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                        {roomQty} item{roomQty === 1 ? '' : 's'}
                                                    </span>
                                                </div>
                                                <ul className="divide-y divide-gray-50 px-4 py-1">
                                                    {itemsList.map(({ idKey, item, qty, variation }) => {
                                                        const hasShield = item?.autoPackagingType || (variation === 'Glass' || variation === 'Marble')
                                                        return (
                                                            <li key={idKey} className="py-2 text-xs">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-slate-700 font-bold">
                                                                        {qty}× {item?.name || idKey} {variation ? <span className="text-slate-400 text-[10px] font-normal uppercase">({variation})</span> : ''}
                                                                    </span>
                                                                    <span className="font-bold text-slate-400 text-[10px] uppercase bg-slate-50 px-1.5 py-0.5 rounded">Included</span>
                                                                </div>
                                                                {hasShield && (
                                                                    <div className="text-[10px] text-emerald-600 font-semibold italic mt-0.5">
                                                                        🛡 Protective wrapping included
                                                                    </div>
                                                                )}
                                                                {item?.requiresPhoto && (
                                                                    <div className="text-[10px] text-purple-600 font-semibold italic mt-0.5">
                                                                        📸 Photo verification required
                                                                    </div>
                                                                )}
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })()}
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
                            <a href="mailto:sales1@mastermoversjhb.co.za" className="text-sm font-medium hover:text-red-600 underline underline-offset-4">sales1@mastermoversjhb.co.za</a>
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
                            const fullName = formatClientName(formData.name, formData.surname)
                            setMoveDetails({
                                contactName: formData.name,
                                surname: formData.surname,
                                contactEmail: formData.email,
                                contactPhone: formData.phone
                            })
                            // Submit lead
                            await submitQuote({ 
                                status: 'lead', 
                                request_call_back: true,
                                client_name: fullName,
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
