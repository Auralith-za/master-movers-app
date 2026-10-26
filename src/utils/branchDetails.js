import { detectCityCode } from '../features/inventory/data/pricingRates.js';

export const BRANCH_DETAILS = {
    DBN: {
        code: 'DBN',
        name: 'Master Movers Kwazulu Natal',
        shortName: 'Durban Branch',
        line1: 'Units 5 & 6 Raddical Park, 3 Gourly Rd',
        line2: 'Ballito Service Park.',
        line3: 'Ballito 4420',
        cityPostal: 'Ballito 4420',
        tel: '031 700 8380',
        telDisplay: '031 700 8380',
        telInternational: '+27 31 700 8380',
        fax: '031 700 3760',
        faxDisplay: '031 700 3760',
        telLink: '+27317008380',
        email: 'sales@mastermoversdbn.co.za',
        coRegNo: '2017/168816/07',
        vatRegNo: '4100278961',
        fullAddress: 'Units 5 & 6 Raddical Park, 3 Gourly Rd, Ballito Service Park., Ballito 4420',
        pdfAddressLines: [
            'Units 5 & 6 Raddical Park, 3 Gourly Rd',
            'Ballito Service Park.',
            'Ballito 4420',
            'Tel 031 700 8380   Fax 031 700 3760',
            'Co. Reg. No.  2017/168816/07',
            'VAT Reg. No.  4100278961'
        ]
    },
    CPT: {
        code: 'CPT',
        name: 'Master Movers Cape Town',
        shortName: 'Cape Town Branch',
        line1: 'UNIT 1 BOSAL PARK',
        line2: '77 BOFORS CIRCLE',
        line3: 'EPPING INDUSTRI 7460',
        cityPostal: 'EPPING INDUSTRI 7460',
        tel: '021 534 1582',
        telDisplay: '021 534 1582',
        telInternational: '+27 21 534 1582',
        fax: '',
        faxDisplay: '',
        telLink: '+27215341582',
        email: 'sales@mastermoverscpt.co.za',
        coRegNo: '2017/168816/07',
        vatRegNo: '4100278961',
        fullAddress: 'UNIT 1 BOSAL PARK, 77 BOFORS CIRCLE, EPPING INDUSTRI 7460',
        pdfAddressLines: [
            'UNIT 1 BOSAL PARK',
            '77 BOFORS CIRCLE',
            'EPPING INDUSTRI 7460',
            'Tel 021 534 1582   Fax',
            'Co. Reg. No.  2017/168816/07',
            'VAT Reg. No.  4100278961'
        ]
    },
    JHB: {
        code: 'JHB',
        name: 'Master Movers Johannesburg',
        shortName: 'Johannesburg (Head Office)',
        line1: '17 Indianapolis Boulevard',
        line2: 'Raceway Industrial Park',
        line3: 'Gosforth Park 1419',
        cityPostal: 'Gosforth Park 1419',
        tel: '+27 11 493 7569',
        telDisplay: '+27 11 493 7569',
        telInternational: '+27 11 493 7569',
        fax: '',
        faxDisplay: '',
        telLink: '+27114937569',
        email: 'sales1@mastermoversjhb.co.za',
        coRegNo: '2017/168816/07',
        vatRegNo: '4100278961',
        fullAddress: '17 Indianapolis Boulevard, Raceway Industrial Park, Gosforth Park 1419',
        pdfAddressLines: [
            '17 Indianapolis Boulevard',
            'Raceway Industrial Park',
            'Gosforth Park 1419',
            'Tel +27 11 493 7569   Fax',
            'Co. Reg. No.  2017/168816/07',
            'VAT Reg. No.  4100278961'
        ]
    }
};

/**
 * Resolves the branch code ('DBN' | 'CPT' | 'JHB') based on the quote's origin ("From").
 */
export const getBranchCode = (quoteOrData) => {
    if (!quoteOrData) return 'JHB';

    // Direct string passed
    if (typeof quoteOrData === 'string') {
        const detected = detectCityCode(quoteOrData);
        if (detected === 'DBN') return 'DBN';
        if (detected === 'CPT') return 'CPT';
        return 'JHB';
    }

    // Direct city code properties
    const directCode = quoteOrData.branch ||
                       quoteOrData.branchCode ||
                       quoteOrData.pickupCityCode || 
                       quoteOrData.pickup_city_code || 
                       quoteOrData.pickup_city ||
                       quoteOrData.items_json?.pickupCityCode ||
                       quoteOrData.moveDetails?.pickupCityCode;

    if (directCode === 'DBN') return 'DBN';
    if (directCode === 'CPT') return 'CPT';
    if (directCode === 'JHB') return 'JHB';

    // Check pickup address
    const pickupAddress = quoteOrData.pickupAddress ||
                          quoteOrData.pickup_address ||
                          quoteOrData.moveDetails?.pickupAddress ||
                          quoteOrData.items_json?.pickupAddress ||
                          '';

    const components = quoteOrData.pickupAddressComponents ||
                       quoteOrData.pickup_address_components ||
                       quoteOrData.items_json?.pickupAddressComponents ||
                       quoteOrData.moveDetails?.pickupAddressComponents ||
                       null;

    const latLng = quoteOrData.pickupLatLng ||
                   quoteOrData.pickup_lat_lng ||
                   quoteOrData.items_json?.pickupLatLng ||
                   quoteOrData.moveDetails?.pickupLatLng ||
                   null;

    const detected = detectCityCode(pickupAddress, components, latLng);
    if (detected === 'DBN') return 'DBN';
    if (detected === 'CPT') return 'CPT';

    // Fallback checks on address text in case detectCityCode was null
    if (pickupAddress) {
        const lower = pickupAddress.toLowerCase();
        if (
            lower.includes('durban') || lower.includes('dbn') || lower.includes('ballito') ||
            lower.includes('umhlanga') || lower.includes('kzn') || lower.includes('kwazulu') ||
            lower.includes('pinetown') || lower.includes('hillcrest') || lower.includes('amanzimtoti')
        ) {
            return 'DBN';
        }
        if (
            lower.includes('cape town') || lower.includes('capetown') || lower.includes('cpt') ||
            lower.includes('epping') || lower.includes('bellville') || lower.includes('stellenbosch') ||
            lower.includes('somerset west') || lower.includes('paarl') || lower.includes('blouberg') ||
            lower.includes('milnerton') || lower.includes('western cape')
        ) {
            return 'CPT';
        }
    }

    // Default to Johannesburg (Head Office)
    return 'JHB';
};

/**
 * Returns the complete branch configuration for a given quote / move details.
 */
export const getBranchDetails = (quoteOrData) => {
    const code = getBranchCode(quoteOrData);
    return BRANCH_DETAILS[code] || BRANCH_DETAILS.JHB;
};
