import React, { useMemo } from 'react'
import { Truck } from 'lucide-react'
import TruckVisual from './TruckVisual'
import { useMoveStore, getWrappingFlag, getPlasticSleevesCount } from '../store/moveStore'

export default function VolumeSummary({ items, inventory, breakdown = {}, children }) {
    const { moveDetails } = useMoveStore()
    
    const totalVolume = useMemo(() => {
        let baseVolume = Object.entries(inventory).reduce((total, [idKey, qty]) => {
            const [itemId] = idKey.split('_')
            if (itemId === 'boxes' || itemId.startsWith('boxes-')) {
                return total
            }
            const item = items.find(i => i.id === itemId)
            return total + (item ? item.volume * qty : 0)
        }, 0)
        
        const orderedSt7Boxes = moveDetails?.st7Boxes || 0
        const orderedLinenBoxes = moveDetails?.linenBoxes || 0
        return baseVolume + (orderedSt7Boxes * 4.25) + (orderedLinenBoxes * 8)
    }, [items, inventory, moveDetails?.st7Boxes, moveDetails?.linenBoxes])

    const boxQty = useMemo(() => {
        let baseQty = Object.entries(inventory).reduce((total, [idKey, qty]) => {
            const [itemId] = idKey.split('_')
            if (itemId === 'boxes' || itemId.startsWith('boxes-')) {
                return total + qty
            }
            return total
        }, 0)
        
        const orderedSt7Boxes = moveDetails?.st7Boxes || 0
        const orderedLinenBoxes = moveDetails?.linenBoxes || 0
        return baseQty + orderedSt7Boxes + orderedLinenBoxes
    }, [inventory, moveDetails?.st7Boxes, moveDetails?.linenBoxes])

    // Remove the 4.25 multiplier for boxQty since we already included precise box volumes in totalVolume
    const volumeForTruck = totalVolume
    const truckSize = 883
    const usagePercent = Math.min((volumeForTruck / truckSize) * 100, 100)

    return (
        <div
            className="bg-slate-900 text-white rounded-2xl shadow-xl sticky top-2 lg:top-24 flex flex-col overflow-hidden transition-all duration-300 z-40 mb-4 lg:mb-0"
        >
            {/* Header — never scrolls */}
            <div className="flex items-center justify-between px-4 md:px-6 pt-4 md:pt-6 pb-1 flex-shrink-0">
                <h3 className="text-sm md:text-lg font-bold flex items-center gap-2 uppercase tracking-tighter">
                    <Truck className="text-red-400 w-4 h-4 md:w-6 md:h-6" />
                    Your Move Truck
                </h3>
            </div>

            {/* Truck Visual — never scrolls */}
            <div className="px-6 pb-2 flex-shrink-0">
                <TruckVisual volumeMp={volumeForTruck} fillPercent={usagePercent} />
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

            {/* Box Supplies Summary */}
            {breakdown?.packaging > 0 && (
                <div className="px-6 py-2 bg-slate-800/50 border-y border-slate-700/50 flex justify-between items-center animate-in slide-in-from-right-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Box Supplies & Delivery</span>
                    <span className="text-sm font-black text-slate-200">R {breakdown.packaging.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            )}

            {/* Protective Packaging (Wrapping & Sleeves) */}
            {(breakdown?.wrappingCost > 0 || breakdown?.plasticSleeveCost > 0) && (
                <div className="border-y border-red-500/20 bg-red-950/40">
                    {breakdown?.wrappingCost > 0 && (
                        <div className={`px-6 py-2 flex justify-between items-center animate-in slide-in-from-right-4 ${breakdown?.plasticSleeveCost > 0 ? 'border-b border-red-900/30' : ''}`}>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-200">Specialized Wrapping</span>
                            <span className="text-sm font-black text-red-400">R {breakdown.wrappingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    {breakdown?.plasticSleeveCost > 0 && (
                        <div className="px-6 py-2 flex justify-between items-center animate-in slide-in-from-right-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-200">Plastic Covers</span>
                            <span className="text-sm font-black text-red-400">R {breakdown.plasticSleeveCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Item list — scrolls independently if it overflows */}
            <div className="flex-1 overflow-y-auto min-h-0 border-t border-slate-700 px-6 py-3 space-y-2 custom-scrollbar">
                {Object.entries(inventory).map(([idKey, qty]) => {
                    const [itemId, variation] = idKey.split('_')
                    const item = items.find(i => i.id === itemId)
                    if (!item) return null
                    const isWrapped = getWrappingFlag(item, variation)
                    const isSleeved = getPlasticSleevesCount(item, idKey) > 0
                    return (
                        <div key={idKey} className="flex justify-between text-sm items-center py-1">
                            <span className="text-slate-300 truncate pr-2 font-medium">
                                {qty}x {item.name}
                                {variation && <span className="text-slate-500 text-[10px] ml-1 uppercase">({variation})</span>}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-tighter">
                                {isWrapped ? <span className="text-blue-400">Wrapping ✓</span> : 
                                 isSleeved ? <span className="text-blue-400">Sleeve ✓</span> : 
                                 <span className="text-slate-600">Standard</span>}
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
