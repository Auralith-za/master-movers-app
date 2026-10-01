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
    'DBN-JHB': { ratePerCuFt: 9,   minCharge: 5500  },  // ✅ corrected to R9/cuft per spreadsheet 20-05-2026

    // CPT ↔ DBN
    'CPT-DBN': { ratePerCuFt: 15,  minCharge: 8250  },
    'DBN-CPT': { ratePerCuFt: 25,  minCharge: 8250  },  // ✅ corrected to R25/cuft, min R8250 per spreadsheet

    // Eastern Cape / Garden Route
    // JHB→GR and DBN→GR: R29/cuft (outbound from JHB/DBN depot)
    // CPT→GR: R15/cuft (CT rate outbound)
    // GR→JHB and GR→DBN: R29/cuft (return from GR)
    // GR→CPT: R15/cuft
    // All verified against Local Costing: GR spreadsheet (20-05-2026)
    'JHB-GR':  { ratePerCuFt: 29,  minCharge: 14500 },
    'CPT-GR':  { ratePerCuFt: 15,  minCharge: 14500 },
    'DBN-GR':  { ratePerCuFt: 29,  minCharge: 14500 },
    'GR-JHB':  { ratePerCuFt: 29,  minCharge: 14500 },
    'GR-CPT':  { ratePerCuFt: 15,  minCharge: 14500 },
    'GR-DBN':  { ratePerCuFt: 29,  minCharge: 14500 },
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
    // Shuttle required when items must travel more than 90m from the truck to the door
    // Also triggered by the 'Shuttle Required' checkbox in special conditions
    shuttle: { flatRate: 2500, thresholdMeters: 90 },

    // Long carry surcharge: 50m–90m carry distance (no shuttle required)
    longCarry: { flatRate: 750, thresholdMeters: 50 },

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
        deliveryFee: 0.00
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
    minStorageFee:     450,    // Monthly storage fee minimum charge (ex-VAT)
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
export const OUTLYING_PROVINCES = [
    'free state',
    'limpopo',
    'mpumalanga',
    'mpumulanga',
    'mphumulanga',
    'north west',
    'northern cape',
    'eastern cape', // Eastern Cape is outlying except the Garden Route transit towns
];

export const GARDEN_ROUTE_TOWNS = [
    'george',
    'knysna',
    'mossel bay',
    'mosselbay',
    'plettenberg bay',
    'plett',
    'sedgefield',
    'wilderness'
];

export const OUTER_REGIONAL_TOWNS = [
    // Western Cape Outer Regional (>160km round trip from Epping depot)
    'hermanus', 'caledon', 'stanford', 'bredasdorp', 'swellendam', 'napier', 'struisbaai', 'arniston', 'cape agulhas',
    'worcester', 'robertson', 'ceres', 'ashton', 'montagu', 'bonnievale', 'wolseley', 'tulbagh', 'touws river', 'touwsriver',
    'malmesbury', 'moorreesburg', 'piketberg', 'porterville', 'hopefield', 'langebaan', 'saldanha', 'vredenburg', 'paternoster', 'st helena bay', 'shelena bay', 'velddrif', 'laaiplek', 'clanwilliam', 'vredendal', 'lamberts bay', 'lambert\'s bay', 'lutzville',
    'beaufort west', 'beaufortwest', 'prince albert', 'laingsburg',
    'overberg', 'breede river', 'breederiver', 'central karoo', 'west coast',

    // KwaZulu-Natal Outer Regional (>160km round trip from Ballito depot)
    'pietermaritzburg', 'hilton', 'howick', 'wartburg', 'mooi river', 'mooiriver', 'estcourt', 'ladysmith', 'dundee', 'newcastle', 'vryheid', 'glencoe',
    'mtunzini', 'empangeni', 'richards bay', 'richardsbay', 'kwambonambi', 'st lucia', 'mtubatuba', 'hluhluwe', 'pongola', 'mkuze',
    'umkomaas', 'scottburgh', 'pennington', 'hibberdene', 'port shepstone', 'portshepstone', 'shelly beach', 'shellybeach', 'uvongo', 'margate', 'ramsgate', 'southbroom', 'port edward', 'portedward', 'kokstad', 'underberg', 'ixopo',
    'midlands', 'zululand', 'drakensberg',

    // Gauteng Outer Regional / Border (>160km round trip from Germiston depot)
    'brits', 'rustenburg', 'potchefstroom', 'klerksdorp', 'carletonville', 'fochville', 'lichtenburg', 'mafikeng', 'mahikeng',
    'witbank', 'emalahleni', 'middelburg', 'secunda', 'standerton', 'ermelo', 'bethal',
    'bela-bela', 'belabela', 'warmbaths', 'mokopane', 'polokwane', 'tzaneen',
    'parys', 'sasolburg', 'bloemfontein', 'welkom', 'bethlehem', 'kimberley', 'upington',
    'east london', 'eastlondon', 'buffalo city', 'gqeberha', 'port elizabeth', 'portelizabeth', 'pe'
];

