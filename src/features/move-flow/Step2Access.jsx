import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMoveStore } from '../inventory/store/moveStore'
import { Button } from '../../components/ui/Button'
import { Label } from '../../components/ui/Label'
import { Input } from '../../components/ui/Input'
import { Home, Building2, User, Truck, Clock, AlertTriangle, Shield, Sparkles, Info, HelpCircle, Plus, Minus, Loader2, Phone } from 'lucide-react'
import { LeadCaptureModal } from './Step1Details'
import { emailService } from '../../services/emailService'
import clsx from 'clsx'
import { PACKAGING_RATES } from '../inventory/data/pricingRates'
import { trackCallbackRequest } from '../../lib/gtag'
import { formatClientName } from '../../utils/quoteHelpers'

const PROPERTY_TYPES = [
    { id: 'house', label: 'House', icon: Home },
    { id: 'flat', label: 'Apartment', icon: Building2 },
    { id: 'townhouse', label: 'Townhouse', icon: Home },
    { id: 'office', label: 'Office', icon: Building2 },
]

const PARKING_OPTIONS = [
    { value: 'driveway', label: 'Driveway' },
    { value: 'panhandle', label: 'Panhandle Driveway' },
    { value: 'street', label: 'Street Parking' },
    { value: 'secure_complex', label: 'Secure Complex (Inside)' },
    { value: 'loading_bay', label: 'Loading Bay' },
]

const Tooltip = ({ text }) => (
    <div className="group relative inline-block">
        <HelpCircle size={14} className="text-slate-400 cursor-help hover:text-red-500 transition-colors" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
        </div>
    </div>
)

