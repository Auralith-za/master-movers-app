/**
 * Master Movers Pricing Rates
 * 
 * All rates are EX-VAT (VAT at 15% is added at the end of calculation).
 * Verified against official spreadsheet screenshots (June 2026).
 * 
 * LOCAL MINIMUM CHARGE: R2,600 ex-VAT for JHB, DBN, CPT.
 * 
 * NATIONAL MOVES: Volume-based pricing. Minimum charges as per route table.
 * Garden Route (GR) is NATIONAL only — it is a transit region, not a local depot.
 */

export const CITY_CODES = {
    JHB: 'JHB',
    CPT: 'CPT',
    DBN: 'DBN',
    GR:  'GR'   // Garden Route — national/transit only, no local depot
};

/**
 * National Route Rates (volume-based, per cubic foot).
 *
 * All routes are ex-VAT. Minimum charges apply regardless of volume.
 * GR routes represent moves through/to the Garden Route region.
 *
 * Rates verified from official spreadsheet June 2026.
 */
export const NATIONAL_RATES = {
    // JHB ↔ CPT
    'JHB-CPT': { ratePerCuFt: 25,  minCharge: 5250  },
    'CPT-JHB': { ratePerCuFt: 15,  minCharge: 5250  },

    // JHB ↔ DBN
    'JHB-DBN': { ratePerCuFt: 15,  minCharge: 4750  },
    'DBN-JHB': { ratePerCuFt: 15,  minCharge: 5000  },  // ✅ corrected from 4750

    // CPT ↔ DBN
    'CPT-DBN': { ratePerCuFt: 15,  minCharge: 8250  },
    'DBN-CPT': { ratePerCuFt: 15,  minCharge: 6500  },  // ✅ corrected from 8250

    // Eastern Cape / Garden Route — R15/cuft (CPT rate), min R14,000
    // All GR routes use the Cape Town rate per cuft as instructed.
    'JHB-GR':  { ratePerCuFt: 15,  minCharge: 14000 },
    'CPT-GR':  { ratePerCuFt: 15,  minCharge: 14000 },
    'DBN-GR':  { ratePerCuFt: 15,  minCharge: 14000 },
    'GR-JHB':  { ratePerCuFt: 15,  minCharge: 14000 },
    'GR-CPT':  { ratePerCuFt: 15,  minCharge: 14000 },
    'GR-DBN':  { ratePerCuFt: 15,  minCharge: 14000 },
};

/**
 * Local Vehicle Rates by City.
 *
 * Formula (local move): (TotalBillableKm × ratePerKm) + (TotalVolumeCuFt × ratePerCuFt)
 * Minimum charge: R2,600 ex-VAT for all cities.
 *
 * TotalBillableKm = Depot→Pickup + Pickup→Dropoff + Dropoff→Depot (full circuit).
 * Rates verified from official spreadsheet June 2026.
 */