/**
 * Checks if a given address string, components, or coordinates belong to an
 * outlying province or an outer regional area (round trips over 160km / outside core hubs).
 */
export const isOutlyingOrOuterRegional = (addressStr, components = null, latLng = null) => {
    if (!addressStr && !components && !latLng) return false;

    const lowerAddr = (addressStr || '').toLowerCase().trim();

    const matchesTerm = (term, str) => {
        if (!term || !str) return false;
        if (term === 'pe') return new RegExp('\\bpe\\b', 'i').test(str);
        if (term === 'george') {
            if (/\bgeorge\s+(st|street|rd|road|ave|avenue|dr|drive|cres|crescent|way|lane|blvd|close|ross|storrar)\b/i.test(str)) {
                return false;
            }
            return /,\s*george\b/i.test(str) || /\bgeorge,\s*(western cape|wc|garden route|65\d\d)\b/i.test(str) || /\bgeorge\s+65\d\d\b/i.test(str);
        }
        return str.includes(term);
    };

    const isGardenRouteTown = GARDEN_ROUTE_TOWNS.some(t => matchesTerm(t, lowerAddr));

    // 1. Postal Code Geographic Check (South Africa)
    const postalMatches = lowerAddr.match(/\b(\d{4})\b/g);
    if (postalMatches && postalMatches.length > 0) {
        for (let i = postalMatches.length - 1; i >= 0; i--) {
            const code = parseInt(postalMatches[i], 10);

            // Garden Route postal codes (6500 to 6600) are handled by National Linehaul
            if (isGardenRouteTown && code >= 6500 && code <= 6600) {
                return false;
            }

            // Outer Western Cape postal codes (>160km round trip from Epping)
            // 6700-6999 (Worcester, Ceres, Robertson, Karoo)
            // 7200-7399 (Hermanus, Overberg, West Coast outer)
            // 8100-8299 (Vredendal, West Coast far)
            if ((code >= 6700 && code <= 6999) || (code >= 7200 && code <= 7399) || (code >= 8100 && code <= 8299)) {
                return true;
            }

            // Outer KZN postal codes (>160km round trip from Ballito)
            // 2900-3599 (Newcastle, Midlands, Pietermaritzburg)
            // 3670-3999 (Zululand, Richards Bay)
            // 4140-4299 (South Coast outer, Margate, Port Shepstone)
            // 4500-4799 (Kokstad)
            if ((code >= 2900 && code <= 3599) || (code >= 3670 && code <= 3999) || (code >= 4140 && code <= 4299) || (code >= 4500 && code <= 4799)) {
                return true;
            }

            // Outlying Provinces postal codes
            // 0200-0999 (North West, Limpopo - except Pretoria core 0001-0199)
            // 1000-1399 (Mpumalanga)
            // 2300-2899 (North West, Mpumalanga)
            // 5000-6499 (Eastern Cape outside Garden Route)
            // 8300-9999 (Northern Cape, Free State)
            if ((code >= 200 && code <= 999) || (code >= 1000 && code <= 1399) || (code >= 2300 && code <= 2899) || (code >= 5000 && code <= 6499) || (code >= 8300 && code <= 9999)) {
                return true;
            }
        }
    }

    // 2. Text Search for Outlying Provinces & Outer Regional Towns
    for (const prov of OUTLYING_PROVINCES) {
        if (matchesTerm(prov, lowerAddr)) {
            // Eastern Cape with explicit Garden Route town is serviced as GR national route
            if (prov === 'eastern cape' && isGardenRouteTown) {
                continue;
            }
            return true;
        }
    }

    for (const town of OUTER_REGIONAL_TOWNS) {
        if (matchesTerm(town, lowerAddr)) {
            return true;
        }
    }

    // 3. Google Places Address Components Check
    if (components && Array.isArray(components)) {
        for (const c of components) {
            const types = Array.isArray(c.types) ? c.types : [];
            if (types.includes('route') || types.includes('street_number') || types.includes('premise')) {
                continue;
            }
            const val = (c.long_name || c.short_name || '').toLowerCase().trim();
            if (!val) continue;

            for (const prov of OUTLYING_PROVINCES) {
                if (matchesTerm(prov, val)) {
                    if (prov === 'eastern cape' && isGardenRouteTown) continue;
                    return true;
                }
            }

            for (const town of OUTER_REGIONAL_TOWNS) {
                if (matchesTerm(town, val)) {
                    return true;
                }
            }
        }
    }

    // 4. GPS Distance Check (latLng from Google Places API)
    if (latLng && latLng.lat && latLng.lng) {
        const lat = parseFloat(latLng.lat);
        const lng = parseFloat(latLng.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
            const haversineKm = (lat1, lon1, lat2, lon2) => {
                const R = 6371;
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = 
                    Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return R * c;
            };

            const distToJhb = haversineKm(lat, lng, -26.2573, 28.1519);
            const distToDbn = haversineKm(lat, lng, -29.5444, 31.2174);
            const distToCpt = haversineKm(lat, lng, -33.9340, 18.5328);

            // Garden Route transit hub area (George coordinates)
            const distToGeorge = haversineKm(lat, lng, -33.9630, 22.4617);
            if (distToGeorge < 80) {
                return false;
            }

            // If it's more than 80km straight-line from ALL depots (~110km driving distance), it's outer regional
            if (distToJhb > 80 && distToDbn > 80 && distToCpt > 80) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Checks if a pair of city codes forms a supported national linehaul route.
 */
export const isValidHubToHubRoute = (pickupCityCode, dropoffCityCode) => {
    if (!pickupCityCode || !dropoffCityCode || pickupCityCode === dropoffCityCode) return false;
    const routeKey = `${pickupCityCode}-${dropoffCityCode}`;
    return Boolean(NATIONAL_RATES[routeKey]);
};

/**
 * Maps a city name string (from Google Places address_components or full address)
 * to an internal city code.
 *
 * Restricts outer regional and outlying areas to prevent invalid automated quoting.
 */
export const detectCityCode = (addressStr, components = null, latLng = null) => {
    if (!addressStr && !components && !latLng) return null;

    // 0. If it is an outlying or outer regional location, do NOT force it to a core metro depot.
    // Allow Garden Route to resolve to CITY_CODES.GR for national linehaul routing.
    const isOutlying = isOutlyingOrOuterRegional(addressStr, components, latLng);
    if (isOutlying) {
        return null;
    }

    const haversineKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // 1. Google Address Components Check (Specific Core Localities)
    if (components && Array.isArray(components)) {
        for (const c of components) {
            const types = Array.isArray(c.types) ? c.types : [];
            // Do not use administrative_area (province) alone to classify as a local city hub
            if (types.includes('administrative_area_level_1')) continue;

            const val = (c.long_name || c.short_name || "").toLowerCase().trim();
            if (!val) continue;

            // Check Garden Route
            if (
                val === "george" || val === "knysna" || val === "mossel bay" || val === "mosselbay" ||
                val === "plettenberg bay" || val === "plett" || val === "sedgefield" || val === "wilderness"
            ) {
                return CITY_CODES.GR;
            }

            // Check Core Cape Town
            if (
                val === "cape town" || val === "capetown" || val === "cpt" ||
                val.includes("city of cape town") || val === "bellville" || val === "stellenbosch" ||
                val === "somerset west" || val === "paarl" || val === "durbanville" || val === "parow" ||
                val === "goodwood" || val === "milnerton" || val === "bloubergstrand" || val === "table view" ||
                val === "strand" || val === "franschhoek" || val === "gordons bay" || val === "gordon's bay"
            ) {
                return CITY_CODES.CPT;
            }

            // Check Core Durban / North Coast
            if (
                val === "durban" || val === "dbn" || val.includes("ethekwini") ||
                val === "kingsburgh" || val === "astra park" || val === "amanzimtoti" ||
                val === "umhlanga" || val === "ballito" || val === "pinetown" ||
                val === "hillcrest" || val === "westville" || val === "kloof" ||
                val.includes("shaka") || val.includes("dolphin coast") || val.includes("kwadukuza") ||
                val.includes("salt rock") || val.includes("zimbali") || val.includes("sheffield beach") ||
                val.includes("tinley manor") || val.includes("westbrook") || val.includes("tongaat") ||
                val.includes("umdloti") || val.includes("stanger")
            ) {
                return CITY_CODES.DBN;
            }

            // Check Core Gauteng / JHB / Pretoria
            if (
                val === "johannesburg" || val === "joburg" || val === "jhb" ||
                val === "pretoria" || val === "tshwane" || val === "sandton" || val === "midrand" ||
                val === "centurion" || val === "randburg" || val === "roodepoort" ||
                val === "ekurhuleni" || val === "boksburg" || val === "benoni" || val === "brakpan" ||
                val === "germiston" || val === "alberton" || val === "kempton park" || val === "krugersdorp"
            ) {
                return CITY_CODES.JHB;
            }
        }
    }

    // 2. Full Text Search fallback
    if (addressStr) {
        const name = addressStr.toLowerCase().trim();

        // 2.1 Postal Code geographic matching for Core Regions
        const postalMatches = name.match(/\b(\d{4})\b/g);
        if (postalMatches && postalMatches.length > 0) {
            for (let i = postalMatches.length - 1; i >= 0; i--) {
                const code = parseInt(postalMatches[i], 10);

                // Garden Route (6500 to 6600)
                if (code >= 6500 && code <= 6600) {
                    if (GARDEN_ROUTE_TOWNS.some(t => name.includes(t))) {
                        return CITY_CODES.GR;
                    }
                }

                // Core Cape Town / Helderberg / Winelands (7100-7151, 7400-7690, 8000-8099)
                if ((code >= 7100 && code <= 7151) || (code >= 7400 && code <= 7690) || (code >= 8000 && code <= 8099)) {
                    return CITY_CODES.CPT;
                }

                // Core Durban / North Coast Hub (3600-3660, 4000-4099, 4125-4130, 4300-4320, 4390-4450)
                if ((code >= 3600 && code <= 3660) || (code >= 4000 && code <= 4099) || (code >= 4125 && code <= 4130) || (code >= 4300 && code <= 4320) || (code >= 4390 && code <= 4450)) {
                    return CITY_CODES.DBN;
                }

                // Core Johannesburg / Ekurhuleni / West Rand (1400-1750, 2000-2199)
                if ((code >= 1400 && code <= 1750) || (code >= 2000 && code <= 2199)) {
                    return CITY_CODES.JHB;
                }

                // Core Pretoria / Tshwane / Centurion (0001 to 0199)
                if (code >= 1 && code <= 199) {
                    return CITY_CODES.JHB;
                }
            }
        }

        // Garden Route
        if (GARDEN_ROUTE_TOWNS.some(t => name.includes(t))) {
            return CITY_CODES.GR;
        }

        // Core Cape Town / Western Cape Metro
        if (
            name.includes('cape town') || name.includes('capetown') || name.includes('cpt') ||
            name.includes('bellville') || name.includes('stellenbosch') || name.includes('somerset west') ||
            name.includes('milnerton') || name.includes('tableview') || name.includes('table view') || name.includes('blouberg') ||
            name.includes('durbanville') || name.includes('brackenfell') || name.includes('parow') ||
            name.includes('goodwood') || name.includes('constantia') || name.includes('hout bay') ||
            name.includes('sea point') || name.includes('green point') || name.includes('camps bay') ||
            name.includes('wynberg') || name.includes('claremont') || name.includes('rondebosch') ||
            name.includes('paarl') || name.includes('franschhoek') || name.includes('strand') ||
            name.includes('gordon\'s bay') || name.includes('gordons bay')
        ) {
            return CITY_CODES.CPT;
        }

        // Core Durban / North Coast Hub
        if (
            name.includes('durban') || name.includes('dbn') || name.includes('ethekwini') ||
            name.includes('shaka') || name.includes('dolphin coast') || name.includes('kwadukuza') ||
            name.includes('zimbali') || name.includes('sheffield beach') || name.includes('tinley manor') ||
            name.includes('westbrook') || name.includes('tongaat') || name.includes('stanger') ||
            name.includes('blythedale') || name.includes('zinkwazi') ||
            name.includes('kingsburgh') || name.includes('astra park') || name.includes('amanzimtoti') ||
            name.includes('umhlanga') || name.includes('pinetown') || name.includes('ballito') ||
            name.includes('salt rock') || name.includes('hillcrest') || name.includes('kloof') ||
            name.includes('westville') || name.includes('kwamashu') || name.includes('umdloti') ||
            name.includes('mount edgecombe') || name.includes('la lucia') || name.includes('morningside') ||
            name.includes('queensburgh') || name.includes('berea') || name.includes('glenwood') ||
            name.includes('chatsworth') || name.includes('phoenix') || name.includes('gillitts') ||
            name.includes('assagay') || name.includes('bothas hill') || name.includes('cowies hill') ||
            name.includes('warner beach') || name.includes('winklespruit')
        ) {
            return CITY_CODES.DBN;
        }

        // Core Johannesburg / Gauteng Metro Hub
        if (
            name.includes('johannesburg') || name.includes('joburg') || name.includes('jhb') ||
            name.includes('sandton') || name.includes('midrand') || name.includes('pretoria') ||
            name.includes('centurion') || name.includes('randburg') || name.includes('roodepoort') ||
            name.includes('fourways') || name.includes('bryanston') || name.includes('sunninghill') ||
            name.includes('morningside') || name.includes('melrose') || name.includes('rosebank') ||
            name.includes('germiston') || name.includes('edenvale') || name.includes('kempton park') ||
            name.includes('alberton') || name.includes('boksburg') || name.includes('benoni') ||
            name.includes('brakpan') || name.includes('springs') || name.includes('nigel') ||
            name.includes('krugersdorp') || name.includes('bedfordview') || name.includes('florida')
        ) {
            return CITY_CODES.JHB;
        }
    }

    // 3. GPS Proximity Check for Core Metros (within ~65km straight line / ~80km driving radius)
    if (latLng && latLng.lat && latLng.lng) {
        const lat = parseFloat(latLng.lat);
        const lng = parseFloat(latLng.lng);

        const distToJhb = haversineKm(lat, lng, -26.2573, 28.1519);
        const distToDbn = haversineKm(lat, lng, -29.5444, 31.2174);
        const distToCpt = haversineKm(lat, lng, -33.9340, 18.5328);
        const distToGeorge = haversineKm(lat, lng, -33.9630, 22.4617);

        if (distToGeorge <= 70) return CITY_CODES.GR;
        if (distToCpt <= 65) return CITY_CODES.CPT;
        if (distToDbn <= 65) return CITY_CODES.DBN;
        if (distToJhb <= 65) return CITY_CODES.JHB;

        return null;
    }

    return null;
};

export const getCityCode = (cityName) => {
    return detectCityCode(cityName);
};

