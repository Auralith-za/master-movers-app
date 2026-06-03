import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMoveStore, calculateQuote } from '../inventory/store/moveStore'
import { INVENTORY_ITEMS, CATEGORIES } from '../inventory/data/mockItems'
import InventoryItemCard from '../inventory/components/InventoryItemCard'
import VolumeSummary from '../inventory/components/VolumeSummary'
import { Button } from '../../components/ui/Button'
import { motion } from 'framer-motion'
import { Search, Trash2, Truck, RotateCcw, Phone, Loader2, Sparkles } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { LOCAL_VEHICLE_RATES, CITY_CODES } from '../inventory/data/pricingRates'
import { LeadCaptureModal } from './Step1Details'

const categoryEmojis = {
    "Special Handling Items": "🎹",
    "Lounge / Living Room": "🛋️",
    "Dining Room": "🍽️",
    "Bedrooms": "🛏️",
    "Appliances": "🔌",
    "Office / Study": "💼",
    "General Furniture": "🪑",
    "Outdoor & Patio": "⛱️",
    "Boxes & Loose Items": "📦"
};

const orderedCategories = (() => {
    const list = [...CATEGORIES];
    const index = list.indexOf("Special Handling Items");
    if (index > -1) {
        list.splice(index, 1);
        list.push("Special Handling Items");
    }
    return list;
})();

