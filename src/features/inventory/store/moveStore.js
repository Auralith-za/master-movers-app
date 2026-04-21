import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../../../lib/supabaseClient'
import { 
    CITY_CODES, 
    NATIONAL_RATES, 
    LOCAL_VEHICLE_RATES, 
    ADDITIONAL_COSTS, 
    PACKAGING_RATES, 
    PRICING_CONSTANTS, 
    getCityCode 
} from '../data/pricingRates'

export const useMoveStore = create(
    persist(
        (set, get) => ({
            // Step 1: Details
            moveDetails: {
                pickupAddress: '',
                dropoffAddress: '',
                distanceKm: 0,
                moveDate: '',
                contactName: '',
                surname: '',
                contactPhone: '',
                contactEmail: '',
                generalNotes: '',
                packagingOption: 'none',
                st7Boxes: 0,
                linenBoxes: 0,
                insuranceEnabled: false
            },
            lastSavedQuote: null,
            setMoveDetails: (details) =>
                set((state) => ({
                    moveDetails: { ...state.moveDetails, ...details }
                })),
            setPackagingOption: (option) =>
                set((state) => ({
                    moveDetails: { ...state.moveDetails, packagingOption: option }
                })),

            // Step 2: Access
            accessDetails: {
                origin: {
                    type: 'house',
                    floorLevel: 0,
                    elevator: false,
                    stairs: false,
                    shuttle: false,
                    longCarry: false,
                    distanceFromDoor: '<10m',
                    notes: '',
                    specialConditions: {}
                },
                destination: {
                    type: 'house',
                    floorLevel: 0,
                    elevator: false,
                    stairs: false,
                    shuttle: false,
                    longCarry: false,
                    distanceFromDoor: '<10m',
                    notes: '',
                    specialConditions: {}
                }
            },
            setAccessDetails: (location, details) =>
                set((state) => ({
                    accessDetails: {
                        ...state.accessDetails,
                        [location]: { ...state.accessDetails[location], ...details }
                    }
                })),

            // Step 3: Inventory
            inventory: {},
            addItem: (id, variation = null) =>
                set((state) => {
                    const idKey = variation ? `${id}_${variation}` : id
                    const newInventory = { ...state.inventory, [idKey]: (state.inventory[idKey] || 0) + 1 }
                    return {
                        inventory: newInventory,
                        undoHistory: [...state.undoHistory, state.inventory]
                    }
                }),
            removeItem: (id, variation = null) =>
                set((state) => {
                    const idKey = variation ? `${id}_${variation}` : id
                    if (!state.inventory[idKey]) return state
                    const newInventory = { ...state.inventory }
                    if (newInventory[idKey] <= 1) {
                        delete newInventory[idKey]
                    } else {
                        newInventory[idKey] -= 1
                    }
                    return {
                        inventory: newInventory,
                        undoHistory: [...state.undoHistory, state.inventory]
                    }
                }),
            undoHistory: [],
            undo: () => set((state) => {
                if (state.undoHistory.length === 0) return state;
                const previous = state.undoHistory[state.undoHistory.length - 1];
                return {
                    inventory: previous,
                    undoHistory: state.undoHistory.slice(0, -1)
                }
            }),
            currentVehicle: null,
            setCurrentVehicle: (v) => set({ currentVehicle: v }),

            // Basic Helpers
            reset: () => set({ 
                moveDetails: { packagingOption: 'none', insuranceEnabled: false }, 
                accessDetails: {}, 
                inventory: {}, 
                manualServiceCharges: {},
                undoHistory: []
            }),
            clearInventory: () => set((state) => ({ inventory: {}, undoHistory: [...state.undoHistory, state.inventory] })),
            
            manualServiceCharges: {},
            updateManualServiceCharge: (key, value) => set((state) => ({
                manualServiceCharges: { ...state.manualServiceCharges, [key]: value }
            })),

            getTotals: () => {
                const state = get()
                return calculateQuote(
                    state.inventory,
                    state.moveDetails,
                    state.accessDetails,
                    [], // Placeholder for INVENTORY_ITEMS
                    state.manualServiceCharges || {}
                )
            },

            // Quote Submission & Management
            submitQuote: async (overrides = {}) => {
                const state = get()
                const totals = calculateQuote(
                    state.inventory,
                    state.moveDetails,
                    state.accessDetails,
                    [], // INVENTORY_ITEMS should be passed if available locally, but store doesn't have it
                    state.manualServiceCharges
                )

                const quotePayload = {
                    ...state.moveDetails,
                    access_details: state.accessDetails,
                    inventory: state.inventory,
                    totals: {
                        subtotal: totals.subTotal,
                        vat: totals.vat,
                        total: totals.total,
                        discount: totals.discount,
                        breakdown: totals.breakdown
                    },
                    status: overrides.status || 'new',
                    ...overrides
                }

                try {
                    let result
                    if (state.lastSavedQuote?.id) {
                        result = await supabase
                            .from('quotes')
                            .update(quotePayload)
                            .eq('id', state.lastSavedQuote.id)
                            .select()
                    } else {
                        result = await supabase
                            .from('quotes')
                            .insert([quotePayload])
                            .select()
                    }

                    if (result.error) throw result.error

                    const savedQuote = result.data[0]
                    set({ lastSavedQuote: savedQuote })
                    return { success: true, data: savedQuote }
                } catch (err) {
                    console.error('Submit Quote Error:', err)
                    return { success: false, error: err }
                }
            },

            submitQuoteActivity: async (quoteId, activityType, details) => {
                try {
                    const { error } = await supabase
                        .from('quote_activity')
                        .insert([{ quote_id: quoteId, activity_type: activityType, details }])
                    return { success: !error, error }
                } catch (err) {
                    return { success: false, error: err }
                }
            },

            updateQuoteStatus: async (quoteId, status, additionalData = {}) => {
                try {
                    const { error } = await supabase
                        .from('quotes')
                        .update({ status, ...additionalData })
                        .eq('id', quoteId)
                    return { success: !error, error }
                } catch (err) {
                    return { success: false, error: err }
                }
            },

            sendWhatsApp: async (payload) => {
                try {
                    const response = await fetch('/api/whatsapp', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    })
                    return await response.json()
                } catch (error) {
                    return { success: false, error }
                }
            }
        }),
        {
            name: 'master-movers-storage-v3',
            version: 3
        }
    )
)

