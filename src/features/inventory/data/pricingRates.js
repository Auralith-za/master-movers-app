/**
 * Updated Pricing Rates based on Spreadsheet (April 2026)
 */

export const CITY_CODES = {
    JHB: 'JHB',
    CPT: 'CPT',
    DBN: 'DBN',
    GR: 'GR'
};

export const NATIONAL_RATES = {
    'JHB-CPT': { ratePerKm: 28.40, minAmount: 6000 },
    'JHB-DBN': { ratePerKm: 15.00 },
    'JHB-GR': { ratePerKm: 30.00 },
    'CPT-JHB': { ratePerKm: 15.00 },
    'CPT-DBN': { ratePerKm: 15.00 },
    'CPT-GR': { ratePerKm: 16.00 },
    'DBN-JHB': { ratePerKm: 13.00 },
    'DBN-CPT': { ratePerKm: 28.40 },
    'DBN-GR': { ratePerKm: 30.00 },
};

export const LOCAL_VEHICLE_RATES = {
    [CITY_CODES.JHB]: [
        { name: 'HYUNDAI', capacityCuFt: 300, ratePerKm: 13.14, ratePerCuFt: 3.26 },
        { name: 'HILUX', capacityCuFt: 300, ratePerKm: 13.69, ratePerCuFt: 3.26 },
        { name: 'DYNA 4', capacityCuFt: 400, ratePerKm: 14.25, ratePerCuFt: 3.26 },
        { name: 'DYNA 6', capacityCuFt: 600, ratePerKm: 14.50, ratePerCuFt: 3.26 },
        { name: 'MB800', capacityCuFt: 700, ratePerKm: 15.95, ratePerCuFt: 3.26 },
        { name: 'ISUZU', capacityCuFt: 900, ratePerKm: 27.07, ratePerCuFt: 3.26 },
        { name: '1213', capacityCuFt: 1100, ratePerKm: 30.94, ratePerCuFt: 3.26 },
        { name: 'DYNA 7', capacityCuFt: 1100, ratePerKm: 30.68, ratePerCuFt: 3.26 },
        { name: 'HINO', capacityCuFt: 1700, ratePerKm: 30.68, ratePerCuFt: 3.26 },
        { name: 'ATEGO', capacityCuFt: 1800, ratePerKm: 29.34, ratePerCuFt: 3.26 },
        { name: '1 LINK TRAILER', capacityCuFt: 2500, ratePerKm: 40.26, ratePerCuFt: 3.26 },
        { name: '41 FT TRAILER', capacityCuFt: 3600, ratePerKm: 40.26, ratePerCuFt: 3.26 },
        { name: 'LINK', capacityCuFt: 5000, ratePerKm: 46.91, ratePerCuFt: 3.26 },
    ],
    [CITY_CODES.CPT]: [
        { name: 'Vehicle 1 (CPT)', capacityCuFt: 300, ratePerKm: 25.48, ratePerCuFt: 3.26 },
        { name: 'Vehicle 2 (CPT)', capacityCuFt: 700, ratePerKm: 23.35, ratePerCuFt: 3.26 },
        { name: 'Large Truck (CPT)', capacityCuFt: 1500, ratePerKm: 39.55, ratePerCuFt: 3.26 },
        { name: 'LINK (CPT)', capacityCuFt: 5000, ratePerKm: 46.91, ratePerCuFt: 3.26 },
    ],
    [CITY_CODES.DBN]: [
        { name: 'Vehicle 1 (DBN)', capacityCuFt: 300, ratePerKm: 15.80, ratePerCuFt: 3.26 },
        { name: 'Vehicle 2 (DBN)', capacityCuFt: 400, ratePerKm: 25.48, ratePerCuFt: 3.26 },
        { name: 'Vehicle 3 (DBN)', capacityCuFt: 600, ratePerKm: 26.37, ratePerCuFt: 3.26 },
        { name: 'Vehicle 4 (DBN)', capacityCuFt: 700, ratePerKm: 23.35, ratePerCuFt: 3.26 },
        { name: 'Vehicle 5 (DBN)', capacityCuFt: 900, ratePerKm: 39.55, ratePerCuFt: 3.26 },
    ],
    [CITY_CODES.GR]: 'NATIONAL', 
};

export const ADDITIONAL_COSTS = {
    shuttle: { ratePerKm: 31 },
    longCarry: { flatRate: 450, thresholdMeters: 30 },
    additionalDriver: { perPerson: 700, includesCrew: 2 },
    insurance: 'contact_sales',
    collectionOver80Km: { ratePerKm: 40 },
    deliveryOver80Km: { ratePerKm: 40 },
};

export const PACKAGING_RATES = {
    sendingBoxesOnly: {
        st7: 59.50,
        linen: 146.00,
        deliveryFee: 220.00
    },
    boxesAndPacking: {
        st7: 146.00,
        linen: 175.00,
        deliveryFee: 220.00
    }
};

export const PRICING_CONSTANTS = {
    minOrder: 2250,
    minKmRadius: 100,
    documentationFee: 175, // Kept from existing code as it wasn't in spreadsheet but likely still applies
    weekendSurcharge: 440, // Kept from existing code
    sharedLoadRate: 38.50, // Kept from existing code/report
};

/**
 * Utility to map a city name (from Google Maps) to a internal city code
 */
export const getCityCode = (cityName) => {
    if (!cityName) return null;
    const name = cityName.toLowerCase();
    
    if (name.includes('johannesburg') || name.includes('sandton') || name.includes('midrand') || name.includes('pretoria') || name.includes('germiston') || name.includes('randburg') || name.includes('roodepoort') || name.includes('benoni') || name.includes('boksburg')) {
        return CITY_CODES.JHB;
    }
    if (name.includes('cape town') || name.includes('bellville') || name.includes('stellenbosch') || name.includes('somerset west') || name.includes('paarl')) {
        return CITY_CODES.CPT;
    }
    if (name.includes('durban') || name.includes('umhlanga') || name.includes('pinetown') || name.includes('amanzimtoti') || name.includes('ballito')) {
        return CITY_CODES.DBN;
    }
    if (name.includes('knysna') || name.includes('george') || name.includes('plettenberg bay') || name.includes('mossel bay') || name.includes('garden route') || name.includes('sedgefield')) {
        return CITY_CODES.GR;
    }
    
    return null;
};
