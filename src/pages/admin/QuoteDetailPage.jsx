import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { 
    ArrowLeft, MessageCircle, Mail, MapPin, Calendar, Box, Truck, 
    Building, Package, Download, Save, X, Edit2, AlertCircle, RefreshCw,
    Plus, Trash2, Send, History, User, Lock, ExternalLink, ShieldCheck, Copy, CreditCard, Search
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { INVENTORY_ITEMS, CATEGORIES } from '../../features/inventory/data/mockItems'
import { calculateQuote, useMoveStore, getPlasticSleevesCount, getWrappingFlag, parseInventoryKey } from '../../features/inventory/store/moveStore'
import { generateProfessionalQuote } from '../../services/pdfService'
import { emailService } from '../../services/emailService'
import { getInventoryImage } from '../../features/inventory/components/InventoryItemCard'
import AddressAutocomplete from '../../components/ui/AddressAutocomplete'
import { calculateTripDistances } from '../../services/googleMaps'
import { PACKAGING_RATES, detectCityCode } from '../../features/inventory/data/pricingRates'
import { getSimpleQuoteNumber } from '../../utils/quoteHelpers'
import CouponInput from '../../features/payment/CouponInput'
import { normalizeInventory } from '../../utils/inventoryUtils'
import clsx from 'clsx'

const orderedCategories = (() => {
    const list = [...CATEGORIES];
    const index = list.indexOf("Special Handling Items");
    if (index > -1) {
        list.splice(index, 1);
        list.push("Special Handling Items");
    }
    return list;
})();

const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'new': return 'bg-blue-50 text-blue-700 ring-blue-600/20'
        case 'processing': return 'bg-purple-50 text-purple-700 ring-purple-600/20'
        case 'pending_payment': return 'bg-amber-50 text-amber-700 ring-amber-600/20'
        case 'booked':
        case 'paid':
        case 'booked_paid': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
        case 'on_hold': return 'bg-orange-50 text-orange-700 ring-orange-600/20'
        case 'rejected': return 'bg-red-50 text-red-700 ring-red-600/10'
        case 'completed': return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20'
        case 'lead': return 'bg-slate-50 text-slate-700 ring-slate-600/20'
        case 'payment_cancelled': return 'bg-red-100 text-red-800 ring-red-600/30'
        default: return 'bg-slate-50 text-slate-700 ring-slate-600/20'
    }
}

