import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useMoveStore } from '../inventory/store/moveStore'
import { Button } from '../../components/ui/Button'
import { Label } from '../../components/ui/Label'
import { Input } from '../../components/ui/Input'
import { Home, Building2, User, Truck, Clock, AlertTriangle, Shield, CalendarClock } from 'lucide-react'
import clsx from 'clsx'

const PROPERTY_TYPES = [
    { id: 'house', label: 'House', icon: Home },
    { id: 'flat', label: 'Flat/Apartment', icon: Building2 },
    { id: 'townhouse', label: 'Townhouse', icon: Home },
    { id: 'office', label: 'Office', icon: Building2 },
]

const DISTANCE_OPTIONS = [
    { value: '<10m', label: 'Less than 10m' },
    { value: '10-30m', label: '10 - 30 meters' },
    { value: '>30m', label: 'More than 30m (Long Carry)' },
]

const PARKING_OPTIONS = [
    { value: 'driveway', label: 'Driveway' },
    { value: 'street', label: 'Street Parking' },
    { value: 'secure_complex', label: 'Secure Complex (Inside)' },
    { value: 'loading_bay', label: 'Loading Bay' },
]

export default function Step2Access() {
    const navigate = useNavigate()
    const { accessDetails, setAccessDetails } = useMoveStore()

    const handleUpdate = (location, field, value) => {
        setAccessDetails(location, { [field]: value })
    }

    const handleSpecialCondition = (location, condition) => {
        setAccessDetails(location, {
            specialConditions: {
                ...accessDetails[location].specialConditions,
                [condition]: !accessDetails[location].specialConditions?.[condition]
            }
        })
    }

    const handleTimingUpdate = (field, value) => {
        // We use a special 'timing' key which our store handles
        setAccessDetails('timing', { [field]: value })
    }

    const renderLocationForm = (locationType) => {
        const data = accessDetails[locationType]
        const label = locationType === 'origin' ? 'Pickup Location' : 'Dropoff Location'
        const colorClass = locationType === 'origin' ? 'border-l-4 border-l-primary-500' : 'border-l-4 border-l-orange-500'

        return (
            <div className={`space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200 ${colorClass}`}>
                <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${locationType === 'origin' ? 'bg-primary-100 text-primary-700' : 'bg-orange-100 text-orange-700'}`}>
                        <Truck size={20} />
                    </div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-sm">{label}</h4>
                </div>

                {/* row 1: Type & Floor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Property Type</Label>
                        <select
                            value={data.type}
                            onChange={(e) => handleUpdate(locationType, 'type', e.target.value)}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        >
                            {PROPERTY_TYPES.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Floor Level</Label>
                        <div className="flex gap-4">
                            <Input
                                type="number"
                                min="0"
                                placeholder="0 (Ground)"
                                value={data.floorLevel}
                                onChange={(e) => handleUpdate(locationType, 'floorLevel', parseInt(e.target.value) || 0)}
                                className="w-full"
                            />
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.elevator}
                                        onChange={(e) => handleUpdate(locationType, 'elevator', e.target.checked)}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-slate-700">Elevator?</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.stairs}
                                        onChange={(e) => handleUpdate(locationType, 'stairs', e.target.checked)}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-slate-700">Stairs?</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* row 2: Distance & Parking */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Distance to Entrance</Label>
                        <select
                            value={data.distanceFromDoor}
                            onChange={(e) => handleUpdate(locationType, 'distanceFromDoor', e.target.value)}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        >
                            {DISTANCE_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Parking Availability</Label>
                        <select
                            value={data.parkingType}
                            onChange={(e) => handleUpdate(locationType, 'parkingType', e.target.value)}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        >
                            {PARKING_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* row 3: Special Conditions */}
                <div className="pt-4 border-t border-slate-200">
                    <Label className="mb-3 block text-slate-900 font-semibold flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        Access Challenges
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <ConditionCheckbox
                            label="Narrow Doors/Passages"
                            checked={data.specialConditions?.narrowPassage}
                            onChange={() => handleSpecialCondition(locationType, 'narrowPassage')}
                        />
                        <ConditionCheckbox
                            label="Low Ceilings"
                            checked={data.specialConditions?.lowCeiling}
                            onChange={() => handleSpecialCondition(locationType, 'lowCeiling')}
                        />
                        <ConditionCheckbox
                            label="Steep Driveway"
                            checked={data.specialConditions?.steepDriveway}
                            onChange={() => handleSpecialCondition(locationType, 'steepDriveway')}
                        />
                        <ConditionCheckbox
                            label="Security Gate / Boom"
                            checked={data.specialConditions?.securityGate}
                            onChange={() => handleSpecialCondition(locationType, 'securityGate')}
                        />
                    </div>

                    <textarea
                        placeholder="Any other access details? (e.g. spiral staircase, bad road condition...)"
                        value={data.notes || ''}
                        onChange={(e) => handleUpdate(locationType, 'notes', e.target.value)}
                        className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none min-h-[80px]"
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 space-y-8">

                    <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Access Questionnaire</h3>
                            <p className="text-slate-500 text-sm mt-1">Help us plan the logistics for a smooth move.</p>
                        </div>
                        <div className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide self-start">
                            Step 2 of 4
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {renderLocationForm('origin')}
                        {renderLocationForm('destination')}
                    </div>

                    {/* Global Timing Section */}
                    <div className="bg-slate-900 rounded-xl p-6 text-white">
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarClock className="text-primary-400" />
                            <h4 className="font-bold text-lg">Timing & Restrictions</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Preferred Time</label>
                                <select
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg text-white p-2.5 focus:ring-primary-500 focus:border-primary-500 invalid:text-gray-500"
                                    value={accessDetails.timing?.preferredTime}
                                    onChange={(e) => handleTimingUpdate('preferredTime', e.target.value)}
                                >
                                    <option value="morning">Morning (08:00 - 12:00)</option>
                                    <option value="afternoon">Afternoon (12:00 - 16:00)</option>
                                    <option value="flexible">Flexible</option>
                                </select>
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-800 rounded-lg transition-colors w-full">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-offset-slate-900"
                                        checked={accessDetails.timing?.weekendNeeded}
                                        onChange={(e) => handleTimingUpdate('weekendNeeded', e.target.checked)}
                                    />
                                    <span>Weekend / After Hours?</span>
                                </label>
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-800 rounded-lg transition-colors w-full">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-offset-slate-900"
                                        checked={accessDetails.timing?.securityBookingRequired}
                                        onChange={(e) => handleTimingUpdate('securityBookingRequired', e.target.checked)}
                                    />
                                    <span>Security Booking Required?</span>
                                </label>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                    <Button variant="ghost" onClick={() => navigate('/quote')}>Back to Details</Button>
                    <Button size="lg" onClick={() => navigate('/quote/inventory')}>
                        Next: Inventory <Truck className="ml-2" size={18} />
                    </Button>
                </div>
            </div>
        </div>
    )
}

function ConditionCheckbox({ label, checked, onChange }) {
    return (
        <label className={clsx(
            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-slate-50",
            checked ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"
        )}>
            <input
                type="checkbox"
                checked={checked || false}
                onChange={onChange}
                className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
            />
            <span className={clsx("text-sm font-medium", checked ? "text-amber-900" : "text-slate-600")}>
                {label}
            </span>
        </label>
    )
}



