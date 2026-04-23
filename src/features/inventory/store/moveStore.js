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
                insuranceEnabled: false,
                paymentMethod: 'eft', // Default to EFT
                tripBreakdown: null
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
                    longCarryDistance: 0,
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
                    longCarryDistance: 0,
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
                undoHistory: [],
                lastSavedQuote: null
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
                console.log('--- SUBMIT QUOTE TRIGGERED ---')
                console.log('OVERRIDES:', overrides)
                console.log('CURRENT STATE DETAILS:', state.moveDetails)
                
                const totals = calculateQuote(
                    state.inventory,
                    state.moveDetails,
                    state.accessDetails,
                    [], // items will be passed from calculation engine
                    state.manualServiceCharges
                )

                // Strip non-DB control flags from overrides before building payload
                const { forceNew, submission_type, contactName, contactEmail, contactPhone, ...dbOverrides } = overrides

                // Build a clean payload with only known database columns
                const quotePayload = {
                    client_name: dbOverrides.client_name || overrides.contactName || state.moveDetails.contactName || '',
                    client_email: dbOverrides.client_email || overrides.contactEmail || state.moveDetails.contactEmail || '',
                    client_phone: dbOverrides.client_phone || overrides.contactPhone || state.moveDetails.contactPhone || '',
                    pickup_address: dbOverrides.pickup_address || state.moveDetails.pickupAddress || 'Address Not Provided',
                    dropoff_address: dbOverrides.dropoff_address || state.moveDetails.dropoffAddress || 'Address Not Provided',
                    distance_km: Number(dbOverrides.distance_km || state.moveDetails.distanceKm || 0),
                    move_date: (dbOverrides.move_date || state.moveDetails.moveDate || new Date().toISOString()).split('T')[0],
                    items_json: state.inventory,
                    total_price: totals.total,
                    status: dbOverrides.status || overrides.status || 'new',
                    request_call_back: Boolean(overrides.request_call_back || state.moveDetails.request_call_back),
                }

                console.log('SUBMITTING QUOTE PAYLOAD (clean):', quotePayload)

                try {
                    let result
                    if (state.lastSavedQuote?.id && !overrides.forceNew) {
                        result = await supabase
                            .from('quotes')
                            .update(quotePayload)
                            .eq('id', state.lastSavedQuote.id)
                            .select()
                    } else {
                        // For new inserts, remove the ID if it's a temp one
                        const { id, ...insertPayload } = quotePayload
                        result = await supabase
                            .from('quotes')
                            .insert([insertPayload])
                            .select()
                    }

                    console.log('SUPABASE RAW RESULT:', result)
                    if (result.error) throw result.error

                    if (!result.data || result.data.length === 0) {
                        console.warn('SUPABASE: Record created but no data returned. Check RLS SELECT policy.')
                        return { success: true, data: null }
                    }

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

            sendEmail: async (payload) => {
                try {
                    const response = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
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

export const calculateQuote = (inventory, moveDetails, accessDetails, items, manualServiceCharges = {}) => {
    const { isSharedLoad: sharedLoadPreference = null } = moveDetails;
    let totalVolume = 0
    let autoPackagingCost = 0
    let requiresCrateFlag = false
    let requiresPhotoFlag = false

    Object.entries(inventory).forEach(([idKey, qty]) => {
        const [itemId] = idKey.split('_')
        const item = items.find(i => i.id === itemId)
        if (item) {
            totalVolume += item.volume * qty
            if (item.autoPackagingType === 'Plastic Covers') autoPackagingCost += (qty * 145)
            if (item.autoPackagingType === 'Wrapping') autoPackagingCost += (qty * 75)
            if (item.requiresCrate) requiresCrateFlag = true
            if (item.requiresPhoto) requiresPhotoFlag = true
        }
    })

    const totalVolumeCuFt = totalVolume
    const pickupAddress = (moveDetails.pickupAddress || '').toLowerCase()
    const dropoffAddress = (moveDetails.dropoffAddress || '').toLowerCase()
    
    // Attempt detection from metadata first, then full address string
    const pickupCityCode = getCityCode(moveDetails.pickupCity) || getCityCode(pickupAddress)
    const dropoffCityCode = getCityCode(moveDetails.dropoffCity) || getCityCode(dropoffAddress)
    
    const totalDistance = (parseFloat(moveDetails.distanceKm) || 0) + 30

    // Force National if we detect cross-city keywords OR distance is high
    const isNationalMove = (pickupCityCode && dropoffCityCode && pickupCityCode !== dropoffCityCode) || 
                          totalDistance > 150 ||
                          (pickupAddress.includes('johannesburg') && dropoffAddress.includes('cape town')) ||
                          (pickupAddress.includes('joburg') && dropoffAddress.includes('cape town')) ||
                          (pickupAddress.includes('durban') && dropoffAddress.includes('johannesburg')) ||
                          (pickupAddress.includes('cape town') && dropoffAddress.includes('johannesburg'))

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
            // National logic is flat rate times distance - no minAmount anymore as per request
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
    let hasShuttle = false
    
    // Additional Costs: Shuttle & Long Carry logic
    const addAccess = (loc) => {
        if (loc?.elevator) accessFees += 300
        if (loc?.stairs) accessFees += (loc.floorLevel || 0) * 200
        if (loc?.specialConditions?.panhandle) accessFees += 0
        if (loc?.specialConditions?.hoisting) accessFees += 0
        
        // Shuttle: Track if needed
        if (loc?.parkingType === 'shuttle' || loc?.specialConditions?.shuttle) {
            hasShuttle = true
        }
        
        // Long Carry: Flat rate R450 if distance > 30m
        if (loc?.specialConditions?.longCarry && (parseFloat(loc?.longCarryDistance) > ADDITIONAL_COSTS.longCarry.thresholdMeters)) {
            accessFees += ADDITIONAL_COSTS.longCarry.flatRate
        }
    }
    if (accessDetails?.origin) addAccess(accessDetails.origin)
    if (accessDetails?.destination) addAccess(accessDetails.destination)

    if (hasShuttle) {
        accessFees += ADDITIONAL_COSTS.shuttle.flatRate
    }

    let additionalCrewCost = 0
    let hasHeavyItems = false
    // Additional Costs: Heavy Items (2 Crew @ R700pp - Flat fee)
    Object.entries(inventory).forEach(([idKey, qty]) => {
        if (qty <= 0) return
        const [itemId] = idKey.split('_')
        const item = items.find(i => i.id === itemId)
        const isHeavy = item?.isHeavy || ['piano', 'golf-cart', 'statue', 'gym', 'server', 'bulk-filer', 'jungle-gym', 'wendy-house', 'safe'].some(k => itemId.toLowerCase().includes(k))
        
        if (isHeavy) {
            hasHeavyItems = true
        }
    })

    if (hasHeavyItems) {
        additionalCrewCost = (ADDITIONAL_COSTS.heavyItemCrew.perPerson * ADDITIONAL_COSTS.heavyItemCrew.count)
    }

    // Additional Costs: Distance-based depot fees (Over 80km) - LOCAL ONLY
    let extraDistanceFees = 0
    if (!isNationalMove && moveDetails.tripBreakdown) {
        const { depotToPickup, dropoffToDepot } = moveDetails.tripBreakdown
        if (depotToPickup > ADDITIONAL_COSTS.collectionOver80Km.thresholdKm) {
            extraDistanceFees += depotToPickup * ADDITIONAL_COSTS.collectionOver80Km.ratePerKm
        }
        if (dropoffToDepot > ADDITIONAL_COSTS.deliveryOver80Km.thresholdKm) {
            extraDistanceFees += dropoffToDepot * ADDITIONAL_COSTS.deliveryOver80Km.ratePerKm
        }
    }

    let packagingCost = 0
    if (moveDetails.packagingOption !== 'none') {
        const rates = moveDetails.packagingOption === 'boxes_only' 
            ? PACKAGING_RATES.sendMeBoxesOnly 
            : PACKAGING_RATES.boxesAndPacking
            
        const st7Cost = (moveDetails.st7Boxes || 0) * rates.st7
        const linenCost = (moveDetails.linenBoxes || 0) * rates.linen
        packagingCost = st7Cost + linenCost + rates.deliveryFee
    }

    const subTotal = transportCost + volumeCost + accessFees + additionalCrewCost + extraDistanceFees + autoPackagingCost + packagingCost + (PRICING_CONSTANTS.documentationFee || 175)
    
    let discount = 0
    if (moveDetails.moveDate) {
        const day = new Date(moveDetails.moveDate).getDate()
        if (day >= 5 && day <= 24) discount = subTotal * 0.10
    }

    const subTotalAfterDiscount = subTotal - discount
    let vat = subTotalAfterDiscount * 0.15
    let total = subTotalAfterDiscount + vat

    // Additional Costs: Payflex Surcharge (+7%)
    if (moveDetails.paymentMethod === 'payflex') {
        total = total * (1 + ADDITIONAL_COSTS.payflex.surcharge)
        // Adjust VAT accordingly if needed, or just keep it as a flat surcharge on final
    }

    // Additional Notes: Min Order R2250
    if (total < PRICING_CONSTANTS.minOrder) {
        total = PRICING_CONSTANTS.minOrder
    }

    const detailedAccess = []
    if (hasShuttle) detailedAccess.push(`Shuttle: R${ADDITIONAL_COSTS.shuttle.flatRate}`)
    const checkLoc = (loc, prefix) => {
        if (loc?.elevator) detailedAccess.push(`${prefix} Elevator: R300`)
        if (loc?.stairs) detailedAccess.push(`${prefix} Stairs (${loc.floorLevel} flr): R${loc.floorLevel * 200}`)
        if (loc?.specialConditions?.panhandle) detailedAccess.push(`${prefix} Panhandle: R0`)
        if (loc?.specialConditions?.hoisting) detailedAccess.push(`${prefix} Hoisting: R0`)
        if (loc?.specialConditions?.longCarry && (parseFloat(loc?.longCarryDistance) > ADDITIONAL_COSTS.longCarry.thresholdMeters)) {
            detailedAccess.push(`${prefix} Long Carry (${loc.longCarryDistance}m): R${ADDITIONAL_COSTS.longCarry.flatRate}`)
        }
    }
    if (accessDetails?.origin) checkLoc(accessDetails.origin, 'Origin')
    if (accessDetails?.destination) checkLoc(accessDetails.destination, 'Dest')

    const detailedExtraDistance = []
    if (!isNationalMove && moveDetails.tripBreakdown) {
        const { depotToPickup, dropoffToDepot } = moveDetails.tripBreakdown
        if (depotToPickup > ADDITIONAL_COSTS.collectionOver80Km.thresholdKm) {
            detailedExtraDistance.push(`Pickup > 80km: ${depotToPickup.toFixed(1)}km × R${ADDITIONAL_COSTS.collectionOver80Km.ratePerKm}`)
        }
        if (dropoffToDepot > ADDITIONAL_COSTS.deliveryOver80Km.thresholdKm) {
            detailedExtraDistance.push(`Dropoff > 80km: ${dropoffToDepot.toFixed(1)}km × R${ADDITIONAL_COSTS.deliveryOver80Km.ratePerKm}`)
        }
    }

    const needsConsultation = totalDistance > 100 || totalVolumeCuFt > 3600

    return {
        total,
        subTotal,
        discount,
        vat,
        totalVolume,
        totalVolumeCuFt,
        packagingCost: packagingCost + autoPackagingCost,
        requiresCrateFlag,
        requiresPhotoFlag,
        needsConsultation,
        breakdown: {
            vehicleType: vehicleName,
            transport: transportCost,
            volume: volumeCost,
            access: accessFees,
            detailedAccess: detailedAccess.length > 0 ? detailedAccess.join(' | ') : 'Standard Access (No Surcharges)',
            crew: additionalCrewCost,
            extraDistance: extraDistanceFees,
            detailedExtraDistance: detailedExtraDistance.length > 0 ? detailedExtraDistance.join(' | ') : 'No Depot Surcharges',
            packaging: packagingCost + autoPackagingCost,
            distance: totalDistance,
            transportRate: transportRate,
            volumeRate: volumeRate,
            isSharedLoad: sharedLoadPreference !== null ? sharedLoadPreference : (isNationalMove && totalVolumeCuFt < 850)
        }
    }
}
