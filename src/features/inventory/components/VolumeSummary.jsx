import React, { useMemo } from 'react'
import { Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import TruckVisual from './TruckVisual'

export default function VolumeSummary({ items, inventory }) {
    const totalVolume = useMemo(() => {
        return Object.entries(inventory).reduce((total, [itemId, qty]) => {
            const item = items.find(i => i.id === itemId)
            return total + (item ? item.volume * qty : 0)
        }, 0)
    }, [items, inventory])

    // Simple logic to determine truck size (just for visual)
    const truckSize = 25 // standard truck
    const usagePercent = Math.min((totalVolume / truckSize) * 100, 100)

    return (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl sticky top-24">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Truck className="text-primary-400" />
                    Truck Load
                </h3>
                <span className="text-2xl font-bold font-mono text-primary-400">{totalVolume.toFixed(2)} <span className="text-sm text-slate-400">m³</span></span>
            </div>

            {/* Progress Bar */}
            {/* Truck Visual */}
            <div className="mb-4">
                <TruckVisual volumeMp={totalVolume} fillPercent={usagePercent} />
            </div>
            <p className="text-xs text-slate-400 mb-6">
                Est. capacity usage based on standard 3-ton truck.
            </p>

            {/* Mini List of added items */}
            <div className="space-y-2 border-t border-slate-700 pt-4 max-h-60 overflow-y-auto custom-scrollbar">
                {Object.entries(inventory).map(([itemId, qty]) => {
                    const item = items.find(i => i.id === itemId)
                    if (!item) return null
                    return (
                        <div key={itemId} className="flex justify-between text-sm">
                            <span className="text-slate-300">{qty}x {item.name}</span>
                            <span className="text-slate-500">{(item.volume * qty).toFixed(2)}</span>
                        </div>
                    )
                })}
                {Object.keys(inventory).length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-4">Your truck is empty.</p>
                )}
            </div>
        </div>
    )
}
