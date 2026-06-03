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
    'JHB-CPT': { ratePerCuFt: 25, minCharge: 5250 },
    'JHB-DBN': { ratePerCuFt: 15, minCharge: 4750 },
    'JHB-GR': { ratePerCuFt: 29, minCharge: 14500 },
    'CPT-JHB': { ratePerCuFt: 15, minCharge: 5250 },
    'CPT-DBN': { ratePerCuFt: 15, minCharge: 8250 },
    'CPT-GR': { ratePerCuFt: 15, minCharge: 14500 },
    'DBN-JHB': { ratePerCuFt: 9, minCharge: 5500 },
    'DBN-CPT': { ratePerCuFt: 25, minCharge: 8250 },
    'DBN-GR': { ratePerCuFt: 29, minCharge: 14500 },
};

export const LOCAL_VEHICLE_RATES = {
    [CITY_CODES.JHB]: [
        { name: 'Dyna 4', capacityCuFt: 400, ratePerKm: 14.23, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Dyna 6', capacityCuFt: 600, ratePerKm: 14.43, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Mb800', capacityCuFt: 700, ratePerKm: 16.03, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Isuzu', capacityCuFt: 900, ratePerKm: 20.61, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: '1213', capacityCuFt: 1100, ratePerKm: 26.58, ratePerCuFt: 3.26 },
        { name: 'Dyna 7', capacityCuFt: 1100, ratePerKm: 26.34, ratePerCuFt: 3.26 },
        { name: 'Hino', capacityCuFt: 1700, ratePerKm: 26.34, ratePerCuFt: 3.26 },
        { name: 'Atego', capacityCuFt: 1800, ratePerKm: 25.01, ratePerCuFt: 3.26 },
        { name: '41Ft trailer', capacityCuFt: 3600, ratePerKm: 35.57, ratePerCuFt: 3.26 },
        { name: 'Link Trailers x 2', capacityCuFt: 5000, ratePerKm: 40.56, ratePerCuFt: 3.26 },
    ],
    [CITY_CODES.CPT]: [
        { name: 'Hino', capacityCuFt: 1000, ratePerKm: 20.60, ratePerCuFt: 3.26 },
        { name: 'Semi Trailer', capacityCuFt: 1600, ratePerKm: 35.57, ratePerCuFt: 3.26 },
        { name: 'Link Trailer', capacityCuFt: 2500, ratePerKm: 35.57, ratePerCuFt: 3.26 },
        { name: 'Link Trailers x 2', capacityCuFt: 5000, ratePerKm: 40.56, ratePerCuFt: 3.26 },
    ],
    [CITY_CODES.DBN]: [
        { name: 'Dyna 4', capacityCuFt: 300, ratePerKm: 13.65, ratePerCuFt: 3.26 },
        { name: 'Hino 300', capacityCuFt: 1000, ratePerKm: 20.60, ratePerCuFt: 3.26 },
        { name: 'old Hino', capacityCuFt: 1500, ratePerKm: 26.40, ratePerCuFt: 3.26 },
        { name: 'Link + 1 Trailer', capacityCuFt: 2500, ratePerKm: 35.57, ratePerCuFt: 3.26 },
        { name: 'Link + 2 Trailers', capacityCuFt: 5000, ratePerKm: 40.56, ratePerCuFt: 3.26 },
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
        st7: 50.00,
        linen: 125.00,
        deliveryFee: 500.00
    },
    boxesAndPacking: {
        st7: 85.00,
        linen: 165.00,
        deliveryFee: 500.00
    }
};

export const PRICING_CONSTANTS = {
    minOrder: 2600,
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
    const name = cityName.toLowerCase().trim();
    
    if (name.includes('johannesburg') || name.includes('sandton') || name.includes('midrand') || name.includes('pretoria') || name.includes('germiston') || name.includes('randburg') || name.includes('roodepoort') || name.includes('benoni') || name.includes('boksburg') || name.includes('alexandra') || name.includes('edenvale') || name.includes('kempton park') || name.includes('springs') || name.includes('alberton') || name.includes('soweto') || name === 'jhb' || name.includes('jhb')) {
        return CITY_CODES.JHB;
    }
    if (name.includes('cape town') || name.includes('bellville') || name.includes('stellenbosch') || name.includes('somerset west') || name.includes('paarl') || name.includes('epping') || name === 'cpt' || name.includes('cpt')) {
        return CITY_CODES.CPT;
    }
    if (name.includes('durban') || name.includes('umhlanga') || name.includes('pinetown') || name.includes('amanzimtoti') || name.includes('ballito') || name.includes('salt rock') || name.includes('hillcrest') || name.includes('kloof') || name === 'dbn' || name.includes('dbn')) {
        return CITY_CODES.DBN;
    }
    if (name.includes('knysna') || name.includes('george') || name.includes('plettenberg bay') || name.includes('mossel bay') || name.includes('garden route') || name.includes('sedgefield') || name.includes('wilderness') || name.includes('great brak') || name.includes('riversdale') || name.includes('still bay') || name.includes('oudtshoorn') || name.includes('de rust') || name.includes('uniondale') || name.includes('ladismith') || name.includes('barrydale') || name.includes('swellendam') || name.includes('heidelberg') || name.includes('albertinia') || name.includes('herbertsdale') || name === 'gr' || name.includes('gr')) {
        return CITY_CODES.GR;
    }
    
    return null;
};
