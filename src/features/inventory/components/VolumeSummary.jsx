import React, { useMemo } from 'react'
import { Truck } from 'lucide-react'
import TruckVisual from './TruckVisual'

export default function VolumeSummary({ items, inventory, children }) {
    const totalVolume = useMemo(() => {
        return Object.entries(inventory).reduce((total, [idKey, qty]) => {
            const [itemId] = idKey.split('_')
            const item = items.find(i => i.id === itemId)
            return total + (item ? item.volume * qty : 0)
        }, 0)
    }, [items, inventory])

    const truckSize = 883
    const usagePercent = Math.min((totalVolume / truckSize) * 100, 100)

    return (
        <div
            className="bg-slate-900 text-white rounded-2xl shadow-xl sticky top-24 flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 7rem)' }}
        >
            {/* Header — never scrolls */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2 flex-shrink-0">
                <h3 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tighter">
                    <Truck className="text-red-400" />
                    Your Move Truck
                </h3>
            </div>

            {/* Truck Visual — never scrolls */}
            <div className="px-6 pb-2 flex-shrink-0">
                <TruckVisual volumeMp={totalVolume} fillPercent={usagePercent} />
            </div>
            
            <div className="px-6 py-3 bg-indigo-900/50 mx-4 rounded-xl border border-indigo-500/30 mb-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Payment Option Available</span>
                    </div>
                    <span className="text-[10px] font-bold text-white bg-indigo-500 px-2 py-0.5 rounded">Payflex</span>
                </div>
                <p className="text-[11px] text-white font-bold mt-1">Pay in 4 interest-free installments</p>
            </div>

            {/* Item list — scrolls independently if it overflows */}
            <div className="flex-1 overflow-y-auto min-h-0 border-t border-slate-700 px-6 py-3 space-y-2 custom-scrollbar">
                {Object.entries(inventory).map(([idKey, qty]) => {
                    const [itemId, variation] = idKey.split('_')
                    const item = items.find(i => i.id === itemId)
                    if (!item) return null
                    const needsPackaging = item.autoPackagingType || (variation === 'Glass' || variation === 'Marble')
                    return (
                        <div key={idKey} className="flex justify-between text-sm items-center py-1">
                            <span className="text-slate-300 truncate pr-2 font-medium">
                                {qty}x {item.name}
                                {variation && <span className="text-slate-500 text-[10px] ml-1 uppercase">({variation})</span>}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-tighter">
                                {needsPackaging ? <span className="text-blue-400">Wrapping ✓</span> : <span className="text-slate-600">Standard</span>}
                            </span>
                        </div>
                    )
                })}
                {Object.keys(inventory).length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-4">Add items to your truck.</p>
                )}
            </div>

            {/* Action Buttons — always pinned to the bottom */}
            {children && (
                <div className="border-t border-slate-700 p-4 space-y-2 flex-shrink-0 bg-slate-900">
                    {children}
                </div>
            )}
        </div>
    )
}
