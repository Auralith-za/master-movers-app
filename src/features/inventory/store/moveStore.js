import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../../../lib/supabaseClient.js'
import { formatClientName, cleanClientName } from '../../../utils/quoteHelpers.js'
import { INVENTORY_ITEMS } from '../data/mockItems.js'
import { 
    CITY_CODES, 
    NATIONAL_RATES, 
    LOCAL_VEHICLE_RATES, 
    ADDITIONAL_COSTS, 
    PACKAGING_RATES, 
    PRICING_CONSTANTS, 
    getCityCode,
    detectCityCode
} from '../data/pricingRates.js'

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
                    moveDetails: { 
                        ...state.moveDetails, 
                        packagingOption: option,
                        // Always reset box quantities AND confirmation when switching packaging option
                        // This prevents stale persisted values from showing phantom costs
                        st7Boxes: 0,
                        linenBoxes: 0,
                        boxesConfirmed: false
                    }
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
            addItem: (id, variation = null, room = null) =>
                set((state) => {
                    let idKey = variation ? `${id}_${variation}` : id
                    if (room) {
                        idKey = `${idKey}__room:${room}`
                    }
                    const newInventory = { ...state.inventory, [idKey]: (state.inventory[idKey] || 0) + 1 }
                    return {
                        inventory: newInventory,
                        undoHistory: [...state.undoHistory, state.inventory]
                    }
                }),
            removeItem: (id, variation = null, room = null) =>
                set((state) => {
                    let idKey = variation ? `${id}_${variation}` : id
                    if (room) {
                        idKey = `${idKey}__room:${room}`
                    }
                    if (!state.inventory[idKey]) {
                        // Fallback match: match by itemId and variation (or match any key starting with itemId)
                        const match = Object.keys(state.inventory).find(k => {
                            const parsed = parseInventoryKey(k)
                            if (parsed.itemId !== id) return false
                            if (variation && parsed.variation !== variation) return false
                            if (room && parsed.room && parsed.room !== room) return false
                            return true
                        }) || Object.keys(state.inventory).find(k => {
                            const parsed = parseInventoryKey(k)
                            return parsed.itemId === id
                        })
                        if (match) idKey = match
                    }
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
            setItemQuantity: (id, variation = null, qty = 0, room = null) =>
                set((state) => {
                    let idKey = variation ? `${id}_${variation}` : id
                    if (room) {
                        idKey = `${idKey}__room:${room}`
                    }
                    if (qty > 0 && !state.inventory[idKey]) {
                        const match = Object.keys(state.inventory).find(k => {
                            const parsed = parseInventoryKey(k)
                            return parsed.itemId === id && (variation ? parsed.variation === variation : true) && (room ? parsed.room === room : true)
                        })
                        if (match) idKey = match
                    }
                    const newInventory = { ...state.inventory }
                    const count = Math.max(0, parseInt(qty) || 0)
                    if (count <= 0) {
                        delete newInventory[idKey]
                    } else {
                        newInventory[idKey] = count
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
            reset: () => {
                // Clear sessionStorage dedup guards so a new quote flow can create a fresh lead
                Object.keys(sessionStorage)
                    .filter(k => k.startsWith('mm_step4_lead_saved_'))
                    .forEach(k => sessionStorage.removeItem(k))
                sessionStorage.removeItem('abandoned_lead_sent')
                set({ 
                    moveDetails: { packagingOption: 'none', insuranceEnabled: false }, 
                    accessDetails: {}, 
                    inventory: {}, 
                    manualServiceCharges: {},
                    undoHistory: [],
                    lastSavedQuote: null
                })
            },
            clearInventory: () => set((state) => ({ inventory: {}, undoHistory: [...state.undoHistory, state.inventory] })),
            setInventory: (newInventory) => set((state) => ({ inventory: newInventory, undoHistory: [...state.undoHistory, state.inventory] })),
            toggleItemModifier: (itemId, modifier, room) => set((state) => {
                const inventory = state.inventory;
                // Find the key for this item in the given room (with any existing variation)
                const matchKey = Object.keys(inventory).find(k => {
                    const p = parseInventoryKey(k);
                    if (p.itemId !== itemId) return false;
                    const itemRoom = p.room || (INVENTORY_ITEMS.find(i => i.id === itemId)?.category);
                    if (room && itemRoom !== room) return false;
                    return true;
                }) || Object.keys(inventory).find(k => parseInventoryKey(k).itemId === itemId);
                if (!matchKey) return state;
                const parsed = parseInventoryKey(matchKey);
                const qty = inventory[matchKey];
                let newVariation = parsed.variation || '';
                if (newVariation.includes(modifier)) {
                    newVariation = newVariation.split('_').filter(v => v !== modifier).join('_') || null;
                } else {
                    newVariation = newVariation ? `${newVariation}_${modifier}` : modifier;
                }
                let newKey = itemId;
                if (newVariation) newKey += `_${newVariation}`;
                if (parsed.room) newKey += `__room:${parsed.room}`;
                const newInventory = { ...inventory };
                delete newInventory[matchKey];
                newInventory[newKey] = qty;
                return { inventory: newInventory, undoHistory: [...state.undoHistory, inventory] };
            }),
            
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
                    INVENTORY_ITEMS,
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
                    INVENTORY_ITEMS,
                    state.manualServiceCharges
                )

                // Strip non-DB control flags from overrides before building payload
                const { forceNew, submission_type, contactName, contactEmail, contactPhone, ...dbOverrides } = overrides

                // Build a clean payload with only known database columns
                const isLocationNotFound = Boolean(overrides.cant_find_address || state.moveDetails.cant_find_address)
                const commentsBase = dbOverrides.customer_comments || state.moveDetails.generalNotes || ''
                const commentsFinal = isLocationNotFound 
                    ? `[LOCATION SEARCH FAILED] User could not find their address. Please contact them. ${commentsBase}`
                    : commentsBase

                const defaultFullName = formatClientName(state.moveDetails.contactName, state.moveDetails.surname) || 'Anonymous'
                const rawName = dbOverrides.client_name || overrides.contactName || defaultFullName
                const quotePayload = {
                    client_name: cleanClientName(rawName),
                    client_email: dbOverrides.client_email || overrides.contactEmail || state.moveDetails.contactEmail || '',
                    client_phone: dbOverrides.client_phone || overrides.contactPhone || state.moveDetails.contactPhone || '',
                    pickup_address: dbOverrides.pickup_address || state.moveDetails.pickupAddress || 'Address Not Provided',
                    dropoff_address: dbOverrides.dropoff_address || state.moveDetails.dropoffAddress || 'Address Not Provided',
                    distance_km: Number(dbOverrides.distance_km || state.moveDetails.totalBillableDistance || state.moveDetails.distanceKm || 0),
                    trip_breakdown: dbOverrides.trip_breakdown || state.moveDetails.tripBreakdown || null,
                    move_date: (dbOverrides.move_date || state.moveDetails.moveDate || new Date().toISOString()).split('T')[0],
                    items_json: {
                        items: state.inventory || {},
                        extraCollections: state.moveDetails?.extraCollections || [],
                        extraDrops: state.moveDetails?.extraDrops || [],
                        ...(state.inventory || {})
                    },
                    total_price: totals.total || 0,
                    total_volume: totals.totalVolume || 0,
                    status: dbOverrides.status || overrides.status || 'new',
                    request_call_back: Boolean(overrides.request_call_back || state.moveDetails.request_call_back || isLocationNotFound),
                    customer_comments: commentsFinal,
                    access_details: dbOverrides.access_details || state.accessDetails || {},
                    packaging_option: dbOverrides.packaging_option || state.moveDetails.packagingOption || 'none',
                    st7_boxes: Number(dbOverrides.st7_boxes || state.moveDetails.st7Boxes || 0),
                    linen_boxes: Number(dbOverrides.linen_boxes || state.moveDetails.linenBoxes || 0),
                    insurance_enabled: Boolean(dbOverrides.insurance_enabled !== undefined ? dbOverrides.insurance_enabled : state.moveDetails.insuranceEnabled),
                    payment_method: dbOverrides.payment_method || state.moveDetails.paymentMethod || 'eft'
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
                        .from('quote_activities')
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

export const parseInventoryKey = (idKey) => {
    if (!idKey) return { itemId: '', variation: null, room: null }
    let key = idKey
    let room = null
    if (key.includes('__room:')) {
        const parts = key.split('__room:')
        key = parts[0]
        room = parts[1] || null
    }
    let variation = null
    if (key.includes('_')) {
        const parts = key.split('_')
        key = parts[0]
        variation = parts.slice(1).join('_') || null
    }
    return { itemId: key, variation, room }
}

export const getPlasticSleevesCount = (item, idKey) => {
    if (!item) return 0;
    const { itemId: rawItemId } = parseInventoryKey(idKey)
    const itemId = (rawItemId || item.id || '').toLowerCase()
    const name = (item.name || '').toLowerCase()
    const { variation: parsedVar } = parseInventoryKey(idKey)
    const variation = (parsedVar || '').toLowerCase()

    // ─── Exact per-item sleeve counts (verified 2026-07-14) ──────────────────
    // Keys match item IDs in mockItems.js exactly.
    const SLEEVE_MAP = {
        // Queen
        'queen-bed-base':               1,
        'queen-bed-mattress':           1,
        'queen-mattress-bed-and-base':  2,
        // King
        'king-size-bed-base':           2,
        'king-size-bed-mattress':       2,
        'king-bed-base':                2,
        'king-bed-mattress':            2,
        'king-mattress-bed-and-base':   4,
        'king-headboard':               0,
        'sleigh-king-bed':              2,
        'king-sleigh-bed':              2,
        'sleigh-king':                  2,
        'king-sleigh':                  2,
        // Double
        'double-bed-base':              1,
        'double-bed-mattress':          1,
        'double-bed-base-and-mattress': 2,
        'double-bed-headboard':         0,
        'd-bed-headboard':              0,
        'double-bed-metal-spring':      0,
        // Single / Three Quarter
        'three-quarter-bed':            2,
        'single-bed-base':              1,
        'single-bed-mattress':          1,
        'single-bed-base-and-mattress': 2,
        'single-bed-headboard':         0,
        'single-bed-steel-frame':       0,
        // Sleigh beds
        'sleigh-king-bed':              2,
        'sleigh-queen-bed':             1,
        'sleigh-double-bed':            1,
        // Desks — no sleeves
        'large-desk':                   0,
        'l-shape-desk':                 0,
        'small-desk':                   0,
        'normal-desk':                  0,
        'executive-desk':               0,
        'desk-bedroom':                 0,
        // Office chairs — no sleeves
        'office-chairs':                0,
        'office-chair-bedroom':         0,
        // Pedestals — no sleeves
        'pedestal':                     0,
        'pedestals':                    0,
        'glass-pedestal':               0,
        'pedestals-bedroom':            0,
        // Boxes — no sleeves
        'boxes-lounge':                 0,
        'boxes-dining':                 0,
        'boxes-bedrooms':               0,
        'boxes-office':                 0,
        'boxes-appliances':             0,
        'boxes-general':                0,
        'boxes-outdoor':                0,
        'boxes-or-cartons':             0,
        'boxes-special':                0,
        // Lamps — no sleeves
        'bedside-lamp':                 0,
        'desk-lamp':                    0,
        // Carpet — no sleeves
        'carpet':                       0,
        'carpet-or-rug':                0,
    }

    // ─── Manual Toggle Override ──────────────────────────────────────────────
    if (idKey.endsWith('_Plastic Sleeve') || idKey.includes('_Plastic Sleeve_')) {
        return 1
    }

    if (Object.prototype.hasOwnProperty.call(SLEEVE_MAP, itemId)) {
        return SLEEVE_MAP[itemId]
    }

    // ─── King beds / base / mattress / sleigh logic ───────────────────────────
    if (itemId.includes('king') || name.includes('king')) {
        if (itemId.includes('headboard') || name.includes('headboard')) return 0;
        if (itemId.includes('base and mattress') || name.includes('base & mattress') || name.includes('base-and-mattress')) return 4;
        if (itemId.includes('base') || name.includes('base') || itemId.includes('mattress') || name.includes('mattress') || itemId.includes('sleigh') || name.includes('sleigh')) return 2;
    }

    // ─── Couch / sofa / suite logic ──────────────────────────────────────────
    const isCouch = (itemId.includes('couch') || name.includes('couch') ||
                    itemId.includes('sofa') || name.includes('sofa') ||
                    itemId.includes('suite') || name.includes('suite') ||
                    itemId.includes('seater') || name.includes('seater')) &&
                    !itemId.includes('table') && !name.includes('table')

    if (isCouch) {
        const isLShape = itemId.includes('l-shape') || name.includes('l shape') || name.includes('l-shape')
        if (isLShape) return 3

        const is4Seater = itemId.includes('4-seater') || name.includes('4-seater') ||
                          itemId.includes('4 seater') || name.includes('4 seater') ||
                          variation.includes('4-seater') || variation.includes('4 seater')
        const is3Seater = itemId.includes('3-seater') || name.includes('3-seater') ||
                          itemId.includes('3 seater') || name.includes('3 seater') ||
                          itemId.includes('three-seater') || name.includes('three') ||
                          variation.includes('3-seater') || variation.includes('3 seater')
        return (is4Seater || is3Seater) ? 2 : 1
    }

    // ─── Recliner / lounger / armchair / daybed ───────────────────────────────
    const isReclinerOrPoofOrLounger = (itemId.includes('recliner') || name.includes('recliner') ||
                                      itemId.includes('lounger') || name.includes('lounger') ||
                                      itemId.includes('chaise') || name.includes('chaise') ||
                                      itemId.includes('armchair') || name.includes('armchair') ||
                                      itemId.includes('daybed') || name.includes('daybed')) &&
                                      !itemId.includes('pool') && !name.includes('pool')

    if (isReclinerOrPoofOrLounger) {
        return 1
    }

    // ─── Fallback: autoPackagingType or variation tag ─────────────────────────
    if (item.autoPackagingType === 'Plastic Covers') {
        return 1
    }

    return 0
}


export const getWrappingFlag = (item, variation) => {
    if (!item) return false;
    // Auto-sleeved items (couches, mattresses, bases, recliners, armchairs, etc.) use Plastic Sleeves and CANNOT be wrapped
    // Build the actual idKey from item.id + variation to check if sleeves are currently active
    const cleanVar = variation ? variation.replace(/_?Plastic Sleeve/g, '').replace(/_?Wrapped/g, '') : null
    const baseIdKey = cleanVar ? `${item.id}_${cleanVar}` : item.id
    if (getPlasticSleevesCount(item, baseIdKey) > 0) return false;
    // Also block if a Plastic Sleeve modifier is explicitly in the variation
    if (variation && variation.includes('Plastic Sleeve')) return false;

    const isGlassOrMarble = variation === 'Glass' || variation === 'Marble'
    const isStandardOrWood = variation === 'Standard Wood/Other' || variation === 'Standard' || variation === 'Wood'
    const appliesAutoWrapping = item.autoPackagingType === 'Wrapping' && !isStandardOrWood
    return isGlassOrMarble || appliesAutoWrapping || Boolean(variation?.includes('Wrapped'))
}

export const calculateQuote = (inventory = {}, moveDetails = {}, accessDetails = {}, items = INVENTORY_ITEMS, manualServiceCharges = {}, extraVolumeCuFt = 0, specialWrappingOverrides = null, isAdminEdit = false) => {
    moveDetails = moveDetails || {}
    accessDetails = accessDetails || {}
    inventory = inventory || {}
    const { isSharedLoad: sharedLoadPreference = null } = moveDetails;
    let totalVolume = 0
    let plasticSleeveCost = 0
    let plasticSleeveCount = 0
    let wrappingCost = 0
    let wrappingVolume = 0
    let requiresCrateFlag = false
    let requiresPhotoFlag = false

    let boxQty = 0
    Object.entries(inventory).forEach(([idKey, qty]) => {
        const { itemId, variation } = parseInventoryKey(idKey)
        const item = items.find(i => i.id === itemId)
        if (item) {
            // All inventory items add to volume (including self-supplied boxes)
            totalVolume += item.volume * qty

            
            let appliesWrapping = getWrappingFlag(item, variation)
            let sleeves = getPlasticSleevesCount(item, idKey)

            // Apply overrides if any
            if (specialWrappingOverrides && specialWrappingOverrides[idKey]) {
                const override = specialWrappingOverrides[idKey]
                if (override.wrap !== undefined) appliesWrapping = override.wrap
                if (override.sleeves !== undefined) sleeves = override.sleeves
            }

            // Enforce mutual exclusivity: auto-sleeved items (sleeves > 0) use plastic sleeves ONLY and cannot be wrapped
            if (sleeves > 0) {
                appliesWrapping = false
            }

            if (sleeves > 0) {
                plasticSleeveCount += (qty * sleeves)
                plasticSleeveCost += (qty * sleeves * 55)
            }
            
            if (appliesWrapping) {
                // R5.90 per cubic FOOT
                wrappingVolume += (qty * item.volume)
                wrappingCost += qty * (item.volume * 5.90);
            }
            
            if (item.requiresCrate) requiresCrateFlag = true
            if (item.requiresPhoto) requiresPhotoFlag = true
        }
    })

    // Add any extra volume (e.g. from manual custom items in admin)
    totalVolume += extraVolumeCuFt

    // Add volume for ordered boxes — only when user has confirmed the quantities
    const boxesConfirmed = moveDetails.boxesConfirmed !== false
    const orderedSt7Volume = boxesConfirmed ? (moveDetails.st7Boxes || 0) * 4.25 : 0
    const orderedLinenVolume = boxesConfirmed ? (moveDetails.linenBoxes || 0) * 8 : 0
    totalVolume += orderedSt7Volume + orderedLinenVolume

    const totalVolumeCuFt = totalVolume
    const pickupAddress = (moveDetails.pickupAddress || '').toLowerCase()
    const dropoffAddress = (moveDetails.dropoffAddress || '').toLowerCase()
    
    // ─── STEP 1: City Code Detection ────────────────────────────────────────────
    // Raw codes before any fallback — null means the address was not recognised
    // as being in a JHB / DBN / CPT metro area.
    const rawPickupCityCode = detectCityCode(moveDetails.pickupAddress, moveDetails.pickupAddressComponents, moveDetails.pickupLatLng);
    const rawDropoffCityCode = detectCityCode(moveDetails.dropoffAddress, moveDetails.dropoffAddressComponents, moveDetails.dropoffLatLng);

    // ─── STEP 2: Outline Province / Unknown Location Detection ──────────────────
    const haversineKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const isGPSOutline = (latLng) => {
        if (!latLng || !latLng.lat || !latLng.lng) return false;
        const lat = parseFloat(latLng.lat);
        const lng = parseFloat(latLng.lng);
        if (isNaN(lat) || isNaN(lng)) return false;
        const distToJhb = haversineKm(lat, lng, -26.2573, 28.1519);
        const distToDbn = haversineKm(lat, lng, -29.5444, 31.2174);
        const distToCpt = haversineKm(lat, lng, -33.9340, 18.5328);
        const resolvedCode = detectCityCode(null, null, latLng);
        if (resolvedCode === CITY_CODES.GR) return false;
        return distToJhb > 150 && distToDbn > 150 && distToCpt > 150;
    };

    const outlineProvinces = [
        'free state', 'limpopo', 'mpumalanga', 'north west', 'northern cape',
        'mpumulanga', 'mphumulanga',
        'potchefstroom', 'klerksdorp', 'rustenburg', 
        'bloemfontein', 'polokwane', 'nelspruit', 'mbombela', 
        'kimberley', 'upington',
        'east london', 'eastlondon', 'buffalo city',
        'george', 'knysna', 'mossel bay', 'mosselbay', 'plettenberg bay', 'plett', 'sedgefield', 'wilderness', 'garden route', 'garden route district',
        'gqeberha', 'port elizabeth', 'portelizabeth', 'pe', 'nelson mandela bay', 'eastern cape'
    ];

    const allLocations = [
        { address: pickupAddress, components: moveDetails.pickupAddressComponents, latLng: moveDetails.pickupLatLng, rawCityCode: rawPickupCityCode },
        { address: dropoffAddress, components: moveDetails.dropoffAddressComponents, latLng: moveDetails.dropoffLatLng, rawCityCode: rawDropoffCityCode }
    ];

    if (Array.isArray(moveDetails.extraCollections)) {
        moveDetails.extraCollections.forEach(coll => {
            if (coll?.address) {
                const rawCode = detectCityCode(coll.address, coll.addressComponents, coll.latLng);
                allLocations.push({ address: coll.address.toLowerCase(), components: coll.addressComponents, latLng: coll.latLng, rawCityCode: rawCode });
            }
        });
    }

    if (Array.isArray(moveDetails.extraDrops)) {
        moveDetails.extraDrops.forEach(drop => {
            if (drop?.address) {
                const rawCode = detectCityCode(drop.address, drop.addressComponents, drop.latLng);
                allLocations.push({ address: drop.address.toLowerCase(), components: drop.addressComponents, latLng: drop.latLng, rawCityCode: rawCode });
            }
        });
    }

    const isLocationOutline = (loc) => {
        // 1. Text-based search
        if (outlineProvinces.some(prov => loc.address.includes(prov))) return true;

        // 2. Component-based search
        if (loc.components && Array.isArray(loc.components)) {
            const hasOutlineComp = loc.components.some(c => {
                const name = (c.long_name || c.short_name || '').toLowerCase().trim();
                return outlineProvinces.some(prov => name === prov || name.includes(prov));
            });
            if (hasOutlineComp) return true;
        }

        // 3. Unresolved and GPS outline check
        if (!loc.rawCityCode) {
            if (loc.latLng?.lat) {
                if (isGPSOutline(loc.latLng)) return true;
            } else {
                return true; // No GPS coords and not resolved -> treat as outline
            }
        }

        return false;
    };

    const hasOutlineProvince = allLocations.some(isLocationOutline);

    // ─── STEP 3: Resolve final city codes (fallback after outline check) ─────────
    // Cross-address fallback: if one side is resolved, propagate it to the other.
    let pickupCityCode = rawPickupCityCode;
    let dropoffCityCode = rawDropoffCityCode;
    if (pickupCityCode && !dropoffCityCode) dropoffCityCode = pickupCityCode;
    if (dropoffCityCode && !pickupCityCode) pickupCityCode = dropoffCityCode;
    // Absolute fallback — only reached for addresses with no GPS and no text match.
    // The outline-province flag above will have already caught most real cases.
    if (!pickupCityCode) pickupCityCode = CITY_CODES.JHB;
    if (!dropoffCityCode) dropoffCityCode = CITY_CODES.JHB;

    // ─── STEP 4: Province text cross-check (fail-safe) ───────────────────────────
    const provinces = ['gauteng', 'western cape', 'kwazulu-natal', 'kzn', 'eastern cape', 'free state', 'limpopo', 'mpumalanga', 'mpumulanga', 'mphumulanga', 'north west', 'northern cape'];
    const getProvince = (addr) => provinces.find(p => addr.includes(p)) || null;
    const pickupProvince = getProvince(pickupAddress);
    const dropoffProvince = getProvince(dropoffAddress);
    const isInterProvincial = pickupProvince && dropoffProvince && pickupProvince !== dropoffProvince;

    // ─── STEP 5: Total Billable Distance ─────────────────────────────────────────
    // Prefer the Google Maps Distance Matrix result (stored as totalBillableDistance).
    // Fallback: use distanceKm + depot legs from tripBreakdown, or a flat 30km estimate.
    const totalDistance = parseFloat(moveDetails.totalBillableDistance) || 
                         ((parseFloat(moveDetails.distanceKm) || 0) + (moveDetails.tripBreakdown 
                             ? (moveDetails.tripBreakdown.depotToPickup || 0) + (moveDetails.tripBreakdown.dropoffToDepot || 0)
                             : 30))

    const hasDifferentCityCode = allLocations.some(loc => {
        const cityCode = loc.rawCityCode || detectCityCode(loc.address, loc.components, loc.latLng);
        return cityCode && cityCode !== pickupCityCode;
    });

    const isNationalMove =
        !hasOutlineProvince && (
            (pickupCityCode && dropoffCityCode && pickupCityCode !== dropoffCityCode) ||
            (isInterProvincial && pickupCityCode !== dropoffCityCode) ||
            (totalDistance > 250 && pickupCityCode !== dropoffCityCode) ||
            (pickupAddress.includes('johannesburg') && dropoffAddress.includes('cape town')) ||
            (pickupAddress.includes('joburg') && dropoffAddress.includes('cape town')) ||
            (pickupAddress.includes('durban') && dropoffAddress.includes('johannesburg')) ||
            (pickupAddress.includes('cape town') && dropoffAddress.includes('johannesburg')) ||
            hasDifferentCityCode
        );

    let nationalDestinationCityCode = dropoffCityCode;
    if (isNationalMove) {
        const sequence = [];
        if (Array.isArray(moveDetails.extraCollections)) {
            moveDetails.extraCollections.forEach(coll => {
                if (coll?.address) {
                    const rawCode = detectCityCode(coll.address, coll.addressComponents, coll.latLng);
                    if (rawCode) sequence.push(rawCode);
                }
            });
        }
        sequence.push(dropoffCityCode);
        if (Array.isArray(moveDetails.extraDrops)) {
            moveDetails.extraDrops.forEach(drop => {
                if (drop?.address) {
                    const rawCode = detectCityCode(drop.address, drop.addressComponents, drop.latLng);
                    if (rawCode) sequence.push(rawCode);
                }
            });
        }
        
        const firstDiff = sequence.find(code => code && code !== pickupCityCode);
        if (firstDiff) {
            nationalDestinationCityCode = firstDiff;
        }
    }

    // ─── STEP 7: Local 80km Depot Rule ───────────────────────────────────────────
    // If this is a local move and either the depot→pickup OR dropoff→depot leg
    // (per Google Maps) exceeds 80 km, we cannot price it — request a quote.
    // We use tripBreakdown (Google Maps legs) when available, otherwise fall back to
    // the haversine distance from the depot coord to the address GPS coords.
    let isDepotOver80 = false;
    if (!isNationalMove) {
        if (moveDetails.tripBreakdown) {
            const { depotToPickup, dropoffToDepot } = moveDetails.tripBreakdown;
            if ((depotToPickup || 0) > 80 || (dropoffToDepot || 0) > 80) {
                isDepotOver80 = true;
            }
        } else {
            // No tripBreakdown yet — use GPS haversine as a conservative estimate.
            const depotCity = pickupCityCode || 'JHB';
            const DEPOT_COORDS_LOCAL = {
                JHB: { lat: -26.2573, lng: 28.1519 },
                DBN: { lat: -29.5444, lng: 31.2174 },
                CPT: { lat: -33.9340, lng: 18.5328 },
            };
            const depot = DEPOT_COORDS_LOCAL[depotCity] || DEPOT_COORDS_LOCAL.JHB;
            if (moveDetails.pickupLatLng?.lat) {
                const d2p = haversineKm(depot.lat, depot.lng, parseFloat(moveDetails.pickupLatLng.lat), parseFloat(moveDetails.pickupLatLng.lng));
                if (d2p > 80) isDepotOver80 = true;
            }
            if (!isDepotOver80 && moveDetails.dropoffLatLng?.lat) {
                const d2d = haversineKm(depot.lat, depot.lng, parseFloat(moveDetails.dropoffLatLng.lat), parseFloat(moveDetails.dropoffLatLng.lng));
                if (d2d > 80) isDepotOver80 = true;
            }
        }
    }

    const needsQuoteRequest = hasOutlineProvince || (!isNationalMove && isDepotOver80)

    const moveProtectionCost = totalVolumeCuFt <= 500 ? 250 : 450

    let transportCost = 0
    let volumeCost = 0
    let vehicleName = ''
    let transportRate = 0
    let volumeRate = 0
    let routeMinCharge = PRICING_CONSTANTS.minOrder || 2600

    if (isNationalMove) {
        // Jose's National logic: Volume-based calculation (volume * ratePerCuFt)
        const routeKey = `${pickupCityCode}-${nationalDestinationCityCode}`
        const nationalRate = NATIONAL_RATES[routeKey]
        
        if (nationalRate) {
            volumeRate = nationalRate.ratePerCuFt
            volumeCost = totalVolumeCuFt * volumeRate
            
            // Apply route-specific min charge (including move protection as part of it)
            routeMinCharge = nationalRate.minCharge || 5000
            transportCost = moveProtectionCost
            
            const currentMoveCost = volumeCost + transportCost
            if (currentMoveCost < routeMinCharge) {
                volumeCost += routeMinCharge - currentMoveCost
            }
        } else {
            // Fallback for undefined routes
            volumeRate = 25
            volumeCost = totalVolumeCuFt * volumeRate
            routeMinCharge = 5000
            transportCost = moveProtectionCost
            
            const currentMoveCost = volumeCost + transportCost
            if (currentMoveCost < routeMinCharge) {
                volumeCost += routeMinCharge - currentMoveCost
            }
        }
        
        // transportCost has moveProtectionCost
        transportRate = 0
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

        // Apply flat minimum charge of R2600 for local moves
        const localMinCharge = PRICING_CONSTANTS.minOrder || 2600
        routeMinCharge = localMinCharge
        
        const currentLocalCost = transportCost + volumeCost
        if (currentLocalCost < localMinCharge) {
            const diff = localMinCharge - currentLocalCost
            volumeCost += diff
        }
        
        // Add move protection cost on top of the local minimum / base move cost
        transportCost += moveProtectionCost
    }

    let accessFees = 0
    let hasShuttle = false
    let longCarryCost = 0
    let shuttleCost = 0
    let detailedAccess = []

    // Additional Costs: Shuttle & Long Carry logic
    const addAccess = (loc, prefix) => {
        if (!loc) return;
        const hasElevator = !!loc?.elevator
        const fl = loc?.floorLevel
        
        if (hasElevator) {
            const flNum = parseInt(fl) || 0
            // Elevator fee only applies from 3rd floor and upwards
            if (flNum >= 3) {
                accessFees += 750
                detailedAccess.push(`${prefix} Elevator (3rd floor+): R750`)
            }
        } else {
            // Enforce staircase surcharges (no lift logged)
            const fl = loc?.floorLevel
            if (fl === 'double_volume') {
                accessFees += 500
                detailedAccess.push(`${prefix} Stairs (Double Volume): R500`)
            } else if (fl === 'multiple_stairs') {
                accessFees += 800
                detailedAccess.push(`${prefix} Stairs (Multiple Flights): R800`)
            } else {
                const flNum = parseInt(fl) || 0
                if (flNum === 2) {
                    accessFees += 450
                    detailedAccess.push(`${prefix} Long Carry Floors (2nd floor): R450`)
                } else if (flNum === 3) {
                    accessFees += 450
                    detailedAccess.push(`${prefix} Long Carry Floors (3rd floor): R450`)
                } else if (flNum === 4) {
                    accessFees += 750
                    detailedAccess.push(`${prefix} Long Carry Floors (4th floor): R750`)
                } else if (flNum >= 5) {
                    accessFees += 950
                    detailedAccess.push(`${prefix} Long Carry Floors (5th+ floor): R950`)
                }
            }
        }

        if (loc?.specialConditions?.hoisting) {
            accessFees += 850
            detailedAccess.push(`${prefix} Hoisting: R850`)
        }

        let locationHasShuttle = false
        // Shuttle: Track if needed — shuttle checkbox, panhandle, weight restriction, or parkingType shuttle
        if (loc?.parkingType === 'shuttle' || loc?.specialConditions?.shuttle || loc?.shuttle || loc?.specialConditions?.panhandle || loc?.specialConditions?.weightRestriction) {
            locationHasShuttle = true
            hasShuttle = true
        }

        // Long Carry / Shuttle based on distance:
        let appliedLongCarryCost = 0

        if (loc?.specialConditions?.longCarry) {
            const dist = parseFloat(loc?.longCarryDistance || loc?.longCarryMeters) || 0
            appliedLongCarryCost = 750
            // Shuttle applied if 90m or greater
            if (dist >= 90) {
                locationHasShuttle = true
                hasShuttle = true
            }
        }

        if (appliedLongCarryCost > 0) {
            longCarryCost += appliedLongCarryCost
            detailedAccess.push(`${prefix} Long Carry from street: R${appliedLongCarryCost}`)
        }
    }

    // Process ALL locations present in accessDetails (origin, destination, extra_coll_*, extra_drop_*)
    Object.entries(accessDetails || {}).forEach(([locKey, loc]) => {
        if (!loc) return;
        let prefix = 'Location';
        if (locKey === 'origin') prefix = 'Origin';
        else if (locKey === 'destination') prefix = 'Dest';
        else if (locKey.startsWith('extra_coll_')) {
            const idx = parseInt(locKey.replace('extra_coll_', '')) || 0;
            prefix = `Pickup #${idx + 2}`;
        } else if (locKey.startsWith('extra_drop_')) {
            const idx = parseInt(locKey.replace('extra_drop_', '')) || 0;
            prefix = `Drop #${idx + 2}`;
        }
        addAccess(loc, prefix);
    });

    if (hasShuttle) {
        shuttleCost = ADDITIONAL_COSTS.shuttle.flatRate
    }

    let additionalCrewCost = 0
    let hasHeavyItems = false

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
    const hasStep2Packaging = moveDetails.packagingOption && moveDetails.packagingOption !== 'none';
    const totalSt7 = boxesConfirmed ? (moveDetails.st7Boxes || 0) : 0
    const totalLinen = boxesConfirmed ? (moveDetails.linenBoxes || 0) : 0
    const totalBoxesOrdered = totalSt7 + totalLinen
    
    if ((hasStep2Packaging && totalBoxesOrdered > 0) || boxQty > 0) {
        const isBoxesOnly = moveDetails.packagingOption === 'boxes_only' || !hasStep2Packaging
        const rates = isBoxesOnly 
            ? PACKAGING_RATES.sendMeBoxesOnly 
            : PACKAGING_RATES.boxesAndPacking
            
        const st7Cost = totalSt7 * rates.st7
        const linenCost = totalLinen * rates.linen
        
        // Apply delivery fee from rates if they explicitly used a packaging service and ordered boxes
        const deliveryFee = hasStep2Packaging ? (rates.deliveryFee || 0) : 0
        
        packagingCost = st7Cost + linenCost + deliveryFee
    }

    const specialWrappingCost = parseFloat(manualServiceCharges?.specialWrapping) || 0

    // Sum all other manual service charges
    let manualServiceChargesTotal = 0
    if (manualServiceCharges) {
        Object.entries(manualServiceCharges).forEach(([key, val]) => {
            if (key !== 'specialWrapping') {
                manualServiceChargesTotal += parseFloat(val) || 0
            }
        })
    }

    // Move Protection is already added to transportCost above
    const standardInsurance = 0 // Hide separate line item

    // All rates are EX-VAT. Build the ex-VAT subtotal first.
    const VAT_RATE = 0.15
    const documentationFee = PRICING_CONSTANTS.documentationFee || 175
    const autoPackagingCost = plasticSleeveCost + wrappingCost

    // Base move cost (transport, volume, access, crew, distance, boxes, insurance, docs)
    // Packaging add-ons are kept separate so they always apply ON TOP of the minimum charge
    let baseCost = transportCost + volumeCost + accessFees + longCarryCost + shuttleCost + additionalCrewCost + extraDistanceFees + packagingCost + manualServiceChargesTotal + standardInsurance + documentationFee

    // Robust day-of-month extractor supporting YYYY-MM-DD, DD/MM/YYYY, YYYY/MM/DD, DD-MM-YYYY, and Date instances
    const getDayOfMonth = (dateVal) => {
        if (!dateVal) return null;
        const str = String(dateVal).split('T')[0].trim();

        if (str.includes('/')) {
            const parts = str.split('/');
            if (parts[0].length === 4) return parseInt(parts[2], 10); // YYYY/MM/DD
            return parseInt(parts[0], 10);                             // DD/MM/YYYY
        }

        if (str.includes('-')) {
            const parts = str.split('-');
            if (parts[0].length === 4) return parseInt(parts[2], 10); // YYYY-MM-DD
            return parseInt(parts[0], 10);                             // DD-MM-YYYY
        }

        const d = new Date(dateVal);
        return !isNaN(d.getTime()) ? d.getDate() : null;
    };

    const moveDay = getDayOfMonth(moveDetails.moveDate);
    // Mid-month special (10% discount) applies ONLY if move date is selected AND day of month is between 5 and 24 inclusive
    const isMidMonthDate = (moveDay !== null && !isNaN(moveDay) && moveDay >= 5 && moveDay <= 24);
    const isMonthEnd = !isMidMonthDate;

    // Check if raw unpadded move transport/volume cost was at or below minimum threshold
    const unpaddedMoveCost = isNationalMove
        ? ((totalVolumeCuFt * (NATIONAL_RATES[`${pickupCityCode}-${dropoffCityCode}`]?.ratePerCuFt || 25)) + moveProtectionCost)
        : ((totalDistance * transportRate) + moveProtectionCost + (totalVolumeCuFt * volumeRate));

    let isMinQuote = (unpaddedMoveCost <= routeMinCharge);

    // MID-MONTH DISCOUNT (10%): Apply ONLY if NOT month-end AND NOT a minimum quote.
    // Minimum quotes get ZERO discount!
    const moveBaseCost = transportCost + volumeCost;
    let exclVatDiscount = 0;

    if (!isMonthEnd && !isMinQuote) {
        exclVatDiscount = moveBaseCost * 0.10;
        // Clamp discount so that moveBaseCost after discount NEVER drops below routeMinCharge
        if ((moveBaseCost - exclVatDiscount) < routeMinCharge) {
            exclVatDiscount = Math.max(0, moveBaseCost - routeMinCharge);
            if (exclVatDiscount === 0) {
                isMinQuote = true;
            }
        }
    } else {
        // Strict enforcement: ZERO discount on minimum quotes
        exclVatDiscount = 0;
        isMinQuote = true;
    }

    let baseAfterDiscount = baseCost - exclVatDiscount;

    // Storage with Master Movers: R1.50 per cubic foot, minimum R450/month (applied when client selects a depot)
    const STORAGE_DEPOTS_VALID = ['JHB', 'DBN', 'CPT']
    const storageDestination = moveDetails.storageDestination || null
    const hasStorage = STORAGE_DEPOTS_VALID.includes(storageDestination)
    const storageCostPerCuFt = 1.50
    const rawStorageCost = Math.round(totalVolumeCuFt * storageCostPerCuFt * 100) / 100
    const minStorageFee = PRICING_CONSTANTS.minStorageFee || 450
    const storageCost = hasStorage ? Math.max(minStorageFee, rawStorageCost) : 0

    // Add packaging add-ons AFTER minimum enforcement so they are never lost
    let exclVatSubTotal = baseAfterDiscount + autoPackagingCost + specialWrappingCost + storageCost
    let exclVatAfterDiscount = exclVatSubTotal

    // Now add 15% VAT to get the final incl-VAT total
    const vatAmount = exclVatAfterDiscount * VAT_RATE
    let total = exclVatAfterDiscount + vatAmount

    // Payflex surcharge (+7%) applied AFTER VAT on the total
    let payflexSurcharge = 0
    if (moveDetails.paymentMethod === 'payflex') {
        payflexSurcharge = total * ADDITIONAL_COSTS.payflex.surcharge
        total = total + payflexSurcharge
    }

    const vat = vatAmount

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
        total: (needsQuoteRequest && !isAdminEdit) ? 0 : total,
        subTotal: (needsQuoteRequest && !isAdminEdit) ? 0 : exclVatAfterDiscount,  // Ex-VAT total after discount & minimums applied
        discount: (needsQuoteRequest && !isAdminEdit) ? 0 : exclVatDiscount,        // Ex-VAT discount amount
        isMonthEnd,
        isMinQuote,
        vat: (needsQuoteRequest && !isAdminEdit) ? 0 : vat,                              // VAT amount (15% of ex-VAT subtotal)
        payflexSurcharge: (needsQuoteRequest && !isAdminEdit) ? 0 : payflexSurcharge,
        paymentMethod: moveDetails.paymentMethod || 'eft',
        totalVolume,
        totalVolumeCuFt,
        boxQty: moveDetails.st7Boxes || 0,
        volumeForVehicle: totalVolumeCuFt,
        isNationalMove,
        needsQuoteRequest,
        packagingCost: packagingCost,
        autoPackagingCost: autoPackagingCost,
        standardInsurance,
        requiresCrateFlag,
        requiresPhotoFlag,
        needsConsultation,
        breakdown: {
            vehicleType: vehicleName,
            transport: transportCost,
            volume: volumeCost,
            access: accessFees,
            detailedAccess: detailedAccess,
            crew: additionalCrewCost,
            extraDistance: extraDistanceFees,
            detailedExtraDistance: detailedExtraDistance.length > 0 ? detailedExtraDistance.join(' | ') : 'No Depot Surcharges',
            packaging: packagingCost,
            wrapping: autoPackagingCost,
            wrappingVolume: wrappingVolume,
            wrappingCost: wrappingCost,
            plasticSleeveCost: plasticSleeveCost,
            plasticSleeveCount: plasticSleeveCount,
            specialWrapping: specialWrappingCost,
            shuttleCost: shuttleCost,
            longCarryCost: longCarryCost,
            standardInsurance: standardInsurance,
            moveProtectionCost: moveProtectionCost,
            storageCost: storageCost,
            storageDestination: storageDestination,
            documentationFee: documentationFee,
            distance: totalDistance,
            transportRate: transportRate,
            volumeRate: volumeRate,
            isSharedLoad: sharedLoadPreference !== null ? sharedLoadPreference : (isNationalMove && totalVolumeCuFt < 850),
            payflexSurcharge,
            paymentMethod: moveDetails.paymentMethod || 'eft',
            discount: exclVatDiscount
        }
    }
}