export default function QuoteDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [quote, setQuote] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [activities, setActivities] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [mapsStatus, setMapsStatus] = useState('Idle')
    const [priceOffset, setPriceOffset] = useState(0)
    const [hasCalculatedOffset, setHasCalculatedOffset] = useState(false)
    
    const [selectedCategory, setSelectedCategory] = useState(orderedCategories[0])
    const [showCatalog, setShowCatalog] = useState(false)
    const [selectedItemForVariation, setSelectedItemForVariation] = useState(null)
    const [roomModalItem, setRoomModalItem] = useState(null)
    const [newNote, setNewNote] = useState('')
    const [customProductForm, setCustomProductForm] = useState({ name: '', cubes: '', quantity: 1, wrap: false, sleeves: 0 })
    const [showCustomProductModal, setShowCustomProductModal] = useState(false)

    useEffect(() => {
        if (id === 'new') {
            setQuote({ id: 'new', status: 'lead', client_name: '', items_json: {} })
            setEditForm({
                client_name: '',
                client_email: '',
                client_phone: '',
                pickup_address: '',
                dropoff_address: '',
                distance_km: 0,
                move_date: new Date().toISOString().split('T')[0],
                status: 'lead',
                items_json: {},
                total_price: 0,
                total_volume: 0,
                packaging_option: 'none',
                st7_boxes: 0,
                linen_boxes: 0,
                insurance_enabled: false,
                is_shared_load: false,
                custom_products: [],
                payment_method: 'eft',
                access_details: { 
                    origin: { type: 'house', floorLevel: 0, parkingType: 'driveway', specialConditions: {} }, 
                    destination: { type: 'house', floorLevel: 0, parkingType: 'driveway', specialConditions: {} } 
                }
            })
            setIsEditing(true)
            setLoading(false)
        } else if (id) {
            fetchQuote()
            fetchActivities()
        }
    }, [id])

    const lastCalcInputsRef = useRef('');

    // Helper function to handle distance calculation
    const performDistanceCalculation = async (pickup, dropoff, silent = true, customExtraColls = null, customExtraDrops = null) => {
        if (!pickup || !dropoff || pickup.trim().length < 5 || dropoff.trim().length < 5) return;

        setMapsStatus("Calculating distance matrix via Google Maps...");
        try {
            const cityCode = detectCityCode(pickup) || detectCityCode(dropoff) || 'JHB';
            const extraColls = customExtraColls !== null ? customExtraColls : (editForm.extraCollections || editForm.extra_collections || []);
            const extraDrops = customExtraDrops !== null ? customExtraDrops : (editForm.extraDrops || editForm.extra_drops || []);
            const { totalDistance, breakdown } = await calculateTripDistances(
                pickup, 
                dropoff, 
                cityCode, 
                null, 
                null, 
                extraColls, 
                extraDrops
            );
            setMapsStatus(`Success: ${totalDistance}km`);
            const pickupCity = detectCityCode(pickup);
            const dropoffCity = detectCityCode(dropoff);
            const isNational = (pickupCity && dropoffCity && pickupCity !== dropoffCity) || ((breakdown.pickupToDropoff || 0) > 250);
            setEditForm(prev => ({ 
                ...prev, 
                distance_km: totalDistance,
                trip_breakdown: breakdown
            }));
            return true;
        } catch (err) {
            console.error("Admin auto-dist error:", err);
            setMapsStatus(`Failed: ${err.message}`);
            if (!silent) {
                alert("Google Maps could not process these addresses. Please fix the addresses or manually enter the correct Billable Distance (km) below.");
            }
            return false;
        }
    };

    // Auto-calculate distance with debounce when addresses or extra locations change
    const extraCollsStr = JSON.stringify(editForm.extraCollections || editForm.extra_collections || []);
    const extraDropsStr = JSON.stringify(editForm.extraDrops || editForm.extra_drops || []);
    const quoteExtraCollsStr = JSON.stringify(quote?.items_json?.extraCollections || quote?.extra_collections || []);
    const quoteExtraDropsStr = JSON.stringify(quote?.items_json?.extraDrops || quote?.extra_drops || []);

    useEffect(() => {
        if (editForm.pickup_address && editForm.dropoff_address) {
            const currentInputs = `${editForm.pickup_address}|${editForm.dropoff_address}|${extraCollsStr}|${extraDropsStr}`;
            const hasValidBreakdown = editForm.trip_breakdown && 
                                      typeof editForm.trip_breakdown === 'object' &&
                                      editForm.trip_breakdown.depotToPickup !== undefined;

            const needsCalculation = isEditing 
                ? (
                    editForm.pickup_address !== quote?.pickup_address || 
                    editForm.dropoff_address !== quote?.dropoff_address || 
                    extraCollsStr !== quoteExtraCollsStr || 
                    extraDropsStr !== quoteExtraDropsStr || 
                    !hasValidBreakdown
                  )
                : (!hasValidBreakdown && editForm.pickup_address && editForm.dropoff_address);

            if (needsCalculation && currentInputs !== lastCalcInputsRef.current) {
                const timer = setTimeout(() => {
                    lastCalcInputsRef.current = currentInputs;
                    const currentExtraColls = editForm.extraCollections || editForm.extra_collections || [];
                    const currentExtraDrops = editForm.extraDrops || editForm.extra_drops || [];
                    performDistanceCalculation(editForm.pickup_address, editForm.dropoff_address, true, currentExtraColls, currentExtraDrops);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [editForm.pickup_address, editForm.dropoff_address, extraCollsStr, extraDropsStr, isEditing, quote?.pickup_address, quote?.dropoff_address, editForm.trip_breakdown]);

    const fetchQuote = async () => {
        try {
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setQuote(data)
            setHasCalculatedOffset(false)
            setPriceOffset(0)
            
            // Fix items_json if it's nested or legacy
            const rawItems = normalizeInventory(data.items_json)
            const rawSpecialWrapping = data.items_json?.special_wrapping || {}
            const extraColls = data.items_json?.extraCollections || data.extra_collections || []
            const extraDrops = data.items_json?.extraDrops || data.extra_drops || []
            
            // If the quote already has a trip breakdown, ensure distance_km represents the full billable circuit (depot legs included) for local moves
            let initialDistance = Number(data.distance_km || 0);
            if (data.trip_breakdown && typeof data.trip_breakdown === 'object') {
                const pickupCity = detectCityCode(data.pickup_address);
                const dropoffCity = detectCityCode(data.dropoff_address);
                const breakdown = data.trip_breakdown;
                const pickupToDropoff = breakdown.pickupToDropoff || 0;
                const isNational = (pickupCity && dropoffCity && pickupCity !== dropoffCity) || (pickupToDropoff > 250);
                
                if (!isNational) {
                    const totalCircuit = (breakdown.depotToPickup || 0) + (breakdown.pickupToDropoff || 0) + (breakdown.dropoffToDepot || 0);
                    
                    if (Math.abs(initialDistance - pickupToDropoff) < Math.abs(initialDistance - totalCircuit)) {
                        initialDistance = totalCircuit;
                    }
                }
            }

            setEditForm({
                ...data,
                distance_km: initialDistance,
                items_json: rawItems,
                special_wrapping: rawSpecialWrapping,
                custom_products: data.custom_products || [],
                extraCollections: extraColls,
                extraDrops: extraDrops
            })
        } catch (error) {
            console.error('Error fetching quote:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchActivities = async () => {
        try {
            const { data, error } = await supabase
                .from('quote_activities')
                .select('*')
                .eq('quote_id', id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setActivities(data || [])
        } catch (error) {
            console.error('Error fetching activities:', error)
            setActivities([])
        }
    }

    const logActivity = async (type, content) => {
        try {
            const { error } = await supabase
                .from('quote_activities')
                .insert([{
                    quote_id: id,
                    activity_type: type,
                    content: content
                }])

            if (error) {
                setActivities(prev => [{
                    id: Math.random(),
                    created_at: new Date().toISOString(),
                    activity_type: type,
                    content: content
                }, ...prev])
                return true
            }

            await fetchActivities()
            return true
        } catch (error) {
            console.error('Error logging activity:', error)
            return false
        }
    }

    const handleSaveNote = async () => {
        if (!newNote.trim()) return
        const success = await logActivity('note', newNote)
        if (success) setNewNote('')
    }

    // Calculate live price — runs always so PDF always has a full breakdown
    const recalculatedData = useMemo(() => {
        // Always compute from editForm since it acts as the staging copy of the quote
        const inventory = normalizeInventory(editForm.items_json)

        const srcPickup  = editForm.pickup_address  || ''
        const srcDropoff = editForm.dropoff_address || ''
        const srcDist    = editForm.distance_km     || 0
        const srcDate    = editForm.move_date       || ''
        const srcPkg     = editForm.packaging_option || 'none'
        const srcSt7     = editForm.st7_boxes       || 0
        const srcLinen   = editForm.linen_boxes     || 0
        const srcAccess  = editForm.access_details  || {}

        const srcExtraColls = editForm.extraCollections || editForm.extra_collections || []
        const srcExtraDrops = editForm.extraDrops || editForm.extra_drops || []

        const moveDetails = {
            pickupAddress: srcPickup,
            dropoffAddress: srcDropoff,
            extraCollections: srcExtraColls,
            extraDrops: srcExtraDrops,
            pickupCity: srcPickup,
            dropoffCity: srcDropoff,
            distanceKm: srcDist,
            totalBillableDistance: srcDist,
            tripBreakdown: editForm.trip_breakdown || null,
            moveDate: srcDate,
            packagingOption: srcPkg,
            st7Boxes: srcSt7,
            linenBoxes: srcLinen,
            insuranceEnabled: editForm.insurance_enabled || false,
            isSharedLoad: editForm.is_shared_load || false,
            paymentMethod: editForm.payment_method || 'eft',
            storageDestination: editForm.storage_destination || quote?.storage_destination || null,
            customProducts: editForm.custom_products || []
        }

        const manualServiceCharges = { ...(editForm.manual_service_charges || {}) }
        const srcWrapping = editForm.special_wrapping || {}

        try {
            return calculateQuote(inventory, moveDetails, srcAccess, INVENTORY_ITEMS, manualServiceCharges, 0, srcWrapping, true)
        } catch (err) {
            console.error("calculateQuote error:", err)
            return { error: err.message }
        }
    }, [
        editForm.items_json,
        editForm.pickup_address,
        editForm.dropoff_address,
        extraCollsStr,
        extraDropsStr,
        editForm.distance_km,
        editForm.trip_breakdown,
        editForm.move_date,
        editForm.packaging_option,
        editForm.st7_boxes,
        editForm.linen_boxes,
        editForm.insurance_enabled,
        editForm.is_shared_load,
        editForm.access_details,
        editForm.special_wrapping,
        editForm.manual_service_charges,
        editForm.custom_products
    ])



    const handleUpdateQuantity = (itemId, newQty) => {
        const updatedItems = { ...editForm.items_json }
        if (newQty <= 0) {
            delete updatedItems[itemId]
        } else {
            updatedItems[itemId] = newQty
        }
        setEditForm({ ...editForm, items_json: updatedItems })
    }

    const handleAddItem = (item, variation = null, targetRoom = null) => {
        if (item.variationOptions && item.variationOptions.length > 0 && !variation) {
            setSelectedItemForVariation({ item, targetRoom: targetRoom || (searchQuery.length >= 2 ? null : selectedCategory) })
            return
        }

        if (!targetRoom) {
            setRoomModalItem({ item, variation })
            return
        }

        const baseKey = variation ? `${item.id}_${variation}` : item.id
        const idKey = `${baseKey}__room:${targetRoom}`
        const updatedItems = { ...editForm.items_json }
        updatedItems[idKey] = (updatedItems[idKey] || 0) + 1
        setEditForm({ ...editForm, items_json: updatedItems })
        setSelectedItemForVariation(null)
        setRoomModalItem(null)
        setSearchQuery('')
    }

    const handleChangeItemRoom = (oldIdKey, newRoom) => {
        const parsed = parseInventoryKey(oldIdKey)
        const baseKey = parsed.variation ? `${parsed.itemId}_${parsed.variation}` : parsed.itemId
        const newIdKey = `${baseKey}__room:${newRoom}`
        const updatedItems = { ...editForm.items_json }
        const qty = updatedItems[oldIdKey] || 1
        delete updatedItems[oldIdKey]
        updatedItems[newIdKey] = (updatedItems[newIdKey] || 0) + qty
        setEditForm({ ...editForm, items_json: updatedItems })
        setRoomModalItem(null)
    }

    const handleAddCustomProduct = (nameArg, cubesArg, wrapArg, sleevesArg, quantityArg) => {
        const name = (typeof nameArg === 'string' ? nameArg : customProductForm.name).trim()
        const cubesVal = typeof cubesArg === 'number' || typeof cubesArg === 'string' ? cubesArg : customProductForm.cubes
        const wrap = typeof wrapArg === 'boolean' ? wrapArg : Boolean(customProductForm.wrap)
        const sleeves = typeof sleevesArg === 'number' ? sleevesArg : (parseInt(customProductForm.sleeves) || 0)
        const qtyVal = typeof quantityArg === 'number' || typeof quantityArg === 'string' ? quantityArg : customProductForm.quantity
        const cubes = parseFloat(cubesVal) || 0
        const quantity = Math.max(1, parseInt(qtyVal) || 1)
        if (!name) return
        const newProduct = { 
            id: Date.now(), 
            name, 
            cubes, 
            cuft: cubes,
            quantity, 
            wrap: sleeves > 0 ? false : wrap, 
            sleeves, 
            price: 0 
        }
        setEditForm(prev => ({ ...prev, custom_products: [...(prev.custom_products || []), newProduct] }))
        setCustomProductForm({ name: '', cubes: '', quantity: 1, wrap: false, sleeves: 0 })
        setShowCustomProductModal(false)
    }

    const handleUpdateCustomProductQty = (productId, newQty) => {
        const quantity = Math.max(1, parseInt(newQty) || 1)
        setEditForm(prev => ({
            ...prev,
            custom_products: (prev.custom_products || []).map(p => {
                if (p.id === productId) {
                    return { ...p, quantity }
                }
                return p
            })
        }))
    }

    const handleToggleCustomProductWrap = (productId, wrapVal) => {
        setEditForm(prev => ({
            ...prev,
            custom_products: (prev.custom_products || []).map(p => {
                if (p.id === productId) {
                    const newWrap = wrapVal !== undefined ? wrapVal : !p.wrap
                    return { ...p, wrap: newWrap, sleeves: newWrap ? 0 : (p.sleeves || 0) }
                }
                return p
            })
        }))
    }

    const handleUpdateCustomProductSleeves = (productId, newSleevesQty) => {
        const sleeves = Math.max(0, parseInt(newSleevesQty) || 0)
        setEditForm(prev => ({
            ...prev,
            custom_products: (prev.custom_products || []).map(p => {
                if (p.id === productId) {
                    return { ...p, sleeves, wrap: sleeves > 0 ? false : p.wrap }
                }
                return p
            })
        }))
    }

    const handleApplyCoupon = (coupon) => {
        const basePrice = recalculatedData?.total || editForm.total_price || 0
        const customProductsTotal = (editForm.custom_products || []).reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0)
        
        const discountAmount = coupon.discount_type === 'fixed' 
            ? coupon.discount_amount 
            : ((basePrice + customProductsTotal) * coupon.discount_percent) / 100
            
        const newProduct = { 
            id: `coupon_${Date.now()}`, 
            name: `Coupon (${coupon.code})`, 
            cubes: 0, 
            cuft: 0,
            quantity: 1,
            price: -Math.abs(discountAmount) 
        }
        
        setEditForm(prev => ({ 
            ...prev, 
            custom_products: [...(prev.custom_products || []), newProduct] 
        }))
        
        alert(`Coupon applied! Added as a discount of R ${discountAmount.toFixed(2)}`)
    }

    const handleRemoveCustomProduct = (productId) => {
        setEditForm(prev => ({ ...prev, custom_products: (prev.custom_products || []).filter(p => p.id !== productId) }))
    }

    const customProductsTotal = (editForm.custom_products || []).reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0)
    const customProductsVolume = (editForm.custom_products || []).reduce((sum, p) => sum + (parseFloat(p.cubes || p.cuft || 0) * (parseInt(p.quantity || p.qty || 1) || 1)), 0)


    useEffect(() => {
        // Block offset calculation if Google Maps is actively running in the background.
        // This avoids race conditions where the baseline offset is calculated against a temporary distance (e.g. 10km) 
        // before Google Maps has finished resolving the correct circuit distance (e.g. 64km).
        const hasValidBreakdown = editForm.trip_breakdown && 
                                  typeof editForm.trip_breakdown === 'object' &&
                                  editForm.trip_breakdown.depotToPickup !== undefined;
        const isMapsRunning = !hasValidBreakdown && !mapsStatus.startsWith('Failed');

        if (quote && recalculatedData && !recalculatedData.error && !hasCalculatedOffset && !isEditing && !isMapsRunning) {
            const dbPrice = Number(quote.total_price || 0);
            const recalcPrice = Number((recalculatedData.total || 0) + customProductsTotal);
            if (recalcPrice === 0) {
                setPriceOffset(0);
                setHasCalculatedOffset(true);
            } else if (dbPrice > 0 && recalcPrice > 0 && quote.is_manual_price) {
                const offset = dbPrice - recalcPrice;
                if (Math.abs(offset) > 0.01) {
                    setPriceOffset(offset);
                }
                setHasCalculatedOffset(true);
            } else {
                setPriceOffset(0);
                setHasCalculatedOffset(true);
            }
        }
    }, [quote, recalculatedData, hasCalculatedOffset, isEditing, customProductsTotal, editForm.trip_breakdown, mapsStatus])

    const hasNoItemsOrCustomQuote = (recalculatedData?.total === 0 && customProductsTotal === 0);

    const finalPrice = hasNoItemsOrCustomQuote
        ? 0
        : ((isEditing || !quote?.total_price)
            ? (((recalculatedData?.total || 0) + customProductsTotal) + priceOffset)
            : (Number(quote?.total_price) || 0));

    const finalVat = hasNoItemsOrCustomQuote
        ? 0
        : ((isEditing || !quote?.total_price)
            ? ((recalculatedData?.vat || 0) + (priceOffset * 0.15 / 1.15))
            : ((Number(quote?.total_price) || 0) * 0.15 / 1.15));

    const finalSubTotal = hasNoItemsOrCustomQuote
        ? 0
        : ((isEditing || !quote?.total_price)
            ? ((recalculatedData?.subTotal || 0) + (priceOffset / 1.15))
            : ((Number(quote?.total_price) || 0) / 1.15));

    const handleSave = async () => {
        try {
            const basePrice = recalculatedData?.total || editForm.total_price || 0
            const finalPrice = basePrice + customProductsTotal + priceOffset
            const baseVolume = recalculatedData?.totalVolume || editForm.total_volume || 0
            const finalVolume = baseVolume + customProductsVolume

            const payload = {
                client_name: editForm.client_name,
                client_phone: editForm.client_phone,
                client_email: editForm.client_email,
                pickup_address: editForm.pickup_address,
                dropoff_address: editForm.dropoff_address,
                extra_collections: editForm.extraCollections || editForm.extra_collections || [],
                extra_drops: editForm.extraDrops || editForm.extra_drops || [],
                distance_km: Number(editForm.distance_km || 0),
                trip_breakdown: editForm.trip_breakdown || null,
                move_date: editForm.move_date,
                status: editForm.status,
                rejection_reason: editForm.rejection_reason,
                team_notes: editForm.team_notes,
                items_json: {
                    items: editForm.items_json,
                    special_wrapping: editForm.special_wrapping || {},
                    extraCollections: editForm.extraCollections || editForm.extra_collections || [],
                    extraDrops: editForm.extraDrops || editForm.extra_drops || []
                },
                total_price: finalPrice,
                total_volume: finalVolume,
                customer_comments: editForm.customer_comments,
                access_details: editForm.access_details,
                packaging_option: editForm.packaging_option,
                st7_boxes: editForm.st7_boxes,
                linen_boxes: editForm.linen_boxes,
                insurance_enabled: editForm.insurance_enabled,
                is_shared_load: editForm.is_shared_load,
                custom_products: editForm.custom_products || [],
                payment_method: editForm.payment_method || 'eft'
            }

            let error
            let newId = id
            if (id === 'new') {
                const { data, error: err } = await supabase
                    .from('quotes')
                    .insert([payload])
                    .select()
                error = err
                if (data?.[0]) newId = data[0].id
            } else {
                const { error: err } = await supabase
                    .from('quotes')
                    .update(payload)
                    .eq('id', id)
                error = err
            }

            // Fallback: If DB table is missing extra_collections or extra_drops columns, retry without top-level keys (data is preserved in items_json)
            if (error && (error.code === 'PGRST204' || error.message?.includes('extra_collections') || error.message?.includes('extra_drops'))) {
                console.warn('Supabase DB missing extra_collections/extra_drops columns. Retrying with fallback payload...')
                const safePayload = { ...payload }
                delete safePayload.extra_collections
                delete safePayload.extra_drops
                if (id === 'new') {
                    const { data, error: err } = await supabase
                        .from('quotes')
                        .insert([safePayload])
                        .select()
                    error = err
                    if (data?.[0]) newId = data[0].id
                } else {
                    const { error: err } = await supabase
                        .from('quotes')
                        .update(safePayload)
                        .eq('id', id)
                    error = err
                }
            }

            if (error) throw error

            if (id === 'new') {
                alert('Quote created successfully!')
                navigate(`/admin/quotes/${newId}`)
            } else {
                setQuote({ 
                    ...editForm, 
                    extra_collections: editForm.extraCollections || editForm.extra_collections || [],
                    extra_drops: editForm.extraDrops || editForm.extra_drops || [],
                    items_json: {
                        items: editForm.items_json,
                        special_wrapping: editForm.special_wrapping || {},
                        extraCollections: editForm.extraCollections || editForm.extra_collections || [],
                        extraDrops: editForm.extraDrops || editForm.extra_drops || []
                    },
                    total_price: finalPrice, 
                    total_volume: finalVolume 
                })
                await logActivity('edit', `Quote adjusted manually in backend. New Total: R ${finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
                setIsEditing(false)
                alert('Quote updated successfully!')
            }
        } catch (error) {
            console.error('Error saving quote:', error)
            alert('Failed to save quote: ' + error.message)
        }
    }

    const handleSendEmailUpdate = async () => {
        // Use saved email OR fall back to the edit form value (unsaved new quote)
        let emailTo = quote.client_email || editForm.client_email

        if (!emailTo) {
            emailTo = prompt('No email address on this quote. Enter the client email to send to:')
            if (!emailTo) return
            // Save it to the quote immediately
            setEditForm(prev => ({ ...prev, client_email: emailTo }))
            await supabase.from('quotes').update({ client_email: emailTo }).eq('id', quote.id)
        }

        const confirmSend = confirm(`Send automated proposal email with PDF to ${emailTo}?`)
        if (!confirmSend) return

        try {
            const inventoryForPdf = quote.items_json?.items || quote.items_json || {}
            
            const result = await emailService.sendQuoteEmail({
                type: 'quote_proposal',
                quoteId: quote.id,
                totalVolume: computedVolume || quote.total_volume,
                clientName: quote.client_name || editForm.client_name,
                clientEmail: emailTo,
                clientPhone: quote.client_phone || editForm.client_phone,
                pickupAddress: quote.pickup_address || editForm.pickup_address,
                dropoffAddress: quote.dropoff_address || editForm.dropoff_address,
                moveDate: quote.move_date || editForm.move_date,
                inventory: inventoryForPdf,
                total: finalPrice,
                vat: finalVat,
                subTotal: finalSubTotal,
                inventoryItems: INVENTORY_ITEMS,
                breakdown: recalculatedData?.breakdown || quote.items_json?.breakdown || null,
                extraCollections: extraCollections || quote.items_json?.extraCollections || [],
                extraDrops: extraDrops || quote.items_json?.extraDrops || [],
                accessDetails: accessDetails || quote.access_details || {},
                customProducts: editForm.custom_products || quote.custom_products || quote.items_json?.custom_products || []
            })
            
            if (result.success) {
                await logActivity('email', `Proposal email (PDF attached) sent to ${emailTo}.`)
                alert('Email sent successfully!')
            } else {
                alert('Failed to send email: ' + result.error)
            }
        } catch (error) {
            console.error('Email error:', error)
            alert('Failed to trigger email automation: ' + error.message)
        }
    }

    const handleResendQuote = async () => {
        let emailTo = quote.client_email || editForm.client_email

        if (!emailTo) {
            emailTo = prompt('No email address on this quote. Enter the client email to send to:')
            if (!emailTo) return
            setEditForm(prev => ({ ...prev, client_email: emailTo }))
            await supabase.from('quotes').update({ client_email: emailTo }).eq('id', quote.id)
        }

        if (!confirm(`Regenerate and email quote PDF to ${emailTo}?`)) return
        
        try {
            const inventoryForPdf = quote.items_json?.items || quote.items_json || {}
            const reviewLink = `https://mastermovers.co.za/quote-review?id=${id}`
            
            const result = await emailService.sendQuoteEmail({
                type: 'quote_proposal',
                quoteId: quote.id,
                totalVolume: computedVolume || quote.total_volume,
                clientName: quote.client_name,
                clientEmail: quote.client_email,
                clientPhone: quote.client_phone,
                pickupAddress: quote.pickup_address,
                dropoffAddress: quote.dropoff_address,
                moveDate: quote.move_date,
                inventory: inventoryForPdf,
                total: finalPrice,
                vat: finalVat,
                subTotal: finalSubTotal,
                inventoryItems: INVENTORY_ITEMS,
                breakdown: recalculatedData?.breakdown || quote.items_json?.breakdown || null,
                extraCollections: extraCollections || quote.items_json?.extraCollections || [],
                extraDrops: extraDrops || quote.items_json?.extraDrops || [],
                accessDetails: accessDetails || quote.access_details || {},
                customProducts: editForm.custom_products || quote.custom_products || quote.items_json?.custom_products || []
            });

            if (result.success) {
                await logActivity('email', `Quote PDF resent to client at ${quote.client_email}. Payment Link: ${reviewLink}`);
                alert('Quote resent successfully!');
            } else {
                alert('Failed to send email: ' + result.error);
            }
        } catch (error) {
            console.error('Email error:', error);
            alert('Failed to resend quote: ' + error.message);
        }
    }

    const copyPaymentLink = () => {
        const link = `https://mastermovers.co.za/quote-review?id=${id}`
        navigator.clipboard.writeText(link)
        alert('Payment link copied to clipboard!')
    }

    const filteredItems = useMemo(() => {
        if (!searchQuery) return []
        return INVENTORY_ITEMS.filter(i => 
            i.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
    }, [searchQuery])

    const downloadInventoryPDF = async () => {
        try {
            const inventoryForPdf = normalizeInventory(isEditing ? editForm.items_json : (quote.items_json || quote.inventory))
            const activeCustomProds = (isEditing ? editForm.custom_products : (quote.custom_products || quote.items_json?.custom_products || editForm.custom_products || [])) || []
            const activeCustomVol = activeCustomProds.reduce((sum, p) => sum + (parseFloat(p.cubes || p.cuft) || 0), 0)
            const computedVolume = (isEditing ? ((recalculatedData?.totalVolume || 0) + activeCustomVol) : (quote.total_volume || ((recalculatedData?.totalVolume || 0) + activeCustomVol)))
            await generateProfessionalQuote({
                quoteId: quote.id,
                clientName: quote.client_name,
                clientEmail: quote.client_email,
                clientPhone: quote.client_phone,
                pickupAddress: quote.pickup_address,
                dropoffAddress: quote.dropoff_address,
                moveDate: quote.move_date,
                createdAt: quote.created_at,
                inventory: inventoryForPdf,
                // Always prefer live recalculated values so PDF matches sidebar
                total: finalPrice,
                vat: finalVat,
                subTotal: finalSubTotal,
                discount: recalculatedData?.discount || quote.items_json?.breakdown?.discount || 0,
                inventoryItems: INVENTORY_ITEMS,
                breakdown: recalculatedData?.breakdown || null,
                boxQty: recalculatedData?.boxQty,
                totalVolume: computedVolume,
                st7Boxes: quote.st7_boxes || 0,
                linenBoxes: quote.linen_boxes || 0,
                accessDetails: quote.access_details || recalculatedData?.accessDetails || {},
                generalNotes: quote.general_notes || quote.notes || quote.customer_comments || quote.items_json?.generalNotes || '',
                customProducts: activeCustomProds,
                isMinQuote: recalculatedData?.isMinQuote || false,
                extraCollections: quote.items_json?.extraCollections || quote.extra_collections || [],
                extraDrops: quote.items_json?.extraDrops || quote.extra_drops || []
            })
        } catch (err) {
            console.error('PDF generation error:', err)
            alert('Failed to generate PDF: ' + err.message)
        }
    }

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
    if (!quote) return <div className="p-8 text-center"><p className="text-red-500">Quote not found</p></div>

    const displayInventory = normalizeInventory(isEditing ? editForm.items_json : (quote?.items_json || quote?.inventory))
    const isManualEditable = true

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/admin/quotes')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft size={20} className="mr-2" /> Back to Quotes
                </button>
                <div className="flex gap-2">
                    <button onClick={downloadInventoryPDF} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                        <Download size={18} className="mr-2" /> Download Quote
                    </button>
                    <button onClick={handleResendQuote} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800">
                        <Send size={18} className="mr-2" /> Resend Quote
                    </button>
                </div>
            </div>

            {recalculatedData?.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg font-bold">
                    Calculation Error: {recalculatedData.error}
                </div>
            )}

            {mapsStatus && (
                <div className="bg-amber-50 text-amber-700 p-4 rounded-lg font-bold border border-amber-200 text-xs">
                    Google Maps Status: {mapsStatus}
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-slate-900">
                            {id === 'new' ? 'New Manual Quote' : `Quote #${getSimpleQuoteNumber(quote.id)}`}
                        </h1>
                        <span className={clsx(
                            "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset uppercase tracking-wider",
                            getStatusBadgeClass(isEditing ? editForm.status : quote.status)
                        )}>
                            {isEditing ? editForm.status : quote.status}
                        </span>
                        {quote.terms_accepted && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                <ShieldCheck size={12} /> Terms Accepted
                            </span>
                        )}
                    </div>
                    {isEditing && (
                        <div className="flex items-center gap-4 mt-2">
                             <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                <input 
                                    type="checkbox" 
                                    checked={editForm.is_shared_load}
                                    onChange={e => setEditForm({...editForm, is_shared_load: e.target.checked})}
                                />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Shared Load / Part-Move</span>
                            </label>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">
                                <X size={18} className="mr-2" /> Discard
                            </button>
                            <button onClick={handleSave} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium shadow-sm hover:bg-emerald-700">
                                <Save size={18} className="mr-2" /> Save Quote
                            </button>
                        </>
                    ) : (
                        isManualEditable ? (
                            <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100">
                                <Edit2 size={18} className="mr-2" /> Edit Quote
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-lg font-medium cursor-not-allowed">
                                <Lock size={18} /> Quote Locked
                            </div>
                        )
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COL - DETAILS & INVENTORY */}
                <div className="lg:col-span-2 space-y-6">

                    {/* SECTION 1: CLIENT & SERVICE OPTIONS */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">1</div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <User size={20} className="text-primary-600" /> Client & Service Options
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                                    {isEditing ? (
                                        <input 
                                            className="w-full text-sm border border-gray-200 rounded px-3 py-1.5 focus:border-indigo-500 outline-none"
                                            value={editForm.client_name || ''}
                                            onChange={e => setEditForm({...editForm, client_name: e.target.value})}
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-900">{quote?.client_name}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                                        {isEditing ? (
                                            <input className="w-full text-xs border border-gray-100 rounded p-2" value={editForm.client_email || ''} onChange={e => setEditForm({...editForm, client_email: e.target.value})} />
                                        ) : (
                                            <p className="text-xs text-slate-600">{quote?.client_email}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone</label>
                                        {isEditing ? (
                                            <input className="w-full text-xs border border-gray-100 rounded p-2" value={editForm.client_phone || ''} onChange={e => setEditForm({...editForm, client_phone: e.target.value})} />
                                        ) : (
                                            <p className="text-xs text-slate-600">{quote?.client_phone}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-100">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Quote Status</label>
                                    {isEditing ? (
                                        <select 
                                            className="w-full text-xs border border-gray-200 rounded p-2 bg-white font-medium text-slate-800 focus:border-indigo-500 outline-none"
                                            value={editForm.status || 'new'}
                                            onChange={e => setEditForm({...editForm, status: e.target.value})}
                                        >
                                            <option value="lead">Lead</option>
                                            <option value="new">New</option>
                                            <option value="processing">Processing</option>
                                            <option value="pending_payment">Pending Payment</option>
                                            <option value="booked_paid">Booked / Paid</option>
                                            <option value="completed">Completed</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="on_hold">On Hold</option>
                                        </select>
                                    ) : (
                                        <span className={clsx(
                                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset uppercase",
                                            getStatusBadgeClass(quote?.status)
                                        )}>
                                            {quote?.status}
                                        </span>
                                    )}
                                </div>
                                <div className="pt-2 border-t border-slate-100">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">How They Heard About Us</label>
                                    {isEditing ? (
                                        <select 
                                            className="w-full text-xs border border-gray-200 rounded p-2 bg-white font-medium text-slate-800 focus:border-indigo-500 outline-none"
                                            value={editForm.referral_source || editForm.items_json?.referral_source || ''}
                                            onChange={e => setEditForm({
                                                ...editForm, 
                                                referral_source: e.target.value,
                                                items_json: { ...editForm.items_json, referral_source: e.target.value }
                                            })}
                                        >
                                            <option value="">Not Specified</option>
                                            <option value="Saw our truck">Saw our truck</option>
                                            <option value="Google search">Google search</option>
                                            <option value="Google ads">Google ads</option>
                                            <option value="Facebook">Facebook</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="Used Master Movers before">Used Master Movers before</option>
                                            <option value="Referred by someone">Referred by someone (Word of Mouth / Family / Friend)</option>
                                            <option value="Estate Agent / Property Agency">Estate Agent / Property Agency</option>
                                            <option value="Billboard / Signage">Billboard / Signage</option>
                                            <option value="TikTok">TikTok</option>
                                            <option value="Radio / Print">Radio / Print</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                                            {quote?.referral_source || quote?.items_json?.referral_source || 'Not Specified'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-indigo-400 mb-2 block">Packaging Service</label>
                                    {isEditing ? (
                                        <select 
                                            className="w-full text-xs border border-gray-200 rounded p-2 bg-white"
                                            value={editForm.packaging_option}
                                            onChange={e => setEditForm({...editForm, packaging_option: e.target.value})}
                                        >
                                            <option value="none">No Packaging (User Packs)</option>
                                            <option value="boxes_only">Send Me Boxes Only</option>
                                            <option value="boxes_and_packing">Full Packaging (Boxes + Packing)</option>
                                        </select>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-900 uppercase">{quote?.packaging_option}</span>
                                    )}
                                </div>
                                {editForm.packaging_option !== 'none' && isEditing && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] uppercase font-bold text-slate-400">ST7 Boxes</label>
                                            <input type="number" className="w-full p-2 border border-blue-100 rounded bg-white text-xs" value={editForm.st7_boxes || 0} onChange={e => setEditForm({...editForm, st7_boxes: parseInt(e.target.value) || 0})} />
                                        </div>
                                        <div>
                                            <label className="text-[9px] uppercase font-bold text-slate-400">Linen Boxes</label>
                                            <input type="number" className="w-full p-2 border border-blue-100 rounded bg-white text-xs" value={editForm.linen_boxes || 0} onChange={e => setEditForm({...editForm, linen_boxes: parseInt(e.target.value) || 0})} />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                                        <input 
                                            type="checkbox" 
                                            checked={editForm.insurance_enabled}
                                            onChange={e => setEditForm({...editForm, insurance_enabled: e.target.checked})}
                                            disabled={!isEditing}
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Add MasterCare Insurance</span>
                                    </label>
                                </div>
                                <div className="pt-2 border-t border-slate-100 mt-2">
                                    <label className="text-[10px] font-black uppercase text-indigo-400 mb-1 block">Payment Method</label>
                                    {isEditing ? (
                                        <select 
                                            className="w-full text-xs border border-gray-200 rounded p-2 bg-white"
                                            value={editForm.payment_method || 'eft'}
                                            onChange={e => setEditForm({...editForm, payment_method: e.target.value})}
                                        >
                                            <option value="eft">EFT / Debit Card (Standard Rate)</option>
                                            <option value="payflex">Payflex (+7% Surcharge)</option>
                                        </select>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-900 uppercase">
                                            {quote?.payment_method === 'payflex' ? 'Payflex (+7% Surcharge)' : 'EFT / Debit Card'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DUAL COMMENTS SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <MessageCircle size={18} className="text-red-500" /> Customer Comments
                            </h3>
                            {isEditing ? (
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    value={editForm.customer_comments || ''}
                                    onChange={e => setEditForm({...editForm, customer_comments: e.target.value})}
                                    placeholder="Visible to client..."
                                />
                            ) : (
                                <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100 italic">
                                    {quote.customer_comments || "No comments."}
                                </p>
                            )}
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Lock size={18} className="text-indigo-500" /> Internal Notes
                            </h3>
                            {isEditing ? (
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    value={editForm.team_notes || ''}
                                    onChange={e => setEditForm({...editForm, team_notes: e.target.value})}
                                    placeholder="Staff only..."
                                />
                            ) : (
                                <p className="text-sm text-slate-600 bg-indigo-50/30 p-4 rounded-lg border border-indigo-100">
                                    {quote.team_notes || "No notes."}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* INVENTORY EDITOR */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">4</div>
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Package size={20} className="text-primary-600" /> Inventory Breakdown
                                </h3>
                            </div>
                            {isEditing && (
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCustomProductModal(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shrink-0"
                                    >
                                        <Plus size={14} /> Add Custom Product / Volume
                                    </button>
                                    <div className="relative">
                                        <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary-500">
                                            <Plus size={16} className="text-slate-400" />
                                            <input 
                                                placeholder="Add item..." 
                                                className="bg-transparent border-none outline-none text-sm w-32 sm:w-40"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        {filteredItems.length > 0 && searchQuery.length >= 2 && (
                                            <div className="absolute right-0 top-full mt-1 w-64 bg-white shadow-xl border border-gray-100 rounded-lg z-50 p-1 overflow-hidden">
                                                {filteredItems.map(item => (
                                                    <button 
                                                        key={item.id}
                                                        onClick={() => handleAddItem(item)}
                                                        className="w-full text-left p-2 hover:bg-slate-50 text-sm rounded transition-colors flex justify-between items-center"
                                                    >
                                                        <span>{item.name} ({item.volume}ft³)</span>
                                                        <Plus size={14} className="text-slate-300" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {selectedItemForVariation && (() => {
                                            const targetItem = selectedItemForVariation.item || selectedItemForVariation;
                                            const opts = targetItem?.variationOptions || [];
                                            const targetRoom = selectedItemForVariation.targetRoom;

                                            return (
                                                <div className="absolute top-full right-0 w-64 bg-slate-900 text-white rounded-lg shadow-xl mt-1 z-50 p-4 animate-in fade-in zoom-in-95">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Variation</h4>
                                                    <p className="text-xs font-bold mb-3">{targetItem?.name}</p>
                                                    <div className="space-y-1">
                                                        {opts.map(opt => (
                                                            <button 
                                                                key={opt}
                                                                onClick={() => handleAddItem(targetItem, opt, targetRoom)}
                                                                className="w-full text-left px-3 py-2 text-[10px] uppercase font-bold hover:bg-white/10 rounded transition-colors flex justify-between items-center"
                                                            >
                                                                {opt}
                                                                <Plus size={10} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => setSelectedItemForVariation(null)} className="w-full mt-4 text-[9px] uppercase font-black text-slate-500 hover:text-white">Cancel</button>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Catalog / Room Selector */}
                        {isEditing && (
                            <div className="p-6 bg-slate-50/50 border-b border-gray-100 space-y-4">
                                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                                    {orderedCategories.map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                                                selectedCategory === cat
                                                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-900/10'
                                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                                                                {INVENTORY_ITEMS.filter(item => item.category === selectedCategory && (searchQuery.length < 2 || item.name.toLowerCase().includes(searchQuery.toLowerCase()))).map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleAddItem(item)}
                                            className="flex items-center justify-between p-2.5 bg-white border border-slate-100 hover:border-primary-500 rounded-xl text-left transition-all hover:shadow-sm"
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className="text-xs font-bold text-slate-700 truncate">{item.name}</span>
                                            </div>
                                            <Plus size={14} className="text-slate-400 flex-shrink-0 ml-1.5" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500">
                                        <th className="px-6 py-3 font-medium">Item Name</th>
                                        <th className="px-6 py-3 font-medium text-center">Wrapping<br/><span className="text-[10px] font-normal text-slate-400">vol × R5.90</span></th>
                                        <th className="px-6 py-3 font-medium text-center">Plastic Sleeves<br/><span className="text-[10px] font-normal text-slate-400">qty × R55</span></th>
                                        <th className="px-6 py-3 font-medium w-32 text-center">Quantity</th>
                                        <th className="px-6 py-3 font-medium w-24 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(() => {
                                        try {
                                            const grouped = {}
                                            Object.entries(displayInventory).forEach(([itemIdKey, qty]) => {
                                                if (!qty || qty <= 0) return
                                                const parsed = parseInventoryKey(itemIdKey)
                                                const item = INVENTORY_ITEMS.find(i => i.id === parsed.itemId)
                                                const roomCategory = parsed.room || item?.category || 'General Furniture'
                                                if (!grouped[roomCategory]) grouped[roomCategory] = []
                                                grouped[roomCategory].push({ itemId: itemIdKey, id: parsed.itemId, variation: parsed.variation, room: roomCategory, item, qty })
                                            })

                                            if (Object.keys(grouped).length === 0) {
                                                return <tr><td colSpan="5" className="text-center py-8 text-slate-400 font-medium">No inventory items in this quote.</td></tr>
                                            }

                                            return Object.entries(grouped).map(([category, itemsList]) => {
                                                const totalQtyInRoom = itemsList.reduce((acc, i) => acc + i.qty, 0)
                                                const totalVolInRoom = itemsList.reduce((acc, i) => acc + (i.item?.volume || 0) * i.qty, 0)

                                                return (
                                                    <React.Fragment key={`room-cat-${category}`}>
                                                        <tr className="bg-slate-100/90 border-y border-slate-200">
                                                            <td colSpan="5" className="px-6 py-2.5">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                                                                        🏠 {category}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                                        {totalQtyInRoom} item{totalQtyInRoom === 1 ? '' : 's'} · {totalVolInRoom.toFixed(2)} ft³
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {itemsList.map(({ itemId, item, qty, variation }) => {
                                                            const wrapInfo = editForm.special_wrapping?.[itemId] || {}
                                                            return (
                                                                <tr key={itemId} className="hover:bg-slate-50/50">
                                                                    <td className="px-6 py-4 flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 flex-shrink-0">
                                                                            {item ? (
                                                                                <img 
                                                                                    src={getInventoryImage(item)} 
                                                                                    alt={item.name} 
                                                                                    className="w-full h-full object-contain"
                                                                                    style={{ mixBlendMode: 'multiply' }}
                                                                                    onError={(e) => {
                                                                                        e.target.onerror = null;
                                                                                        e.target.src = "https://img.icons8.com/3d-fluency/100/box.png";
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <span className="text-lg">📦</span>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-slate-900">{item?.name || itemId}</p>
                                                                            <div className="flex items-center gap-2">
                                                                                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{category} · Vol: {item?.volume || 0} ft³/unit</p>
                                                                                {isEditing && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setRoomModalItem({ item, variation, currentKey: itemId, targetRoom: category, isMoving: true })}
                                                                                        className="text-[10px] text-primary-600 hover:text-primary-800 font-bold hover:underline"
                                                                                    >
                                                                                        Move Room
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>

                                                                    {/* WRAPPING COLUMN — vol × R5.90 */}
                                                                    <td className="px-6 py-4 text-center">
                                                                        {(() => {
                                                                            const isAutoSleeved = getPlasticSleevesCount(item, itemId) > 0
                                                                            if (isAutoSleeved) {
                                                                                return <span className="text-slate-400 text-xs">—</span>
                                                                            }

                                                                            const defaultWrapped = getWrappingFlag(item, variation)
                                                                            const wrappingEnabled = wrapInfo.wrap !== undefined ? wrapInfo.wrap : defaultWrapped
                                                                            const wrappingCostCalc = wrappingEnabled ? ((item?.volume || 0) * qty * 5.90) : 0

                                                                            return isEditing ? (
                                                                                <div className="flex flex-col items-center gap-1">
                                                                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={wrappingEnabled}
                                                                                            onChange={(e) => {
                                                                                                const updatedWrap = {
                                                                                                    ...(editForm.special_wrapping || {}),
                                                                                                    [itemId]: { ...wrapInfo, wrap: e.target.checked }
                                                                                                }
                                                                                                setEditForm({ ...editForm, special_wrapping: updatedWrap })
                                                                                            }}
                                                                                            className="w-3.5 h-3.5 text-primary-600 rounded border-slate-300"
                                                                                        />
                                                                                        {defaultWrapped ? "Auto-Wrap (Override)" : "Add Wrapping"}
                                                                                    </label>
                                                                                    {wrappingEnabled && (
                                                                                        <span className="text-[10px] text-emerald-600 font-bold">
                                                                                            {(item?.volume || 0)} ft³ × {qty} × R5.90 = R {wrappingCostCalc.toFixed(2)}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                wrappingEnabled
                                                                                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Wrapped (+R {wrappingCostCalc.toFixed(2)})</span>
                                                                                    : <span className="text-slate-400 text-xs">—</span>
                                                                            );
                                                                        })()}
                                                                    </td>

                                                                    {/* PLASTIC SLEEVES COLUMN — qty × R55 */}
                                                                    <td className="px-6 py-4 text-center">
                                                                        {(() => {
                                                                            const defaultSleeves = getPlasticSleevesCount(item, itemId)
                                                                            const sleeveQty = wrapInfo.sleeves !== undefined ? wrapInfo.sleeves : defaultSleeves
                                                                            const sleeveCost = sleeveQty * qty * 55

                                                                            return isEditing ? (
                                                                                <div className="flex flex-col items-center gap-1">
                                                                                    <div className="flex items-center gap-1">
                                                                                        <button onClick={() => {
                                                                                            const newQty = Math.max(0, sleeveQty - 1)
                                                                                            const updatedWrap = { ...(editForm.special_wrapping || {}), [itemId]: { ...wrapInfo, sleeves: newQty } }
                                                                                            setEditForm({ ...editForm, special_wrapping: updatedWrap })
                                                                                        }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">−</button>
                                                                                        <span className="w-8 text-center font-bold text-sm">{sleeveQty}</span>
                                                                                        <button onClick={() => {
                                                                                            const newQty = sleeveQty + 1
                                                                                            const updatedWrap = { ...(editForm.special_wrapping || {}), [itemId]: { ...wrapInfo, sleeves: newQty } }
                                                                                            setEditForm({ ...editForm, special_wrapping: updatedWrap })
                                                                                        }} className="w-6 h-6 rounded bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">+</button>
                                                                                    </div>
                                                                                    {sleeveQty > 0 && <span className="text-[10px] text-amber-600 font-bold">{sleeveQty} × {qty} × R55 = R {sleeveCost.toFixed(2)}</span>}
                                                                                </div>
                                                                            ) : (
                                                                                sleeveQty > 0
                                                                                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">{sleeveQty} sleeves (+R {sleeveCost})</span>
                                                                                    : <span className="text-slate-400 text-xs">—</span>
                                                                            );
                                                                        })()}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        {isEditing ? (
                                                                            <div className="flex items-center justify-center gap-3">
                                                                                <button onClick={() => handleUpdateQuantity(itemId, qty - 1)} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                                                                                    <Trash2 size={14} className={qty === 1 ? "text-red-500" : ""} />
                                                                                </button>
                                                                                <span className="font-bold min-w-[20px] text-center">{qty}</span>
                                                                                <button onClick={() => handleUpdateQuantity(itemId, qty + 1)} className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors">
                                                                                    <Plus size={14} />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-center font-bold text-slate-900">{qty}</div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        {isEditing && (
                                                                            <button onClick={() => handleUpdateQuantity(itemId, 0)} className="text-red-400 hover:text-red-600 p-1">
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </React.Fragment>
                                                )
                                            })
                                        } catch (err) {
                                            return <tr><td colSpan="5" className="text-red-500 font-bold p-4">Error rendering inventory: {err.message}</td></tr>
                                        }
                                    })()}
                                    {/* Custom Products & Manual Items Section */}
                                    {((isEditing ? editForm.custom_products : (quote?.custom_products || quote?.items_json?.custom_products)) || []).length > 0 && (
                                        <React.Fragment key="custom-products-section">
                                            <tr className="bg-indigo-100/90 border-y border-indigo-200">
                                                <td colSpan="5" className="px-6 py-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-black text-indigo-900 text-xs uppercase tracking-wider flex items-center gap-2">
                                                            📦 Custom Products & Manual Items
                                                        </span>
                                                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">
                                                            {((isEditing ? editForm.custom_products : (quote?.custom_products || quote?.items_json?.custom_products)) || []).length} item(s) · {customProductsVolume.toFixed(2)} ft³ (Cubes)
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {((isEditing ? editForm.custom_products : (quote?.custom_products || quote?.items_json?.custom_products)) || []).map(prod => {
                                                 const prodQty = Math.max(1, parseInt(prod.quantity || prod.qty) || 1);
                                                 const prodVol = parseFloat(prod.cubes || prod.cuft || 0);
                                                 const totalProdVol = prodVol * prodQty;
                                                 const wrapEnabled = Boolean(prod.wrap);
                                                 const sleeveQty = parseInt(prod.sleeves || 0);
                                                 const wrapCost = wrapEnabled ? (totalProdVol * 5.90) : 0;
                                                 const sleeveCost = sleeveQty * 55;

                                                 return (
                                                     <tr key={prod.id} className="hover:bg-indigo-50/40">
                                                         <td className="px-6 py-4 flex items-center gap-3">
                                                             <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100 flex-shrink-0">
                                                                 📦
                                                             </div>
                                                             <div>
                                                                 <p className="font-bold text-slate-900">{prod.name}</p>
                                                                 <p className="text-[10px] text-slate-500 uppercase tracking-tight font-semibold">
                                                                     Custom Product · Vol: {prodVol.toFixed(2)} ft³ {prodQty > 1 ? `ea (Total: ${totalProdVol.toFixed(2)} ft³)` : '(cuft)'}
                                                                 </p>
                                                             </div>
                                                         </td>

                                                         {/* WRAPPING COLUMN — total vol × R5.90 */}
                                                         <td className="px-6 py-4 text-center">
                                                             {sleeveQty > 0 ? (
                                                                 <span className="text-slate-400 text-xs">—</span>
                                                             ) : isEditing ? (
                                                                 <div className="flex flex-col items-center gap-1">
                                                                     <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600">
                                                                         <input
                                                                             type="checkbox"
                                                                             checked={wrapEnabled}
                                                                             onChange={(e) => handleToggleCustomProductWrap(prod.id, e.target.checked)}
                                                                             className="w-3.5 h-3.5 text-primary-600 rounded border-slate-300"
                                                                         />
                                                                         Add Wrapping
                                                                     </label>
                                                                     {wrapEnabled && (
                                                                         <span className="text-[10px] text-emerald-600 font-bold">
                                                                             {totalProdVol.toFixed(2)} ft³ × R5.90 = R {wrapCost.toFixed(2)}
                                                                         </span>
                                                                     )}
                                                                 </div>
                                                             ) : (
                                                                 wrapEnabled ? (
                                                                     <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                                                         Wrapped (+R {wrapCost.toFixed(2)})
                                                                     </span>
                                                                 ) : (
                                                                     <span className="text-slate-400 text-xs">—</span>
                                                                 )
                                                             )}
                                                         </td>

                                                         {/* PLASTIC SLEEVES COLUMN — qty × R55 */}
                                                         <td className="px-6 py-4 text-center">
                                                             {isEditing ? (
                                                                 <div className="flex flex-col items-center gap-1">
                                                                     <div className="flex items-center gap-1">
                                                                         <button
                                                                             type="button"
                                                                             onClick={() => handleUpdateCustomProductSleeves(prod.id, sleeveQty - 1)}
                                                                             className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm"
                                                                         >
                                                                             −
                                                                         </button>
                                                                         <span className="w-8 text-center font-bold text-sm">{sleeveQty}</span>
                                                                         <button
                                                                             type="button"
                                                                             onClick={() => handleUpdateCustomProductSleeves(prod.id, sleeveQty + 1)}
                                                                             className="w-6 h-6 rounded bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm"
                                                                         >
                                                                             +
                                                                         </button>
                                                                     </div>
                                                                     {sleeveQty > 0 && (
                                                                         <span className="text-[10px] text-amber-600 font-bold">
                                                                             {sleeveQty} × R55 = R {sleeveCost.toFixed(2)}
                                                                         </span>
                                                                     )}
                                                                 </div>
                                                             ) : (
                                                                 sleeveQty > 0 ? (
                                                                     <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                                                         {sleeveQty} sleeves (+R {sleeveCost.toFixed(2)})
                                                                     </span>
                                                                 ) : (
                                                                     <span className="text-slate-400 text-xs">—</span>
                                                                 )
                                                             )}
                                                         </td>

                                                         {/* QUANTITY COLUMN */}
                                                         <td className="px-6 py-4 text-center font-bold text-slate-900">
                                                             {isEditing ? (
                                                                 <div className="flex items-center justify-center gap-1">
                                                                     <button
                                                                         type="button"
                                                                         onClick={() => handleUpdateCustomProductQty(prod.id, prodQty - 1)}
                                                                         className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm"
                                                                     >
                                                                         −
                                                                     </button>
                                                                     <span className="w-8 text-center font-bold text-sm">{prodQty}</span>
                                                                     <button
                                                                         type="button"
                                                                         onClick={() => handleUpdateCustomProductQty(prod.id, prodQty + 1)}
                                                                         className="w-6 h-6 rounded bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm"
                                                                     >
                                                                         +
                                                                     </button>
                                                                 </div>
                                                             ) : (
                                                                 <span>{prodQty}</span>
                                                             )}
                                                         </td>
                                                         <td className="px-6 py-4 text-right">
                                                             {isEditing && (
                                                                 <button onClick={() => handleRemoveCustomProduct(prod.id)} className="text-red-400 hover:text-red-600 p-1">
                                                                     <Trash2 size={16} />
                                                                 </button>
                                                             )}
                                                         </td>
                                                     </tr>
                                                 );
                                             })}
                                        </React.Fragment>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>



                    {/* SECTION 2: ADDRESSES & TRIP */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">2</div>
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <MapPin size={20} className="text-primary-600" /> Route & Logistics
                                </h3>
                            </div>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => performDistanceCalculation(
                                        editForm.pickup_address, 
                                        editForm.dropoff_address, 
                                        false, 
                                        editForm.extraCollections || editForm.extra_collections || [], 
                                        editForm.extraDrops || editForm.extra_drops || []
                                    )}
                                    className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
                                    title="Recalculate distance via Google Maps"
                                >
                                    <RefreshCw size={12} /> Recalculate Route
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Pickup Group */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Primary Pickup Address</label>
                                    {isEditing ? (
                                        <AddressAutocomplete 
                                            placeholder="Start typing pickup address..."
                                            value={editForm.pickup_address || ''}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const city = e.target.city;
                                                const currentExtraColls = editForm.extraCollections || editForm.extra_collections || [];
                                                const currentExtraDrops = editForm.extraDrops || editForm.extra_drops || [];
                                                setEditForm(prev => ({ ...prev, pickup_address: val, pickup_city: city }));
                                                if (e.target.isGoogleSelect) {
                                                    performDistanceCalculation(val, editForm.dropoff_address, true, currentExtraColls, currentExtraDrops);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-900 leading-snug">{quote?.pickup_address}</p>
                                    )}
                                </div>

                                {/* Extra Collections / 2nd Location */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Additional Collection / 2nd Location</label>
                                        {isEditing && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const list = editForm.extraCollections || editForm.extra_collections || [];
                                                    const newList = [...list, { id: 'coll_' + Date.now(), address: '' }];
                                                    setEditForm(prev => ({ ...prev, extraCollections: newList, extra_collections: newList }));
                                                }}
                                                className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                                            >
                                                <Plus size={14} /> Add 2nd Collection
                                            </button>
                                        )}
                                    </div>

                                    {(editForm.extraCollections || editForm.extra_collections || []).map((coll, idx) => (
                                        <div key={coll.id || idx} className="p-3 bg-red-50/50 border border-red-100 rounded-xl space-y-2 relative">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Collection #{idx + 2}</span>
                                                {isEditing && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const list = [...(editForm.extraCollections || editForm.extra_collections || [])];
                                                            list.splice(idx, 1);
                                                            const currentExtraDrops = editForm.extraDrops || editForm.extra_drops || [];
                                                            setEditForm(prev => ({ ...prev, extraCollections: list, extra_collections: list }));
                                                            performDistanceCalculation(editForm.pickup_address, editForm.dropoff_address, true, list, currentExtraDrops);
                                                        }}
                                                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            {isEditing ? (
                                                <AddressAutocomplete
                                                    placeholder="Enter 2nd collection address..."
                                                    value={coll.address || ''}
                                                    onChange={e => {
                                                        const { value, placeId, latLng, addressComponents, isGoogleSelect } = e.target;
                                                        const list = [...(editForm.extraCollections || editForm.extra_collections || [])];
                                                        list[idx] = { 
                                                            ...list[idx], 
                                                            address: value,
                                                            placeId: placeId || list[idx]?.placeId || null,
                                                            latLng: latLng || list[idx]?.latLng || null,
                                                            addressComponents: addressComponents || list[idx]?.addressComponents || null
                                                        };
                                                        const currentExtraDrops = editForm.extraDrops || editForm.extra_drops || [];
                                                        setEditForm(prev => ({ ...prev, extraCollections: list, extra_collections: list }));
                                                        if (isGoogleSelect) {
                                                            performDistanceCalculation(editForm.pickup_address, editForm.dropoff_address, true, list, currentExtraDrops);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <p className="text-xs font-medium text-slate-800">{coll.address}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" />
                                    {isEditing ? (
                                        <div className="flex-1">
                                            <label className="text-[9px] uppercase font-bold text-slate-400">Move Date</label>
                                            <input 
                                                type="date"
                                                className="w-full text-sm font-medium border-b border-gray-100 outline-none pb-1"
                                                value={editForm.move_date || ''}
                                                onChange={e => setEditForm({...editForm, move_date: e.target.value})}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm font-bold text-slate-800">{new Date(quote?.move_date || Date.now()).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </div>

                            {/* Dropoff Group */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Primary Dropoff Address</label>
                                    {isEditing ? (
                                        <AddressAutocomplete 
                                            placeholder="Start typing dropoff address..."
                                            value={editForm.dropoff_address || ''}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const city = e.target.city;
                                                const currentExtraColls = editForm.extraCollections || editForm.extra_collections || [];
                                                const currentExtraDrops = editForm.extraDrops || editForm.extra_drops || [];
                                                setEditForm(prev => ({ ...prev, dropoff_address: val, dropoff_city: city }));
                                                if (e.target.isGoogleSelect) {
                                                    performDistanceCalculation(editForm.pickup_address, val, true, currentExtraColls, currentExtraDrops);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-900 leading-snug">{quote?.dropoff_address}</p>
                                    )}
                                </div>

                                {/* Extra Drops / 2nd Location */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Additional Drop-off / 2nd Location</label>
                                        {isEditing && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const list = editForm.extraDrops || editForm.extra_drops || [];
                                                    const newList = [...list, { id: 'drop_' + Date.now(), address: '' }];
                                                    setEditForm(prev => ({ ...prev, extraDrops: newList, extra_drops: newList }));
                                                }}
                                                className="text-xs text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
                                            >
                                                <Plus size={14} /> Add 2nd Drop-off
                                            </button>
                                        )}
                                    </div>

                                    {(editForm.extraDrops || editForm.extra_drops || []).map((drop, idx) => (
                                        <div key={drop.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Drop-off #{idx + 2}</span>
                                                {isEditing && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const list = [...(editForm.extraDrops || editForm.extra_drops || [])];
                                                            list.splice(idx, 1);
                                                            const currentExtraColls = editForm.extraCollections || editForm.extra_collections || [];
                                                            setEditForm(prev => ({ ...prev, extraDrops: list, extra_drops: list }));
                                                            performDistanceCalculation(editForm.pickup_address, editForm.dropoff_address, true, currentExtraColls, list);
                                                        }}
                                                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            {isEditing ? (
                                                <AddressAutocomplete
                                                    placeholder="Enter 2nd dropoff address..."
                                                    value={drop.address || ''}
                                                    onChange={e => {
                                                        const { value, placeId, latLng, addressComponents, isGoogleSelect } = e.target;
                                                        const list = [...(editForm.extraDrops || editForm.extra_drops || [])];
                                                        list[idx] = { 
                                                            ...list[idx], 
                                                            address: value,
                                                            placeId: placeId || list[idx]?.placeId || null,
                                                            latLng: latLng || list[idx]?.latLng || null,
                                                            addressComponents: addressComponents || list[idx]?.addressComponents || null
                                                        };
                                                        const currentExtraColls = editForm.extraCollections || editForm.extra_collections || [];
                                                        setEditForm(prev => ({ ...prev, extraDrops: list, extra_drops: list }));
                                                        if (isGoogleSelect) {
                                                            performDistanceCalculation(editForm.pickup_address, editForm.dropoff_address, true, currentExtraColls, list);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <p className="text-xs font-medium text-slate-800">{drop.address}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex items-center gap-2">
                                    <Truck size={14} className="text-slate-400" />
                                    <div>
                                        <label className="text-[9px] uppercase font-bold text-slate-400">Billable Distance</label>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {isEditing ? (
                                                <input 
                                                    type="number"
                                                    step="any"
                                                    className="w-24 font-bold text-slate-800 text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 bg-white"
                                                    value={editForm.distance_km ?? ''}
                                                    onChange={e => setEditForm({...editForm, distance_km: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0)})}
                                                />
                                            ) : (
                                                <span className="font-bold text-slate-800 text-sm">{Number(quote?.distance_km || 0).toFixed(1)}</span>
                                            )}
                                            <span className="text-sm text-slate-400 font-medium">km</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {isEditing && mapsStatus && mapsStatus.startsWith('Failed') && (
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                                <AlertCircle size={15} className="text-amber-600 shrink-0" />
                                <span>Google Maps couldn't resolve the route for these custom addresses automatically. You can manually enter the correct <strong>Billable Distance (km)</strong> above or click <strong>Recalculate Route</strong>.</span>
                            </div>
                        )}
                    </div>

                    {/* SECTION 3: SITE ACCESS DETAILS */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">3</div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Building size={20} className="text-primary-600" /> Site Access & Challenges
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {(() => {
                                const locs = ['origin'];
                                (editForm.extraCollections || editForm.extra_collections || quote?.extra_collections || []).forEach((_, idx) => {
                                    locs.push(`extra_coll_${idx}`);
                                });
                                locs.push('destination');
                                (editForm.extraDrops || editForm.extra_drops || quote?.extra_drops || []).forEach((_, idx) => {
                                    locs.push(`extra_drop_${idx}`);
                                });
                                if (editForm.access_details) {
                                    Object.keys(editForm.access_details).forEach(k => {
                                        if (!locs.includes(k)) locs.push(k);
                                    });
                                }
                                return locs;
                            })().map(loc => {
                                let locLabel = 'Pickup Access';
                                if (loc === 'origin') locLabel = 'Pickup Access';
                                else if (loc === 'destination') locLabel = 'Dropoff Access';
                                else if (loc.startsWith('extra_coll_')) {
                                    const idx = parseInt(loc.replace('extra_coll_', '')) || 0;
                                    locLabel = `Pickup #${idx + 2} Access`;
                                } else if (loc.startsWith('extra_drop_')) {
                                    const idx = parseInt(loc.replace('extra_drop_', '')) || 0;
                                    locLabel = `Dropoff #${idx + 2} Access`;
                                }
                                return (
                                <div key={loc} className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        {locLabel}
                                        <div className={`w-2 h-2 rounded-full ${loc === 'origin' ? 'bg-red-500' : 'bg-slate-900'}`} />
                                    </h4>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] uppercase font-bold text-slate-400">Floor Level</label>
                                            <select 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 outline-none bg-white font-medium"
                                                value={editForm.access_details?.[loc]?.floorLevel || 0}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const parsedVal = val === 'double_volume' || val === 'multiple_stairs' ? val : parseInt(val) || 0;
                                                    const details = { ...editForm.access_details }
                                                    details[loc] = { ...details[loc], floorLevel: parsedVal }
                                                    setEditForm({...editForm, access_details: details})
                                                }}
                                                disabled={!isEditing}
                                            >
                                                <option value={0}>Ground Floor</option>
                                                <option value={1}>1st Floor</option>
                                                <option value={2}>2nd Floor</option>
                                                <option value={3}>3rd Floor</option>
                                                <option value="double_volume">Double Volume</option>
                                                <option value="multiple_stairs">Multiple Flights of Stairs</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] uppercase font-bold text-slate-400">Truck Parking</label>
                                            <select 
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                                                value={editForm.access_details?.[loc]?.parkingType || 'driveway'}
                                                onChange={e => {
                                                    const details = { ...editForm.access_details }
                                                    details[loc] = { ...details[loc], parkingType: e.target.value }
                                                    setEditForm({...editForm, access_details: details})
                                                }}
                                                disabled={!isEditing}
                                            >
                                                <option value="driveway">Driveway</option>
                                                <option value="street">Street Parking</option>
                                                <option value="panhandle">Panhandle</option>
                                                <option value="loading_bay">Loading Bay</option>
                                                <option value="secure_complex">Inside Complex</option>
                                                <option value="shuttle">Shuttle Required</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                                type="checkbox"
                                                className="w-4 h-4 text-indigo-600 rounded"
                                                checked={editForm.access_details?.[loc]?.elevator || false}
                                                onChange={e => {
                                                    const details = { ...editForm.access_details }
                                                    details[loc] = { ...details[loc], elevator: e.target.checked }
                                                    setEditForm({...editForm, access_details: details})
                                                }}
                                                disabled={!isEditing}
                                            />
                                            <span className="text-[10px] font-bold uppercase text-slate-600 group-hover:text-slate-900 transition-colors">Lift Available</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                                type="checkbox"
                                                className="w-4 h-4 text-indigo-600 rounded"
                                                checked={editForm.access_details?.[loc]?.specialConditions?.longCarry || false}
                                                onChange={e => {
                                                    const details = { ...editForm.access_details }
                                                    const currentCond = details[loc].specialConditions || {}
                                                    details[loc] = { ...details[loc], specialConditions: { ...currentCond, longCarry: e.target.checked } }
                                                    setEditForm({...editForm, access_details: details})
                                                }}
                                                disabled={!isEditing}
                                            />
                                            <span className="text-[10px] font-bold uppercase text-slate-600 group-hover:text-slate-900 transition-colors">Long Carry (+20m)</span>
                                        </label>
                                    </div>

                                    {editForm.access_details?.[loc]?.specialConditions?.longCarry && (
                                        <div className="mt-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-top-1">
                                            <label className="text-[9px] uppercase font-black text-indigo-600 tracking-widest mb-1.5 block">Distance from Truck (meters)</label>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    placeholder="e.g. 45"
                                                    value={editForm.access_details?.[loc]?.longCarryDistance || ''}
                                                    onChange={(e) => {
                                                        const details = { ...editForm.access_details }
                                                        details[loc] = { ...details[loc], longCarryDistance: parseFloat(e.target.value) || 0 }
                                                        setEditForm({...editForm, access_details: details})
                                                    }}
                                                    disabled={!isEditing}
                                                    className="w-24 bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:border-indigo-500 outline-none"
                                                />
                                                <span className="text-xs text-slate-400 font-bold uppercase">meters</span>
                                            </div>
                                            <p className="text-[8px] text-indigo-500 font-bold mt-1 uppercase">Long Carry is R750. 90m+ adds Shuttle (R2,500).</p>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Shuttle Required?</span>
                                            <input type="checkbox" checked={editForm.access_details?.[loc]?.specialConditions?.shuttle || false} onChange={e => {
                                                const details = { ...editForm.access_details };
                                                const cond = details[loc].specialConditions || {};
                                                details[loc] = { ...details[loc], specialConditions: { ...cond, shuttle: e.target.checked } };
                                                setEditForm({...editForm, access_details: details});
                                            }} disabled={!isEditing} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Hoisting Req?</span>
                                            <input type="checkbox" checked={editForm.access_details?.[loc]?.specialConditions?.hoisting || false} onChange={e => {
                                                const details = { ...editForm.access_details };
                                                const cond = details[loc].specialConditions || {};
                                                details[loc] = { ...details[loc], specialConditions: { ...cond, hoisting: e.target.checked } };
                                                setEditForm({...editForm, access_details: details});
                                            }} disabled={!isEditing} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Narrow Passage?</span>
                                            <input type="checkbox" checked={editForm.access_details?.[loc]?.specialConditions?.narrowPassage || false} onChange={e => {
                                                const details = { ...editForm.access_details };
                                                const cond = details[loc].specialConditions || {};
                                                details[loc] = { ...details[loc], specialConditions: { ...cond, narrowPassage: e.target.checked } };
                                                setEditForm({...editForm, access_details: details});
                                            }} disabled={!isEditing} />
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT COL - PRICING & TIMELINE */}
                <div className="space-y-6">

                    {/* PRICING CARD */}
                    <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary-600/20 transition-all duration-700" />
                        
                        <div className="relative z-10">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Quote Value</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white whitespace-nowrap">R {finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                {isEditing && (
                                    <span className="text-emerald-400 text-xs font-bold animate-pulse">Live</span>
                                )}
                            </div>
                            
                            <div className="mt-8 space-y-3 pt-6 border-t border-white/10">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Assigned Vehicle</span>
                                    <span className="text-emerald-400 font-bold uppercase tracking-wider">{recalculatedData?.breakdown?.vehicleType || 'Standard'}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Total Cubes / Volume</span>
                                    <span className="text-white font-bold tracking-wide">{(isEditing ? ((recalculatedData?.totalVolume || 0) + customProductsVolume) : (quote?.total_volume || 0))?.toFixed(2)} ft³ (Cubes)</span>
                                </div>

                                {isEditing && customProductsTotal > 0 && (
                                    <div className="flex justify-between text-xs text-amber-400">
                                        <span>Custom Products</span>
                                        <span className="font-bold whitespace-nowrap">+ R {customProductsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {(recalculatedData?.breakdown?.packaging > 0 || quote?.packaging_cost > 0) && (
                                    <div className="flex justify-between text-xs text-emerald-400/80">
                                        <span>Box Supplies {(editForm.st7_boxes || quote?.st7_boxes) > 0 && `(${editForm.st7_boxes || quote?.st7_boxes} x R${(quote?.packaging_option === 'boxes_only' ? PACKAGING_RATES.sendMeBoxesOnly.st7 : PACKAGING_RATES.boxesAndPacking.st7).toFixed(0)})`} {(editForm.linen_boxes || quote?.linen_boxes) > 0 && `(${editForm.linen_boxes || quote?.linen_boxes} x R${(quote?.packaging_option === 'boxes_only' ? PACKAGING_RATES.sendMeBoxesOnly.linen : PACKAGING_RATES.boxesAndPacking.linen).toFixed(0)})`}</span>
                                        <span className="font-bold whitespace-nowrap">+ R {(Number(recalculatedData?.breakdown?.packaging || quote?.packaging_cost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {(recalculatedData?.breakdown?.wrappingCost > 0 || quote?.wrapping_cost > 0) && (
                                    <div className="flex justify-between text-xs text-emerald-400/80">
                                        <span>Specialized Wrapping {((recalculatedData?.breakdown?.wrappingVolume || quote?.wrapping_volume || 0) > 0) && `(${Number(recalculatedData?.breakdown?.wrappingVolume || quote?.wrapping_volume || 0).toFixed(2)} ft³ x R5.90)`}</span>
                                        <span className="font-bold whitespace-nowrap">+ R {(Number(recalculatedData?.breakdown?.wrappingCost || quote?.wrapping_cost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {(recalculatedData?.breakdown?.plasticSleeveCost > 0 || quote?.plastic_sleeve_cost > 0) && (
                                    <div className="flex justify-between text-xs text-emerald-400/80">
                                        <span>Plastic Sleeves {((recalculatedData?.breakdown?.plasticSleeveCount || quote?.plastic_sleeve_count || 0) > 0) && `(${(Number(recalculatedData?.breakdown?.plasticSleeveCount || quote?.plastic_sleeve_count || 0))} x R55)`}</span>
                                        <span className="font-bold whitespace-nowrap">+ R {(Number(recalculatedData?.breakdown?.plasticSleeveCost || quote?.plastic_sleeve_cost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {(recalculatedData?.breakdown?.shuttleCost > 0 || quote?.shuttle_cost > 0) && (
                                    <div className="flex justify-between text-xs text-amber-400">
                                        <span>Shuttle Vehicle</span>
                                        <span className="font-bold whitespace-nowrap">+ R {(Number(recalculatedData?.breakdown?.shuttleCost || quote?.shuttle_cost || 2500)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {(recalculatedData?.breakdown?.access > 0 || quote?.access_fees > 0) && (
                                    <div className="flex justify-between text-xs text-amber-400/80">
                                        <span title={Array.isArray(recalculatedData?.breakdown?.detailedAccess) ? recalculatedData.breakdown.detailedAccess.join(' | ') : recalculatedData?.breakdown?.detailedAccess}>Access & Surcharges</span>
                                        <span className="font-bold whitespace-nowrap">+ R {(Number(recalculatedData?.breakdown?.access || quote?.access_fees || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {(recalculatedData?.breakdown?.crew > 0 || quote?.crew_fee > 0) && (
                                    <div className="flex justify-between text-xs text-amber-400/80">
                                        <span>Heavy Item Crew</span>
                                        <span className="font-bold whitespace-nowrap">+ R {(Number(recalculatedData?.breakdown?.crew || quote?.crew_fee || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {(recalculatedData?.discount > 0 || quote?.discount_amount > 0) && (
                                    <div className="flex justify-between text-xs text-emerald-400">
                                        <span>Special Discount (Mid-Month)</span>
                                        <span className="font-bold whitespace-nowrap">- R {(Number(recalculatedData?.discount || quote?.discount_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {((isEditing ? recalculatedData?.breakdown?.storageCost : (quote?.storage_cost || recalculatedData?.breakdown?.storageCost)) > 0) && (
                                    <div className="flex flex-col gap-1 text-xs text-amber-400/90 py-1 border-t border-slate-700/50">
                                        <div className="flex justify-between">
                                            <span>Master Movers Storage (Monthly Fee)</span>
                                            <span className="font-bold whitespace-nowrap">+ R {(Number(isEditing ? recalculatedData?.breakdown?.storageCost : (quote?.storage_cost || recalculatedData?.breakdown?.storageCost)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <p className="text-[10px] text-amber-300/80 font-medium">Note: Delivery out of storage is not included</p>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Payment Method</span>
                                    <span className="text-white font-bold uppercase tracking-wider">
                                        {(isEditing ? editForm.payment_method : quote?.payment_method) === 'payflex' ? 'Payflex' : 'EFT'}
                                    </span>
                                </div>
                                {(recalculatedData?.payflexSurcharge > 0) && (
                                    <div className="flex justify-between text-xs text-indigo-400">
                                        <span>Payflex Surcharge (7%)</span>
                                        <span className="font-bold whitespace-nowrap">+ R {recalculatedData.payflexSurcharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Vat Included (15%)</span>
                                    <span className="text-white font-bold tracking-wide whitespace-nowrap">R {finalVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MANUAL ADJUSTMENTS (Only visible when editing) */}
                    {isEditing && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Plus size={18} className="text-primary-600" /> Manual Adjustments & Coupons
                            </h3>
                            
                            {/* Custom Products List */}
                            {editForm.custom_products?.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    {editForm.custom_products.map(p => (
                                        <div key={p.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700">{p.name}</span>
                                                <div className="flex items-center gap-1.5 text-[10px]">
                                                    <span className="text-slate-500 font-semibold">Qty: {p.quantity || 1}</span>
                                                    {p.cubes > 0 && <span className="text-slate-400">Vol: {(parseFloat(p.cubes) * (parseInt(p.quantity || 1) || 1)).toFixed(2)} ft³</span>}
                                                    {p.wrap && <span className="text-blue-600 font-bold">[Wrapped]</span>}
                                                    {p.sleeves > 0 && <span className="text-amber-600 font-bold">[{p.sleeves} Sleeves]</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {p.price < 0 ? (
                                                    <span className="font-bold whitespace-nowrap text-emerald-600">
                                                        - R {Math.abs(p.price).toFixed(2)}
                                                    </span>
                                                ) : p.price > 0 ? (
                                                    <span className="font-bold whitespace-nowrap text-slate-900">
                                                        + R {p.price.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                                        (Volume Rate)
                                                    </span>
                                                )}
                                                <button onClick={() => handleRemoveCustomProduct(p.id)} className="text-slate-400 hover:text-red-500">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Custom Item Button */}
                            <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-gray-50">
                                <button 
                                    type="button"
                                    onClick={() => setShowCustomProductModal(true)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> Add Custom Product / Volume
                                </button>
                            </div>

                            {/* Apply Coupon */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Apply Promo Code</label>
                                <CouponInput onApply={handleApplyCoupon} onRemove={() => {}} appliedCoupon={null} />
                                <p className="text-[9px] text-slate-400 mt-1">Coupons are added as a negative price adjustment.</p>
                            </div>
                        </div>
                    )}

                    {/* CLIENT CARD */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl font-black">
                                {quote?.client_name?.charAt(0) || 'M'}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 tracking-tight">{quote?.client_name || 'Manual Lead'}</h4>
                                <p className="text-[11px] text-slate-400 font-bold uppercase">{quote?.client_email || 'No Email'}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button 
                                onClick={handleSendEmailUpdate} 
                                className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-md"
                            >
                                <Mail size={16} /> Email Client Update
                            </button>
                            <a href={`tel:${quote.client_phone}`} className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
                                <User size={14} /> Call Client
                            </a>
                        </div>
                    </div>

                    {/* ACTIVITY TIMELINE SECTION */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <History size={18} className="text-indigo-600" /> Timeline & Logs
                        </h3>

                        {/* Quick Manual Note */}
                        <div className="mb-8">
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 text-sm bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Add manual note..."
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSaveNote()}
                                />
                                <button 
                                    onClick={handleSaveNote}
                                    disabled={!newNote.trim() || id === 'new'}
                                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    <Save size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 relative border-l border-slate-100 ml-2 pl-6">
                            {activities.length === 0 && <p className="text-xs text-slate-400 italic">No historical logs.</p>}
                            {activities.map((act) => (
                                <div key={act.id} className="relative">
                                    <div className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-indigo-200 border border-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.3)]" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(act.created_at).toLocaleString()}</p>
                                    <div className="mt-1 bg-slate-50 border border-slate-100 p-3 rounded-lg">
                                        <p className="text-xs font-bold text-indigo-700 uppercase mb-1 tracking-tighter opacity-70">{act.activity_type}</p>
                                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{act.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Room Selector Modal for Admin */}
            {roomModalItem && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-red-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
                                🏠
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-base font-bold text-slate-900 leading-tight">
                                    {roomModalItem.isMoving ? 'Move to Which Room?' : 'Add to Which Room?'}
                                </h3>
                                <p className="text-xs font-semibold text-red-600 truncate">{roomModalItem.item?.name || 'Item'}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">Select the room destination for this item:</p>

                        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                            {orderedCategories.map(cat => {
                                const isCurrent = (roomModalItem.targetRoom || selectedCategory) === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        className={`w-full py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold flex items-center justify-between transition-all border-2 ${
                                            isCurrent
                                                ? 'bg-red-600 border-red-600 text-white shadow-md'
                                                : 'bg-white border-slate-100 text-slate-700 hover:border-red-200 hover:bg-red-50/50'
                                        }`}
                                        onClick={() => {
                                            if (roomModalItem.isMoving && roomModalItem.currentKey) {
                                                handleChangeItemRoom(roomModalItem.currentKey, cat);
                                            } else {
                                                handleAddItem(roomModalItem.item, roomModalItem.variation || null, cat);
                                            }
                                        }}
                                    >
                                        <span>{cat}</span>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            {isCurrent ? 'Selected ✓' : 'Select →'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            className="w-full mt-4 text-slate-400 text-xs font-bold outline-none hover:text-slate-600 text-center py-2"
                            onClick={() => setRoomModalItem(null)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Product Modal for Admin */}
            {showCustomProductModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-indigo-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
                                    📦
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                                        Add Custom Product / Volume
                                    </h3>
                                    <p className="text-xs text-slate-400">Specify item details, volume & protection options</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCustomProductModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleAddCustomProduct();
                        }} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                    Product / Item Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Custom Marble Dining Table Top, Server Rack..."
                                    className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    value={customProductForm.name}
                                    onChange={e => setCustomProductForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                        Volume in CuFt (ft³) *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        placeholder="e.g. 35.5"
                                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-bold text-slate-800"
                                        value={customProductForm.cubes}
                                        onChange={e => setCustomProductForm(prev => ({ ...prev, cubes: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                        Quantity *
                                    </label>
                                    <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-white">
                                        <button
                                            type="button"
                                            onClick={() => setCustomProductForm(prev => ({ ...prev, quantity: Math.max(1, (parseInt(prev.quantity) || 1) - 1) }))}
                                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-sm flex items-center justify-center transition-colors"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            className="w-full text-center text-sm font-bold text-slate-800 outline-none bg-transparent"
                                            value={customProductForm.quantity}
                                            onChange={e => setCustomProductForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setCustomProductForm(prev => ({ ...prev, quantity: (parseInt(prev.quantity) || 1) + 1 }))}
                                            className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 font-bold text-indigo-600 text-sm flex items-center justify-center transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <span className="text-[9px] text-indigo-600 font-bold block">
                                Adds directly to quote volume: {((parseFloat(customProductForm.cubes || 0)) * (parseInt(customProductForm.quantity || 1) || 1)).toFixed(2)} ft³ total
                            </span>

                            {/* Protection Options: Wrapping & Plastic Sleeves */}
                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                    Special Protection (Optional)
                                </span>

                                <div className="flex flex-col gap-1">
                                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-xs">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(customProductForm.wrap)}
                                            disabled={(parseInt(customProductForm.sleeves) || 0) > 0}
                                            onChange={e => setCustomProductForm(prev => ({ ...prev, wrap: e.target.checked, sleeves: e.target.checked ? 0 : prev.sleeves }))}
                                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                        />
                                        <span>Add Specialized Wrapping (vol × R5.90)</span>
                                    </label>
                                    {customProductForm.wrap && parseFloat(customProductForm.cubes || 0) > 0 && (
                                        <span className="text-[10px] text-emerald-600 font-bold block ml-6">
                                            Est. Wrapping Cost: R {((parseFloat(customProductForm.cubes || 0) * (parseInt(customProductForm.quantity || 1) || 1)) * 5.90).toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold text-slate-700 block">Plastic Sleeves (R55 ea)</span>
                                        {(parseInt(customProductForm.sleeves) || 0) > 0 && (
                                            <span className="text-[10px] text-amber-600 font-bold block">
                                                Sleeves Cost: R {((parseInt(customProductForm.sleeves) || 0) * 55).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCustomProductForm(prev => {
                                                const s = Math.max(0, (parseInt(prev.sleeves) || 0) - 1);
                                                return { ...prev, sleeves: s, wrap: s > 0 ? false : prev.wrap };
                                            })}
                                            className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 text-sm flex items-center justify-center transition-colors"
                                        >
                                            −
                                        </button>
                                        <span className="w-6 text-center font-bold text-sm text-slate-800">
                                            {customProductForm.sleeves || 0}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setCustomProductForm(prev => {
                                                const s = (parseInt(prev.sleeves) || 0) + 1;
                                                return { ...prev, sleeves: s, wrap: false };
                                            })}
                                            className="w-7 h-7 rounded-lg bg-indigo-100 hover:bg-indigo-200 font-bold text-indigo-700 text-sm flex items-center justify-center transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCustomProductModal(false)}
                                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!customProductForm.name.trim() || !customProductForm.cubes}
                                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
                                >
                                    Add Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
