import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../../../lib/supabaseClient'
import { SORTED_VEHICLE_RATES } from '../data/vehicleRates'

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
                contactPhone: '',
                contactEmail: '',
            },
            setMoveDetails: (details) =>
                set((state) => ({
                    moveDetails: { ...state.moveDetails, ...details }
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
                    distanceFromDoor: '<10m', // <10m, 10-30m, >30m
                    parkingType: 'driveway', // driveway, street, secure_complex, loading_bay
                    permitRequired: false,
                    specialConditions: {
                        narrowPassage: false,
                        lowCeiling: false,
                        steepDriveway: false,
                        securityGate: false
                    },
                    notes: ''
                },
                destination: {
                    type: 'house',
                    floorLevel: 0,
                    elevator: false,
                    stairs: false,
                    shuttle: false,
                    longCarry: false,
                    distanceFromDoor: '<10m',
                    parkingType: 'driveway',
                    permitRequired: false,
                    specialConditions: {
                        narrowPassage: false,
                        lowCeiling: false,
                        steepDriveway: false,
                        securityGate: false
                    },
                    notes: ''
                },
                timing: {
                    preferredTime: 'flexible', // morning, afternoon, flexible
                    weekendNeeded: false,
                    securityBookingRequired: false
                }
            },
            setAccessDetails: (location, details) =>
                set((state) => {
                    // unexpected location 'timing' handled at root of accessDetails
                    if (location === 'timing') {
                        return {
                            accessDetails: {
                                ...state.accessDetails,
                                timing: { ...state.accessDetails.timing, ...details }
                            }
                        }
                    }

                    // Special handling for deep merging specialConditions if present
                    let updatedSpecifics = { ...details }
                    if (details.specialConditions) {
                        updatedSpecifics.specialConditions = {
                            ...state.accessDetails[location].specialConditions,
                            ...details.specialConditions
                        }
                    }

                    return {
                        accessDetails: {
                            ...state.accessDetails,
                            [location]: { ...state.accessDetails[location], ...updatedSpecifics }
                        }
                    }
                }),

            // Step 3: Inventory
            inventory: {}, // { itemId: quantity }
            manualServiceCharges: {},
            addItem: (itemId) =>
                set((state) => ({
                    inventory: { ...state.inventory, [itemId]: (state.inventory[itemId] || 0) + 1 }
                })),
            removeItem: (itemId) =>
                set((state) => {
                    const newInventory = { ...state.inventory }
                    if (newInventory[itemId] > 1) {
                        newInventory[itemId] -= 1
                    } else {
                        delete newInventory[itemId]
                    }
                    return { inventory: newInventory }
                }),

            // Computed helpers (would normally be selectors)
            reset: () => set({ moveDetails: {}, accessDetails: {}, inventory: {}, manualServiceCharges: {} }),
            clearInventory: () => set((state) => ({ inventory: {} })),
            updateManualServiceCharge: (key, value) => set((state) => ({
                manualServiceCharges: { ...state.manualServiceCharges, [key]: value }
            })),

            getTotals: () => {
                const state = get()
                const { inventory, moveDetails, accessDetails } = state
                return { inventory, moveDetails, accessDetails }
            },

            // Async Actions
            submitQuote: async (extraPayload = {}) => {
                const state = get()
                const { inventory, moveDetails, accessDetails } = state

                // Calculate final totals to store
                // We'd typically import the catalog or pass it in. 
                // For now, assuming we trigger this from a component that has the data or we just save raw state.
                // WE SHOULD TRY TO IMPORT CATALOG if possible or just save the raw IDs.
                // Let's save the raw state mostly.

                // Construct the payload matching our planned Supabase schema
                try {
                    let inventoryItems = []
                    try {
                        const module = await import('../data/mockItems')
                        inventoryItems = module.INVENTORY_ITEMS || []
                    } catch (e) {
                        console.warn("Could not load inventory items for calculation, using empty catalog", e)
                    }

                    const calculation = calculateQuote(inventory || {}, moveDetails || {}, accessDetails || {}, inventoryItems)
                    const safeVolume = calculation.totalVolume || 0
                    const safePrice = calculation.total || 0

                    const payload = {
                        client_name: moveDetails.contactName || '',
                        client_email: moveDetails.contactEmail || '',
                        client_phone: moveDetails.contactPhone || '',
                        pickup_address: moveDetails.pickupAddress || '',
                        dropoff_address: moveDetails.dropoffAddress || '',
                        move_date: moveDetails.moveDate || new Date().toISOString(),
                        status: 'new',
                        distance_km: moveDetails.distanceKm || 0,
                        items_json: inventory || {},
                        access_details: accessDetails || {},
                        trip_breakdown: moveDetails.tripBreakdown || null,
                        total_volume: safeVolume,
                        total_price: safePrice,
                        vehicle_type: calculation.breakdown?.vehicleType || 'Unknown',
                        created_at: new Date().toISOString(),
                        ...extraPayload // Merge in any extra fields like request_call_back
                    }

                    console.log("Submitting Quote Payload:", payload)

                    const { data, error } = await supabase
                        .from('quotes')
                        .insert([payload])
                        .select()

                    if (error) {
                        console.error("Supabase Write Error:", error)
                        throw error // Fail loudly if live connection fails
                    }

                    return { success: true, data }
                } catch (error) {
                    console.error('Error submitting quote:', error)
                    return { success: false, error }
                }
            },

            sendWhatsAppNotification: async (quoteId, phone, templateName, params = []) => {
                try {
                    // Invoke Supabase Edge Function
                    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
                        body: {
                            phone,
                            template_name: templateName,
                            parameters: params
                        }
                    })

                    if (error) throw error
                    return { success: true, data }
                } catch (error) {
                    console.error('Error sending WhatsApp:', error)
                    // If function fails (e.g. 404 not deployed), return mock success for UI demo
                    return { success: false, error, mock: true }
                }
            }
        }),
        {
            name: 'master-movers-storage',
            partialize: (state) => ({
                moveDetails: state.moveDetails,
                accessDetails: state.accessDetails,
                inventory: state.inventory,
                vehicle: state.vehicle,
                manualServiceCharges: state.manualServiceCharges
            })
        }
    )
)

