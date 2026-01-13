import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../../../lib/supabaseClient'

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
                origin: { type: 'house', stairs: false, elevator: false, shuttle: false, longCarry: false },
                destination: { type: 'house', stairs: false, elevator: false, shuttle: false, longCarry: false },
            },
            setAccessDetails: (location, details) =>
                set((state) => ({
                    accessDetails: {
                        ...state.accessDetails,
                        [location]: { ...state.accessDetails[location], ...details }
                    }
                })),

            // Step 3: Inventory
            inventory: {}, // { itemId: quantity }
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
            reset: () => set({ moveDetails: {}, accessDetails: {}, inventory: {} }),

            getTotals: () => {
                const state = get()
                const { inventory, moveDetails, accessDetails } = state
                return { inventory, moveDetails, accessDetails }
            },

            // Async Actions
            submitQuote: async () => {
                const state = get()
                const { inventory, moveDetails, accessDetails } = state

                // Calculate final totals to store
                // We'd typically import the catalog or pass it in. 
                // For now, assuming we trigger this from a component that has the data or we just save raw state.
                // WE SHOULD TRY TO IMPORT CATALOG if possible or just save the raw IDs.
                // Let's save the raw state mostly.

                // Construct the payload matching our planned Supabase schema
                try {
                    // Calculate safe values
                    const safeVolume = calculateQuote(inventory || {}, moveDetails || {}, accessDetails || {}, []).totalVolume || 0
                    const safePrice = calculateQuote(inventory || {}, moveDetails || {}, accessDetails || {}, []).total || 0

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
                        created_at: new Date().toISOString()
                    }

                    console.log("Submitting Quote Payload:", payload)

                    const { data, error } = await supabase
                        .from('quotes')
                        .insert([payload])
                        .select()

                    if (error) {
                        console.error("Supabase Write Error:", error)
                        throw error
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
            name: 'move-storage', // unique name
        }
    )
)

// Pricing Utility
export const calculateQuote = (inventory = {}, moveDetails = {}, accessDetails = {}, catalog = []) => {
    let totalVolume = 0
    Object.entries(inventory || {}).forEach(([id, qty]) => {
        const item = catalog.find(i => i.id === id)
        if (item) totalVolume += item.volume * qty
    })

    // Pricing Constants
    const BASE_RATE = 1500
    const RATE_PER_KM = 15
    const RATE_PER_M3 = 350 // Adjusted real market rate approx

    // Distance Logic (Depot -> Pickup -> Dropoff -> Depot)
    // If we have a breakdown, use it. Otherwise fallback to distanceKm * 2 (rough return trip estimate)
    const { depotToPickup = 0, pickupToDropoff = 0, dropoffToDepot = 0 } = moveDetails?.tripBreakdown || {}

    // If breakdown exists, use sum. Else use distanceKm (which user entered as A->B)
    let totalDistance
    if (moveDetails.tripBreakdown) {
        totalDistance = depotToPickup + pickupToDropoff + dropoffToDepot
    } else {
        // Fallback for legacy state: A->B + 20km depot overhead? Or just A->B?
        // Let's assume A->B is standard, adding 30km for depot runs as default
        totalDistance = (parseFloat(moveDetails.distanceKm) || 0) + 30
    }

    const transportCost = (totalDistance * RATE_PER_KM)
    const volumeCost = (totalVolume * RATE_PER_M3)

    // Access Fees
    let accessFees = 0
    const checkAccess = (loc) => {
        if (loc.elevator) accessFees += 500
        if (loc.stairs) accessFees += 800
        if (loc.longCarry) accessFees += 1000
        if (loc.shuttle) accessFees += 2500
    }

    if (accessDetails?.origin) checkAccess(accessDetails.origin)
    if (accessDetails?.destination) checkAccess(accessDetails.destination)

    const subTotal = BASE_RATE + transportCost + volumeCost + accessFees
    const vat = subTotal * 0.15
    const total = subTotal + vat

    return {
        totalVolume,
        subTotal,
        vat,
        total,
        breakdown: {
            base: BASE_RATE,
            transport: transportCost,
            volume: volumeCost,
            access: accessFees,
            distance: totalDistance
        }
    }
}
