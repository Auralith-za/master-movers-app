import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMoveStore } from '../inventory/store/moveStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import AddressAutocomplete from '../../components/ui/AddressAutocomplete'
import { emailService } from '../../services/emailService'
import { calculateTripDistances } from '../../services/googleMaps'
import { Calendar, MapPin, Truck, Phone, User, Sparkles, Loader2, X, CheckCircle } from 'lucide-react'
import { getCityCode, detectCityCode } from '../inventory/data/pricingRates'

export const LeadCaptureModal = ({ isOpen, onClose, onSubmit, isLoading, initialData = {} }) => {
    const [form, setForm] = useState({ name: '', surname: '', email: '', phone: '' })
    const [isSuccess, setIsSuccess] = useState(false)
    
    React.useEffect(() => {
        if (isOpen) {
            setForm({
                name: initialData.contactName || '',
                surname: initialData.surname || '',
                email: initialData.contactEmail || '',
                phone: initialData.contactPhone || ''
            })
            setIsSuccess(false)
        }
    }, [isOpen]) // Only reset when modal opens, NOT on initialData changes while open
    
    if (!isOpen) return null
    
    const handleLocalSubmit = async (e) => {
        e.preventDefault()
        const success = await onSubmit(form)
        if (success) {
            setIsSuccess(true)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                {!isSuccess ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Request a Call Back</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">We'll contact you shortly</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleLocalSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                                    <input 
                                        required
                                        value={form.name}
                                        onChange={e => setForm({...form, name: e.target.value})}
                                        placeholder="First Name"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Surname</label>
                                    <input 
                                        required
                                        value={form.surname}
                                        onChange={e => setForm({...form, surname: e.target.value})}
                                        placeholder="Last Name"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input 
                                    required
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({...form, email: e.target.value})}
                                    placeholder="email@example.com"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                />
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cell Number</label>
                                <input 
                                    required
                                    type="tel"
                                    value={form.phone}
                                    onChange={e => setForm({...form, phone: e.target.value})}
                                    placeholder="082 123 4567"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                />
                            </div>
                            
                            <Button type="submit" isLoading={isLoading} className="w-full py-4 text-sm font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200">
                                Submit Request <Phone size={16} className="ml-2" />
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-6 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <CheckCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Thank You!</h3>
                        <p className="text-slate-500 font-medium mt-2 leading-relaxed">
                            One of our agents will call you back shortly <br />
                            to discuss your move requirements.
                        </p>
                        <div className="mt-8">
                            <Button onClick={onClose} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest rounded-2xl transition-all">
                                Got it, Thanks!
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function Step1Details() {
    const navigate = useNavigate()
    const { moveDetails, setMoveDetails, submitQuote } = useMoveStore()
    const location = useLocation()
    const [isSubmittingLead, setIsSubmittingLead] = React.useState(false)
    const [showLeadModal, setShowLeadModal] = React.useState(false)
    const [addressError, setAddressError] = React.useState(null)
    const [isValidating, setIsValidating] = React.useState(false)
    const [pickupHelpSent, setPickupHelpSent] = React.useState(false)
    const [dropoffHelpSent, setDropoffHelpSent] = React.useState(false)

    const handleLocationHelp = async (field) => {
        const isPickup = field === 'pickup'
        
        if (isPickup) {
            setPickupHelpSent(true)
            setMoveDetails({
                pickupManualActive: true,
                pickupAddress: 'Custom Suburb Requested (Pending Assistance)',
                cant_find_address: true,
                pickupAddressVerified: true,
                request_call_back: true
            })
        } else {
            setDropoffHelpSent(true)
            setMoveDetails({
                dropoffManualActive: true,
                dropoffAddress: 'Custom Suburb Requested (Pending Assistance)',
                cant_find_address: true,
                dropoffAddressVerified: true,
                request_call_back: true
            })
        }

        // Auto submit lead
        try {
            await submitQuote({
                status: 'lead',
                request_call_back: true,
                cant_find_address: true,
                pickup_address: isPickup ? 'Custom Suburb Requested (Pending Assistance)' : moveDetails.pickupAddress,
                dropoff_address: !isPickup ? 'Custom Suburb Requested (Pending Assistance)' : moveDetails.dropoffAddress
            })

            // Send notification email
            await emailService.sendLocationNotFoundEmail({
                name: moveDetails.contactName || 'Valued Client',
                email: moveDetails.contactEmail || 'No Email Provided',
                phone: moveDetails.contactPhone || 'No Phone Provided',
                fieldName: isPickup ? 'Pickup Address' : 'Dropoff Address',
                enteredValue: isPickup ? moveDetails.pickupAddress : moveDetails.dropoffAddress,
                comments: `User requested manual address verification. Custom Suburb Requested on ${isPickup ? 'Pickup' : 'Dropoff'} input.`
            })
        } catch (e) {
            console.error('Error handling location help request:', e)
        }
    }

    const basePath = location.pathname.startsWith('/quote-test') ? '/quote-test' : 
                     location.pathname.startsWith('/admin/quotes/new') ? '/admin/quotes/new' : '/quote';

    const handleChange = (e) => {
        const { name, value, city, placeId, latLng, addressComponents } = e.target
        const updates = { [name]: value }
        
        // If change comes from google autocomplete select
        if (e.target.isGoogleSelect) {
            if (name === 'pickupAddress') {
                updates.pickupAddressVerified = true
                updates.pickupPlaceId = placeId || null
                updates.pickupLatLng = latLng || null
                // Store the full address for better city detection
                if (city) updates.pickupCity = city
                if (addressComponents) updates.pickupAddressComponents = addressComponents
            }
            if (name === 'dropoffAddress') {
                updates.dropoffAddressVerified = true
                updates.dropoffPlaceId = placeId || null
                updates.dropoffLatLng = latLng || null
                if (city) updates.dropoffCity = city
                if (addressComponents) updates.dropoffAddressComponents = addressComponents
            }
        } else {
            // If they typed manually, reset verified flag and coordinates
            // Distance calculation requires Google-verified addresses
            if (name === 'pickupAddress') {
                updates.pickupAddressVerified = false
                updates.pickupPlaceId = null
                updates.pickupLatLng = null
                updates.pickupCity = null
                updates.pickupAddressComponents = null
                // Clear previous distance when address changes
                updates.distanceKm = 0
                updates.tripBreakdown = null
                updates.totalBillableDistance = 0
            }
            if (name === 'dropoffAddress') {
                updates.dropoffAddressVerified = false
                updates.dropoffPlaceId = null
                updates.dropoffLatLng = null
                updates.dropoffCity = null
                updates.dropoffAddressComponents = null
                updates.distanceKm = 0
                updates.tripBreakdown = null
                updates.totalBillableDistance = 0
            }
        }

        if (name === 'pickupAddress' || name === 'dropoffAddress') {
            setAddressError(null)
        }
        setMoveDetails(updates)
    }

    // Auto-calculate distance in background when both addresses are selected from Google Maps
    React.useEffect(() => {
        if (!moveDetails.pickupAddress || !moveDetails.dropoffAddress) {
            setAddressError(null)
            return
        }

        // Use city from address_components first (most accurate), then fall back to full address string matching
        const pickupCityCode = detectCityCode(moveDetails.pickupAddress, moveDetails.pickupAddressComponents, moveDetails.pickupLatLng)
        const dropoffCityCode = detectCityCode(moveDetails.dropoffAddress, moveDetails.dropoffAddressComponents, moveDetails.dropoffLatLng)

        // National moves are VOLUME-based — distance is not required for pricing.
        // Skip the Distance Matrix call for cross-city routes.
        const isDetectedNational = pickupCityCode && dropoffCityCode && pickupCityCode !== dropoffCityCode
        if (isDetectedNational) {
            setMoveDetails({ distanceKm: 0, tripBreakdown: null, totalBillableDistance: 0 })
            setAddressError(null)
            setIsValidating(false)
            return
        }

        // Outline province check — if the Google address_components contain an
        // outline province (Northern Cape, Free State, Limpopo, etc.) we don't
        // need a Distance Matrix call. The quote engine will flag it as
        // needsQuoteRequest and block automated pricing.
        const outlineProvinces = ['free state', 'limpopo', 'mpumalanga', 'north west', 'northern cape', 'mpumulanga', 'mphumulanga']
        const isOutlineComponent = (components) => {
            if (!components || !Array.isArray(components)) return false
            return components.some(c => {
                const val = (c.long_name || c.short_name || '').toLowerCase().trim()
                return outlineProvinces.some(prov => val === prov || val.includes(prov))
            })
        }
        const pickupIsOutline = isOutlineComponent(moveDetails.pickupAddressComponents)
        const dropoffIsOutline = isOutlineComponent(moveDetails.dropoffAddressComponents)
        if (pickupIsOutline || dropoffIsOutline) {
            // Store zeros — the quote engine's hasOutlineProvince flag handles the rest
            setMoveDetails({ distanceKm: 0, tripBreakdown: null, totalBillableDistance: 0 })
            setAddressError(null)
            setIsValidating(false)
            return
        }

        // Require Google Maps selection for local moves (not just typed text)
        // This ensures we have accurate placeId/latLng for Distance Matrix
        const hasPickupRef = moveDetails.pickupLatLng || moveDetails.pickupPlaceId
        const hasDropoffRef = moveDetails.dropoffLatLng || moveDetails.dropoffPlaceId
        
        if (!hasPickupRef || !hasDropoffRef) {
            // Don't show an error yet — they may still be typing
            return
        }

        // Local move — call Distance Matrix to get real driving distance
        const cityCode = pickupCityCode || dropoffCityCode || 'JHB'
        setIsValidating(true)
        setAddressError(null)

        const pickupRef = { placeId: moveDetails.pickupPlaceId, latLng: moveDetails.pickupLatLng }
        const dropoffRef = { placeId: moveDetails.dropoffPlaceId, latLng: moveDetails.dropoffLatLng }

        calculateTripDistances(
            moveDetails.pickupAddress,
            moveDetails.dropoffAddress,
            cityCode,
            pickupRef,
            dropoffRef
        )
            .then(({ breakdown, totalDistance }) => {
                setMoveDetails({
                    distanceKm: breakdown.pickupToDropoff,     // Pickup→Dropoff only (for reference display)
                    tripBreakdown: breakdown,                   // Full breakdown object
                    totalBillableDistance: totalDistance        // Full circuit: Depot→Pickup→Dropoff→Depot
                })
                setAddressError(null)
            })
            .catch((error) => {
                console.error("Distance calculation error:", error)
                setAddressError("Could not calculate the driving distance. Please make sure you selected a valid address from the Google Maps dropdown suggestions.")
                setMoveDetails({ distanceKm: 0, tripBreakdown: null, totalBillableDistance: 0 })
            })
            .finally(() => {
                setIsValidating(false)
            })
    }, [
        moveDetails.pickupAddress, 
        moveDetails.dropoffAddress, 
        moveDetails.pickupCity, 
        moveDetails.dropoffCity, 
        moveDetails.pickupLatLng, 
        moveDetails.dropoffLatLng,
        moveDetails.pickupPlaceId,
        moveDetails.dropoffPlaceId
    ])


    const handleSubmit = (e) => {
        e.preventDefault()

        if (!moveDetails.pickupAddress || !moveDetails.dropoffAddress) {
            setAddressError("Both pickup and dropoff addresses are required.")
            return
        }
        if (isValidating) {
            return
        }
        if (addressError) {
            return
        }

        // Check if this is a national move — national moves don't need distanceKm
        const pickupCityCode = detectCityCode(moveDetails.pickupAddress, moveDetails.pickupAddressComponents, moveDetails.pickupLatLng)
        const dropoffCityCode = detectCityCode(moveDetails.dropoffAddress, moveDetails.dropoffAddressComponents, moveDetails.dropoffLatLng)
        const isNational = pickupCityCode && dropoffCityCode && pickupCityCode !== dropoffCityCode
        const isManual = moveDetails.pickupManualActive || moveDetails.dropoffManualActive

        const outlineProvinces = ['free state', 'limpopo', 'mpumalanga', 'north west', 'northern cape', 'mpumulanga', 'mphumulanga']
        const isOutlineComponent = (components) => {
            if (!components || !Array.isArray(components)) return false
            return components.some(c => {
                const val = (c.long_name || c.short_name || '').toLowerCase().trim()
                return outlineProvinces.some(prov => val === prov || val.includes(prov))
            })
        }
        const pickupIsOutline = isOutlineComponent(moveDetails.pickupAddressComponents)
        const dropoffIsOutline = isOutlineComponent(moveDetails.dropoffAddressComponents)
        const isOutline = pickupIsOutline || dropoffIsOutline

        // For local moves, ensure Google Maps resolved a real distance (unless manual entry is selected)
        if (!isManual && !isNational && !isOutline && (!moveDetails.distanceKm || moveDetails.distanceKm === 0)) {
            setAddressError("Could not calculate a driving route. Please make sure you selected an address from the Google Maps suggestions.")
            return
        }

        navigate(`${basePath}/access`)
    }

    return (
        <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Massive Promo Banner at the Top */}
            <div className="mb-8 bg-red-600 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Sparkles size={120} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <div>
                        <p className="text-red-100 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Exclusive Offer</p>
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none mb-2">
                            Mid-Month <span className="text-slate-900 leading-none">Madness</span>
                        </h2>
                        <p className="text-red-50 text-lg opacity-90 max-w-md">
                            Book your move between the <span className="font-bold underline text-white">5th - 24th</span> and secure our <span className="font-black italic text-slate-900">cheapest rates</span> of the season.
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <span className="block text-4xl font-black text-white italic">10% OFF</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-red-200">Automatically Applied</span>
                    </div>
                </div>
            </div>

            {/* Coverage Banner (Replacing Moving Anywhere) */}
            <div className="mb-8 bg-slate-900 rounded-2xl p-8 shadow-xl relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
                    <div className="text-center md:text-left flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-red-600/30">JHB</div>
                        <div>
                            <p className="text-white font-bold text-lg leading-tight">Johannesburg</p>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">Gauteng Hub</p>
                        </div>
                    </div>
                    <div className="text-center md:text-left flex items-center gap-4 border-y md:border-y-0 md:border-x border-slate-800 py-6 md:py-0 md:px-8">
                        <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-white font-black">DBN</div>
                        <div>
                            <p className="text-white font-bold text-lg leading-tight">Durban</p>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">Coastal Routes</p>
                        </div>
                    </div>
                    <div className="text-center md:text-left flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-white font-black">CPT</div>
                        <div>
                            <p className="text-white font-bold text-lg leading-tight">Cape Town</p>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">Western Cape</p>
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-slate-300 text-sm font-medium">✨ <span className="text-white font-black italic">MasterMovers Network:</span> We operate daily routes across all major South African cities and internationally.</p>
                    <div className="flex gap-2">
                        <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] rounded font-bold">LOCAL</span>
                        <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] rounded font-bold">NATIONAL</span>
                        <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] rounded font-bold">GLOBAL</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 space-y-10">

                    {/* Section: Contact */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <User className="text-red-600" size={32} />
                                Contact Details
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Input
                                label="First Name"
                                name="contactName"
                                placeholder="John"
                                className="text-lg py-6"
                                value={moveDetails.contactName}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Surname"
                                name="surname"
                                placeholder="Doe"
                                className="text-lg py-6"
                                value={moveDetails.surname}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Phone Number"
                                name="contactPhone"
                                placeholder="+27 82 123 4567"
                                className="text-lg py-6"
                                value={moveDetails.contactPhone}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Email Address"
                                name="contactEmail"
                                type="email"
                                placeholder="john@example.com"
                                className="text-lg py-6"
                                value={moveDetails.contactEmail}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-8"></div>

                    {/* Section: Locations */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <MapPin className="text-red-600" size={32} />
                            Where are you moving?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Pickup Group */}
                            <div className="space-y-4">
                                {moveDetails.pickupManualActive ? (
                                    <div className="space-y-1.5">
                                        <Input
                                            label="Pickup Suburb / Area"
                                            name="pickupAddress"
                                            placeholder="Please enter suburb name"
                                            value={moveDetails.pickupAddress || ''}
                                            onChange={handleChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMoveDetails({ pickupManualActive: false, pickupAddress: '', cant_find_address: false });
                                                setPickupHelpSent(false);
                                            }}
                                            className="text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer mt-1 focus:outline-none text-left block"
                                        >
                                            ← Search address on map
                                        </button>
                                    </div>
                                ) : (
                                    <AddressAutocomplete
                                        label="Pickup Address"
                                        name="pickupAddress"
                                        placeholder="Please fill in as: Street Number, Street Name, Suburb"
                                        value={moveDetails.pickupAddress || ''}
                                        onChange={handleChange}
                                        required
                                    />
                                )}
                                {!pickupHelpSent ? (
                                    !moveDetails.pickupManualActive && (
                                        <button
                                            type="button"
                                            onClick={() => handleLocationHelp('pickup')}
                                            className="text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer mt-1 focus:outline-none text-left block"
                                        >
                                            I cannot find my address
                                        </button>
                                    )
                                ) : (
                                    <div className="mt-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 shadow-lg shadow-emerald-100/50 animate-in fade-in slide-in-from-top-3 duration-500">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30 animate-in zoom-in duration-300">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-emerald-800 uppercase tracking-wide">Request Received</p>
                                                <p className="text-xs text-emerald-600 mt-1 leading-relaxed">One of our sales consultants will contact you shortly to assist with your location details.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <Input
                                    label="Unit Number & Complex Name (Optional)"
                                    name="pickupUnitComplex"
                                    placeholder="e.g. Unit 4, Sunset Heights"
                                    value={moveDetails.pickupUnitComplex || ''}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Dropoff Group */}
                            <div className="space-y-4">
                                {moveDetails.dropoffManualActive ? (
                                    <div className="space-y-1.5">
                                        <Input
                                            label="Dropoff Suburb / Area"
                                            name="dropoffAddress"
                                            placeholder="Please enter suburb name"
                                            value={moveDetails.dropoffAddress || ''}
                                            onChange={handleChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMoveDetails({ dropoffManualActive: false, dropoffAddress: '', cant_find_address: false });
                                                setDropoffHelpSent(false);
                                            }}
                                            className="text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer mt-1 focus:outline-none text-left block"
                                        >
                                            ← Search address on map
                                        </button>
                                    </div>
                                ) : (
                                    <AddressAutocomplete
                                        label="Dropoff Address"
                                        name="dropoffAddress"
                                        placeholder="Please fill in as: Street Number, Street Name, Suburb"
                                        value={moveDetails.dropoffAddress || ''}
                                        onChange={handleChange}
                                        required
                                    />
                                )}
                                {!dropoffHelpSent ? (
                                    !moveDetails.dropoffManualActive && (
                                        <button
                                            type="button"
                                            onClick={() => handleLocationHelp('dropoff')}
                                            className="text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer mt-1 focus:outline-none text-left block"
                                        >
                                            I cannot find my address
                                        </button>
                                    )
                                ) : (
                                    <div className="mt-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 shadow-lg shadow-emerald-100/50 animate-in fade-in slide-in-from-top-3 duration-500">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30 animate-in zoom-in duration-300">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-emerald-800 uppercase tracking-wide">Request Received</p>
                                                <p className="text-xs text-emerald-600 mt-1 leading-relaxed">One of our sales consultants will contact you shortly to assist with your location details.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <Input
                                    label="Unit Number & Complex Name (Optional)"
                                    name="dropoffUnitComplex"
                                    placeholder="e.g. Unit 12, Ocean View"
                                    value={moveDetails.dropoffUnitComplex || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Input
                                label="Preferred Move Date"
                                name="moveDate"
                                type="date"
                                className="text-lg py-6"
                                value={moveDetails.moveDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="border-t border-gray-100 my-8"></div>

                        {/* Section: Notes */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Sparkles className="text-red-600" size={24} />
                                Step 1 Notes / Special Instructions
                            </h3>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes / Instructions (e.g. tight roads, specific timing)</label>
                                <textarea
                                    name="generalNotes"
                                    value={moveDetails.generalNotes}
                                    onChange={handleChange}
                                    placeholder="Please describe any unique details about your details or timing requirements..."
                                    className="w-full min-h-[100px] p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all text-sm bg-slate-50"
                                />
                            </div>
                        </div>
                        
                        {addressError && (
                            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                <span>⚠️ {addressError}</span>
                            </div>
                        )}
                        {isValidating && (
                            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-xl text-blue-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 animate-in fade-in">
                                <Loader2 className="animate-spin text-blue-500" size={16} />
                                <span>Calculating driving route with Google Maps...</span>
                            </div>
                        )}

                        {/* Distance Breakdown Panel — shown for local moves once Google Maps has calculated the route (ONLY IN TEST MODE) */}
                        {window.location.pathname.includes('quote-test') && !isValidating && !addressError && moveDetails.tripBreakdown && moveDetails.totalBillableDistance > 0 && (
                            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">Route Distance Confirmed via Google Maps</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-white rounded-xl p-3 border border-emerald-100 text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Depot → Pickup</p>
                                        <p className="text-lg font-black text-slate-900">{moveDetails.tripBreakdown.depotToPickup} <span className="text-xs font-bold text-slate-500">km</span></p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 border border-emerald-100 text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pickup → Dropoff</p>
                                        <p className="text-lg font-black text-slate-900">{moveDetails.tripBreakdown.pickupToDropoff} <span className="text-xs font-bold text-slate-500">km</span></p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 border border-emerald-100 text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dropoff → Depot</p>
                                        <p className="text-lg font-black text-slate-900">{moveDetails.tripBreakdown.dropoffToDepot} <span className="text-xs font-bold text-slate-500">km</span></p>
                                    </div>
                                    <div className="bg-emerald-600 rounded-xl p-3 text-center">
                                        <p className="text-[9px] font-black text-emerald-100 uppercase tracking-widest mb-1">Total Billable</p>
                                        <p className="text-lg font-black text-white">{moveDetails.totalBillableDistance} <span className="text-xs font-bold text-emerald-200">km</span></p>
                                    </div>
                                </div>
                                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mt-2">
                                    ✓ {moveDetails.tripBreakdown.method === 'distance_matrix' ? 'Real road distance via Google Maps Distance Matrix' : 'Estimated via coordinate calculation (fallback)'}
                                </p>
                            </div>
                        )}
                    </div>

                </div>

                <div className="bg-gray-50 px-8 py-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <button
                        type="button"
                        onClick={async () => {
                            if (moveDetails.contactName && moveDetails.contactEmail && moveDetails.contactPhone) {
                                setIsSubmittingLead(true)
                                try {
                                    const result = await submitQuote({ status: 'lead', request_call_back: true, forceNew: true })
                                    // Send urgent callback alert to all admins
                                    emailService.sendCallbackEmail({
                                        name: moveDetails.contactName,
                                        email: moveDetails.contactEmail,
                                        phone: moveDetails.contactPhone,
                                        step: 'Step 1 — Details',
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
                            <span className="font-black text-slate-900 uppercase tracking-widest text-xs italic">"I am Old School"</span>
                        </div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em]">Request a Call Back</p>
                    </button>
                    <Button 
                        type="submit" 
                        size="lg" 
                        disabled={!!addressError || isValidating}
                        className="w-full md:w-auto px-16 py-8 text-base uppercase tracking-[0.2em] font-black shadow-2xl shadow-red-600/20 bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isValidating ? 'Verifying...' : 'Next Step'} <Truck className="ml-3" size={20} />
                    </Button>
                </div>

                <LeadCaptureModal 
                    isOpen={showLeadModal} 
                    onClose={() => setShowLeadModal(false)}
                    isLoading={isSubmittingLead}
                    onSubmit={async (formData) => {
                        setIsSubmittingLead(true)
                        try {
                            // Save to store
                            setMoveDetails({
                                contactName: `${formData.name} ${formData.surname}`,
                                contactEmail: formData.email,
                                contactPhone: formData.phone
                            })
                            // Submit lead
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
                            alert("Submission Error: " + (err.message || "Failed to reach server") + ". Please call us directly if this persists.")
                            // Keep modal open so user knows it failed
                        } finally {
                            setIsSubmittingLead(false)
                        }
                    }}
                />
            </div>
        </form>
    )
}
