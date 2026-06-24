/**
 * Google Maps Service
 * Handles distance calculations for the Master Movers pricing engine.
 *
 * Strategy:
 *  1. PRIMARY:   Google Maps Distance Matrix API — real driving distances on actual roads.
 *                Used whenever Google Places autocomplete has been used (placeId or latLng available).
 *  2. FALLBACK:  Haversine formula × 1.35 road factor — used ONLY if Distance Matrix fails or
 *                no valid coordinates/placeIds are available.
 *
 * Trip calculation = Depot → Pickup → Dropoff → Depot (full billable circuit).
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Verified depot addresses (physical locations used for dispatch).
 */
export const DEPOT_LOCATIONS = {
    JHB: "17 Indianapolis Blvd, Gosforth Park, Germiston, 1401",
    DBN: "Units 5 & 6 Raddical Park, 3 Gourly Rd, Ballito, 4420",
    CPT: "Unit 1, Bosal Park, 77 Bofors Cir, Epping, Cape Town, 7460"
};

/**
 * Verified lat/lng coordinates for each depot.
 * These are precise geocoded coordinates for the actual depot physical addresses.
 * Used in Haversine fallback calculations.
 */
const DEPOT_COORDS = {
    JHB: { lat: -26.2573, lng: 28.1519 }, // 17 Indianapolis Blvd, Gosforth Park, Germiston
    DBN: { lat: -29.5444, lng: 31.2174 }, // 3 Gourly Rd, Ballito
    CPT: { lat: -33.9340, lng: 18.5328 }, // 77 Bofors Cir, Epping Industrial
};

const DEFAULT_CITY_CODE = 'JHB';

let loadingPromise = null;

/**
 * Loads the Google Maps script dynamically if not already loaded.
 */
export const loadGoogleMapsScript = () => {
    if (loadingPromise) return loadingPromise;

    loadingPromise = new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            resolve();
            return;
        }

        if (!GOOGLE_MAPS_API_KEY) {
            loadingPromise = null;
            reject(new Error("Google Maps API Key is missing. Add VITE_GOOGLE_MAPS_API_KEY to your .env file."));
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = (err) => {
            loadingPromise = null;
            reject(err);
        };
        document.head.appendChild(script);
    });

    return loadingPromise;
};

/**
 * Haversine formula — calculates straight-line distance between two lat/lng points (in km).
 * NOTE: This is only used as a fallback when the Distance Matrix API is unavailable.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = (deg) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Road factor applied to Haversine straight-line distance to estimate actual road distance.
 * 1.40 = 40% longer than straight line (conservative estimate for SA urban roads).
 * Used ONLY in the Haversine fallback path.
 */
const ROAD_FACTOR = 1.40;

/**
 * FALLBACK: Calculate trip distances using lat/lng coordinates (Haversine + road factor).
 * This does NOT require the Distance Matrix API.
 * 
 * Route: Depot → Pickup → Dropoff → Depot
 */
function calculateFromCoords(pickupCoords, dropoffCoords, cityCode = 'JHB') {
    const depotCoords = DEPOT_COORDS[cityCode] || DEPOT_COORDS.JHB;

    const depotToPickupStraight = haversineKm(
        depotCoords.lat, depotCoords.lng,
        pickupCoords.lat, pickupCoords.lng
    );
    const pickupToDropoffStraight = haversineKm(
        pickupCoords.lat, pickupCoords.lng,
        dropoffCoords.lat, dropoffCoords.lng
    );
    const dropoffToDepotStraight = haversineKm(
        dropoffCoords.lat, dropoffCoords.lng,
        depotCoords.lat, depotCoords.lng
    );

    const breakdown = {
        depotToPickup: Math.round(depotToPickupStraight * ROAD_FACTOR),
        pickupToDropoff: Math.round(pickupToDropoffStraight * ROAD_FACTOR),
        dropoffToDepot: Math.round(dropoffToDepotStraight * ROAD_FACTOR),
    };

    const totalDistance = breakdown.depotToPickup + breakdown.pickupToDropoff + breakdown.dropoffToDepot;

    return {
        totalDistance,
        breakdown,
        depotUsed: DEPOT_LOCATIONS[cityCode] || DEPOT_LOCATIONS.JHB,
        method: 'haversine_fallback'
    };
}

/**
 * PRIMARY: Calculate trip distances using the Distance Matrix API.
 * Returns REAL driving distances on actual roads.
 *
 * Route: Depot → Pickup → Dropoff → Depot (3 separate legs in one API call)
 *
 * @param {string} pickupAddress  - Text address for pickup
 * @param {string} dropoffAddress - Text address for dropoff
 * @param {object|null} pickupRef  - { placeId, latLng } from Places autocomplete
 * @param {object|null} dropoffRef - { placeId, latLng } from Places autocomplete
 * @param {string} cityCode        - JHB | DBN | CPT
 */
