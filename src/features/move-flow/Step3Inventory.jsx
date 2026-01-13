import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMoveStore } from '../inventory/store/moveStore'
import { INVENTORY_ITEMS, CATEGORIES } from '../inventory/data/mockItems'
import InventoryItemCard from '../inventory/components/InventoryItemCard'
import VolumeSummary from '../inventory/components/VolumeSummary'
import { Button } from '../../components/ui/Button'
import { Search } from 'lucide-react'
import { Input } from '../../components/ui/Input'

export default function Step3Inventory() {
    const navigate = useNavigate()
    const { inventory, addItem, removeItem } = useMoveStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])

    const filteredItems = INVENTORY_ITEMS.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = activeCategory ? item.category === activeCategory : true
        return matchesSearch && matchesCategory
    })

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Inventory List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

                        {/* Search */}
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search for items (e.g. Bed, Sofa)..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-shadow"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Categories */}
                        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Items Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            {filteredItems.map(item => (
                                <InventoryItemCard
                                    key={item.id}
                                    item={item}
                                    quantity={inventory[item.id] || 0}
                                    onAdd={addItem}
                                    onRemove={removeItem}
                                />
                            ))}
                            {filteredItems.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-400">
                                    No items found in this section.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Calculations */}
                <div className="lg:col-span-1">
                    <VolumeSummary items={INVENTORY_ITEMS} inventory={inventory} />

                    <div className="mt-6 flex flex-col gap-3">
                        <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/quote/summary')}>
                            View Quote Summary
                        </Button>
                        <Button variant="ghost" onClick={() => navigate('/quote/access')}>
                            Back to Access
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    )
}
