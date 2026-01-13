import React, { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMoveStore, calculateQuote } from '../inventory/store/moveStore'
import { INVENTORY_ITEMS } from '../inventory/data/mockItems'
import { Button } from '../../components/ui/Button'
import { FileText, CreditCard, Send, CheckCircle, Truck, MapPin } from 'lucide-react'
import jsPDF from 'jspdf'
import PayFastCheckout from '../payment/PayFastCheckout'
import PayflexCheckout from '../payment/PayflexCheckout'

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

function Step4SummaryContent() {
    const navigate = useNavigate()
    const { moveDetails, accessDetails, inventory, submitQuote } = useMoveStore()
    const [searchParams, setSearchParams] = useSearchParams()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)

    // Calculate Totals
    const { totalVolume, total, vat, subTotal, breakdown } = useMemo(() => {
        try {
            return calculateQuote(inventory, moveDetails, accessDetails, INVENTORY_ITEMS)
        } catch (e) {
            console.error("Calculation Error:", e)
            return { totalVolume: 0, total: 0, vat: 0, subTotal: 0, breakdown: { base: 0, transport: 0, volume: 0, access: 0, distance: 0 } }
        }
    }, [inventory, moveDetails, accessDetails])

    const handleProceed = async () => {
        setIsSubmitting(true)
        try {
            const result = await submitQuote()

            if (result.success) {
                setSearchParams({ saved: 'true' })
            } else {
                alert('Error submitting quote. Please try again.')
            }
        } catch (error) {
            console.error("Submission Error", error)
            alert(`Failed to submit quote: ${error.message || 'Unknown error'}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleWhatsApp = async () => {
        const phone = prompt("Please enter the number to send to:", moveDetails.contactPhone || '')
        if (!phone) return

        try {
            // Using a saved quote ID if available, otherwise mock something for now
            // Ideally we pass the real quote ID. 
            // For now we'll just trigger the test function.
            // In a real app, you'd pass the actual quote ID from the URL or state after saving.
            // But let's just send the details we have.
            const { success, error, mock } = await useMoveStore.getState().sendWhatsAppNotification(
                'TEST-QUOTE-ID',
                phone,
                'quote_summary',
                [moveDetails.contactName, total.toFixed(2)] // Params for template
            )

            if (success) {
                alert(mock ? 'WhatsApp Mock Success (Function not deployed live yet)' : 'WhatsApp sent successfully!')
            } else {
                alert('Failed to send WhatsApp: ' + (error?.message || 'Unknown error'))
            }
        } catch (e) {
            console.error(e)
            alert('Error sending WhatsApp')
        }
    }

    const handleGeneratePDF = () => {
        setIsGenerating(true)
        try {
            const doc = new jsPDF()

            // Header
            doc.setFontSize(22)
            doc.setTextColor(225, 29, 72) // Primary Red
            doc.text('MasterMovers NextGen', 20, 20)

            doc.setFontSize(12)
            doc.setTextColor(0, 0, 0)
            doc.text('Official Move Quote', 20, 30)
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 36)
            doc.text(`Reference: MM-${Math.floor(Math.random() * 10000)}`, 150, 20)

            // Client Details
            doc.setDrawColor(200, 200, 200)
            doc.line(20, 45, 190, 45)

            doc.setFontSize(14)
            doc.text('Client Details', 20, 55)
            doc.setFontSize(10)
            doc.text(`Name: ${moveDetails.contactName || 'N/A'}`, 20, 62)
            doc.text(`Phone: ${moveDetails.contactPhone || 'N/A'}`, 20, 68)
            doc.text(`Pickup: ${moveDetails.pickupAddress || 'N/A'}`, 20, 74)
            doc.text(`Dropoff: ${moveDetails.dropoffAddress || 'N/A'}`, 20, 80)
            doc.text(`Distance: ${breakdown.distance} km`, 120, 74)
            doc.text(`Volume: ${totalVolume.toFixed(2)} m3`, 120, 80)

            // Cost Breakdown
            doc.line(20, 90, 190, 90)
            doc.setFontSize(14)
            doc.text('Cost Breakdown', 20, 100)

            let y = 110
            const addRow = (label, value) => {
                doc.setFontSize(10)
                doc.text(label, 20, y)
                doc.text(`R ${value.toFixed(2)}`, 160, y, { align: 'right' })
                y += 6
            }

            addRow('Base Fare', breakdown.base)
            addRow('Distance Charge', breakdown.transport)
            addRow('Volume Charge', breakdown.volume)
            addRow('Access Fees', breakdown.access)

            y += 4
            doc.line(20, y, 190, y)
            y += 8
            doc.setFontSize(12)
            doc.setFont(undefined, 'bold')
            doc.text('Subtotal', 20, y)
            doc.text(`R ${subTotal.toFixed(2)}`, 160, y, { align: 'right' })
            y += 6
            doc.text('VAT (15%)', 20, y)
            doc.text(`R ${vat.toFixed(2)}`, 160, y, { align: 'right' })
            y += 10
            doc.setFontSize(16)
            doc.setTextColor(225, 29, 72)
            doc.text('TOTAL', 20, y)
            doc.text(`R ${total.toFixed(2)}`, 160, y, { align: 'right' })

            // Save
            doc.save('MasterMovers_Quote.pdf')
        } catch (e) {
            console.error("PDF Gen Error", e)
            alert("Failed to generate PDF")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
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
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-slate-600">Total Volume</span>
                            <span className="font-medium">{totalVolume.toFixed(2)} m³</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-slate-600">Billable Distance</span>
                            <span className="font-medium">{breakdown.distance ? breakdown.distance.toFixed(0) : (moveDetails.distanceKm || 0)} km</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-slate-600">Transport & Labour</span>
                            <span className="font-medium">R {(breakdown.base + breakdown.transport + breakdown.volume).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-slate-600">Access Fees</span>
                            <span className="font-medium text-orange-600">+ R {breakdown.access.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 space-y-3">
                        {!isSubmitting && !searchParams.get('saved') ? (
                            <Button
                                size="lg"
                                className="w-full flex justify-between items-center group"
                                onClick={handleProceed}
                                isLoading={isSubmitting}
                            >
                                <span>Proceed to Payment</span>
                                <CreditCard size={18} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center mb-2">
                                    <CheckCircle size={16} className="mr-2" />
                                    Quote Saved! Reference: {moveDetails.contactName?.split(' ')[0]}-{Math.floor(Math.random() * 1000)}
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="border border-gray-200 rounded-xl p-4">
                                        <h4 className="font-semibold text-slate-900 mb-3">Option 1: Card / EFT</h4>
                                        <PayFastCheckout
                                            quote={{
                                                id: 'QUOTE-' + Date.now(), // In real app, use actual DB ID
                                                total_price: total,
                                                pickup_address: moveDetails.pickupAddress,
                                                dropoff_address: moveDetails.dropoffAddress,
                                                client_name: moveDetails.contactName,
                                                client_email: moveDetails.contactEmail
                                            }}
                                        />
                                    </div>

                                    <div className="border border-indigo-100 rounded-xl p-0 overflow-hidden">
                                        <PayflexCheckout
                                            quote={{
                                                id: 'QUOTE-' + Date.now(),
                                                total_price: total
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button variant="secondary" onClick={handleGeneratePDF} isLoading={isGenerating}>
                                <FileText size={16} className="mr-2" /> Download PDF
                            </Button>
                            <Button variant="secondary" onClick={handleWhatsApp}>
                                <Send size={16} className="mr-2" /> WhatsApp Me
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Summary Details */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <MapPin size={18} className="text-primary-600" /> Move Route
                        </h3>
                        <div className="space-y-4 pl-4 border-l-2 border-gray-100 relative">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary-600 border-2 border-white ring-1 ring-gray-200" />
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
                            <Truck size={18} className="text-primary-600" /> Top Items
                        </h3>
                        <ul className="space-y-2 text-sm">
                            {Object.entries(inventory || {}).slice(0, 5).map(([id, qty]) => {
                                const item = INVENTORY_ITEMS.find(i => i.id === id)
                                return (
                                    <li key={id} className="flex justify-between border-b border-gray-50 pb-2 last:border-0">
                                        <span className="text-slate-600">{qty}x {item?.name}</span>
                                        <span className="font-medium text-slate-900">{(item?.volume * qty).toFixed(2)} m³</span>
                                    </li>
                                )
                            })}
                            {Object.keys(inventory || {}).length > 5 && (
                                <li className="text-xs text-primary-600 font-medium pt-2 cursor-pointer hover:underline" onClick={() => navigate('/quote/inventory')}>
                                    + {Object.keys(inventory).length - 5} more items
                                </li>
                            )}
                        </ul>
                    </div>

                    <Button variant="ghost" className="w-full" onClick={() => navigate('/quote/inventory')}>
                        Start Over / Edit Inventory
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function Step4Summary() {
    return (
        <ErrorBoundary>
            <Step4SummaryContent />
        </ErrorBoundary>
    )
}