export const calculateQuote = (inventory, moveDetails, accessDetails, INVENTORY_ITEMS, manualServiceCharges = {}) => {
    let totalVolume = 0
    let autoPackagingCost = 0

    Object.entries(inventory).forEach(([idKey, qty]) => {
        const [itemId] = idKey.split('_')
        const item = INVENTORY_ITEMS.find(i => i.id === itemId)
        if (item) {
            totalVolume += item.volume * qty
            if (item.autoPackagingType === 'Plastic Covers') autoPackagingCost += (qty * 145)
            if (item.autoPackagingType === 'Wrapping') autoPackagingCost += (qty * 75)
        }
    })

    const totalVolumeCuFt = totalVolume
    const pickupAddress = (moveDetails.pickupAddress || '').toLowerCase()
    const dropoffAddress = (moveDetails.dropoffAddress || '').toLowerCase()
    
    // Attempt detection from metadata first, then full address string
    const pickupCityCode = getCityCode(moveDetails.pickupCity) || getCityCode(pickupAddress)
    const dropoffCityCode = getCityCode(moveDetails.dropoffCity) || getCityCode(dropoffAddress)
    
    // Force National if we detect cross-city keywords in addresses even if codes are missing
    const isNationalMove = (pickupCityCode && dropoffCityCode && pickupCityCode !== dropoffCityCode) || 
                          (pickupAddress.includes('johannesburg') && dropoffAddress.includes('cape town')) ||
                          (pickupAddress.includes('joburg') && dropoffAddress.includes('cape town')) ||
                          (pickupAddress.includes('durban') && dropoffAddress.includes('johannesburg')) ||
                          (pickupAddress.includes('cape town') && dropoffAddress.includes('johannesburg'))
    
    const totalDistance = (parseFloat(moveDetails.distanceKm) || 0) + 30
    let transportCost = 0
    let volumeCost = 0
    let vehicleName = ''
    let transportRate = 0
    let volumeRate = 0

    if (isNationalMove) {
        // National logic: Flat rate per KM regardless of volume (Standard: Link)
        const routeKey = `${pickupCityCode}-${dropoffCityCode}`
        const nationalRate = NATIONAL_RATES[routeKey]
        
        if (nationalRate) {
            transportRate = nationalRate.ratePerKm
            transportCost = totalDistance * transportRate
            if (nationalRate.minAmount && transportCost < nationalRate.minAmount) {
                transportCost = nationalRate.minAmount
            }
        } else {
            // Fallback for undefined routes
            transportRate = 35 
            transportCost = totalDistance * transportRate
        }
        
        volumeCost = 0 // National has no ft3 charge in flat rate mode
        volumeRate = 0
        vehicleName = 'Standard National Link'
    } else {
        // Local logic: Vehicle selection by volume + ft3 charge
        const cityRates = LOCAL_VEHICLE_RATES[pickupCityCode] || LOCAL_VEHICLE_RATES[CITY_CODES.JHB]
        const vehicleList = Array.isArray(cityRates) ? cityRates : LOCAL_VEHICLE_RATES[CITY_CODES.JHB]
        const vehicle = vehicleList.find(v => v.capacityCuFt >= totalVolumeCuFt) || vehicleList[vehicleList.length - 1]
        
        transportRate = vehicle.ratePerKm || 0
        volumeRate = vehicle.ratePerCuFt || 0
        
        transportCost = totalDistance * transportRate
        volumeCost = totalVolumeCuFt * volumeRate
        vehicleName = vehicle.name
    }

    let accessFees = 0
    const addAccess = (loc) => {
        if (loc?.elevator) accessFees += 300
        if (loc?.stairs) accessFees += (loc.floorLevel || 0) * 200
        if (loc?.specialConditions?.panhandle) accessFees += 500
        if (loc?.specialConditions?.hoisting) accessFees += 1200
        if (loc?.parkingType === 'shuttle') accessFees += 1500
    }
    if (accessDetails?.origin) addAccess(accessDetails.origin)
    if (accessDetails?.destination) addAccess(accessDetails.destination)

    let packagingCost = 0
    if (moveDetails.packagingOption !== 'none') {
        const rates = moveDetails.packagingOption === 'boxes_only' 
            ? PACKAGING_RATES.sendingBoxesOnly 
            : PACKAGING_RATES.boxesAndPacking
            
        const st7Cost = (moveDetails.st7Boxes || 0) * rates.st7
        const linenCost = (moveDetails.linenBoxes || 0) * rates.linen
        packagingCost = st7Cost + linenCost + rates.deliveryFee
    }

    const subTotal = transportCost + volumeCost + accessFees + autoPackagingCost + packagingCost + (PRICING_CONSTANTS.documentationFee || 175)
    
    let discount = 0
    if (moveDetails.moveDate) {
        const day = new Date(moveDetails.moveDate).getDate()
        if (day >= 5 && day <= 24) discount = subTotal * 0.10
    }

    const subTotalAfterDiscount = subTotal - discount
    const vat = subTotalAfterDiscount * 0.15
    const total = subTotalAfterDiscount + vat

    return {
        total,
        subTotal,
        discount,
        vat,
        totalVolume,
        totalVolumeCuFt,
        breakdown: {
            vehicleType: vehicleName,
            transport: transportCost,
            volume: volumeCost,
            access: accessFees,
            packaging: packagingCost + autoPackagingCost,
            distance: totalDistance,
            transportRate: transportRate,
            volumeRate: volumeRate,
            isSharedLoad: isNationalMove && totalVolumeCuFt < 850
        }
    }
}
