import React, { useMemo, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useMoveStore, calculateQuote } from '../inventory/store/moveStore'
import { INVENTORY_ITEMS } from '../inventory/data/mockItems'
import { Button } from '../../components/ui/Button'
import { FileText, CreditCard, Send, CheckCircle, Truck, MapPin, Sparkles } from 'lucide-react'
import { PRICING_CONSTANTS } from '../inventory/data/pricingRates'
import { generateProfessionalQuote } from '../../services/pdfService'
import PayFastCheckout from '../payment/PayFastCheckout'
import PayflexCheckout from '../payment/PayflexCheckout'
import { event } from '../../lib/gtag'
import { ChevronDown, ChevronUp, Plus, Minus, RotateCcw } from 'lucide-react'
import { LOCAL_VEHICLE_RATES } from '../inventory/data/pricingRates'
import clsx from 'clsx'

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
    const { moveDetails, accessDetails, inventory, submitQuote, lastSavedQuote, manualServiceCharges, updateManualServiceCharge } = useMoveStore()
    const location = useLocation()
    const basePath = location.pathname.startsWith('/quote-test') ? '/quote-test' : 
                     location.pathname.startsWith('/admin/quotes/new') ? '/admin/quotes/new' : '/quote';
    const [searchParams, setSearchParams] = useSearchParams()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [showServices, setShowServices] = useState(false)
    const [showAllItems, setShowAllItems] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [showDebug, setShowDebug] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const isStep4Initialized = React.useRef(false)

    // Calculate Totals
    const { totalVolume, total, vat, subTotal, discount, discountType, breakdown, packagingCost, requiresCrateFlag, requiresPhotoFlag, needsConsultation } = useMemo(() => {
        try {
            return calculateQuote(inventory, moveDetails, accessDetails, INVENTORY_ITEMS, manualServiceCharges)
        } catch (e) {
            console.error("Calculation Error:", e)
            return { totalVolume: 0, total: 0, vat: 0, subTotal: 0, discount: 0, discountType: null, packagingCost: 0, requiresCrateFlag: false, requiresPhotoFlag: false, needsConsultation: false, breakdown: { base: 0, transport: 0, volume: 0, access: 0, distance: 0, autoPackagingCost: 0 } }
        }
    }, [inventory, moveDetails, accessDetails, manualServiceCharges])

    // Auto-save on mount if not already saved
    React.useEffect(() => {
        if (moveDetails.contactName && !searchParams.get('saved') && !isStep4Initialized.current) {
            isStep4Initialized.current = true
            // Mapping: standard -> new, test -> lead, admin -> lead
            const initialStatus = (submissionType === 'test' || submissionType === 'admin') ? 'lead' : 'new'

            submitQuote({
                status: initialStatus,
                submission_type: submissionType
            })
        }
    }, [moveDetails.contactName, searchParams, submitQuote, submissionType])

    const handleProceed = async () => {
        if (subTotal < PRICING_CONSTANTS.minOrder) {
            alert(`Minimum Charge Notice:\n\nOur minimum rate for a move is R ${PRICING_CONSTANTS.minOrder.toLocaleString()}.00 + VAT (R ${(PRICING_CONSTANTS.minOrder * 1.15).toFixed(2)}).\n\nYour current quote (R ${subTotal.toFixed(2)} + VAT) is below this amount. Please add more items or services to proceed, or contact us for a custom arrangement.`)
            return
        }

        setIsSubmitting(true)
        try {
            // Save to backend — non-blocking: show payment regardless of result
            const result = await submitQuote({
                status: (submissionType === 'admin') ? 'lead' : 'pending_payment',
                submission_type: submissionType
            })
            
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
                } else {
                    console.warn("Callback update failed:", result.error)
                    alert("Request Sent! We will call you shortly to discuss your move.")
                }
                return
            }

            event({
                action: 'conversion',
                category: 'Lead',
                label: 'Request Call Back',
                value: 1
            })

            const result = await submitQuote({
                status: 'lead',
                request_call_back: true,
                submission_type: submissionType
            })

            // Optimistic success — don't block user if Supabase is flaky
            setSearchParams({ saved: 'true' })
            alert("Request Sent! We will call you shortly to discuss your move.")

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
            event({
                action: 'conversion',
                category: 'Engagement',
                label: 'Download Quote PDF',
                value: 0
            })

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Quote Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold">Estimated Quote</h2>
                                <p className="text-slate-400 text-sm mt-1">Based on provided inventory & distance.</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-primary-500">R {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-widest">Incl. VAT</div>
                                <div className="text-[10px] text-slate-500 mt-1 italic">* Pricing valid for 7 days from date of issue.</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
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
                                            <p className="text-[9px] text-indigo-600 font-bold uppercase">7% Surcharge applies</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">+7%</span>
                                </label>
                            </div>
                        </div>

                        {/* Service Charges Editor */}
                        <div className="border-t border-gray-100 pt-4">
                            <button
                                onClick={() => setShowServices(!showServices)}
                                className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-red-600 transition-colors w-full"
                            >
                                {showServices ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                {showServices ? 'Hide Service Charges' : 'Adjust Service Charges (Testing)'}
                            </button>
                            
                            {showServices && (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
                                    {SERVICE_KEYS.map(({ key, label }) => (
                                        <div key={key} className="flex flex-col gap-1">
                                            <label className="text-xs text-slate-500">{label}</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={manualServiceCharges[key] || ''}
                                                    onChange={(e) => updateManualServiceCharge(key, e.target.value)}
                                                    className="w-full pl-6 pr-3 py-1 text-sm border border-gray-200 rounded focus:border-primary-500 outline-none bg-white"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 px-2">
                                                <div className="w-1 h-4 bg-red-600 rounded-full" />
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Card / Instant EFT</h4>
                                            </div>
                                            <PayFastCheckout
                                                quote={{
                                                    id: lastSavedQuote?.id || 'QUOTE-' + Date.now(),
                                                    total_price: total,
                                                    pickup_address: moveDetails.pickupAddress,
                                                    dropoff_address: moveDetails.dropoffAddress,
                                                    client_name: moveDetails.contactName,
                                                    client_email: moveDetails.contactEmail
                                                }}
                                            />
                                        </div>

                                        {/* Payflex Option */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 px-2">
                                                <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Interest-Free Credit</h4>
                                            </div>
                                            <PayflexCheckout
                                                quote={{
                                                    id: lastSavedQuote?.id || 'QUOTE-' + Date.now(),
                                                    total_price: total
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-red-600 font-bold" onClick={handleGeneratePDF} isLoading={isGenerating}>
                                <FileText size={16} className="mr-2" /> Download PDF
                            </Button>
                            <Button variant="secondary" onClick={handleCallBackRequest} isLoading={isSubmitting}>
                                <div className="flex items-center">
                                    <span className="relative flex h-3 w-3 mr-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    Request Call Back
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Summary Details */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <MapPin size={18} className="text-red-600" /> Move Route
                            </h3>
                            <button 
                                onClick={() => setShowDebug(!showDebug)}
                                className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 text-slate-400 rounded-md hover:bg-slate-900 hover:text-white transition-all"
                            >
                                {showDebug ? 'Hide Calc' : 'Test: View Calc'}
                            </button>
                        </div>

                        {showDebug && (
                            <div className="mb-6 p-4 bg-slate-900 rounded-xl text-white font-mono text-[10px] space-y-3 animate-in zoom-in-95 duration-200">
                                <div className="space-y-1 border-b border-white/10 pb-2">
                                    <div className="flex justify-between">
                                        <span className="text-white/50 uppercase">Transport Cost:</span>
                                        <span className="text-emerald-400 font-bold">R {breakdown.transport.toFixed(2)}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 italic">
                                        Calculation: {breakdown.distance.toFixed(1)}km × R{breakdown.transportRate.toFixed(2)}/km
                                    </div>
                                </div>

                                <div className="space-y-1 border-b border-white/10 pb-2">
                                    <div className="flex justify-between">
                                        <span className="text-white/50 uppercase">Volume Cost:</span>
                                        <span className="text-emerald-400 font-bold">R {breakdown.volume.toFixed(2)}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 italic">
                                        Calculation: {totalVolume.toFixed(2)}ft³ × R{breakdown.volumeRate.toFixed(2)}/ft³
                                    </div>
                                </div>

                                {breakdown.crew > 0 && (
                                    <div className="space-y-1 border-b border-white/10 pb-2">
                                        <div className="flex justify-between">
                                            <span className="text-white/50 uppercase">Specialist Crew:</span>
                                            <span className="text-emerald-400 font-bold">R {breakdown.crew.toFixed(2)}</span>
                                        </div>
                                        <div className="text-[9px] text-slate-500 italic">Heavy Item Surcharge (2x R700)</div>
                                    </div>
                                )}

                                {breakdown.extraDistance > 0 && (
                                    <div className="space-y-1 border-b border-white/10 pb-2">
                                        <div className="flex justify-between">
                                            <span className="text-white/50 uppercase">Extra Distance:</span>
                                            <span className="text-emerald-400 font-bold">R {breakdown.extraDistance.toFixed(2)}</span>
                                        </div>
                                        <div className="text-[9px] text-slate-500 italic uppercase tracking-wider">{breakdown.detailedExtraDistance}</div>
                                    </div>
                                )}

                                {breakdown.access > 0 && (
                                    <div className="space-y-1 border-b border-white/10 pb-2">
                                        <div className="flex justify-between">
                                            <span className="text-white/50 uppercase">Access & Services:</span>
                                            <span className="text-emerald-400 font-bold">R {breakdown.access.toFixed(2)}</span>
                                        </div>
                                        <div className="text-[9px] text-slate-500 italic uppercase tracking-wider">{breakdown.detailedAccess}</div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-white/50 uppercase block">Vehicle:</span>
                                        <span className="text-emerald-400 font-bold">{breakdown.vehicleType}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-white/50 uppercase block">Mode:</span>
                                        <span className="text-emerald-400 font-bold">{breakdown.isSharedLoad ? 'SHARED' : 'DEDICATED'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
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

                    <Button variant="ghost" className="w-full" onClick={() => navigate(`${basePath}/inventory`)}>
                        Start Over / Edit Inventory
                    </Button>

                    {/* Support Contact */}
                    <div className="pt-6 border-t border-slate-100 mt-6 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Need immediate help with your quote?</p>
                        <p className="text-sm font-black text-slate-900 group">
                            Call us at any time: <a href="tel:+27114937569" className="text-red-600 hover:underline">+27 11 493 7569</a>
                        </p>
                    </div>
                </div>
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