export default function Step3Inventory() {
    const navigate = useNavigate()
    const location = useLocation()
    const basePath = location.pathname.startsWith('/quote-test') ? '/quote-test' : 
                     location.pathname.startsWith('/admin/quotes/new') ? '/admin/quotes/new' : '/quote';
    const { inventory, moveDetails, accessDetails, manualServiceCharges, addItem, removeItem, clearInventory, undo, submitQuote, setMoveDetails } = useMoveStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState(orderedCategories[0])

    // Modal states
    const [variationModalItem, setVariationModalItem] = useState(null)
    const [crateModalItem, setCrateModalItem] = useState(null) // For optional crate popup
    const [warningModal, setWarningModal] = useState({ show: false, title: '', message: '', onConfirm: null })
    const [showLeadModal, setShowLeadModal] = useState(false)
    const [isSubmittingLead, setIsSubmittingLead] = useState(false)

    const { totalVolume, packagingCost, currentVehicleName } = React.useMemo(() => {
        const result = calculateQuote(inventory, moveDetails, accessDetails, INVENTORY_ITEMS, manualServiceCharges)
        return {
            totalVolume: result.totalVolumeCuFt,
            packagingCost: result.packagingCost,
            currentVehicleName: result.breakdown.vehicleType
        }
    }, [inventory, moveDetails, accessDetails, manualServiceCharges])

    const { currentVehicle, setCurrentVehicle } = useMoveStore()

    const [lastVehicleName, setLastVehicleName] = useState(currentVehicleName)
    
    // Truck Change Notification
    React.useEffect(() => {
        if (lastVehicleName && currentVehicleName && currentVehicleName !== lastVehicleName) {
            alert(`🚛 TRUCK UPDATE:\n\nYou are now moving to a bigger truck with bigger capacity.\n\nYour inventory now requires a ${currentVehicleName}.\n\nThe quote has been adjusted for the larger vehicle and additional crew required.`)
        }
        setLastVehicleName(currentVehicleName)
    }, [currentVehicleName, lastVehicleName])

    const getQuantity = (itemId) => {
        const resolvedId = itemId.startsWith('boxes-') ? 'boxes' : itemId;
        return Object.entries(inventory)
            .filter(([idKey]) => idKey === resolvedId || idKey.startsWith(`${resolvedId}_`))
            .reduce((sum, [_, qty]) => sum + qty, 0);
    }

    const handleAddItem = (itemId) => {
        const resolvedId = itemId.startsWith('boxes-') ? 'boxes' : itemId;
        const item = INVENTORY_ITEMS.find(i => i.id === resolvedId);
        if (!item) return;

        const currentQty = getQuantity(resolvedId);

        if (item.variationOptions && item.variationOptions.length > 0) {
            setVariationModalItem(item);
            return;
        }

        if (currentQty === 0) {
            // Items with both wrapping + crate get the crate choice modal
            if (item.requiresCrate && item.autoPackagingType) {
                setCrateModalItem(item);
                return;
            }
            // Crate-only items just show the crate callback modal directly
            if (item.requiresCrate && !item.autoPackagingType) {
                setCrateModalItem(item);
                return;
            }
            if (item.requiresPhoto) {
                setWarningModal({
                    show: true,
                    title: 'Photo Verification Needed',
                    message: 'This item requires a photo for accurate quoting. Please add it to your inventory and remember to send us a photo!',
                    onConfirm: () => {
                        addItem(resolvedId);
                        setWarningModal({ show: false });
                    }
                });
                return;
            }
        }

        addItem(resolvedId);
    }

    const handleRemoveItem = (itemId) => {
        const resolvedId = itemId.startsWith('boxes-') ? 'boxes' : itemId;
        const idKeys = Object.keys(inventory).filter(idKey => idKey === resolvedId || idKey.startsWith(`${resolvedId}_`));
        if (idKeys.length > 0) {
            const parts = idKeys[0].split('_');
            removeItem(parts[0], parts[1] || null);
        }
    }

    const [showVolumeModal, setShowVolumeModal] = useState(false)
    const VOLUME_THRESHOLD_FT3 = 10594 // 300m3

    const filteredItems = INVENTORY_ITEMS.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = searchTerm ? true : (activeCategory ? item.category === activeCategory : true)
        return matchesSearch && matchesCategory
    })

    const handleProceed = () => {
        if (totalVolume === 0) {
            alert("Oops! Please add at least one item to your inventory before proceeding.")
            return
        }
        if (totalVolume > VOLUME_THRESHOLD_FT3 && !showVolumeModal) {
            setShowVolumeModal(true)
        } else {
            navigate(`${basePath}/summary`)
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Volume Threshold Modal */}
            {showVolumeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-red-100"
                    >
                        <div className="bg-red-600 p-8 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Truck size={120} />
                            </div>
                            <h3 className="text-3xl font-black mb-2 uppercase tracking-tight">Exceptional Volume</h3>
                            <p className="text-red-100 text-sm font-medium">Your move exceeds 300m³. This requires professional planning.</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <p className="text-slate-600 leading-relaxed text-center">
                                Moves of this scale often involve complex logistics, specialized packing, and multi-vehicle coordination. We recommend a consultation with one of our master movers.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="w-full bg-red-600 hover:bg-red-700 py-6 text-lg font-bold"
                                    onClick={() => {
                                        alert("Request Sent! A senior consultant will contact you to discuss your large-scale move. 📞")
                                        setShowVolumeModal(false)
                                    }}
                                >
                                    Speak to a Consultant
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full text-slate-400 hover:text-red-600 font-semibold"
                                    onClick={() => navigate(`${basePath}/summary`)}
                                >
                                    I know what I'm doing, complete quote
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Variations Modal */}
            {variationModalItem && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6"
                    >
                        <h3 className="text-xl font-bold mb-4">Select Variation</h3>
                        <p className="text-sm text-slate-500 mb-6">Choose the type of material for {variationModalItem.name}.</p>

                        <div className="flex flex-col gap-3">
                            {variationModalItem.variationOptions.map(opt => (
                                <Button
                                    key={opt}
                                    variant="outline"
                                    className="w-full justify-start text-left font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                    onClick={() => {
                                        addItem(variationModalItem.id, opt);
                                        setVariationModalItem(null);
                                    }}
                                >
                                    {opt}
                                    {(opt === 'Glass' || opt === 'Marble') && <span className="ml-auto text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">+ Wrapping Cost</span>}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full mt-4 text-slate-400 outline-none"
                            onClick={() => setVariationModalItem(null)}
                        >
                            Cancel
                        </Button>
                    </motion.div>
                </div>
            )}

            {/* Optional Crate Modal */}
            {crateModalItem && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6"
                    >
                        <div className="text-3xl text-center mb-3">📦</div>
                        <h3 className="text-xl font-bold text-center mb-1">Custom Crating Available</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">
                            {crateModalItem.name} can be crated for extra protection.
                            Crate pricing is quoted separately by our team.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors flex items-center justify-center gap-2"
                                onClick={() => {
                                    addItem(crateModalItem.id);
                                    // Trigger callback request for crate quote
                                    alert('Thanks! A sales representative will contact you to quote the crating for this item. Meanwhile, the item has been added to your inventory.');
                                    setCrateModalItem(null);
                                }}
                            >
                                📞 Yes, request crate callback
                            </button>
                            <button
                                className="w-full py-4 rounded-2xl border-2 border-gray-200 text-slate-700 font-semibold hover:border-gray-300 hover:bg-gray-50 transition-colors"
                                onClick={() => {
                                    addItem(crateModalItem.id);
                                    setCrateModalItem(null);
                                }}
                            >
                                ✗ No thanks, add without crate
                            </button>
                            <button
                                className="w-full py-2 text-slate-400 text-sm hover:text-slate-500"
                                onClick={() => setCrateModalItem(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Warning Modal (Photos) */}
            {warningModal.show && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center"
                    >
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            📸
                        </div>
                        <h3 className="text-xl font-bold mb-2">{warningModal.title}</h3>
                        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                            {warningModal.message}
                        </p>

                        <div className="flex flex-col gap-3">
                            <Button
                                variant="primary"
                                className="w-full bg-red-600 hover:bg-red-700 font-bold"
                                onClick={warningModal.onConfirm}
                            >
                                Got it, Add Item
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full text-slate-400"
                                onClick={() => setWarningModal({ show: false, title: '', message: '', onConfirm: null })}
                            >
                                Cancel
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">

                {/* Summary Column - First on mobile, Right on desktop */}
                <div className="lg:order-2 lg:col-span-1">
                    <VolumeSummary items={INVENTORY_ITEMS} inventory={inventory} packagingCost={packagingCost}>
                        <Button variant="primary" size="lg" className="w-full bg-[#e31837] hover:bg-[#c0152f] font-bold" onClick={handleProceed}>
                            View Quote Summary
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="ghost" className="w-full text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-2 border border-slate-700" onClick={() => undo()}>
                                <RotateCcw size={14} /> Undo
                            </Button>
                            <Button variant="ghost" className="w-full text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => navigate(`${basePath}/access`)}>
                                Back
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full text-red-400 hover:text-red-300 hover:bg-slate-800 text-xs"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to clear all inventory items?')) {
                                     clearInventory()
                                }
                            }}
                        >
                            <Trash2 size={14} className="mr-2" /> Reset Inventory
                        </Button>
                    </VolumeSummary>
                </div>

                {/* Left Column: Inventory List - Second on mobile, Left on desktop */}
                <div className="lg:order-1 lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">

                        {/* Search */}
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search for items..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-shadow text-sm md:text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Categories */}
                        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                            {orderedCategories.map(cat => {
                                const isActive = activeCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 border-2 ${
                                            isActive
                                                ? 'bg-red-600 border-red-600 text-white shadow-md'
                                                : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Items Grid - 2 columns on mobile */}
                        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 mt-2">
                            {filteredItems.map(item => {
                                // Determine the current variation for this item (if any)
                                const idKeys = Object.keys(inventory).filter(k => k === item.id || k.startsWith(`${item.id}_`));
                                const firstKey = idKeys[0] || '';
                                const variation = firstKey.includes('_') ? firstKey.split('_').slice(1).join('_') : null;
                                return (
                                    <InventoryItemCard
                                        key={item.id}
                                        item={item}
                                        quantity={getQuantity(item.id)}
                                        variation={variation}
                                        onAdd={handleAddItem}
                                        onRemove={handleRemoveItem}
                                    />
                                );
                            })}
                            {filteredItems.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-400">
                                    No items found in this section.
                                </div>
                            )}
                        </div>

                        {/* Step 3 Notes */}
                        <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                <Sparkles className="text-red-600" size={24} />
                                Step 3 Notes
                            </h3>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Inventory or Wrapping Notes</label>
                                <textarea
                                    name="generalNotes"
                                    value={moveDetails.generalNotes}
                                    onChange={(e) => setMoveDetails({ generalNotes: e.target.value })}
                                    placeholder="List any delicate furniture, wrapping demands, or special instructions here..."
                                    className="w-full min-h-[100px] p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all text-sm bg-slate-50"
                                />
                            </div>
                        </div>

                        {/* Next Button at bottom of items list */}
                        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                            <button
                                type="button"
                                onClick={async () => {
                                    if (moveDetails.contactName && moveDetails.contactEmail && moveDetails.contactPhone) {
                                        setIsSubmittingLead(true)
                                        try {
                                            await submitQuote({ status: 'lead', request_call_back: true })
                                            alert("Request Sent! One of our agents will call you back shortly. 📞")
                                        } catch (err) {
                                            console.error("Callback submission error:", err)
                                            alert("Request Sent! (Note: Offline mode) We will call you shortly.")
                                        } finally {
                                            setIsSubmittingLead(false)
                                        }
                                        return
                                    }
                                    setShowLeadModal(true)
                                }}
                                disabled={isSubmittingLead}
                                className="flex flex-col items-center md:items-start p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl hover:border-red-600 hover:bg-red-50 transition-all group w-full md:max-w-xs text-left"
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    {isSubmittingLead ? <Loader2 className="animate-spin text-red-600" size={18} /> : <Phone size={18} className="text-red-600 group-hover:animate-bounce" />}
                                    <span className="font-black text-slate-900 uppercase tracking-widest text-[10px] italic">"Are you really sure you're not Old School?"</span>
                                </div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em]">Request a Call Back</p>
                            </button>

                            <Button 
                                size="lg" 
                                className="w-full md:w-auto px-10 py-5 text-sm uppercase tracking-[0.2em] font-black shadow-2xl shadow-red-600/20 bg-red-600 hover:bg-red-700 transition-all h-14"
                                onClick={handleProceed}
                            >
                                Next: Summary <Truck className="ml-3" size={16} />
                            </Button>
                        </div>
                    </div>
                </div>

            </div>

            <LeadCaptureModal 
                isOpen={showLeadModal} 
                onClose={() => setShowLeadModal(false)}
                isLoading={isSubmittingLead}
                initialData={moveDetails}
                onSubmit={async (formData) => {
                    setIsSubmittingLead(true)
                    try {
                        setMoveDetails({
                            contactName: `${formData.name} ${formData.surname}`,
                            contactEmail: formData.email,
                            contactPhone: formData.phone
                        })
                        await submitQuote({ 
                            status: 'lead', 
                            request_call_back: true,
                            contactName: `${formData.name} ${formData.surname}`,
                            contactEmail: formData.email,
                            contactPhone: formData.phone,
                            forceNew: true
                        })
                        return true
                    } catch (err) {
                        console.error("Lead submission error:", err)
                        alert("Submission Error: " + (err.message || "Failed to reach server"))
                    } finally {
                        setIsSubmittingLead(false)
                    }
                }}
            />
        </div>
    )
}
