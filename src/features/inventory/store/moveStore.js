import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../../../lib/supabaseClient'
import { INVENTORY_ITEMS } from '../data/mockItems'
import { 
    CITY_CODES, 
    NATIONAL_RATES, 
    LOCAL_VEHICLE_RATES, 
    ADDITIONAL_COSTS, 
    PACKAGING_RATES, 
    PRICING_CONSTANTS, 
    getCityCode,
    detectCityCode
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
                    moveDetails: { 
                        ...state.moveDetails, 
                        packagingOption: option,
                        // Always reset box quantities when switching packaging option
                        // This prevents stale persisted values from showing phantom costs
                        st7Boxes: 0,
                        linenBoxes: 0
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

                const quotePayload = {
                    client_name: dbOverrides.client_name || overrides.contactName || state.moveDetails.contactName || 'Anonymous',
                    client_email: dbOverrides.client_email || overrides.contactEmail || state.moveDetails.contactEmail || '',
                    client_phone: dbOverrides.client_phone || overrides.contactPhone || state.moveDetails.contactPhone || '',
                    pickup_address: dbOverrides.pickup_address || state.moveDetails.pickupAddress || 'Address Not Provided',
                    dropoff_address: dbOverrides.dropoff_address || state.moveDetails.dropoffAddress || 'Address Not Provided',
                    distance_km: Number(dbOverrides.distance_km || state.moveDetails.distanceKm || 0),
                    move_date: (dbOverrides.move_date || state.moveDetails.moveDate || new Date().toISOString()).split('T')[0],
                    items_json: { ...(state.inventory || {}) },
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

export const getPlasticSleevesCount = (item, idKey) => {
    if (!item) return 0;
    const itemId = (item.id || '').toLowerCase()
    const name = (item.name || '').toLowerCase()
    const variation = (idKey || '').includes('_') ? idKey.split('_').slice(1).join('_').toLowerCase() : ''
        
        const isKing = itemId.includes('king') || name.includes('king') || variation.includes('king')
        const isBedOrMattressOrBase = itemId.includes('bed') || name.includes('bed') || 
                                      itemId.includes('mattress') || name.includes('mattress') || 
                                      itemId.includes('futon') || name.includes('futon')
        
        if (isBedOrMattressOrBase) {
            return isKing ? 4 : 2
        }
        
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
        
        const isReclinerOrPoofOrLounger = (itemId.includes('recliner') || name.includes('recliner') ||
                                          itemId.includes('lounger') || name.includes('lounger') ||
                                          itemId.includes('chaise') || name.includes('chaise') ||
                                          itemId.includes('armchair') || name.includes('armchair') ||
                                          itemId.includes('daybed') || name.includes('daybed')) &&
                                          !itemId.includes('pool') && !name.includes('pool')
                                          
        if (isReclinerOrPoofOrLounger) {
            return 1
        }
        
        if (item.autoPackagingType === 'Plastic Covers') {
            return 1
        }
        
        if (idKey.endsWith('_Plastic Sleeve') || idKey.includes('_Plastic Sleeve_')) {
            return 1
        }
        
    return 0
}

export const getWrappingFlag = (item, variation) => {
    if (!item) return false;
    const isGlassOrMarble = variation === 'Glass' || variation === 'Marble'
    return isGlassOrMarble || variation?.includes('Wrapped')
}

export const calculateQuote = (inventory, moveDetails, accessDetails, items = INVENTORY_ITEMS, manualServiceCharges = {}, extraVolumeCuFt = 0, specialWrappingOverrides = null, isAdminEdit = false) => {
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
        const [itemId] = idKey.split('_')
        const variation = idKey.includes('_') ? idKey.split('_').slice(1).join('_') : null
        const item = items.find(i => i.id === itemId)
        if (item) {
            // All inventory items add to volume (including self-supplied boxes)
            totalVolume += item.volume * qty

            
            let sleeves = getPlasticSleevesCount(item, idKey)
            
            // Wrapping only applies when:
            //  - Item has autoPackagingType = 'Wrapping' AND no variation selected (no material choice)
            //  - OR the selected variation is specifically Glass or Marble
            // Standard Wood/Other = no wrapping cost.
            let appliesWrapping = getWrappingFlag(item, variation)

            // Apply overrides if any
            if (specialWrappingOverrides && specialWrappingOverrides[idKey]) {
                const override = specialWrappingOverrides[idKey]
                if (override.sleeves !== undefined) sleeves = override.sleeves
                if (override.wrap !== undefined) appliesWrapping = override.wrap
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

    // Add volume for ordered boxes
    const orderedSt7Volume = (moveDetails.st7Boxes || 0) * 4
    const orderedLinenVolume = (moveDetails.linenBoxes || 0) * 7
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
    // These are the SA provinces we do NOT serve with a live price.
    // NOTE: Eastern Cape is NOT in this list — it is a served national route (GR code).
    const outlineProvinces = [
        'free state', 'limpopo', 'mpumalanga', 'north west', 'northern cape',
        'mpumulanga', 'mphumulanga',
        'potchefstroom', 'klerksdorp', 'rustenburg', 
        'bloemfontein', 'polokwane', 'nelspruit', 'mbombela', 
        'kimberley', 'upington'
    ];

    const checkComponentsForOutline = (components) => {
        if (!components || !Array.isArray(components)) return false;
        return components.some(c => {
            const name = (c.long_name || c.short_name || '').toLowerCase().trim();
            return outlineProvinces.some(prov => name === prov || name.includes(prov));
        });
    };

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

    // Returns true when GPS coords are present but the point sits outside all 3 depot
    // metro radii AND is not in the Eastern Cape / GR region (which IS served nationally).
    // GR coords: Gqeberha ~(-33.96, 25.60), George ~(-33.96, 22.45)
    const isGPSOutline = (latLng) => {
        if (!latLng || !latLng.lat || !latLng.lng) return false;
        const lat = parseFloat(latLng.lat);
        const lng = parseFloat(latLng.lng);
        if (isNaN(lat) || isNaN(lng)) return false;
        const distToJhb = haversineKm(lat, lng, -26.2573, 28.1519);
        const distToDbn = haversineKm(lat, lng, -29.5444, 31.2174);
        const distToCpt = haversineKm(lat, lng, -33.9340, 18.5328);
        // Check if it resolves to a GR city code (Eastern Cape / Garden Route — nationally served)
        const resolvedCode = detectCityCode(null, null, latLng);
        if (resolvedCode === CITY_CODES.GR) return false;
        return distToJhb > 150 && distToDbn > 150 && distToCpt > 150;
    };

    // Text-based outline province detection (address string or components)
    const textIsOutline = [pickupAddress, dropoffAddress].some(addr =>
        outlineProvinces.some(prov => addr.toLowerCase().includes(prov))
    );
    const componentsIsOutline =
        checkComponentsForOutline(moveDetails.pickupAddressComponents) ||
        checkComponentsForOutline(moveDetails.dropoffAddressComponents);

    // GPS-based outline detection (only run if text didn't resolve a city)
    const gpsIsOutline =
        (!rawPickupCityCode && isGPSOutline(moveDetails.pickupLatLng)) ||
        (!rawDropoffCityCode && isGPSOutline(moveDetails.dropoffLatLng));

    // An address is "unresolved" if detectCityCode returned null (not a known hub)
    // AND it either has GPS coordinates placing it outside all hubs, OR it is entirely
    // missing GPS coordinates (meaning the user typed an unknown town and bypassed Google Maps).
    const pickupUnresolved = !rawPickupCityCode && (!moveDetails.pickupLatLng || isGPSOutline(moveDetails.pickupLatLng));
    const dropoffUnresolved = !rawDropoffCityCode && (!moveDetails.dropoffLatLng || isGPSOutline(moveDetails.dropoffLatLng));

    // NOTE: GR city code (Eastern Cape) is intentionally excluded from this check —
    // those routes have defined national rates and should be priced, not quote-requested.
    const hasOutlineProvince =
        textIsOutline ||
        componentsIsOutline ||
        gpsIsOutline ||
        pickupUnresolved ||
        dropoffUnresolved;

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

    // ─── STEP 6: National Move Detection ─────────────────────────────────────────
    // A move is national when it crosses between our three served city depots.
    // Note: outline province moves are caught by hasOutlineProvince — they are NOT
    // priced as national (we have no national rates for those routes).
    const isNationalMove =
        !hasOutlineProvince && (
            (pickupCityCode && dropoffCityCode && pickupCityCode !== dropoffCityCode) ||
            isInterProvincial ||
            (totalDistance > 250) ||
            (pickupAddress.includes('johannesburg') && dropoffAddress.includes('cape town')) ||
            (pickupAddress.includes('joburg') && dropoffAddress.includes('cape town')) ||
            (pickupAddress.includes('durban') && dropoffAddress.includes('johannesburg')) ||
            (pickupAddress.includes('cape town') && dropoffAddress.includes('johannesburg'))
        );

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

    let transportCost = 0
    let volumeCost = 0
    let vehicleName = ''
    let transportRate = 0
    let volumeRate = 0

    if (isNationalMove) {
        // Jose's National logic: Volume-based calculation (volume * ratePerCuFt)
        const routeKey = `${pickupCityCode}-${dropoffCityCode}`
        const nationalRate = NATIONAL_RATES[routeKey]
        
        if (nationalRate) {
            volumeRate = nationalRate.ratePerCuFt
            volumeCost = totalVolumeCuFt * volumeRate
            
            // Apply route-specific min charge
            const minCharge = nationalRate.minCharge || 0
            if (volumeCost < minCharge) {
                volumeCost = minCharge
            }
        } else {
            // Fallback for undefined routes
            volumeRate = 25
            volumeCost = totalVolumeCuFt * volumeRate
            if (volumeCost < 5000) {
                volumeCost = 5000
            }
        }
        
        transportCost = 0 // National has no distance charge in Jose's volume-based mode
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
        const localMinCharge = 2600
        const currentLocalCost = transportCost + volumeCost
        if (currentLocalCost < localMinCharge) {
            const diff = localMinCharge - currentLocalCost
            volumeCost += diff
        }
    }

    let accessFees = 0
    let hasShuttle = false
    let longCarryCost = 0
    let shuttleCost = 0
    let detailedAccess = []

    // Additional Costs: Shuttle & Long Carry logic
    const addAccess = (loc, prefix) => {
        const hasElevator = !!loc?.elevator
        if (hasElevator) {
            accessFees += 300
            detailedAccess.push(`${prefix} Elevator: R300`)
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
                } else if (flNum === 3 || flNum === 4) {
                    accessFees += 750
                    detailedAccess.push(`${prefix} Long Carry Floors (3rd-4th floor): R750`)
                } else if (flNum >= 5) {
                    accessFees += 950
                    detailedAccess.push(`${prefix} Long Carry Floors (5th+ floor): R950`)
                }
            }
        }

        if (loc?.specialConditions?.hoisting) {
            accessFees += 750
            detailedAccess.push(`${prefix} Hoisting: R750`)
        }

        // Shuttle: Track if needed
        if (loc?.parkingType === 'shuttle' || loc?.specialConditions?.shuttle || loc?.shuttle) {
            hasShuttle = true
        }

        // Long Carry / Shuttle based on distance:
        let appliedLongCarryCost = 0


        if (loc?.specialConditions?.longCarry) {
            const dist = parseFloat(loc?.longCarryDistance) || 0
            // Shuttle applied if greater than 60m
            if (dist > 60) {
                hasShuttle = true
            }
            if (dist >= 50 && dist <= 60) {
                if (appliedLongCarryCost < 750) {
                    appliedLongCarryCost = 750
                }
            }
        }

        if (appliedLongCarryCost > 0) {
            accessFees += appliedLongCarryCost
            longCarryCost += appliedLongCarryCost
            detailedAccess.push(`${prefix} Long Carry from street: R${appliedLongCarryCost}`)
        }
    }
    if (accessDetails?.origin) addAccess(accessDetails.origin, 'Origin')
    if (accessDetails?.destination) addAccess(accessDetails.destination, 'Dest')

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
    const totalSt7 = (moveDetails.st7Boxes || 0)
    const totalLinen = (moveDetails.linenBoxes || 0)
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

    // All Risk Insurance: R250
    const standardInsurance = 250

    // All rates are EX-VAT. Build the ex-VAT subtotal first.
    const VAT_RATE = 0.15
    const documentationFee = PRICING_CONSTANTS.documentationFee || 175
    const autoPackagingCost = plasticSleeveCost + wrappingCost

    // Base move cost (transport, volume, access, crew, distance, boxes, insurance, docs)
    // Packaging add-ons are kept separate so they always apply ON TOP of the minimum charge
    let baseCost = transportCost + volumeCost + accessFees + shuttleCost + additionalCrewCost + extraDistanceFees + packagingCost + manualServiceChargesTotal + standardInsurance + documentationFee

    // Apply mid-month discount (10%) only to the base move cost
    let exclVatDiscount = 0
    if (moveDetails.moveDate) {
        const day = new Date(moveDetails.moveDate).getDate()
        if (day >= 5 && day <= 24) exclVatDiscount = baseCost * 0.10
    }

    let baseAfterDiscount = baseCost - exclVatDiscount

    // Enforce minimum charge on the base (packaging costs always apply on top)
    if (!isNationalMove && baseAfterDiscount < PRICING_CONSTANTS.minOrder) {
        baseAfterDiscount = PRICING_CONSTANTS.minOrder
    }

    // Add packaging add-ons AFTER minimum enforcement so they are never lost
    let exclVatSubTotal = baseAfterDiscount + autoPackagingCost + specialWrappingCost
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
        vat: (needsQuoteRequest && !isAdminEdit) ? 0 : vat,                              // VAT amount (15% of ex-VAT subtotal)
        payflexSurcharge: (needsQuoteRequest && !isAdminEdit) ? 0 : payflexSurcharge,
        paymentMethod: moveDetails.paymentMethod || 'eft',
        totalVolume,
        totalVolumeCuFt,
        boxQty: moveDetails.st7Boxes || 0,
        volumeForVehicle: totalVolumeCuFt,
        isNationalMove,
        needsQuoteRequest,
        packagingCost: packagingCost + autoPackagingCost,
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
            documentationFee: documentationFee,
            distance: totalDistance,
            transportRate: transportRate,
            volumeRate: volumeRate,
            isSharedLoad: sharedLoadPreference !== null ? sharedLoadPreference : (isNationalMove && totalVolumeCuFt < 850),
            payflexSurcharge,
            paymentMethod: moveDetails.paymentMethod || 'eft'
        }
    }
}
