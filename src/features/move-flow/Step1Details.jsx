import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useMoveStore } from '../inventory/store/moveStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import AddressAutocomplete from '../../components/ui/AddressAutocomplete'
import { calculateTripDistances } from '../../services/googleMaps'
import { Calendar, MapPin, Truck, Phone, User, Sparkles, Loader2 } from 'lucide-react'

export default function Step1Details() {
    const navigate = useNavigate()
    const { moveDetails, setMoveDetails } = useMoveStore()

    const handleChange = (e) => {
        const { name, value } = e.target
        setMoveDetails({ [name]: value })
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
        navigate('/quote/access')
    }

    return (
        <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 space-y-8">

                    {/* Section: Locations */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <MapPin className="text-primary-600" size={20} />
                            Where are you moving?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        <div className="grid grid-cols-1 gap-6">
                            <Input
                                label="Preferred Move Date"
                                name="moveDate"
                                type="date"
                                value={moveDetails.moveDate}
                                onChange={handleChange}
                                required
                            />

                            {/* Discount Notice Card */}
                            <div className="mt-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                                <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600 shrink-0">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-indigo-900 text-sm">Save 10% on your move</h4>
                                    <p className="text-xs text-indigo-700 mt-0.5">
                                        Book your move between the <span className="font-bold border-b border-indigo-300">5th and 24th</span> of any month to automatically qualify for our Mid-Month Madness discount.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-6"></div>

                    {/* Section: Contact */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <User className="text-primary-600" size={20} />
                            Contact Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Full Name"
                                name="contactName"
                                placeholder="John Doe"
                                value={moveDetails.contactName}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Phone Number"
                                name="contactPhone"
                                placeholder="+27 82 123 4567"
                                value={moveDetails.contactPhone}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Email Address"
                                name="contactEmail"
                                type="email"
                                placeholder="john@example.com"
                                value={moveDetails.contactEmail}
                                onChange={handleChange}
                                className="md:col-span-2"
                                required
                            />
                        </div>
                    </div>

                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
                    <Button type="submit" size="lg" className="w-full md:w-auto">
                        Next Step: Site Access
                    </Button>
                </div>
            </div>
        </form>
    )
}
