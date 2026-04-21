import React from 'react'
import { Plus, Minus } from 'lucide-react'
import clsx from 'clsx'

export default function InventoryItemCard({ item, quantity, onAdd, onRemove, variation }) {
    // Compute per-unit packaging cost for this specific item + variation
    const hasWrapping = item.autoPackagingType && item.autoPackagingType !== 'crate'
    const hasVariationWrap = (variation === 'Glass' || variation === 'Marble')
    const needsPackaging = hasVariationWrap || hasWrapping
    const packagingCostPerUnit = needsPackaging ? (item.volume * 35) : 0

    return (
        <div className={clsx(
            "flex items-start justify-between p-3 rounded-xl border transition-all hover:shadow-md gap-2",
            quantity > 0 ? "border-red-200 bg-red-50/30" : "border-gray-100 bg-white"
        )}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Emoji Icon */}
                <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-2xl select-none">
                    {item.image}
                </div>

                <div className="flex flex-col items-start min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 leading-tight">{item.name}</h4>
                    {needsPackaging && (
                        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">
                            Wrapping: R {packagingCostPerUnit.toFixed(2)}
                        </span>
                    )}
                    <div className="flex flex-wrap gap-1 mt-0.5">
                        {/* Packaging type — always visible */}
                        {item.autoPackagingType && item.autoPackagingType !== 'crate' && (
                            <span className="text-[9px] text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-medium">
                                {item.autoPackagingType}
                            </span>
                        )}
                        {item.requiresCrate && (
                            <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-medium">
                                Opt. Crate
                            </span>
                        )}
                        {item.requiresPhoto && (
                            <span className="text-[9px] text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded font-medium">
                                Photo Req.
                            </span>
                        )}
                        {item.variationOptions?.length > 0 && (
                            <span className="text-[9px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                                Variations
                            </span>
                        )}
                    </div>
                    {/* After adding — show packaging indicator */}
                    {quantity > 0 && needsPackaging && (
                        <div className="mt-1 flex items-center gap-1">
                            <span className="text-[9px] text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded font-medium">
                                ✓ Protective wrapping included
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {quantity > 0 && (
                    <>
                        <button
                            onClick={() => onRemove(item.id)}
                            className="w-8 h-8 rounded-full border border-primary-200 text-primary-600 flex items-center justify-center hover:bg-primary-50 transition-colors"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="text-sm font-semibold text-slate-900 min-w-[1rem] text-center">{quantity}</span>
                    </>
                )}

                <button
                    onClick={() => onAdd(item.id)}
                    className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                        quantity > 0
                            ? "bg-primary-600 text-white hover:bg-primary-700"
                            : "border border-gray-200 text-slate-400 hover:border-primary-500 hover:text-primary-600"
                    )}
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
    )
}
