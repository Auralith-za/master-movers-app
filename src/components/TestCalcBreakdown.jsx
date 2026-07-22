/**
 * TestCalcBreakdown — Live Calculation Inspector
 *
 * Shown only on the /quote-test route. Displays a full, step-by-step breakdown
 * of how the quote is calculated: city detection, depot, distance legs, vehicle
 * assignment, rates, min charge check, surcharges and VAT.
 *
 * This component reads live data from useMoveStore and calls calculateQuote
 * internally to mirror the exact logic the production system uses.
 */
import React, { useMemo } from 'react'
import { useMoveStore, calculateQuote, getPlasticSleevesCount } from '../features/inventory/store/moveStore'
import { INVENTORY_ITEMS } from '../features/inventory/data/mockItems'
import { getCityCode, detectCityCode, LOCAL_VEHICLE_RATES, NATIONAL_RATES, CITY_CODES, PRICING_CONSTANTS, PACKAGING_RATES } from '../features/inventory/data/pricingRates'
import { DEPOT_LOCATIONS } from '../services/googleMaps'
import { FlaskConical, MapPin, Truck, Package, Calculator, BadgeCheck, AlertCircle } from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────

function Row({ label, value, highlight = false, warn = false, mono = false }) {
    return (
        <div className={`flex justify-between items-start py-1.5 border-b border-slate-700/40 last:border-0 gap-3 ${highlight ? 'text-emerald-400' : warn ? 'text-amber-400' : 'text-slate-300'}`}>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 break-words flex-1">{label}</span>
            <span className={`text-xs font-black text-right flex-shrink-0 whitespace-nowrap ${mono ? 'font-mono' : ''} ${highlight ? 'text-emerald-300' : warn ? 'text-amber-300' : 'text-slate-200'}`}>
                {value ?? '—'}
            </span>
        </div>
    )
}

function Section({ title, icon: Icon, children, color = 'slate' }) {
    const colors = {
        slate:   'border-slate-600 bg-slate-800/60',
        blue:    'border-blue-500/40 bg-blue-900/20',
        emerald: 'border-emerald-500/40 bg-emerald-900/20',
        amber:   'border-amber-500/40 bg-amber-900/20',
        red:     'border-red-500/40 bg-red-900/20',
    }
    return (
        <div className={`rounded-xl border p-3 space-y-0.5 ${colors[color]}`}>
            <div className="flex items-center gap-2 mb-2">
                {Icon && <Icon size={13} className={`text-${color === 'slate' ? 'slate-400' : color + '-400'}`} />}
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
            </div>
            {children}
        </div>
    )
}