function calculateFromDistanceMatrix(pickupAddress, dropoffAddress, pickupRef, dropoffRef, cityCode) {
    return new Promise(async (resolve, reject) => {
        if (!window.google) {
            try {
                await loadGoogleMapsScript();
            } catch (e) {
                reject(e);
                return;
            }
        }

        const service = new window.google.maps.DistanceMatrixService();
        const depotAddress = DEPOT_LOCATIONS[cityCode] || DEPOT_LOCATIONS.JHB;

        /**
         * Build the most accurate reference for each point.
         * Priority: latLng object > placeId > text address string.
         */
        const buildRef = (ref, textFallback) => {
            if (ref?.latLng) {
                return new window.google.maps.LatLng(ref.latLng.lat, ref.latLng.lng);
            }
            if (ref?.placeId) {
                return { placeId: ref.placeId };
            }
            return textFallback;
        };

        const pickupOrigin = buildRef(pickupRef, pickupAddress);
        const dropoffDest = buildRef(dropoffRef, dropoffAddress);

        /**
         * We make a single Distance Matrix call with 3 origins and 3 destinations.
         * This gives us all 3 legs of the trip in one API call:
         *   - Row 0 (depot)   → Col 0 (pickup)   = depotToPickup
         *   - Row 1 (pickup)  → Col 1 (dropoff)  = pickupToDropoff
         *   - Row 2 (dropoff) → Col 2 (depot)    = dropoffToDepot
         */
        service.getDistanceMatrix({
            origins: [depotAddress, pickupOrigin, dropoffDest],
            destinations: [pickupOrigin, dropoffDest, depotAddress],
            travelMode: 'DRIVING',
            unitSystem: window.google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false,
        }, (response, status) => {
            if (status !== 'OK') {
                console.warn(`[Distance Matrix] API failed with status: ${status}`);
                reject(new Error(`Distance Matrix API returned status: ${status}`));
                return;
            }

            const depotToPickupEl   = response.rows[0]?.elements[0];
            const pickupToDropoffEl = response.rows[1]?.elements[1];
            const dropoffToDepotEl  = response.rows[2]?.elements[2];

            // Validate all 3 legs returned OK
            if (
                !depotToPickupEl   || depotToPickupEl.status   !== 'OK' ||
                !pickupToDropoffEl || pickupToDropoffEl.status !== 'OK' ||
                !dropoffToDepotEl  || dropoffToDepotEl.status  !== 'OK'
            ) {
                console.warn("[Distance Matrix] One or more route legs failed:", {
                    depotToPickup:   depotToPickupEl?.status,
                    pickupToDropoff: pickupToDropoffEl?.status,
                    dropoffToDepot:  dropoffToDepotEl?.status,
                });
                reject(new Error("Google Maps could not find a driving route for one or more legs of this trip."));
                return;
            }

            // Convert metres → km (rounded to nearest whole km)
            const getKm = (el) => Math.round(el.distance.value / 1000);

            const breakdown = {
                depotToPickup:   getKm(depotToPickupEl),
                pickupToDropoff: getKm(pickupToDropoffEl),
                dropoffToDepot:  getKm(dropoffToDepotEl),
            };

            const totalDistance = breakdown.depotToPickup + breakdown.pickupToDropoff + breakdown.dropoffToDepot;

            console.log(`[Distance Matrix] Route: Depot(${depotAddress}) → Pickup → Dropoff → Depot`);
            console.log(`[Distance Matrix] Legs: ${breakdown.depotToPickup}km + ${breakdown.pickupToDropoff}km + ${breakdown.dropoffToDepot}km = ${totalDistance}km total`);

            resolve({
                totalDistance,
                breakdown,
                depotUsed: depotAddress,
                method: 'distance_matrix'
            });
        });
    });
}

/**
 * Main entry point: calculates the full billable trip distance.
 *
 * Full route: Depot → Pickup → Dropoff → Depot
 *
 * STRATEGY:
 *  1. PRIMARY:  Distance Matrix API (real road distances) — used whenever address data is available
 *  2. FALLBACK: Haversine formula × 1.40 — used only if Distance Matrix API call fails
 *
 * @param {string} pickupAddress  - Text address for pickup
 * @param {string} dropoffAddress - Text address for dropoff
 * @param {string} cityCode       - City code: JHB | DBN | CPT
 * @param {object|null} pickupRef  - { placeId, latLng } from Places autocomplete
 * @param {object|null} dropoffRef - { placeId, latLng } from Places autocomplete
 */
export const calculateTripDistances = async (
    pickupAddress,
    dropoffAddress,
    cityCode = 'JHB',
    pickupRef = null,
    dropoffRef = null
) => {
    if (!pickupAddress || !dropoffAddress) {
        throw new Error("Pickup and Dropoff addresses are required.");
    }

    // PRIMARY: Always try Distance Matrix API first for accurate road distances
    console.log("[Distance] Using Distance Matrix API (primary — real road distances).");
    try {
        const result = await calculateFromDistanceMatrix(
            pickupAddress,
            dropoffAddress,
            pickupRef,
            dropoffRef,
            cityCode
        );
        return result;
    } catch (apiError) {
        console.warn("[Distance] Distance Matrix API failed:", apiError.message);
        console.warn("[Distance] Falling back to Haversine estimate.");

        // FALLBACK: Use Haversine only if we have lat/lng coordinates
        const pickupCoords = pickupRef?.latLng;
        const dropoffCoords = dropoffRef?.latLng;

        if (pickupCoords && dropoffCoords) {
            console.log("[Distance] Using Haversine fallback (straight-line × 1.40).");
            return calculateFromCoords(pickupCoords, dropoffCoords, cityCode);
        }

        // No coordinates available at all — re-throw the original API error
        throw new Error(
            "Could not calculate route distance. Please ensure you selected an address from the Google Maps dropdown suggestions."
        );
    }
};
