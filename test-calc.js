import { calculateQuote } from './src/features/inventory/store/moveStore.js';
import { INVENTORY_ITEMS } from './src/features/inventory/data/mockItems.js';

const inventory = {
    'ottoman': 2,
    'cant_find_address': 1,
    'table-lamp': 1, // assume wrapped?
    'small-table': 1, // assume wrapped?
    'occ-table-small': 1, // assume wrapped?
};

const moveDetails = {
    pickupAddress: "Johannesburg",
    dropoffAddress: "Durban",
    pickupCity: "Johannesburg",
    dropoffCity: "Durban",
    distanceKm: 500,
    totalBillableDistance: 500,
    moveDate: "2026-06-30",
    packagingOption: "none",
    st7Boxes: 0,
    linenBoxes: 0,
    insuranceEnabled: false,
    isSharedLoad: false,
    paymentMethod: "eft"
};

const accessDetails = {
    pickup: { elevator: true }
};

const totals = calculateQuote(inventory, moveDetails, accessDetails, INVENTORY_ITEMS, {});
console.log(totals);
