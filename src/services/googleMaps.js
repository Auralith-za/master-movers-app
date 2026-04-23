/**
 * Google Maps Service
 * Handles distance calculations using the Google Maps Distance Matrix API.
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

export const DEPOT_LOCATIONS = {
    JHB: "17 Indianapolis Blvd, Gosforth Park, Germiston, 1401",
    DBN: "Units 5 & 6 Raddical Park, 3 Gourly Rd, Ballito, 4420",
    CPT: "Unit 1, Bosal Park, 77 Bofors Cir, Epping, Cape Town, 7460"
};

const DEFAULT_DEPOT = DEPOT_LOCATIONS.JHB;

let isLoaded = false;
let loadingPromise = null;

/**
 * loads the Google Maps script dynamically if not already loaded
 */
export const loadGoogleMapsScript = () => {
    // If already loading or loaded, return the existing promise
    if (loadingPromise) return loadingPromise;

    loadingPromise = new Promise((resolve, reject) => {
        // If already loaded globally
        if (window.google && window.google.maps) {
            resolve();
            return;
        }

        if (!GOOGLE_MAPS_API_KEY) {
            loadingPromise = null;
            reject(new Error("Google Maps API Key is missing."));
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            isLoaded = true;
            resolve();
        };
        script.onerror = (err) => {
            loadingPromise = null;
            reject(err);
        };
        document.head.appendChild(script);
    });

    return loadingPromise;
};

/**
 * Calculates distances between points:
 * 1. Depot -> Pickup
 * 2. Pickup -> Dropoff
 * 3. Dropoff -> Depot
 * 
 * Returns breakdown and total distance.
 */
export const calculateTripDistances = async (pickupAddress, dropoffAddress, cityCode = 'JHB') => {
    if (!pickupAddress || !dropoffAddress) {
        throw new Error("Pickup and Dropoff addresses are required.");
    }

    if (!window.google) {
        await loadGoogleMapsScript();
    }

    const service = new window.google.maps.DistanceMatrixService();
    const depotLocation = DEPOT_LOCATIONS[cityCode] || DEFAULT_DEPOT;

    return new Promise((resolve, reject) => {
        service.getDistanceMatrix({
            origins: [depotLocation, pickupAddress, dropoffAddress],
            destinations: [pickupAddress, dropoffAddress, depotLocation],
            travelMode: 'DRIVING',
            unitSystem: window.google.maps.UnitSystem.METRIC,
        }, (response, status) => {
            if (status !== 'OK') {
                reject(new Error(`Distance Matrix failed: ${status}`));
                return;
            }

            // 1. Depot (0) -> Pickup (0)
            const depotToPickupElement = response.rows[0].elements[0];

            // 2. Pickup (1) -> Dropoff (1)
            const pickupToDropoffElement = response.rows[1].elements[1]; 

            // 3. Dropoff (2) -> Depot (2)
            const dropoffToDepotElement = response.rows[2].elements[2];

            const getKm = (element) => {
                if (!element || element.status !== 'OK') return 0;
                return Math.round(element.distance.value / 1000); 
            };

            const breakdown = {
                depotToPickup: getKm(depotToPickupElement),
                pickupToDropoff: getKm(pickupToDropoffElement),
                dropoffToDepot: getKm(dropoffToDepotElement)
            };

            const totalDistance = breakdown.depotToPickup + breakdown.pickupToDropoff + breakdown.dropoffToDepot;

            resolve({
                totalDistance,
                breakdown,
                depotUsed: depotLocation
            });
        });
    });
};