export const LOCAL_VEHICLE_RATES = {
    /**
     * Johannesburg Local Vehicles
     * Depot: 17 Indianapolis Blvd, Gosforth Park, Germiston, 1401
     */
    [CITY_CODES.JHB]: [
        { name: 'Dyna 4',          capacityCuFt: 400,  ratePerKm: 14.23, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Dyna 6',          capacityCuFt: 600,  ratePerKm: 14.43, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Mb800',           capacityCuFt: 700,  ratePerKm: 16.03, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Isuzu',           capacityCuFt: 900,  ratePerKm: 20.61, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: '1213',            capacityCuFt: 1100, ratePerKm: 26.58, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Dyna 7',          capacityCuFt: 1100, ratePerKm: 26.34, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Hino',            capacityCuFt: 1700, ratePerKm: 26.34, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Atego',           capacityCuFt: 1800, ratePerKm: 25.01, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: '41Ft Trailer',    capacityCuFt: 3600, ratePerKm: 35.57, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Link Trailers x2',capacityCuFt: 5000, ratePerKm: 40.56, ratePerCuFt: 3.26, minCharge: 2600 },
    ],

    /**
     * Cape Town Local Vehicles
     * Depot: Unit 1, Bosal Park, 77 Bofors Cir, Epping, Cape Town, 7460
     * Verified from CPT spreadsheet screenshot.
     */
    [CITY_CODES.CPT]: [
        { name: 'Hino',            capacityCuFt: 1000, ratePerKm: 20.60, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Semi Trailer',    capacityCuFt: 1600, ratePerKm: 35.57, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Semi Trailer L',  capacityCuFt: 1600, ratePerKm: 35.57, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Link Trailer',    capacityCuFt: 2500, ratePerKm: 35.57, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Link Trailers x2',capacityCuFt: 5000, ratePerKm: 40.56, ratePerCuFt: 3.26, minCharge: 2600 },
    ],

    /**
     * Durban Local Vehicles
     * Depot: Units 5 & 6 Raddical Park, 3 Gourly Rd, Ballito, 4420
     */
    [CITY_CODES.DBN]: [
        { name: 'Dyna 4',          capacityCuFt: 300,  ratePerKm: 13.65, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Hino 300',        capacityCuFt: 1000, ratePerKm: 20.60, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Old Hino',        capacityCuFt: 1500, ratePerKm: 26.40, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Link + 1 Trailer',capacityCuFt: 2500, ratePerKm: 35.57, ratePerCuFt: 3.26, minCharge: 2600 },
        { name: 'Link + 2 Trailers',capacityCuFt: 5000, ratePerKm: 40.56, ratePerCuFt: 3.26, minCharge: 2600 },
    ],

    // Garden Route has NO local depot — all GR moves are handled as national routes.
    [CITY_CODES.GR]: null,
};

/**
 * Additional Surcharge Costs — verified from spreadsheet.
 */
export const ADDITIONAL_COSTS = {
    // Shuttle required when items must travel 50m or more from the truck to the door
    shuttle: { flatRate: 2500, thresholdMeters: 50 },

    // Long carry surcharge: 30m–50m carry distance (no shuttle required)
    longCarry: { flatRate: 450, thresholdMeters: 30 },

    // Additional crew required for heavy/awkward items (flat fee per 2-person crew)
    heavyItemCrew: { perPerson: 550, count: 2 },

    // Insurance is not auto-calculated — sales team provides custom quote
    insurance: 'contact_sales',

    // Extra distance fees: if depot→pickup OR dropoff→depot exceed 80km on a local move
    collectionOver80Km: { ratePerKm: 40, thresholdKm: 80 },
    deliveryOver80Km:   { ratePerKm: 40, thresholdKm: 80 },

    // Payflex payment surcharge (7% on total incl. VAT)
    payflex: { surcharge: 0.07 }
};

/**
 * Packaging rates (for pre-supplied boxes/packing service).
 */
export const PACKAGING_RATES = {
    sendMeBoxesOnly: {
        st7:         50.00,
        linen:       125.00,
        deliveryFee: 500.00
    },
    boxesAndPacking: {
        st7:         85.00,
        linen:       165.00,
        deliveryFee: 500.00
    }
};

/**
 * Global pricing constants.
 * 
 * minOrder: Minimum charge for LOCAL moves, ex-VAT. R2,600 for JHB, DBN, CPT.
 *           National moves use their own route-specific minimum charges (see NATIONAL_RATES).
 */
export const PRICING_CONSTANTS = {
    minOrder:          2600,   // Local move minimum charge (ex-VAT)
    minKmRadius:       100,
    documentationFee:  175,    // Documentation fee (ex-VAT), always included
    weekendSurcharge:  440,    // Saturday/Sunday surcharge (ex-VAT)
    sharedLoadRate:    38.50,  // Shared load rate per cuft (national small loads)
};

/**
 * Maps a city name string (from Google Places address_components or full address)
 * to an internal city code.
 *
 * The system uses address_components (locality, sublocality, administrative_area) from
 * Google Places autocomplete as the primary source. This full-address string matching
 * is used as a secondary fallback.
 */
export const detectCityCode = (addressStr, components = null, latLng = null) => {
    if (!addressStr && !components && !latLng) return null;

    const haversineKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
    };

    // 1. Google Address Components Check
    if (components && Array.isArray(components)) {
        for (const c of components) {
            const val = (c.long_name || c.short_name || "").toLowerCase().trim();
            if (!val) continue;

            // Check Cape Town
            if (
                val === "cape town" || val === "capetown" || val === "cpt" ||
                val.includes("city of cape town") || val === "bellville" || val === "stellenbosch" ||
                val === "somerset west" || val === "paarl" || val === "durbanville"
            ) {
                return CITY_CODES.CPT;
            }

            // Check Durban
            if (
                val === "durban" || val === "dbn" ||
                val.includes("ethekwini") || val === "umhlanga" || val === "ballito" || val === "pinetown"
            ) {
                return CITY_CODES.DBN;
            }

            // Check Garden Route / PE
            if (
                val === "george" || val === "knysna" || val === "mossel bay" || val === "plettenberg bay" ||
                val === "gqeberha" || val === "port elizabeth" || val === "eastern cape" || val === "pe" ||
                val === "garden route" || val.includes("nelson mandela bay") || val.includes("garden route district")
            ) {
                return CITY_CODES.GR;
            }

            // Check Gauteng / JHB
            if (
                val === "johannesburg" || val === "joburg" || val === "jhb" ||
                val === "pretoria" || val === "tshwane" || val === "sandton" || val === "midrand" ||
                val === "centurion" || val === "randburg"
            ) {
                return CITY_CODES.JHB;
            }
        }
    }

    // 2. Full Text Search fallback
    if (addressStr) {
        const name = addressStr.toLowerCase().trim();

        // Check Garden Route / PE first
        if (
            name.includes('george') || name.includes('knysna') || name.includes('plettenberg') ||
            name.includes('plett') || name.includes('mossel bay') || name.includes('mosselbay') ||
            name.includes('sedgefield') || name.includes('wilderness') || name.includes('tsitsikamma') ||
            name.includes('storms river') || name.includes('jeffreys bay') || name.includes('st francis') ||
            name.includes('gqeberha') || name.includes('port elizabeth') || name.includes('portelizabeth') ||
            name.includes('eastern cape') || name.includes('garden route') ||
            name.includes('nelson mandela bay')
        ) {
            return CITY_CODES.GR;
        }

        // Check Cape Town / Western Cape
        if (
            name.includes('cape town') || name.includes('capetown') || name.includes('western cape') || name.includes('cpt') ||
            name.includes('bellville') || name.includes('stellenbosch') || name.includes('somerset west') ||
            name.includes('paarl') || name.includes('milnerton') || name.includes('tableview') ||
            name.includes('blouberg') || name.includes('durbanville') || name.includes('brackenfell') ||
            name.includes('parow') || name.includes('goodwood') || name.includes('constantia') ||
            name.includes('houte bay') || name.includes('hout bay') || name.includes('sea point') ||
            name.includes('green point') || name.includes('wynberg') || name.includes('claremont') ||
            name.includes('rondebosch')
        ) {
            return CITY_CODES.CPT;
        }

        // Check Durban / KwaZulu-Natal
        const hasDurbanHint = name.includes('durban') || name.includes('kwazulu-natal') || name.includes('kzn') || name.includes('dbn') || name.includes('ethekwini');
        if (
            hasDurbanHint ||
            name.includes('umhlanga') || name.includes('pinetown') || name.includes('amanzimtoti') ||
            name.includes('ballito') || name.includes('salt rock') || name.includes('hillcrest') ||
            name.includes('kloof') || name.includes('pietermaritzburg') || name.includes('westville')
        ) {
            return CITY_CODES.DBN;
        }

        // Check Johannesburg / Gauteng
        if (
            name.includes('johannesburg') || name.includes('joburg') || name.includes('gauteng') || name.includes('jhb') ||
            name.includes('sandton') || name.includes('midrand') || name.includes('pretoria') ||
            name.includes('centurion') || name.includes('randburg') || name.includes('roodepoort') ||
            name.includes('fourways') || name.includes('bryanston') || name.includes('sunninghill') ||
            name.includes('morningside') || name.includes('melrose') || name.includes('rosebank') ||
            name.includes('germiston') || name.includes('edenvale') || name.includes('kempton park') ||
            name.includes('alberton') || name.includes('boksburg') || name.includes('benoni') ||
            name.includes('krugersdorp') || name.includes('heidelberg') && !name.includes('western cape')
        ) {
            return CITY_CODES.JHB;
        }
    }

    // 3. GPS Proximity Check (latLng from Google Places API)
    if (latLng && latLng.lat && latLng.lng) {
        const lat = parseFloat(latLng.lat);
        const lng = parseFloat(latLng.lng);

        const distToJhb = haversineKm(lat, lng, -26.2573, 28.1519);
        const distToDbn = haversineKm(lat, lng, -29.5444, 31.2174);
        const distToCpt = haversineKm(lat, lng, -33.9340, 18.5328);

        if (distToCpt < 150) return CITY_CODES.CPT;
        if (distToDbn < 150) return CITY_CODES.DBN;
        if (distToJhb < 150) return CITY_CODES.JHB;

        // If it's further than 150km from any main hub and didn't match textually,
        // it's an outline or unresolved area. Do not force it to a hub.
        return null;
    }

    return null;
};

export const getCityCode = (cityName) => {
    return detectCityCode(cityName);
};