// Pricing Utility
export const calculateQuote = (inventory = {}, moveDetails = {}, accessDetails = {}, catalog = [], manualServiceCharges = {}) => {
    let totalVolume = 0 // in m3
    Object.entries(inventory || {}).forEach(([id, qty]) => {
        const item = catalog.find(i => i.id === id)
        if (item) totalVolume += item.volume * qty
    })

    // Convert Volume to Cubic Feet for Vehicle Selection
    const totalVolumeCuFt = totalVolume * 35.315

    // Select Vehicle
    // Find the first vehicle that fits the volume
    let vehicle = SORTED_VEHICLE_RATES.find(v => v.capacityCuFt >= totalVolumeCuFt)

    // If volume is larger than largest vehicle, use the largest one (or we could stack them, but simplest is to just max out rate)
    if (!vehicle) {
        vehicle = SORTED_VEHICLE_RATES[SORTED_VEHICLE_RATES.length - 1]
    }

    // Fallback if no vehicle found (shouldn't happen with valid list)
    if (!vehicle) {
        vehicle = { name: 'Standard', ratePerKm: 15, ratePerCuFt: 3.5 }
    }

    // Distance Logic (Depot -> Pickup -> Dropoff -> Depot)
    const { depotToPickup = 0, pickupToDropoff = 0, dropoffToDepot = 0 } = moveDetails?.tripBreakdown || {}

    // --- Long Distance & Shared Load Logic ---
    let totalDistance = 0
    let transportCost = 0
    let volumeCost = 0
    let isSharedLoad = false

    // Determine one-way distance (approx)
    const oneWayDist = moveDetails.tripBreakdown?.pickupToDropoff || parseFloat(moveDetails.distanceKm) || 0

    // Check for Long Distance Shared Load
    // Criteria: > 200km AND < 850 cu ft (approx ~24 m3, half truck)
    if (oneWayDist > 200 && totalVolumeCuFt < 850) {
        isSharedLoad = true
        // For Shared Load, we display one-way distance
        totalDistance = oneWayDist

        // Pricing based on VOLUME only for shared loads (derived from historical R6600 quote)
        // Rate: ~R 38.50 per cu ft covers the transport
        const sharedLoadRate = 38.50
        transportCost = totalVolumeCuFt * sharedLoadRate

        // Volume cost is effectively 0 because it's built into the transport rate
        volumeCost = 0
    } else {
        // Standard / Dedicated Load Logic
        if (moveDetails.tripBreakdown) {
            totalDistance = depotToPickup + pickupToDropoff + dropoffToDepot
        } else {
            // Fallback: A->B + 30km overhead
            totalDistance = (parseFloat(moveDetails.distanceKm) || 0) + 30
        }

        transportCost = (totalDistance * vehicle.ratePerKm)
        volumeCost = (totalVolumeCuFt * vehicle.ratePerCuFt)

        // Enforce Local Minimum Charge (R3025.00)
        // Applies to combined Transport + Volume costs
        const MIN_LOCAL_CHARGE = 3025
        const combinedCost = transportCost + volumeCost
        if (combinedCost < MIN_LOCAL_CHARGE && combinedCost > 0) {
            // Increase transport cost to meet the minimum
            transportCost = MIN_LOCAL_CHARGE - volumeCost
        }
    }

    // Access Fees
    let accessFees = 0
    const checkAccess = (loc) => {
        if (loc.elevator) accessFees += 300
        if (loc.stairs) accessFees += (loc.floorLevel || 0) * 200  // R200 per floor
        if (loc.longCarry) accessFees += 500
        if (loc.shuttle) accessFees += 1500
    }

    if (accessDetails?.origin) checkAccess(accessDetails.origin)
    if (accessDetails?.destination) checkAccess(accessDetails.destination)

    // Get move date for service charge and discount calculations
    const moveDateStr = moveDetails.moveDate

    // Service Charges (based on Master Movers pricing structure)
    let serviceCharges = 0

    // 1. Documentation Fee (always applied, unless overridden)
    const documentationFee = manualServiceCharges.documentationFee !== undefined
        ? Number(manualServiceCharges.documentationFee)
        : 175
    serviceCharges += documentationFee

    // 2. Weekend/Holiday Surcharge (Saturday or Sunday)
    let weekendSurcharge = 0
    if (manualServiceCharges.weekendSurcharge !== undefined) {
        weekendSurcharge = Number(manualServiceCharges.weekendSurcharge)
        serviceCharges += weekendSurcharge
    } else if (moveDateStr) {
        const date = new Date(moveDateStr)
        const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekendSurcharge = 440
            serviceCharges += weekendSurcharge
        }
    }

    // 3. Packing Materials
    const packingMaterials = accessDetails?.packingMaterials || 0
    serviceCharges += packingMaterials

    // 4. Other Manual Service Charges
    Object.entries(manualServiceCharges).forEach(([key, val]) => {
        if (key !== 'documentationFee' && key !== 'weekendSurcharge') {
            serviceCharges += (Number(val) || 0)
        }
    })

    // Define Subtotal (Base rate before discount/vat)
    const subTotal = transportCost + volumeCost + accessFees + serviceCharges

    // Check for Mid-Month Discount (5th - 24th)
    let discount = 0
    let discountType = null
    if (moveDateStr) {
        const date = new Date(moveDateStr)
        const day = date.getDate()
        // Check if day is between 5 and 24 (inclusive)
        if (day >= 5 && day <= 24) {
            discount = subTotal * 0.10 // 10% off subTotal
            discountType = 'Mid-Month Madness (10%)'
        }
    }

    const subTotalAfterDiscount = subTotal - discount
    const vat = subTotalAfterDiscount * 0.15
    const total = subTotalAfterDiscount + vat

    return {
        totalVolume, // Return original m3 for display
        totalVolumeCuFt, // Useful for debugging
        subTotal,
        discount,
        discountType,
        vat,
        total,
        breakdown: {
            vehicleType: isSharedLoad ? 'Shared Load' : vehicle.name,
            isSharedLoad,
            base: 0, // No longer using fixed base rate
            transport: transportCost,
            volume: volumeCost,
            access: accessFees,
            serviceCharges: serviceCharges,
            documentationFee: documentationFee,
            weekendSurcharge: weekendSurcharge,
            packingMaterials: packingMaterials,
            distance: totalDistance
        }
    }
}
