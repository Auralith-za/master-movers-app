import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useMoveStore } from '../inventory/store/moveStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Calendar, MapPin, Truck, Phone, User, Sparkles } from 'lucide-react'

export default function Step1Details() {
    const navigate = useNavigate()
    const { moveDetails, setMoveDetails } = useMoveStore()

    const handleChange = (e) => {
        const { name, value } = e.target
        // If changing distance manually, clear outdated breakdown
        if (name === 'distanceKm') {
            setMoveDetails({ [name]: value, tripBreakdown: null })
        } else {
            setMoveDetails({ [name]: value })
        }
    }

    const simulateRoute = () => {
        // Mock logic to simulate API return
        const userDist = parseFloat(moveDetails.distanceKm) || 25
        const depotToPickup = Math.floor(Math.random() * (45 - 15) + 15)
        const dropoffToDepot = Math.floor(Math.random() * (45 - 15) + 15)

        setMoveDetails({
            tripBreakdown: {
                depotToPickup,
                pickupToDropoff: userDist,
                dropoffToDepot
            }
        })
    }

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
                            <Input
                                label="Pickup Address"
                                name="pickupAddress"
                                placeholder="e.g. 123 Main St, Sandton"
                                value={moveDetails.pickupAddress}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Dropoff Address"
                                name="dropoffAddress"
                                placeholder="e.g. 456 Beach Rd, Cape Town"
                                value={moveDetails.dropoffAddress}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Enhanced Distance Section */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium text-slate-700">Estimated Distance</label>
                                    <button
                                        type="button"
                                        onClick={simulateRoute}
                                        className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 font-bold bg-primary-50 px-2 py-1 rounded transition-colors"
                                    >
                                        <Sparkles size={14} />
                                        Simulate Route
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="distanceKm"
                                        placeholder="0"
                                        value={moveDetails.distanceKm}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                                        required
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">km</span>
                                </div>

                                {moveDetails.tripBreakdown && (
                                    <div className="mt-3 text-xs space-y-1 text-slate-500 animate-in slide-in-from-top-2">
                                        <div className="flex justify-between">
                                            <span>Depot (Germiston) ➝ Pickup:</span>
                                            <span>{moveDetails.tripBreakdown.depotToPickup} km</span>
                                        </div>
                                        <div className="flex justify-between text-slate-700 font-medium">
                                            <span>Pickup ➝ Dropoff (Your Move):</span>
                                            <span>{moveDetails.tripBreakdown.pickupToDropoff} km</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Dropoff ➝ Depot (Germiston):</span>
                                            <span>{moveDetails.tripBreakdown.dropoffToDepot} km</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2">
                                            <span>Total Billable Distance:</span>
                                            <span>
                                                {moveDetails.tripBreakdown.depotToPickup +
                                                    moveDetails.tripBreakdown.pickupToDropoff +
                                                    moveDetails.tripBreakdown.dropoffToDepot} km
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Input
                                label="Preferred Move Date"
                                name="moveDate"
                                type="date"
                                value={moveDetails.moveDate}
                                onChange={handleChange}
                                required
                            />
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
