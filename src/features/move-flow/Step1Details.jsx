import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMoveStore } from '../inventory/store/moveStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import AddressAutocomplete from '../../components/ui/AddressAutocomplete'
import { calculateTripDistances } from '../../services/googleMaps'
import { Calendar, MapPin, Truck, Phone, User, Sparkles, Loader2 } from 'lucide-react'

export default function Step1Details() {
    const navigate = useNavigate()
    const { moveDetails, setMoveDetails } = useMoveStore()
    const basePath = location.pathname.startsWith('/quote-test') ? '/quote-test' : 
                     location.pathname.startsWith('/admin/quotes/new') ? '/admin/quotes/new' : '/quote';

    const handleChange = (e) => {
        const { name, value, city } = e.target
        const updates = { [name]: value }
        if (city) {
            if (name === 'pickupAddress') updates.pickupCity = city
            if (name === 'dropoffAddress') updates.dropoffCity = city
        }
        setMoveDetails(updates)
    }

    // Auto-calculate distance in background when both addresses are filled
    React.useEffect(() => {
        if (moveDetails.pickupAddress && moveDetails.dropoffAddress) {
            // Silently calculate in background without showing loading state
            calculateTripDistances(
                moveDetails.pickupAddress,
                moveDetails.dropoffAddress
            )
                .then(({ breakdown, totalDistance }) => {
                    setMoveDetails({
                        distanceKm: breakdown.pickupToDropoff,
                        tripBreakdown: breakdown,
                        totalBillableDistance: totalDistance
                    })
                })
                .catch((error) => {
                    console.error("Background calculation error:", error)
                    // Fail silently - user can still proceed
                })
        }
    }, [moveDetails.pickupAddress, moveDetails.dropoffAddress])


    const handleSubmit = (e) => {
        e.preventDefault()
        // Basic validation could go here
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
                            <AddressAutocomplete
                                label="Pickup Address"
                                name="pickupAddress"
                                placeholder="e.g. 123 Main St, Sandton"
                                value={moveDetails.pickupAddress}
                                onChange={handleChange}
                                required
                            />
                            <AddressAutocomplete
                                label="Dropoff Address"
                                name="dropoffAddress"
                                placeholder="e.g. 456 Beach Rd, Cape Town"
                                value={moveDetails.dropoffAddress}
                                onChange={handleChange}
                                required
                            />
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
                    </div>

                    <div className="border-t border-gray-100 my-8"></div>

                    {/* Section: Notes */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <Sparkles className="text-red-600" size={32} />
                            Move Notes
                        </h3>
                        <div className="space-y-3">
                            <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Notes / Special Instructions (If none, please say none)</label>
                            <textarea
                                name="generalNotes"
                                required
                                value={moveDetails.generalNotes}
                                onChange={handleChange}
                                placeholder="Please describe any special items, tight spaces, or specific requirements..."
                                className="w-full min-h-[160px] p-6 rounded-2xl border-2 border-gray-100 focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all text-lg"
                            />
                            <p className="text-xs text-slate-400 font-medium">Help us give you the most accurate quote by providing as much detail as possible.</p>
                        </div>
                    </div>

                </div>

                <div className="bg-gray-50 px-8 py-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <button
                        type="button"
                        onClick={() => {
                            // Backend Callback Simulation
                            alert("Request Sent! One of our agents will call you back shortly. 📞")
                        }}
                        className="flex-1 flex flex-col items-center md:items-start p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-red-600 hover:bg-red-50 transition-all group"
                    >
                        <div className="flex items-center gap-3 mb-1">
                            <Phone size={24} className="text-red-600 group-hover:animate-bounce" />
                            <span className="font-black text-slate-900 uppercase tracking-widest text-sm italic">"No, I'm Old School"</span>
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.1em]">Request a Call Back from a human Agent</p>
                    </button>

                    <Button type="submit" size="lg" className="w-full md:w-auto px-16 py-8 text-base uppercase tracking-[0.2em] font-black shadow-2xl shadow-red-600/20 bg-red-600 hover:bg-red-700 transition-all">
                        Next Step <Truck className="ml-3" size={20} />
                    </Button>
                </div>
            </div>
        </form>
    )
}