function R(n) {
    if (n === null || n === undefined || isNaN(n)) return '—'
    return `R ${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TestCalcBreakdown() {
    const { moveDetails, accessDetails, inventory, setMoveDetails } = useMoveStore()

    // Run the exact same calculateQuote the production system uses
    const result = useMemo(() => {
        try {
            return calculateQuote(inventory, moveDetails, accessDetails, INVENTORY_ITEMS, {})
        } catch (e) {
            return null
        }
    }, [inventory, moveDetails, accessDetails])


    // Raw codes — null means unresolved
    const rawPickupCode = detectCityCode(moveDetails.pickupAddress, moveDetails.pickupAddressComponents, moveDetails.pickupLatLng);
    const rawDropoffCode = detectCityCode(moveDetails.dropoffAddress, moveDetails.dropoffAddressComponents, moveDetails.dropoffLatLng);

    // Extract province from Google address_components
    const getProvince = (components) => {
        if (!components || !Array.isArray(components)) return null
        const prov = components.find(c => c.types?.includes('administrative_area_level_1'))
        return prov ? prov.long_name : null
    }
    const getLocality = (components) => {
        if (!components || !Array.isArray(components)) return null
        const loc = components.find(c => c.types?.includes('locality'))
            || components.find(c => c.types?.includes('sublocality_level_1'))
            || components.find(c => c.types?.includes('administrative_area_level_2'))
        return loc ? loc.long_name : null
    }
    const pickupProvince = getProvince(moveDetails.pickupAddressComponents)
    const dropoffProvince = getProvince(moveDetails.dropoffAddressComponents)
    const pickupLocality = getLocality(moveDetails.pickupAddressComponents)
    const dropoffLocality = getLocality(moveDetails.dropoffAddressComponents)

    const outlineProvinces = [
        'free state', 'limpopo', 'mpumalanga', 'north west', 'northern cape',
        'mpumulanga', 'mphumulanga', 
        'potchefstroom', 'klerksdorp', 'rustenburg', 
        'bloemfontein', 'polokwane', 'nelspruit', 'mbombela', 
        'kimberley', 'upington'
    ];
    
    // Text-based outline province detection (address string or components)
    const textIsOutline = [moveDetails.pickupAddress, moveDetails.dropoffAddress].some(addr =>
        addr && outlineProvinces.some(prov => addr.toLowerCase().includes(prov))
    );
    const isOutlineProv = (prov) => prov && outlineProvinces.some(o => prov.toLowerCase().includes(o))

    const formatCityDisplay = (rawCode, province, locality) => {
        if (rawCode) {
            return province ? `${rawCode} (${province})` : rawCode
        }
        const loc = locality || 'Unknown'
        if ((province && isOutlineProv(province)) || textIsOutline) {
            return `🚫 OUTLINE — ${loc}, ${province}`
        }
        if (province) {
            return `⚠️ ${loc}, ${province} (no hub match)`
        }
        return '⚠️ Unresolved (no address data)'
    }

    // Cross-address match fallback: if one is resolved and other is null, copy it
    let pickupCityCode = rawPickupCode;
    let dropoffCityCode = rawDropoffCode;
    if (pickupCityCode && !dropoffCityCode) dropoffCityCode = pickupCityCode;
    if (dropoffCityCode && !pickupCityCode) pickupCityCode = dropoffCityCode;

    // Absolute fallback if both are completely unresolved (for rate display only)
    if (!pickupCityCode) pickupCityCode = CITY_CODES.JHB;
    if (!dropoffCityCode) dropoffCityCode = CITY_CODES.JHB;

    const depotCity = pickupCityCode || 'JHB'
    const depotAddress = DEPOT_LOCATIONS[depotCity] || DEPOT_LOCATIONS.JHB
    const bd = moveDetails.tripBreakdown

    // Volume
    let totalVolume = 0
    let boxQty = 0
    Object.entries(inventory || {}).forEach(([idKey, qty]) => {
        const [itemId] = idKey.split('_')
        const item = INVENTORY_ITEMS.find(i => i.id === itemId)
        if (item) {
            totalVolume += item.volume * qty
            if (itemId === 'boxes' || itemId.startsWith('boxes-')) {
                boxQty += qty
            }
        }
    })

    // Add ordered boxes from moveDetails
    const orderedSt7Boxes = moveDetails.st7Boxes || 0;
    const orderedLinenBoxes = moveDetails.linenBoxes || 0;
    totalVolume += (orderedSt7Boxes * 4.25) + (orderedLinenBoxes * 8);
    boxQty += orderedSt7Boxes + orderedLinenBoxes;

    // Vehicle selection (mirroring moveStore logic)
    const isNational = result?.isNationalMove || false
    const cityRates = LOCAL_VEHICLE_RATES[pickupCityCode] || LOCAL_VEHICLE_RATES[CITY_CODES.JHB]
    const vehicleList = Array.isArray(cityRates) ? cityRates : LOCAL_VEHICLE_RATES[CITY_CODES.JHB]
    const volumeForVehicle = totalVolume
    const assignedVehicle = !isNational
        ? (vehicleList.find(v => v.capacityCuFt >= volumeForVehicle) || vehicleList[vehicleList.length - 1])
        : null

    // National route
    const routeKey = pickupCityCode && dropoffCityCode ? `${pickupCityCode}-${dropoffCityCode}` : null
    const nationalRate = routeKey ? NATIONAL_RATES[routeKey] : null

    // Costs
    const totalBillableKm = parseFloat(moveDetails.totalBillableDistance) || parseFloat(moveDetails.distanceKm) || 0
    const rawTransport = assignedVehicle ? totalBillableKm * (assignedVehicle.ratePerKm || 0) : 0
    const rawVolume = assignedVehicle ? totalVolume * (assignedVehicle.ratePerCuFt || 0) : 0
    const rawSubtotal = rawTransport + rawVolume
    const minApplied = !isNational && rawSubtotal < PRICING_CONSTANTS.minOrder
    const localSubtotal = minApplied ? PRICING_CONSTANTS.minOrder : rawSubtotal

    const natVolumeCost = nationalRate ? Math.max(totalVolume * nationalRate.ratePerCuFt, nationalRate.minCharge) : 0
    const natMinApplied = nationalRate && (totalVolume * nationalRate.ratePerCuFt) < nationalRate.minCharge



    // Build per-item wrapping/packaging breakdown
    const wrappingLines = []
    Object.entries(inventory || {}).forEach(([idKey, qty]) => {
        const [itemId] = idKey.split('_')
        const item = INVENTORY_ITEMS.find(i => i.id === itemId)
        if (!item) return
        
        const sleeves = getPlasticSleevesCount(item, idKey)
        if (sleeves > 0) {
            wrappingLines.push({
                name: item.name,
                type: 'Plastic Sleeves',
                qty,
                sleeves,
                rate: sleeves * 55,
                total: qty * sleeves * 55
            })
        }
        
        // Match the same logic as moveStore: appliesWrapping or isGlassOrMarble
        const variation = idKey.split('_')[1] || ''
        const isGlassOrMarble = variation === 'Glass' || variation === 'Marble'
        const isStandardOrWood = variation === 'Standard Wood/Other' || variation === 'Standard' || variation === 'Wood'
        const appliesWrapping = item.autoPackagingType === 'Wrapping' && !isStandardOrWood
        
        if (appliesWrapping || isGlassOrMarble || variation.includes('Wrapped')) {
            const rate = item.volume * 5.90
            wrappingLines.push({
                name: item.name,
                type: 'Special Wrapping',
                qty,
                rate,
                total: qty * rate
            })
        }
    })

    const hasData = moveDetails.pickupAddress && moveDetails.dropoffAddress

    return (
        <div className="w-full bg-slate-900 rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/60">
                <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                    <FlaskConical size={14} className="text-amber-400" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">Test Mode Inspector</p>
                    <p className="text-[9px] text-slate-500 font-medium">Live calculation breakdown — not visible to customers</p>
                </div>
            </div>

            <div className="p-3 space-y-3">
                {hasData && (
                    <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Inspector Payment Method</p>
                            <p className="text-[9px] text-slate-500 font-medium mt-0.5">Toggle to see Payflex surcharge calculations</p>
                        </div>
                        <select 
                            className="bg-slate-900 text-xs text-white border border-slate-700 rounded px-2 py-1 font-bold outline-none cursor-pointer"
                            value={moveDetails.paymentMethod || 'eft'}
                            onChange={e => setMoveDetails({ paymentMethod: e.target.value })}
                        >
                            <option value="eft">EFT / Debit Card (Standard)</option>
                            <option value="payflex">Payflex (+7% Surcharge)</option>
                        </select>
                    </div>
                )}

                {!hasData && (
                    <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/40">
                        <AlertCircle size={14} className="text-slate-500" />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Enter pickup & dropoff addresses to see the calculation breakdown</p>
                    </div>
                )}

                {/* SECTION 1: ADDRESSES & CITY DETECTION */}
                {hasData && (
                    <Section title="1. Address & City Detection" icon={MapPin} color="blue">
                        <Row label="Pickup City Detected" value={rawPickupCode ? rawPickupCode : '🚫 OUTLINE / UNRESOLVED AREA (no hub match)'} warn={!rawPickupCode} />
                        <Row label="Dropoff City Detected" value={rawDropoffCode ? rawDropoffCode : '🚫 OUTLINE / UNRESOLVED AREA (no hub match)'} warn={!rawDropoffCode} />
                        {(!rawPickupCode || !rawDropoffCode) && (
                            <Row label="Fallback for calc" value={`Using ${pickupCityCode} rates (display only — quote will be blocked)`} warn />
                        )}
                        <Row label="Move Type" value={isNational ? '🛣️ NATIONAL (volume-based)' : '🏙️ LOCAL (distance + volume)'} highlight={!isNational} warn={isNational} />
                        {!isNational && <Row label="Depot Used" value={depotAddress} />}
                    </Section>
                )}

                {/* SECTION 2: DISTANCE CALCULATION */}
                {hasData && !isNational && (
                    <Section title="2. Distance (Google Maps)" icon={Truck} color={bd ? 'emerald' : 'amber'}>
                        {bd ? (
                            <>
                                <Row label="Depot → Pickup" value={`${bd.depotToPickup} km`} />
                                <Row label="Pickup → Dropoff" value={`${bd.pickupToDropoff} km`} />
                                <Row label="Dropoff → Depot" value={`${bd.dropoffToDepot} km`} />
                                <Row label="Total Billable KM" value={`${totalBillableKm} km`} highlight />
                                <Row label="Method" value={bd.method === 'distance_matrix' ? '✅ Google Maps Distance Matrix' : '⚠️ Haversine Fallback'} warn={bd.method !== 'distance_matrix'} />
                            </>
                        ) : (
                            <Row label="Status" value={totalBillableKm > 0 ? `${totalBillableKm} km (stored)` : '⏳ Awaiting address selection from Google dropdown'} warn />
                        )}
                    </Section>
                )}

                {/* SECTION 3: INVENTORY & VOLUME */}
                <Section title="3. Inventory & Volume" icon={Package} color="slate">
                        <Row label="Total Items" value={Object.values(inventory).reduce((a, b) => a + b, 0)} />
                        <Row label="Total Volume" value={`${totalVolume} cuft`} highlight />
                        {!isNational && assignedVehicle && (
                            <>
                                <Row label="Assigned Vehicle" value={assignedVehicle.name} />
                                <Row label="Vehicle Capacity" value={`${assignedVehicle.capacityCuFt} cuft`} />
                            </>
                        )}
                        {isNational && nationalRate && (
                            <>
                                <Row label="Route" value={routeKey} />
                                <Row label="Rate per cuft" value={R(nationalRate.ratePerCuFt)} />
                                <Row label="Min Charge" value={R(nationalRate.minCharge)} />
                            </>
                        )}
                </Section>

                {/* SECTION 4: CALCULATION ENGINE */}
                {hasData && (
                    <Section title="4. Calculation Engine" icon={Calculator} color={result?.needsQuoteRequest ? 'red' : (isNational ? 'amber' : 'slate')}>
                        {result?.needsQuoteRequest && (
                            <div className="mb-2 p-2 bg-red-950/50 border border-red-800 text-red-200 text-[10px] rounded-lg text-left">
                                <strong>⚠️ REFER TO OFFICE / CUSTOM QUOTE REQUIRED</strong><br/>
                                This move involves outline regions or depot logistics &gt; 80km. Automated pricing is blocked for customers.
                            </div>
                        )}
                        {!isNational ? (
                            <>
                                <Row label="Rate per km" value={R(assignedVehicle?.ratePerKm)} mono />
                                <Row label="Rate per cuft" value={R(assignedVehicle?.ratePerCuFt)} mono />
                                <div className="my-1.5 border-t border-slate-700/40" />
                                <Row label="Transport Cost" value={`${totalBillableKm} km × ${R(assignedVehicle?.ratePerKm)} = ${R(rawTransport)}`} mono />
                                <Row label="Volume Cost" value={`${totalVolume} cuft × ${R(assignedVehicle?.ratePerCuFt)} = ${R(rawVolume)}`} mono />
                                <Row label="Raw Subtotal" value={R(rawSubtotal)} mono />
                                <div className="my-1.5 border-t border-slate-700/40" />
                                <Row
                                    label="Min Charge Applied?"
                                    value={minApplied ? `✅ YES → raised from ${R(rawSubtotal)} to ${R(PRICING_CONSTANTS.minOrder)}` : `✗ Not needed (${R(rawSubtotal)} > R2,600)`}
                                    warn={minApplied}
                                    highlight={!minApplied}
                                />
                                <Row label="Local Subtotal (ex-VAT)" value={R(localSubtotal)} highlight />
                            </>
                        ) : (
                            <>
                                <Row label="Volume × Rate" value={nationalRate ? `${totalVolume} cuft × ${R(nationalRate.ratePerCuFt)} = ${R(totalVolume * (nationalRate?.ratePerCuFt || 0))}` : '—'} mono />
                                <Row
                                    label="Min Charge Applied?"
                                    value={natMinApplied ? `✅ YES → raised to ${R(nationalRate?.minCharge)}` : `✗ Not needed`}
                                    warn={natMinApplied}
                                />
                                <Row label="National Subtotal (ex-VAT)" value={R(natVolumeCost)} highlight />
                            </>
                        )}
                    </Section>
                )}

                {/* SECTION 5: ADDITIONAL COSTS */}
                {result && (
                    <Section title="5. Additional Costs" icon={BadgeCheck} color="amber">

                        {/* Access fees */}
                        <Row label="Access Fees (stairs/lift)" value={result.breakdown?.access > 0 ? R(result.breakdown.access) : '✓ None'} warn={result.breakdown?.access > 0} />
                        {result.breakdown?.access > 0 && result.breakdown?.detailedAccess && (
                            Array.isArray(result.breakdown.detailedAccess) 
                                ? result.breakdown.detailedAccess.map((d, i) => (
                                    <Row key={i} label={`  └ ${d.split(':')[0]?.trim()}`} value={d.split(':')[1]?.trim() || ''} />
                                ))
                                : <Row label="  └ Detail" value={result.breakdown.detailedAccess} />
                        )}

                        {/* Shuttle */}
                        {result.breakdown?.shuttleCost > 0 && (
                            <Row label="Shuttle Vehicle" value={`R ${result.breakdown.shuttleCost.toFixed(2)}`} warn />
                        )}

                        {/* Additional crew (heavy items) */}
                        <Row label="Heavy Item Crew" value={result.breakdown?.crew > 0 ? `${R(result.breakdown.crew)} (2 crew @ R550)` : '✓ None'} warn={result.breakdown?.crew > 0} />

                        {/* Extra depot distance fees */}
                        <Row label="Depot Distance Surcharge" value={result.breakdown?.extraDistance > 0 ? R(result.breakdown.extraDistance) : '✓ None'} warn={result.breakdown?.extraDistance > 0} />
                        {result.breakdown?.extraDistance > 0 && (
                            <Row label="  └ Detail" value={result.breakdown.detailedExtraDistance} />
                        )}

                        {/* Box Supplies (Step 2) */}
                        {result?.breakdown?.packaging > 0 ? (
                            <Row label={`Box Supplies / Packaging ${moveDetails?.st7Boxes > 0 ? `(${moveDetails.st7Boxes} Std x R${(moveDetails.packagingOption === 'boxes_only' ? PACKAGING_RATES.sendMeBoxesOnly.st7 : PACKAGING_RATES.boxesAndPacking.st7).toFixed(0)})` : ''} ${moveDetails?.linenBoxes > 0 ? `(${moveDetails.linenBoxes} Linen x R${(moveDetails.packagingOption === 'boxes_only' ? PACKAGING_RATES.sendMeBoxesOnly.linen : PACKAGING_RATES.boxesAndPacking.linen).toFixed(0)})` : ''}`} value={R(result.breakdown.packaging)} warn />
                        ) : (
                            <Row label="Box Supplies / Packaging" value="✓ None" />
                        )}

                        {/* Auto-packaging (wrapping) — per-item breakdown */}
                        {wrappingLines.length > 0 ? (
                            <>
                                <Row label="Auto Wrapping / Packaging" value={R(wrappingLines.reduce((s,l) => s + l.total, 0))} warn />
                                {wrappingLines.map((l, i) => (
                                    <Row
                                        key={i}
                                        label={`  └ ${l.name} (${l.type})`}
                                        value={l.sleeves ? `${l.qty} item(s) × ${l.sleeves} sleeves @ R55 = ${R(l.total)}` : `${l.qty} × ${R(l.rate)} = ${R(l.total)}`}
                                        mono
                                    />
                                ))}
                            </>
                        ) : (
                            <Row label="Auto Wrapping / Packaging" value="✓ None" />
                        )}

                        {/* Move Protection Cost (For Testing Visibility) */}
                        {result.breakdown?.moveProtectionCost > 0 && (
                            <Row label="Move Protection Cost (Included in Transport)" value={`R ${result.breakdown.moveProtectionCost.toFixed(2)}`} />
                        )}

                        {/* Documentation fee */}
                        <Row label="Documentation Fee" value="R 175.00" />

                        {/* Mid-month discount */}
                        {result.discount > 0 && (
                            <Row label="Mid-Month Discount (10%)" value={`− ${R(result.discount)}`} highlight />
                        )}

                        <div className="my-1.5 border-t border-amber-700/40" />

                        {/* Running total check */}
                        <Row label="Total Additional Costs" value={R(
                            (result.breakdown?.access || 0) +
                            (result.breakdown?.crew || 0) +
                            (result.breakdown?.extraDistance || 0) +
                            (result.breakdown?.shuttleCost || 0) +
                            (result.packagingCost || 0) +
                            (result.autoPackagingCost || 0) +
                            175 // doc fee
                        )} warn />
                    </Section>
                )}

                {/* SECTION 6: FINAL TOTALS */}
                {result && (
                    <Section title="6. Final Totals" icon={BadgeCheck} color="emerald">
                        <Row label="Base Cost (transport + volume)" value={R((result.breakdown?.transport || 0) + (result.breakdown?.volume || 0))} mono />
                        <Row label="Additional Costs" value={R(
                            (result.breakdown?.access || 0) +
                            (result.breakdown?.crew || 0) +
                            (result.breakdown?.extraDistance || 0) +
                            (result.breakdown?.shuttleCost || 0) +
                            (result.packagingCost || 0) +
                            (result.autoPackagingCost || 0) +
                            175
                        )} mono />
                        {result.discount > 0 && (
                            <Row label="Discount Applied" value={`− ${R(result.discount)}`} highlight mono />
                        )}
                        <Row label="Subtotal (ex-VAT)" value={R(result.subTotal)} mono />
                        <Row label="VAT (15%)" value={R(result.vat)} mono />
                        {result.payflexSurcharge > 0 && (
                            <Row label="Payflex Surcharge (7%)" value={`+ ${R(result.payflexSurcharge)}`} highlight mono />
                        )}
                        <div className="py-2 mt-1 rounded-lg bg-emerald-900/30 border border-emerald-700/40 px-3 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">TOTAL (incl. VAT)</span>
                            <span className="text-base font-black text-emerald-300 font-mono">{R(result.total)}</span>
                        </div>
                        <Row label="Vehicle" value={result.breakdown?.vehicleType || 'Standard National Link'} />
                        <Row label="Total Volume" value={`${result.totalVolumeCuFt || totalVolume} cuft`} />
                    </Section>
                )}

                {/* Footer notice */}
                <p className="text-[9px] text-slate-600 text-center font-bold uppercase tracking-widest pt-1">
                    🔒 Test mode — quotes not saved to database
                </p>
            </div>
        </div>
    )
}
