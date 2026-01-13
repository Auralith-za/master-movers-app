import React from 'react'
import { Plus, Minus } from 'lucide-react'
import clsx from 'clsx'

export default function InventoryItemCard({ item, quantity, onAdd, onRemove }) {
    return (
        <div className={clsx(
            "flex items-center justify-between p-3 rounded-xl border transition-all hover:shadow-md",
            quantity > 0 ? "border-primary-200 bg-primary-50/30" : "border-gray-100 bg-white"
        )}>
            <div className="flex items-center gap-3">
                {/* Image Placeholder */}
                <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-1">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain opacity-80" />
                </div>

                <div>
                    <h4 className="text-sm font-medium text-slate-900">{item.name}</h4>
                    <span className="text-xs text-slate-500">{item.volume} m³</span>
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
