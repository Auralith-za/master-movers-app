/**
 * Vehicle Rates Configuration
 * 
 * Rates are based on the "JHB LOCAL COSTING" table.
 * Volume Capacity is in Cubic Feet (ft³).
 * Rates are in AR (South African Rand).
 * 
 * Note: HILUX rate per km corrected from 13691.00 to 13.69 based on context.
 */
export const VEHICLE_RATES = [
    { name: 'HYUNDAI', capacityCuFt: 300, ratePerKm: 13.14, ratePerCuFt: 3.26 },
    { name: 'HILUX', capacityCuFt: 300, ratePerKm: 13.69, ratePerCuFt: 3.26 },
    { name: 'DYNA 4', capacityCuFt: 400, ratePerKm: 14.25, ratePerCuFt: 3.60 },
    { name: 'DYNA 6', capacityCuFt: 600, ratePerKm: 14.50, ratePerCuFt: 3.75 },
    { name: 'MB800', capacityCuFt: 700, ratePerKm: 15.95, ratePerCuFt: 3.66 },
    { name: 'ISUZU', capacityCuFt: 900, ratePerKm: 27.07, ratePerCuFt: 3.56 },
    { name: '1213', capacityCuFt: 1100, ratePerKm: 30.94, ratePerCuFt: 3.26 },
    { name: 'DYNA 7', capacityCuFt: 1100, ratePerKm: 30.68, ratePerCuFt: 3.26 },
    { name: 'HINO', capacityCuFt: 1700, ratePerKm: 30.68, ratePerCuFt: 3.45 },
    { name: 'ATEGO', capacityCuFt: 1800, ratePerKm: 29.34, ratePerCuFt: 3.26 },
    { name: '41 FT TRAILER', capacityCuFt: 3600, ratePerKm: 40.26, ratePerCuFt: 3.26 },
    { name: '1 LINK TRAILER', capacityCuFt: 2500, ratePerKm: 40.26, ratePerCuFt: 3.26 }, // Note: 1 Link is smaller than 41 FT in this table? Keeping as is.
    { name: 'LINK', capacityCuFt: 5000, ratePerKm: 46.91, ratePerCuFt: 3.26 },
];

// Sort by capacity to help with selection logic
export const SORTED_VEHICLE_RATES = [...VEHICLE_RATES].sort((a, b) => a.capacityCuFt - b.capacityCuFt);
