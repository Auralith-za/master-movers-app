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
const calculateFromDistanceMatrix = async (
    pickupAddress,
    dropoffAddress,
    pickupRef,
    dropoffRef,
    cityCode,
    extraCollections = [],
    extraDrops = []
) => {
    return new Promise(async (resolve, reject) => {
        if (!window.google || !window.google.maps) {
            try {
                await loadGoogleMapsScript();
            } catch (e) {
                reject(e);
                return;
            }
        }

        const service = new window.google.maps.DistanceMatrixService();
        const depotAddress = DEPOT_LOCATIONS[cityCode] || DEPOT_LOCATIONS.JHB;

        const buildRef = (ref, textFallback) => {
            if (ref?.latLng) {
                return new window.google.maps.LatLng(ref.latLng.lat, ref.latLng.lng);
            }
            if (ref?.placeId) {
                return { placeId: ref.placeId };
            }
            return textFallback;
        };

        const origins = [];
        const destinations = [];
        const legLabels = [];

        // Leg 1: Depot -> Primary Pickup
        origins.push(depotAddress);
        const primaryPickupRef = buildRef(pickupRef, pickupAddress);
        destinations.push(primaryPickupRef);
        legLabels.push({ from: 'Depot', to: 'Pickup' });

        let prevRef = primaryPickupRef;
        let prevLabel = 'Pickup';

        // Extra Collections
        if (Array.isArray(extraCollections)) {
            extraCollections.forEach((coll, idx) => {
                if (!coll?.address) return;
                const collRef = buildRef(coll, coll.address);
                origins.push(prevRef);
                destinations.push(collRef);
                const label = `Collection #${idx + 2}`;
                legLabels.push({ from: prevLabel, to: label });
                prevRef = collRef;
                prevLabel = label;
            });
        }

        // Primary Dropoff
        const primaryDropoffRef = buildRef(dropoffRef, dropoffAddress);
        origins.push(prevRef);
        destinations.push(primaryDropoffRef);
        legLabels.push({ from: prevLabel, to: 'Dropoff' });
        prevRef = primaryDropoffRef;
        prevLabel = 'Dropoff';

        // Extra Drops
        if (Array.isArray(extraDrops)) {
            extraDrops.forEach((drop, idx) => {
                if (!drop?.address) return;
                const dropRef = buildRef(drop, drop.address);
                origins.push(prevRef);
                destinations.push(dropRef);
                const label = `Drop-off #${idx + 2}`;
                legLabels.push({ from: prevLabel, to: label });
                prevRef = dropRef;
                prevLabel = label;
            });
        }

        // Final Leg: Last Drop -> Depot
        origins.push(prevRef);
        destinations.push(depotAddress);
        legLabels.push({ from: prevLabel, to: 'Depot' });

        service.getDistanceMatrix({
            origins,
            destinations,
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

            const detailedLegs = [];
            let totalDistance = 0;
            let legFailed = false;

            origins.forEach((_, idx) => {
                const element = response.rows[idx]?.elements[idx];
                if (!element || element.status !== 'OK') {
                    legFailed = true;
                } else {
                    const km = Math.round(element.distance.value / 1000);
                    totalDistance += km;
                    detailedLegs.push({
                        from: legLabels[idx].from,
                        to: legLabels[idx].to,
                        label: `${legLabels[idx].from} → ${legLabels[idx].to}`,
                        km
                    });
                }
            });

            if (legFailed || detailedLegs.length === 0) {
                console.warn("[Distance Matrix] One or more route legs failed");
                reject(new Error("Google Maps could not find a driving route for one or more legs of this trip."));
                return;
            }

            const depotToPickup = detailedLegs[0]?.km || 0;
            const dropoffToDepot = detailedLegs[detailedLegs.length - 1]?.km || 0;
            const pickupToDropoff = detailedLegs.slice(1, -1).reduce((sum, leg) => sum + leg.km, 0);

            const breakdown = {
                depotToPickup,
                pickupToDropoff,
                dropoffToDepot,
                detailedLegs
            };

            console.log(`[Distance Matrix] Total Billable Distance: ${totalDistance}km across ${detailedLegs.length} legs`);

            resolve({
                totalDistance,
                breakdown,
                depotUsed: depotAddress,
                method: 'distance_matrix'
            });
        });
    });
};

/**
 * Main entry point: calculates the full billable trip distance.
 */
export const calculateTripDistances = async (
    pickupAddress,
    dropoffAddress,
    cityCode = 'JHB',
    pickupRef = null,
    dropoffRef = null,
    extraCollections = [],
    extraDrops = []
) => {
    if (!pickupAddress || !dropoffAddress) {
        throw new Error("Pickup and Dropoff addresses are required.");
    }

    console.log("[Distance] Using Distance Matrix API for all trip legs.");
    try {
        const result = await calculateFromDistanceMatrix(
            pickupAddress,
            dropoffAddress,
            pickupRef,
            dropoffRef,
            cityCode,
            extraCollections,
            extraDrops
        );
        return result;
    } catch (apiError) {
        console.warn("[Distance] Distance Matrix API failed:", apiError.message);

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
