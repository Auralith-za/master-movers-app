/**
 * Google Maps Service
 * Handles distance calculations using the Google Maps Distance Matrix API.
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const DEPOT_LOCATION = "Germiston, South Africa";

let isLoaded = false;

/**
 * loads the Google Maps script dynamically if not already loaded
 */
export const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            isLoaded = true;
            resolve();
            return;
        }

        if (!GOOGLE_MAPS_API_KEY) {
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
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
};

/**
 * Calculates distances between points:
 * 1. Depot -> Pickup
 * 2. Pickup -> Dropoff
 * 3. Dropoff -> Depot
 * 
 * Returns breakdown and total distance.
 */
export const calculateTripDistances = async (pickupAddress, dropoffAddress) => {
    if (!pickupAddress || !dropoffAddress) {
        throw new Error("Pickup and Dropoff addresses are required.");
    }

    if (!window.google) {
        await loadGoogleMapsScript();
    }

    const service = new window.google.maps.DistanceMatrixService();

    // We do this in one batch or separate calls. 
    // Batch: Origins: [Depot, Pickup, Dropoff], Destinations: [Pickup, Dropoff, Depot]
    // But easier to just trace the path: 
    // Leg 1: Depot -> Pickup
    // Leg 2: Pickup -> Dropoff
    // Leg 3: Dropoff -> Depot (Return trip)

    return new Promise((resolve, reject) => {
        service.getDistanceMatrix({
            origins: [DEPOT_LOCATION, pickupAddress, dropoffAddress],
            destinations: [pickupAddress, dropoffAddress, DEPOT_LOCATION],
            travelMode: 'DRIVING',
            unitSystem: window.google.maps.UnitSystem.METRIC,
        }, (response, status) => {
            if (status !== 'OK') {
                reject(new Error(`Distance Matrix failed: ${status}`));
                return;
            }

            // response.rows[originIndex].elements[destIndex]

            // 1. Depot (0) -> Pickup (0)
            const depotToPickupElement = response.rows[0].elements[0];

            // 2. Pickup (1) -> Dropoff (1)
            const pickupToDropoffElement = response.rows[1].elements[1]; // Pickup acts as origin 1, Dropoff is dest 1

            // 3. Dropoff (2) -> Depot (2)
            const dropoffToDepotElement = response.rows[2].elements[2]; // Dropoff origin 2, Depot dest 2

            // Helper to extract value (in km)
            const getKm = (element) => {
                if (element.status !== 'OK') return 0;
                return Math.round(element.distance.value / 1000); // meters to km
            };

            const breakdown = {
                depotToPickup: getKm(depotToPickupElement),
                pickupToDropoff: getKm(pickupToDropoffElement),
                dropoffToDepot: getKm(dropoffToDepotElement)
            };

            const totalDistance = breakdown.depotToPickup + breakdown.pickupToDropoff + breakdown.dropoffToDepot;

            resolve({
                totalDistance,
                breakdown
            });
        });
    });
};
