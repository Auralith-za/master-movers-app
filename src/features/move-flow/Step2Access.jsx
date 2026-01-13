import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useMoveStore } from '../inventory/store/moveStore'
import { Button } from '../../components/ui/Button'
import { Label } from '../../components/ui/Label'
import { Home, Building2, User, Tractor } from 'lucide-react'
import clsx from 'clsx'

const PROPERTY_TYPES = [
    { id: 'house', label: 'House', icon: Home },
    { id: 'flat', label: 'Flat/Apartment', icon: Building2 },
    { id: 'townhouse', label: 'Townhouse', icon: Home },
    { id: 'office', label: 'Office', icon: Building2 },
]

export default function Step2Access() {
    const navigate = useNavigate()
    const { accessDetails, setAccessDetails } = useMoveStore()

    const handleToggle = (location, field) => {
        setAccessDetails(location, { [field]: !accessDetails[location][field] })
    }

    const handleTypeSelect = (location, type) => {
        setAccessDetails(location, { type })
    }

    const renderLocationForm = (locationType) => {
        const data = accessDetails[locationType]
        const label = locationType === 'origin' ? 'Pickup Location' : 'Dropoff Location'

        return (
            <div className="space-y-6">
                <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-xs">{label}</h4>

                {/* Property Type Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PROPERTY_TYPES.map((type) => {
                        const Icon = type.icon
                        const isSelected = data.type === type.id
                        return (
                            <div
                                key={type.id}
                                onClick={() => handleTypeSelect(locationType, type.id)}
                                className={clsx(
                                    "cursor-pointer rounded-xl border p-4 flex flex-col items-center justify-center gap-2 transition-all",
                                    isSelected
                                        ? "border-primary-600 bg-primary-50 text-primary-700 ring-1 ring-primary-600"
                                        : "border-gray-200 bg-white hover:border-primary-200 text-slate-600"
                                )}
                            >
                                <Icon size={24} className={isSelected ? "text-primary-600" : "text-slate-400"} />
                                <span className="text-sm font-medium">{type.label}</span>
                            </div>
                        )
                    })}
                </div>

                {/* Adjustments Toggles */}
                <div className="space-y-3">
                    <Label>Site Conditions</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ToggleCard
                            active={data.stairs}
                            label="Stairs Only (No Lift)"
                            onClick={() => handleToggle(locationType, 'stairs')}
                        />
                        <ToggleCard
                            active={data.elevator}
                            label="Elevator Available"
                            onClick={() => handleToggle(locationType, 'elevator')}
                        />
                        <ToggleCard
                            active={data.longCarry}
                            label="Long Carry (>30m)"
                            info="Truck cannot park close to entrance"
                            onClick={() => handleToggle(locationType, 'longCarry')}
                        />
                        <ToggleCard
                            active={data.shuttle}
                            label="Shuttle Required"
                            info="Complex restriction or narrow road"
                            onClick={() => handleToggle(locationType, 'shuttle')}
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 md:p-8 space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-6">Site Access Details</h3>

                    {renderLocationForm('origin')}

                    <div className="border-t border-gray-100 my-8"></div>

                    {renderLocationForm('destination')}
                </div>
            </div>

            <div className="flex justify-between">
                <Button variant="ghost" onClick={() => navigate('/quote')}>Back</Button>
                <Button size="lg" onClick={() => navigate('/quote/inventory')}>Next: Select Inventory</Button>
            </div>
        </div>
    )
}

function ToggleCard({ active, label, info, onClick }) {
    return (
        <div
            onClick={onClick}
            className={clsx(
                "flex items-center justify-between p-3 rounded-lg border cursor-pointer select-none transition-all",
                active ? "border-primary-600 bg-primary-50" : "border-gray-200 hover:border-gray-300"
            )}
        >
            <div>
                <div className={clsx("font-medium text-sm", active ? "text-primary-900" : "text-slate-700")}>{label}</div>
                {info && <div className="text-xs text-slate-500">{info}</div>}
            </div>
            <div className={clsx(
                "w-5 h-5 rounded border flex items-center justify-center",
                active ? "bg-primary-600 border-primary-600" : "bg-white border-gray-300"
            )}>
                {active && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
        </div>
    )
}