export default function Step2Access() {
    const navigate = useNavigate()
    const { accessDetails, setAccessDetails, moveDetails, setPackagingOption, setMoveDetails, submitQuote } = useMoveStore()
    const location = useLocation()
    const basePath = location.pathname.startsWith('/quote-test') ? '/quote-test' : 
                     location.pathname.startsWith('/admin/quotes/new') ? '/admin/quotes/new' : '/quote';
    const [showLeadModal, setShowLeadModal] = React.useState(false)
    const [isSubmittingLead, setIsSubmittingLead] = React.useState(false)
    const [addedBoxes, setAddedBoxes] = React.useState(false)
    const [isSavingBoxes, setIsSavingBoxes] = React.useState(false)

    const handleUpdate = (location, field, value) => {
        setAccessDetails(location, { [field]: value })
    }

    const handleSpecialCondition = (location, condition) => {
        const currentConditions = accessDetails?.[location]?.specialConditions || {}
        const newValue = !currentConditions[condition]
        const updated = {
            ...currentConditions,
            [condition]: newValue
        }
        if (condition === 'panhandle' && newValue) {
            updated.shuttle = true
        }
        setAccessDetails(location, {
            specialConditions: updated
        })
    }

    const renderLocationForm = (locationType, customLabel = null) => {
        const data = accessDetails?.[locationType] || {
            type: 'house',
            floorLevel: 0,
            elevator: false,
            stairs: false,
            specialConditions: {},
            parkingType: 'driveway',
            notes: ''
        }
        const label = customLabel || (locationType === 'origin' ? 'Pickup Location' : 'Dropoff Location')
        const colorClass = locationType === 'origin' || locationType.startsWith('extra_coll') ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-slate-900'

        const showFloorFields = data.type === 'flat' || data.type === 'office'
        const isHouse = data.type === 'house'
        const isTownhouse = data.type === 'townhouse'

        return (
            <div className={`space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200 ${colorClass}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${locationType === 'origin' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                            <Truck size={20} />
                        </div>
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-sm">{label}</h4>
                    </div>
                    <Tooltip text="Select the property type to see specific access options for this location." />
                </div>

                {/* Property Type Selection */}
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Property Type</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {PROPERTY_TYPES.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => handleUpdate(locationType, 'type', t.id)}
                                className={clsx(
                                    "px-3 py-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                                    data.type === t.id 
                                        ? "bg-white border-red-600 shadow-lg text-red-600" 
                                        : "bg-white border-gray-100 text-slate-400 opacity-60 hover:opacity-100"
                                )}
                            >
                                <t.icon size={18} />
                                <span className="text-[10px] font-black uppercase tracking-tighter">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Vertical & Parking Access */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {showFloorFields && (
                        <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-100">
                            <Label className="text-xs font-bold flex items-center gap-2">
                                Vertical Access <Tooltip text="Floor level and lift access info." />
                            </Label>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Floor</p>
                                    <select
                                        value={data.floorLevel}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            handleUpdate(locationType, 'floorLevel', val === 'double_volume' || val === 'multiple_stairs' ? val : parseInt(val) || 0);
                                        }}
                                        className="w-full p-2 bg-slate-50 border border-gray-200 rounded-lg text-sm font-medium outline-none"
                                    >
                                        <option value={0}>Ground Floor</option>
                                        <option value={1}>1st Floor</option>
                                        <option value={2}>2nd Floor</option>
                                        <option value={3}>3rd Floor</option>
                                        <option value={4}>4th Floor</option>
                                        <option value={5}>5th Floor and above</option>
                                        <option value="double_volume">Double Volume</option>
                                        <option value="multiple_stairs">Multiple Flights of Stairs</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2 pt-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.elevator}
                                            onChange={(e) => handleUpdate(locationType, 'elevator', e.target.checked)}
                                            className="w-4 h-4 text-red-600 rounded border-gray-300"
                                        />
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Elevator</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.stairs}
                                            onChange={(e) => handleUpdate(locationType, 'stairs', e.target.checked)}
                                            className="w-4 h-4 text-red-600 rounded border-gray-300"
                                        />
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Stairs</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-100 h-full">
                        <Label className="text-xs font-bold flex items-center gap-2">
                            Vehicle Access <Tooltip text="Select the most accurate parking situation at this address." />
                        </Label>
                        <select
                            value={data.parkingType}
                            onChange={(e) => handleUpdate(locationType, 'parkingType', e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-gray-100 rounded-lg text-sm font-medium outline-none"
                        >
                            {PARKING_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                         <p className="text-[9px] text-slate-400 font-medium">Shuttle / Panhandle required? Select above.</p>
                    </div>
                </div>

                {/* Special Conditions */}
                <div className="pt-4 border-t border-slate-200">
                    <Label className="mb-3 block text-slate-900 font-bold flex items-center gap-2 uppercase tracking-widest text-[10px]">
                        <AlertTriangle size={14} className="text-red-600" />
                        Access & Site Challenges
                    </Label>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <ConditionCheckbox
                            label="Narrow Areas"
                            tooltip="Tight corners, narrow passages, or doorways less than 80cm wide."
                            checked={data.specialConditions?.narrowPassage}
                            onChange={() => handleSpecialCondition(locationType, 'narrowPassage')}
                        />
                        <ConditionCheckbox
                            label="Hoisting"
                            tooltip="Required for oversized items that won't fit through doors or lifts (e.g. Balcony lift)."
                            checked={data.specialConditions?.hoisting}
                            onChange={() => handleSpecialCondition(locationType, 'hoisting')}
                        />
                        <ConditionCheckbox
                            label="Pan Handle"
                            tooltip="A long, narrow driveway where truck turning might be limited."
                            checked={data.specialConditions?.panhandle}
                            onChange={() => handleSpecialCondition(locationType, 'panhandle')}
                        />
                        <ConditionCheckbox
                            label="Shuttle Required"
                            tooltip="A smaller shuttle vehicle is used to transfer items from your home to our large truck if the large truck cannot access your property (due to narrow gates, weight/height limits, steep driveways, or complex restrictions)."
                            checked={data.specialConditions?.shuttle}
                            onChange={() => handleSpecialCondition(locationType, 'shuttle')}
                        />
                        {isTownhouse && (
                            <ConditionCheckbox
                                label="Weight Limits"
                                tooltip="Complex has weight limits for trucks (e.g. 5-ton limit), requiring a smaller shuttle vehicle."
                                checked={data.specialConditions?.weightRestriction}
                                onChange={() => handleSpecialCondition(locationType, 'weightRestriction')}
                            />
                        )}
                        {isTownhouse && (
                            <>
                                <ConditionCheckbox
                                    label="Elevator"
                                    tooltip="Goods lift or passenger lift available."
                                    checked={data.elevator}
                                    onChange={() => handleUpdate(locationType, 'elevator', !data.elevator)}
                                />
                                <ConditionCheckbox
                                    label="Stairs"
                                    tooltip="Multiple flights of stairs required for entry."
                                    checked={data.stairs}
                                    onChange={() => handleUpdate(locationType, 'stairs', !data.stairs)}
                                />
                            </>
                        )}
                        <ConditionCheckbox
                            label="Security Gate"
                            tooltip="Complex requires formal security clearance or gate booking."
                            checked={data.specialConditions?.securityGate}
                            onChange={() => handleSpecialCondition(locationType, 'securityGate')}
                        />
                        <ConditionCheckbox
                            label="Long Carry"
                            tooltip="Required if the distance between the house and the truck is more than 30m."
                            checked={data.specialConditions?.longCarry}
                            onChange={() => handleSpecialCondition(locationType, 'longCarry')}
                        />
                    </div>

                    {data.specialConditions?.longCarry && (
                        <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-[10px] uppercase font-black text-red-600 tracking-widest mb-2 block">Distance from Truck (meters)</Label>
                            <div className="flex items-center gap-3">
                                <Input 
                                    type="number" 
                                    placeholder="e.g. 65"
                                    value={data.longCarryDistance || ''}
                                    onChange={(e) => handleUpdate(locationType, 'longCarryDistance', e.target.value)}
                                    className="bg-white h-10"
                                />
                                <span className="text-xs font-bold text-slate-400 uppercase">meters</span>
                            </div>
                            <p className="text-[9px] text-red-400 font-bold mt-2 uppercase">Note: 50–89m incurs a flat rate of R750. Distances of 90m or more will incur an additional shuttle vehicle fee of R2,500.</p>
                        </div>
                    )}

                    <textarea
                        placeholder="Additional instructions? (e.g. 'Bad road', 'Contact security at gate'...)"
                        value={data.notes || ''}
                        onChange={(e) => handleUpdate(locationType, 'notes', e.target.value)}
                        className="w-full p-4 text-sm border-2 border-slate-100 rounded-xl focus:border-red-600 outline-none min-h-[80px] transition-all bg-white"
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 space-y-10">

                    <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">Site Access</h3>
                            <p className="text-slate-500 text-sm">Fine-tune the logistics for a perfect move day.</p>
                        </div>
                        <div className="bg-red-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest self-start">
                            Step 2 of 4
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {renderLocationForm('origin')}
                        {(moveDetails.extraCollections || []).map((coll, idx) => 
                            renderLocationForm(`extra_coll_${idx}`, `Collection #${idx + 2} (${coll.address ? coll.address.split(',')[0] : 'Address'})`)
                        )}
                        {renderLocationForm('destination')}
                        {(moveDetails.extraDrops || []).map((drop, idx) => 
                            renderLocationForm(`extra_drop_${idx}`, `Drop-off #${idx + 2} (${drop.address ? drop.address.split(',')[0] : 'Address'})`)
                        )}
                    </div>

                    {/* Packaging Services Section */}
                    <div className="pt-8 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 rounded-lg bg-red-50 text-red-600">
                                <Sparkles size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Packaging Services</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <PackagingOptionCard
                                id="none"
                                title="No Packaging"
                                description="I will handle all packing and boxes myself."
                                icon={Home}
                                selected={moveDetails.packagingOption === 'none'}
                                onClick={() => setPackagingOption('none')}
                            />
                            <PackagingOptionCard
                                id="boxes_only"
                                title="Send Me Boxes Only"
                                description="We deliver ST 7 & Linen boxes for you to pack."
                                icon={Truck}
                                selected={moveDetails.packagingOption === 'boxes_only'}
                                onClick={() => setPackagingOption('boxes_only')}
                            />
                            <PackagingOptionCard
                                id="boxes_and_packing"
                                title="Boxes + Packing"
                                description="Our professional crew packs everything for you."
                                icon={Shield}
                                selected={moveDetails.packagingOption === 'boxes_and_packing'}
                                onClick={() => setPackagingOption('boxes_and_packing')}
                            />
                        </div>

                        {moveDetails.packagingOption !== 'none' && (
                            <div className="mt-8 p-8 bg-slate-50 rounded-3xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                                    Quantity Required
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">ST 7 Boxes (R{(moveDetails.packagingOption === 'boxes_only' ? PACKAGING_RATES.sendMeBoxesOnly.st7 : PACKAGING_RATES.boxesAndPacking.st7).toFixed(2)} ea)</label>
                                            <Tooltip text="Standard medium box for general household items." />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={() => setMoveDetails({ st7Boxes: Math.max(0, (moveDetails.st7Boxes || 0) - 1), boxesConfirmed: true })}
                                                className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-red-600 hover:text-red-600 transition-all shadow-sm flex-shrink-0"
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <input 
                                                type="number"
                                                min="0"
                                                value={moveDetails.st7Boxes || 0}
                                                onChange={(e) => {
                                                    const val = Math.max(0, parseInt(e.target.value) || 0)
                                                    setMoveDetails({ st7Boxes: val, boxesConfirmed: true })
                                                }}
                                                className="flex-1 bg-white border border-slate-200 rounded-xl h-12 text-center font-black text-xl text-slate-900 shadow-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                                            />
                                            <button 
                                                onClick={() => setMoveDetails({ st7Boxes: (moveDetails.st7Boxes || 0) + 1, boxesConfirmed: true })}
                                                className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-red-600 hover:text-red-600 transition-all shadow-sm flex-shrink-0"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
 
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Linen Boxes (R{(moveDetails.packagingOption === 'boxes_only' ? PACKAGING_RATES.sendMeBoxesOnly.linen : PACKAGING_RATES.boxesAndPacking.linen).toFixed(2)} ea)</label>
                                            <Tooltip text="Large boxes for bedding, pillows, and hanging clothes." />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={() => setMoveDetails({ linenBoxes: Math.max(0, (moveDetails.linenBoxes || 0) - 1), boxesConfirmed: true })}
                                                className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-red-600 hover:text-red-600 transition-all shadow-sm flex-shrink-0"
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <input 
                                                type="number"
                                                min="0"
                                                value={moveDetails.linenBoxes || 0}
                                                onChange={(e) => {
                                                    const val = Math.max(0, parseInt(e.target.value) || 0)
                                                    setMoveDetails({ linenBoxes: val, boxesConfirmed: true })
                                                }}
                                                className="flex-1 bg-white border border-slate-200 rounded-xl h-12 text-center font-black text-xl text-slate-900 shadow-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                                            />
                                            <button 
                                                onClick={() => setMoveDetails({ linenBoxes: (moveDetails.linenBoxes || 0) + 1, boxesConfirmed: true })}
                                                className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-red-600 hover:text-red-600 transition-all shadow-sm flex-shrink-0"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {moveDetails.packagingOption === 'boxes_only' && (
                                    <div className="mt-6 flex items-center gap-2 text-slate-500 bg-white/50 p-3 rounded-xl border border-slate-100">
                                        <Truck size={14} className="text-red-600" />
                                        <p className="text-[10px] font-bold uppercase tracking-tight">Delivery Fee of R{PACKAGING_RATES.sendMeBoxesOnly.deliveryFee.toFixed(2)} will be included in the total.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Insurance Section */}
                    <div className="pt-8 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Move Protection</h3>
                        </div>

                        <div 
                            className={clsx(
                                "p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col md:flex-row items-center gap-8",
                                moveDetails.insuranceEnabled ? "bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/10" : "bg-white border-slate-100 hover:border-emerald-200"
                            )}
                            onClick={() => setMoveDetails({ insuranceEnabled: !moveDetails.insuranceEnabled })}
                        >
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                                    <h4 className="font-black text-slate-900 uppercase tracking-tight text-xl">All Risk Insurance</h4>
                                    <Tooltip text="Contact our office for details." />
                                </div>
                                <p className="text-base text-slate-500 max-w-md">
                                    Contact our office for details on All Risk Insurance cover. 
                                    <span className="block mt-1 text-sm font-medium text-slate-600">
                                        *Please note: This will be added after the quote has been submitted and requires wrapping of goods.
                                    </span>
                                </p>
                                <p className="text-xs text-emerald-600 font-black uppercase mt-4 tracking-widest px-3 py-1 bg-emerald-100/50 w-fit rounded-full">✨ Call us for a custom quote</p>
                            </div>
                            <button type="button" className={clsx(
                                "px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl",
                                moveDetails.insuranceEnabled ? "bg-emerald-600 text-white shadow-emerald-600/30" : "bg-slate-900 text-white hover:bg-slate-800"
                            )}>
                                {moveDetails.insuranceEnabled ? "Interest Logged" : "I'm Interested"}
                            </button>
                        </div>
                    </div>

                    {/* Step 2 Notes */}
                    <div className="pt-8 border-t border-gray-100 space-y-4">
                        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                            <Sparkles className="text-red-600" size={24} />
                            Step 2 Notes
                        </h3>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Site Details or Notes</label>
                            <textarea
                                name="generalNotes"
                                value={moveDetails.generalNotes}
                                onChange={(e) => setMoveDetails({ generalNotes: e.target.value })}
                                placeholder="Describe any specialized entry details, parking rules, or access conditions here..."
                                className="w-full min-h-[100px] p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all text-sm bg-slate-50"
                            />
                        </div>
                    </div>

                </div>

                <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <button
                        type="button"
                        onClick={async () => {
                            if (moveDetails.contactName && moveDetails.contactEmail && moveDetails.contactPhone) {
                                setIsSubmittingLead(true)
                                try {
                                    await submitQuote({ status: 'lead', request_call_back: true, forceNew: true })
                                    // 🔴 Google Ads: Lead / Callback conversion
                                    trackCallbackRequest({ step: 'Step 2 — Site Access' })
                                    emailService.sendCallbackEmail({
                                        name: moveDetails.contactName,
                                        email: moveDetails.contactEmail,
                                        phone: moveDetails.contactPhone,
                                        step: 'Step 2 — Site Access',
                                        pickup: moveDetails.pickupAddress || '',
                                        dropoff: moveDetails.dropoffAddress || '',
                                        moveDate: moveDetails.moveDate || ''
                                    })
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
                            <span className="font-black text-slate-900 uppercase tracking-widest text-xs italic">"Sure you're not Old School?"</span>
                        </div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em]">Request a Call Back</p>
                    </button>
                    <div className="flex gap-4 w-full md:w-auto justify-end">
                        <Button variant="ghost" className="font-bold text-slate-400 hover:text-red-600" onClick={() => navigate(basePath)}>Back</Button>
                        <Button size="lg" className="bg-red-600 hover:bg-red-700 px-12 py-7 uppercase tracking-widest font-black text-sm shadow-xl shadow-red-600/20" onClick={() => navigate(`${basePath}/inventory`)}>
                            Next: Inventory <Truck className="ml-2" size={18} />
                        </Button>
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
                            const fullName = formatClientName(formData.name, formData.surname)
                            setMoveDetails({
                                contactName: formData.name,
                                surname: formData.surname,
                                contactEmail: formData.email,
                                contactPhone: formData.phone
                            })
                            await submitQuote({ 
                                status: 'lead', 
                                request_call_back: true,
                                client_name: fullName,
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
        </div>
    )
}


function ConditionCheckbox({ label, tooltip, checked, onChange }) {
    return (
        <label className={clsx(
            "flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-white min-h-[64px]",
            checked ? "bg-white border-red-500 shadow-md" : "bg-white/50 border-slate-100"
        )}>
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={checked || false}
                    onChange={onChange}
                    className="w-4 h-4 text-red-600 rounded border-gray-300"
                />
                <span className={clsx("text-[11px] font-black uppercase tracking-tighter", checked ? "text-red-900" : "text-slate-400")}>
                    {label}
                </span>
            </div>
            {tooltip && <Tooltip text={tooltip} />}
        </label>
    )
}

function PackagingOptionCard({ title, description, icon: Icon, selected, onClick }) {
    return (
        <div 
            onClick={onClick}
            className={clsx(
                "p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 group flex flex-col gap-4",
                selected 
                    ? "bg-red-50 border-red-600 shadow-lg shadow-red-600/5 scale-[1.02]" 
                    : "bg-white border-slate-100 hover:border-slate-200"
            )}
        >
            <div className={clsx(
                "p-3 rounded-xl w-fit transition-colors",
                selected ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
            )}>
                <Icon size={24} />
            </div>
            <div>
                <h4 className={clsx("font-black uppercase tracking-tight", selected ? "text-red-900" : "text-slate-900")}>{title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">{description}</p>
            </div>
        </div>
    )
}
