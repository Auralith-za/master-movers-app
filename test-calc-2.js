import { calculateQuote } from './src/features/inventory/store/moveStore.js';
import { INVENTORY_ITEMS } from './src/features/inventory/data/mockItems.js';

const inventory = {
    'cant_find_address': 1,
    'queen-mattress-bed-base': 1,
};

const moveDetails = {
    pickupAddress: "Riversands Blvd, Riversands, Johannesburg, 1684, South Africa",
    dropoffAddress: "Queen Nandi Dr, Emgidweni, KwaMashu, South Africa",
    distanceKm: 1209,
    totalBillableDistance: 1209,
    moveDate: "2026-06-30",
    packagingOption: "none",
    st7Boxes: 3,
    linenBoxes: 0,
    paymentMethod: "eft"
};

const totals = calculateQuote(inventory, moveDetails, {}, INVENTORY_ITEMS, {}, 0, null, true);
console.log("Total is:", totals.total);
console.log("Breakdown:", totals.breakdown);
