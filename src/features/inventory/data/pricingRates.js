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
    'JHB-CPT': { ratePerKm: 28.40 },
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
        { name: 'Dyna 4', capacityCuFt: 400, ratePerKm: 15.80, ratePerCuFt: 3.26 },
        { name: 'Dyna 6', capacityCuFt: 600, ratePerKm: 16.00, ratePerCuFt: 3.26 },
        { name: 'Mb800', capacityCuFt: 700, ratePerKm: 17.20, ratePerCuFt: 3.26 },
        { name: 'Isuzu', capacityCuFt: 900, ratePerKm: 22.45, ratePerCuFt: 3.26 },
        { name: '1213', capacityCuFt: 1100, ratePerKm: 27.10, ratePerCuFt: 3.26 },
        { name: 'Dyna 7', capacityCuFt: 1100, ratePerKm: 26.90, ratePerCuFt: 3.26 },
        { name: 'Hino', capacityCuFt: 1700, ratePerKm: 26.90, ratePerCuFt: 3.26 },
        { name: 'Atego', capacityCuFt: 1800, ratePerKm: 25.90, ratePerCuFt: 3.26 },
        { name: '41Ft trailer', capacityCuFt: 3600, ratePerKm: 23.35, ratePerCuFt: 3.26 },
        { name: 'Link Trailers x 2', capacityCuFt: 5000, ratePerKm: 39.55, ratePerCuFt: 3.26 },
    ],
    [CITY_CODES.CPT]: [
        { name: 'Hino', capacityCuFt: 1000, ratePerKm: 25.50, ratePerCuFt: 3.26 },
        { name: 'Semi Trailer', capacityCuFt: 1600, ratePerKm: 23.35, ratePerCuFt: 3.26 },
        { name: 'Link Trailer', capacityCuFt: 2500, ratePerKm: 23.35, ratePerCuFt: 3.26 },
        { name: 'Link Trailers x 2', capacityCuFt: 5000, ratePerKm: 39.55, ratePerCuFt: 3.26 },
    ],
    [CITY_CODES.DBN]: [
        { name: 'Dyna 4', capacityCuFt: 300, ratePerKm: 15.80, ratePerCuFt: 3.26 },
        { name: 'Hino 300', capacityCuFt: 1000, ratePerKm: 25.00, ratePerCuFt: 3.26 },
        { name: 'old Hino', capacityCuFt: 1500, ratePerKm: 26.40, ratePerCuFt: 3.26 },
        { name: 'Link + 1 Trailer', capacityCuFt: 2500, ratePerKm: 23.35, ratePerCuFt: 3.26 },
        { name: 'Link + 2 Trailers', capacityCuFt: 5000, ratePerKm: 39.55, ratePerCuFt: 3.26 },
    ],
    [CITY_CODES.GR]: 'NATIONAL', 
};

export const ADDITIONAL_COSTS = {
    shuttle: { flatRate: 2500 },
    longCarry: { flatRate: 450, thresholdMeters: 30 },
    heavyItemCrew: { perPerson: 700, count: 2 },
    insurance: 'contact_sales',
    collectionOver80Km: { ratePerKm: 40, thresholdKm: 80 },
    deliveryOver80Km: { ratePerKm: 40, thresholdKm: 80 },
    payflex: { surcharge: 0.07 }
};

export const PACKAGING_RATES = {
    sendMeBoxesOnly: {
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
    documentationFee: 175,
    weekendSurcharge: 440,
    sharedLoadRate: 38.50,
};

/**
 * Utility to map a city name (from Google Maps) to a internal city code
 */
export const getCityCode = (cityName) => {
    if (!cityName) return null;
    const name = cityName.toLowerCase();
    
    if (name.includes('johannesburg') || name.includes('sandton') || name.includes('midrand') || name.includes('pretoria') || name.includes('germiston') || name.includes('randburg') || name.includes('roodepoort') || name.includes('benoni') || name.includes('boksburg') || name.includes('alexandra') || name.includes('edenvale') || name.includes('kempton park') || name.includes('springs') || name.includes('alberton') || name.includes('soweto')) {
        return CITY_CODES.JHB;
    }
    if (name.includes('cape town') || name.includes('bellville') || name.includes('stellenbosch') || name.includes('somerset west') || name.includes('paarl') || name.includes('epping')) {
        return CITY_CODES.CPT;
    }
    if (name.includes('durban') || name.includes('umhlanga') || name.includes('pinetown') || name.includes('amanzimtoti') || name.includes('ballito') || name.includes('salt rock') || name.includes('hillcrest') || name.includes('kloof')) {
        return CITY_CODES.DBN;
    }
    if (name.includes('knysna') || name.includes('george') || name.includes('plettenberg bay') || name.includes('mossel bay') || name.includes('garden route') || name.includes('sedgefield') || name.includes('wilderness') || name.includes('great brak') || name.includes('riversdale') || name.includes('still bay') || name.includes('oudtshoorn') || name.includes('de rust') || name.includes('uniondale') || name.includes('ladismith') || name.includes('barrydale') || name.includes('swellendam') || name.includes('heidelberg') || name.includes('albertinia') || name.includes('herbertsdale')) {
        return CITY_CODES.GR;
    }
    
    return null;
};
