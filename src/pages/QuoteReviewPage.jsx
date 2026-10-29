import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MapPin, Calendar, Truck, Package, ShieldCheck, CheckCircle, CreditCard, Phone, XCircle } from 'lucide-react';
import { INVENTORY_ITEMS } from '../features/inventory/data/mockItems';
import { calculateQuote } from '../features/inventory/store/moveStore';
import TermsModal from '../components/TermsModal';
import PayFastCheckout from '../features/payment/PayFastCheckout';
import PayflexCheckout from '../features/payment/PayflexCheckout';
import { emailService } from '../services/emailService';
import { normalizeInventory, parseInventoryKey } from '../utils/inventoryUtils';
import { generateSignedTermsCertificatePng } from '../utils/termsCertificate';
import { getBranchDetails } from '../utils/branchDetails';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export default function QuoteReviewPage() {
    const { id: pathId } = useParams();
    const [searchParams] = useSearchParams();
    // Support both /quote/review/:id (path param) AND /quote-review?id=UUID (query param from email)
    const id = pathId || searchParams.get('id');
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [signatureData, setSignatureData] = useState(null);
    const [appSettings, setAppSettings] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const branch = quote ? getBranchDetails(quote) : null;

    const handleRejectQuote = async () => {
        if (!quote) return;
        setIsSubmitting(true);
        const reason = rejectReason || 'No reason provided';
        try {
            const { error } = await supabase
                .from('quotes')
                .update({
                    status: 'rejected',
                    rejection_reason: reason,
                    items_json: {
                        ...(quote.items_json || {}),
                        rejection_reason: reason
                    }
                })
                .eq('id', quote.id);

            if (error) console.error('Error updating quote status to rejected:', error);

            await emailService.sendRejectedQuoteAlert({
                quoteId: quote.id,
                clientName: quote.client_name,
                clientEmail: quote.client_email,
                clientPhone: quote.client_phone,
                moveDate: quote.move_date,
                pickupAddress: quote.pickup_address,
                dropoffAddress: quote.dropoff_address,
                total: quote.total_price || 0,
                vat: (quote.total_price || 0) - ((quote.total_price || 0) / 1.15),
                subTotal: (quote.total_price || 0) / 1.15,
                inventory: quote.items_json?.items || quote.items_json || {},
                breakdown: {},
                inventoryItems: INVENTORY_ITEMS,
                rejectionReason: reason
            });

            setQuote(prev => prev ? { ...prev, status: 'rejected', rejection_reason: reason } : null);
            setShowRejectModal(false);
            alert("Thank you for your feedback! Our team has been notified. ✅");
        } catch (err) {
            console.error('Error rejecting quote:', err);
            alert("Feedback submitted. Thank you!");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchQuote();
    }, [id]);

    const fetchQuote = async () => {
        try {
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Reconcile pricing with calculateQuote to protect against stale draft pricing or accidental mid-month discount on month-end moves
            if (data && !data.is_manual_price) {
                try {
                    const inventory = data.items_json?.items || data.items_json || data.inventory || {};
                    const customProductsList = data.custom_products || data.items_json?.custom_products || [];
                    const sendMeBoxes = data.items_json?.packaging_details?.send_me_boxes || data.send_me_boxes;
                    const boxesAndPacking = data.items_json?.packaging_details?.boxes_and_packing || data.boxes_and_packing;
                    const moveDetails = {
                        pickupAddress: data.pickup_address,
                        dropoffAddress: data.dropoff_address,
                        distanceKm: Number(data.distance_km || 0),
                        totalBillableDistance: Number(data.distance_km || 0),
                        tripBreakdown: data.trip_breakdown || data.items_json?.trip_breakdown,
                        moveDate: data.move_date,
                        packagingOption: data.packaging_option,
                        st7Boxes: data.st7_boxes,
                        linenBoxes: data.linen_boxes,
                        sendMeBoxes,
                        boxesAndPacking,
                        insuranceEnabled: data.insurance_enabled,
                        isSharedLoad: data.is_shared_load,
                        paymentMethod: data.payment_method || 'eft',
                        customProducts: customProductsList,
                        includeBoxVolume: data.items_json?.include_box_volume,
                        disableShuttle: Boolean(data.items_json?.disable_shuttle),
                        shuttleOverride: data.items_json?.shuttle_override
                    };
                    const calc = calculateQuote(
                        inventory,
                        moveDetails,
                        data.access_details || {},
                        INVENTORY_ITEMS,
                        data.items_json?.manual_service_charges || {},
                        0,
                        data.items_json?.special_wrapping || {},
                        true
                    );
                    if (calc && !calc.error && calc.total > 0) {
                        const dbTotal = Number(data.total_price || 0);
                        const calcTotal = Number(calc.total);
                        if (Math.abs(dbTotal - calcTotal) > 1.0) {
                            console.warn(`[QuoteReview] Reconciling stale quote total: DB had R${dbTotal.toFixed(2)}, recalculated is R${calcTotal.toFixed(2)}`);
                            data.total_price = calcTotal;
                            data.total_volume = Number(calc.totalVolume || data.total_volume || 0);
                            supabase.from('quotes').update({
                                total_price: calcTotal,
                                total_volume: data.total_volume
                            }).eq('id', data.id).then(({ error: syncErr }) => {
                                if (syncErr) console.error('[QuoteReview] Error syncing price to DB:', syncErr);
                            });
                        }
                    }
                } catch (calcErr) {
                    console.error('[QuoteReview] Error reconciling quote price:', calcErr);
                }
            }

            setQuote(data);
            if (data.terms_accepted) {
                setAccepted(true);
                setSignatureData(data.signature_json);
            }

            // Fetch app_settings
            const { data: settingsData } = await supabase.from('app_settings').select('*').eq('id', 1).single();
            if (settingsData) setAppSettings(settingsData);

        } catch (error) {
            console.error('Error fetching quote or settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptTerms = async (sig) => {
        try {
            // 1. Generate high-resolution Signed Terms PNG Certificate
            let signedPngBase64 = null
            try {
                const cert = await generateSignedTermsCertificatePng({
                    quote,
                    signatureName: sig.name,
                    signatureIdNumber: sig.idNumber,
                    signatureDate: sig.date
                })
                signedPngBase64 = cert.base64
            } catch (certErr) {
                console.warn('Canvas certificate generation warning:', certErr)
            }

            // 2. Call edge function
            let edgeSucceeded = false
            try {
                const response = await fetch(`${SUPABASE_URL}/functions/v1/accept-terms`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({
                        quoteId: id,
                        signatureName: sig.name,
                        idNumber: sig.idNumber,
                        signatureIdNumber: sig.idNumber,
                        signatureDate: sig.date
                    })
                })
                if (response.ok) edgeSucceeded = true
            } catch (err) {
                console.warn('accept-terms edge function call error:', err)
            }

            // 3. Always ensure signature_json with idNumber is directly persisted to Supabase quotes table
            const signaturePayload = {
                name: sig.name,
                idNumber: sig.idNumber,
                id_number: sig.idNumber,
                date: sig.date
            }

            const { error: dbError } = await supabase
                .from('quotes')
                .update({
                    terms_accepted: true,
                    signature_json: signaturePayload,
                    status: 'pending_payment'
                })
                .eq('id', id)

            if (dbError && !edgeSucceeded) {
                console.error('Database update error:', dbError)
                throw new Error(dbError.message || 'Failed to save acceptance')
            }

            // 4. Log activity
            try {
                await supabase.from('quote_activities').insert([{
                    quote_id: id,
                    activity_type: 'system',
                    content: `Client accepted and signed terms. Signature: ${sig.name} (ID: ${sig.idNumber})`
                }])
            } catch (actErr) {
                console.warn('Could not record activity:', actErr)
            }

            // 5. Send email to admin with attached PNG certificate
            try {
                await emailService.sendTermsAcceptedAlert({
                    quoteId: quote.id,
                    clientName: quote.client_name,
                    clientEmail: quote.client_email,
                    clientPhone: quote.client_phone,
                    pickupAddress: quote.pickup_address,
                    dropoffAddress: quote.dropoff_address,
                    moveDate: quote.move_date,
                    total: quote.total_price || 0,
                    signatureName: sig.name,
                    signatureIdNumber: sig.idNumber,
                    signatureDate: sig.date,
                    signedPngBase64: signedPngBase64
                })
            } catch (emailErr) {
                console.warn('Failed to dispatch admin terms accepted alert email:', emailErr)
            }

            setAccepted(true);
            setSignatureData(signaturePayload);
            setIsTermsOpen(false);

        } catch (error) {
            console.error('Error accepting terms:', error);
            alert('Failed to save acceptance. Please try again.');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
    );

    if (!quote) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Quote Not Found</h1>
                <p className="text-slate-500 mt-2">The link you followed may be expired or invalid.</p>
            </div>
        </div>
    );

    const inventory = normalizeInventory(quote.items_json || quote.inventory);

    const customProductsList = quote.custom_products || quote.items_json?.custom_products || [];
    const customVolSum = (Array.isArray(customProductsList) ? customProductsList : []).reduce((sum, p) => sum + (parseFloat(p.cubes || p.cuft || 0) * (parseInt(p.quantity || p.qty || 1) || 1)), 0);

    const st7Count = quote.st7_boxes || quote.items_json?.st7Boxes || 0;
    const linenCount = quote.linen_boxes || quote.items_json?.linenBoxes || 0;
    const potentialBoxVol = (st7Count * 4.25) + (linenCount * 8);

    const includeBoxVolume = quote.items_json?.include_box_volume !== undefined 
        ? Boolean(quote.items_json?.include_box_volume)
        : (customVolSum === 0);

    // Calculate total volume / cubes
    let quoteVolume = Number(quote.total_volume || quote.items_json?.total_volume || 0);

    // Reconcile if quoteVolume was inflated with box volume on a custom cubes quote
    if (customVolSum > 0 && !includeBoxVolume && quoteVolume > customVolSum && Math.abs(quoteVolume - (customVolSum + potentialBoxVol)) < 0.1) {
        quoteVolume = customVolSum;
    }

    if (!quoteVolume && inventory && typeof inventory === 'object') {
        Object.entries(inventory).forEach(([idKey, qty]) => {
            if (!qty || qty <= 0) return;
            const cleanId = idKey.split('__room:')[0].split('_')[0];
            const item = INVENTORY_ITEMS.find(i => i.id === cleanId);
            if (item && item.volume) quoteVolume += item.volume * qty;
        });
        if (includeBoxVolume) {
            quoteVolume += potentialBoxVol;
        }
        quoteVolume += customVolSum;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-36 sm:pb-24">
            <div className="bg-slate-900 overflow-hidden relative">
                <div className="max-w-4xl mx-auto px-6 py-16 text-white relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">Official Quote</span>
                            <h1 className="text-4xl font-black tracking-tight">Review Your Move</h1>
                            <p className="text-slate-400 mt-2">Reference: <span className="text-white font-bold tracking-wider">#{quote.id.toString().substring(0, 8).toUpperCase()}</span></p>
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-full text-xs font-black text-red-400 uppercase tracking-wider">
                                📦 Total Volume / Cubes: {quoteVolume.toFixed(2)} ft³
                            </div>
                        </div>
                        {appSettings && appSettings.pricing_active === false ? (
                            <div className="text-right max-w-sm">
                                <h2 className="text-xl font-black text-amber-400 leading-tight uppercase">
                                    {appSettings.maintenance_heading || 'Pricing Temporarily Unavailable'}
                                </h2>
                            </div>
                        ) : (() => {
                            const inclVatTotal = quote.total_price || 0;
                            const exVatSubtotal = inclVatTotal / 1.15;
                            const vatAmount = inclVatTotal - exVatSubtotal;
                            return (
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Subtotal (ex-VAT)</div>
                                    <div className="text-lg font-bold text-slate-300 whitespace-nowrap">R {exVatSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-2 mb-1">VAT (15%)</div>
                                    <div className="text-lg font-bold text-slate-300 whitespace-nowrap">R {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <div className="w-full border-t border-slate-700 my-2"></div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Total (incl. VAT)</div>
                                    <div className="text-4xl font-black text-red-500 whitespace-nowrap">R {inclVatTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Total Amount Incl. VAT</p>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 -mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Route Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                            {(() => {
                                const originType = (quote.access_details?.origin?.type || 'house').toUpperCase();
                                const destType = (quote.access_details?.destination?.type || 'house').toUpperCase();
                                const compDetails = quote.items_json?.company_details || quote.company_details || {};
                                return (
                                    <>
                                        <h2 className="text-lg font-black text-slate-900 mb-6 flex flex-wrap items-center justify-between gap-2">
                                            <span className="flex items-center gap-2">
                                                <Truck size={20} className="text-red-500" /> Logistics Information
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                                                    {originType === 'OFFICE' ? '🏢' : '🏠'} {originType} → {destType === 'OFFICE' ? '🏢' : '🏠'} {destType}
                                                </span>
                                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                                                    {quoteVolume.toFixed(2)} ft³ Cubes
                                                </span>
                                            </div>
                                        </h2>

                                        {(compDetails.companyName || compDetails.companyVat || compDetails.companyDetails) && (
                                            <div className="mb-6 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
                                                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">
                                                    🏢 Corporate / Company Move Details
                                                </span>
                                                {compDetails.companyName && (
                                                    <p className="text-sm font-black text-slate-900">{compDetails.companyName}</p>
                                                )}
                                                {compDetails.companyVat && (
                                                    <p className="text-xs font-semibold text-slate-600">VAT / Reg No: {compDetails.companyVat}</p>
                                                )}
                                                {compDetails.companyDetails && (
                                                    <p className="text-xs text-slate-600">{compDetails.companyDetails}</p>
                                                )}
                                            </div>
                                        )}

                                        {branch && (
                                            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-600">
                                                <div>
                                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block mb-0.5">
                                                        📍 Issuing Branch
                                                    </span>
                                                    <p className="font-bold text-slate-900 text-sm">{branch.name}</p>
                                                    <p className="text-slate-600 mt-0.5">{branch.fullAddress}</p>
                                                </div>
                                                <div className="text-left md:text-right shrink-0 space-y-0.5 text-[11px]">
                                                    <p className="font-semibold text-slate-700">Tel: <a href={`tel:${branch.telLink}`} className="text-red-600 hover:underline">{branch.telDisplay}</a></p>
                                                    <p><a href={`mailto:${branch.email}`} className="text-slate-600 hover:underline">{branch.email}</a></p>
                                                    <p className="text-[10px] text-slate-400">VAT: {branch.vatRegNo} · Co Reg: {branch.coRegNo}</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Pickup Address</label>
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                {(quote.access_details?.origin?.type || 'house').toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-slate-900 font-bold leading-snug mt-1">{quote.pickup_address}</p>
                                    </div>
                                    {(quote.items_json?.extraCollections || quote.extra_collections || []).map((coll, idx) => (
                                        <div key={idx} className="p-3 bg-red-50/50 border border-red-100 rounded-xl space-y-1">
                                            <label className="text-[9px] font-black text-red-600 uppercase tracking-widest block">Collection #{idx + 2}</label>
                                            <p className="text-xs font-bold text-slate-800">{coll.address}</p>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <Calendar size={16} />
                                        <span>Move Date: <strong className="text-slate-800">{new Date(quote.move_date).toLocaleDateString()}</strong></span>
                                    </div>
                                    {(quote.packing_date || quote.items_json?.packing_date || quote.items_json?.packingDate) && (
                                        <div className="flex items-center gap-2 text-indigo-700 text-sm bg-indigo-50/80 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                                            <Package size={16} className="text-indigo-600" />
                                            <span>Pack / Wrap Date: <strong className="text-indigo-900">{new Date(quote.packing_date || quote.items_json?.packing_date || quote.items_json?.packingDate).toLocaleDateString()}</strong></span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Dropoff Address</label>
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                {(quote.access_details?.destination?.type || 'house').toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-slate-900 font-bold leading-snug mt-1">{quote.dropoff_address}</p>
                                    </div>
                                    {(quote.items_json?.extraDrops || quote.extra_drops || []).map((drop, idx) => (
                                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest block">Drop-off #{idx + 2}</label>
                                            <p className="text-xs font-bold text-slate-800">{drop.address}</p>
                                        </div>
                                    ))}
                                    {quote.is_shared_load && (
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <Truck size={16} />
                                            <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Shared Load</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Access & Additional Stops Card */}
                        {quote.access_details && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-4">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <MapPin size={20} className="text-red-500" /> Access & Site Details
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                                        <p className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Pickup Access</p>
                                        <p className="text-slate-700 font-bold">
                                            {quote.access_details.origin?.type?.toUpperCase() || 'HOUSE'} • Floor {quote.access_details.origin?.floorLevel || 0}
                                        </p>
                                        <p className="text-slate-500">
                                            Elevator: {quote.access_details.origin?.elevator ? 'Yes' : 'No'} • Stairs: {quote.access_details.origin?.stairs ? 'Yes' : 'No'}
                                        </p>
                                        {quote.access_details.origin?.longCarryMeters > 0 && (
                                            <p className="text-slate-600 font-semibold">Long Carry: {quote.access_details.origin.longCarryMeters}m</p>
                                        )}
                                        {quote.access_details.origin?.notes && (
                                            <p className="text-slate-500 italic mt-1">"{quote.access_details.origin.notes}"</p>
                                        )}
                                    </div>

                                    {(quote.items_json?.extraCollections || quote.extra_collections || []).map((coll, idx) => {
                                        const acc = quote.access_details[`extra_coll_${idx}`] || {};
                                        return (
                                            <div key={`extra_coll_${idx}`} className="p-4 bg-red-50/50 rounded-xl space-y-1">
                                                <p className="font-black text-red-700 uppercase tracking-widest text-[10px]">Collection #{idx + 2} Access</p>
                                                <p className="text-slate-700 font-bold">
                                                    {(acc.type || 'HOUSE').toUpperCase()} • Floor {acc.floorLevel || 0}
                                                </p>
                                                <p className="text-slate-500">
                                                    Elevator: {acc.elevator ? 'Yes' : 'No'} • Stairs: {acc.stairs ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                        );
                                    })}

                                    <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                                        <p className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Dropoff Access</p>
                                        <p className="text-slate-700 font-bold">
                                            {quote.access_details.destination?.type?.toUpperCase() || 'HOUSE'} • Floor {quote.access_details.destination?.floorLevel || 0}
                                        </p>
                                        <p className="text-slate-500">
                                            Elevator: {quote.access_details.destination?.elevator ? 'Yes' : 'No'} • Stairs: {quote.access_details.destination?.stairs ? 'Yes' : 'No'}
                                        </p>
                                        {quote.access_details.destination?.longCarryMeters > 0 && (
                                            <p className="text-slate-600 font-semibold">Long Carry: {quote.access_details.destination.longCarryMeters}m</p>
                                        )}
                                        {quote.access_details.destination?.notes && (
                                            <p className="text-slate-500 italic mt-1">"{quote.access_details.destination.notes}"</p>
                                        )}
                                    </div>

                                    {(quote.items_json?.extraDrops || quote.extra_drops || []).map((drop, idx) => {
                                        const acc = quote.access_details[`extra_drop_${idx}`] || {};
                                        return (
                                            <div key={`extra_drop_${idx}`} className="p-4 bg-slate-100 rounded-xl space-y-1">
                                                <p className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Drop-off #{idx + 2} Access</p>
                                                <p className="text-slate-700 font-bold">
                                                    {(acc.type || 'HOUSE').toUpperCase()} • Floor {acc.floorLevel || 0}
                                                </p>
                                                <p className="text-slate-500">
                                                    Elevator: {acc.elevator ? 'Yes' : 'No'} • Stairs: {acc.stairs ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Customer Notes Card */}
                        {(quote.general_notes || quote.notes) && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                                <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
                                    💬 Special Notes & Instructions
                                </h2>
                                <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-900 font-medium leading-relaxed">
                                    "{quote.general_notes || quote.notes}"
                                </div>
                            </div>
                        )}

                        {/* Move Services Card */}
                        {(quote.packaging_option !== 'none' || quote.insurance_enabled) && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                                <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <ShieldCheck size={20} className="text-emerald-500" /> Included Services
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {quote.packaging_option !== 'none' && (() => {
                                        const pkgDetails = quote.items_json?.packaging_details || quote.packaging_details;
                                        const sendDetails = pkgDetails?.send_me_boxes || quote.send_me_boxes;
                                        const packDetails = pkgDetails?.boxes_and_packing || quote.boxes_and_packing;

                                        const hasSend = Boolean(sendDetails?.enabled || quote.packaging_option === 'boxes_only' || quote.packaging_option === 'both');
                                        const hasPack = Boolean(packDetails?.enabled || quote.packaging_option === 'boxes_and_packing' || quote.packaging_option === 'both');

                                        const sendSt7 = sendDetails?.st7 ?? (quote.packaging_option === 'boxes_only' ? quote.st7_boxes : 0);
                                        const sendLinen = sendDetails?.linen ?? (quote.packaging_option === 'boxes_only' ? quote.linen_boxes : 0);

                                        const packSt7 = packDetails?.st7 ?? (quote.packaging_option === 'boxes_and_packing' ? quote.st7_boxes : 0);
                                        const packLinen = packDetails?.linen ?? (quote.packaging_option === 'boxes_and_packing' ? quote.linen_boxes : 0);

                                        if (hasSend && hasPack && (quote.packaging_option === 'both' || (pkgDetails && sendDetails?.enabled && packDetails?.enabled))) {
                                            return (
                                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                                    <Package className="text-red-600 flex-shrink-0" size={24} />
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 uppercase">Packaging: Box Delivery &amp; Full Packing</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                            Pre-Delivery: {sendSt7 || 0}x ST7, {sendLinen || 0}x Linen (+ Delivery Fee) | Packing: {packSt7 || 0}x ST7, {packLinen || 0}x Linen
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                                <Package className="text-red-600 flex-shrink-0" size={24} />
                                                <div>
                                                    <p className="text-xs font-black text-slate-900 uppercase">
                                                        Packaging: {quote.packaging_option === 'boxes_only' ? 'Supplying Boxes (Pre-Move Delivery)' : 'Full Packing Service'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                        {quote.st7_boxes || 0}x ST7, {quote.linen_boxes || 0}x Linen
                                                        {quote.packaging_option === 'boxes_only' ? ' (Delivery Fee Included)' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {quote.insurance_enabled && (
                                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <ShieldCheck className="text-emerald-600" size={24} />
                                            <div>
                                                <p className="text-xs font-black text-emerald-900 uppercase tracking-tight">MasterCare Protection</p>
                                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest leading-none mt-1">Comprehensive Cover Included</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Inventory Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Package size={20} className="text-red-500" /> Quoted Inventory List
                                </span>
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                                    Total Cubes: {quoteVolume.toFixed(2)} ft³
                                </span>
                            </h2>
                            <div className="space-y-5">
                                {(() => {
                                    const groupedRooms = {};
                                    Object.entries(inventory).forEach(([idKey, qty]) => {
                                        if (!qty || qty <= 0) return;
                                        const { itemId, variation, room } = parseInventoryKey(idKey);
                                        const item = INVENTORY_ITEMS.find(i => i.id === itemId);
                                        const itemName = item ? item.name : itemId.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                        const roomName = room || item?.category || 'General Furniture';
                                        if (!groupedRooms[roomName]) groupedRooms[roomName] = [];
                                        groupedRooms[roomName].push({
                                            key: idKey,
                                            name: itemName,
                                            variation,
                                            qty,
                                            image: item?.image,
                                            isCustom: false
                                        });
                                    });

                                    const customProds = quote.custom_products || quote.items_json?.custom_products || [];
                                    const unassignedCustom = [];
                                    (Array.isArray(customProds) ? customProds : []).forEach((prod, idx) => {
                                        const qty = Math.max(1, parseInt(prod.quantity || prod.qty) || 1);
                                        const vol = parseFloat(prod.cubes || prod.cuft || 0);
                                        const entry = {
                                            key: prod.id || `custom_${idx}`,
                                            name: prod.name,
                                            variation: vol > 0 ? `${vol.toFixed(2)} ft³` : null,
                                            qty,
                                            isCustom: true
                                        };
                                        if (prod.room && prod.room !== 'Custom Products & Manual Items') {
                                            if (!groupedRooms[prod.room]) groupedRooms[prod.room] = [];
                                            groupedRooms[prod.room].push(entry);
                                        } else {
                                            unassignedCustom.push(entry);
                                        }
                                    });

                                    if (unassignedCustom.length > 0) {
                                        groupedRooms['Custom Products & Manual Items'] = unassignedCustom;
                                    }

                                    return Object.entries(groupedRooms).map(([roomLabel, items]) => (
                                        <div key={roomLabel} className="space-y-1.5">
                                            <div className="flex items-center justify-between bg-slate-100/80 px-3 py-1.5 rounded-lg">
                                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                                                    {roomLabel === 'Custom Products & Manual Items' ? '📦 ' : '🏠 '}{roomLabel}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500">
                                                    {items.reduce((s, i) => s + i.qty, 0)} item(s)
                                                </span>
                                            </div>
                                            <div className="divide-y divide-slate-50 pl-1">
                                                {items.map(entry => (
                                                    <div key={entry.key} className="flex justify-between items-center py-2 hover:bg-slate-50/50 px-2 rounded transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                                                                {entry.image
                                                                    ? <img src={entry.image} alt={entry.name} className="w-6 h-6 object-contain" onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='📦'; }} />
                                                                    : <span className="text-lg">📦</span>
                                                                }
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-700">
                                                                {entry.name} {entry.variation ? <span className="text-slate-400 font-normal">({entry.variation})</span> : ''}
                                                            </span>
                                                        </div>
                                                        <span className="text-slate-900 font-black">x{entry.qty}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Action Column */}
                    <div className="space-y-6">
                        
                        {/* Status Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                            {!accepted ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <h3 className="font-black text-slate-900 uppercase tracking-tight">Accept Terms</h3>
                                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">Please review and accept our contract terms and Protection Cover policy to proceed.</p>
                                    <button 
                                        onClick={() => setIsTermsOpen(true)}
                                        className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest mt-6 hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                                    >
                                        Sign & Accept
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="font-black text-slate-900 uppercase tracking-tight">Terms Accepted</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase mt-2">Electronically Signed By</p>
                                    <p className="font-serif text-lg text-slate-800 italic mt-1 font-bold">{signatureData?.name}</p>
                                    {(signatureData?.idNumber || signatureData?.id_number) && (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100/60 border border-emerald-200 rounded-full text-xs font-mono font-bold text-slate-700 mt-1.5 shadow-xs">
                                            <span className="text-[10px] uppercase font-bold text-slate-500">ID / Passport:</span>
                                            <span>{signatureData.idNumber || signatureData.id_number}</span>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-slate-400 mt-1">{signatureData?.date ? new Date(signatureData.date).toLocaleString() : ''}</p>
                                </div>
                            )}
                        </div>

                        {/* Payment Card / Maintenance Banner */}
                        {appSettings && appSettings.pricing_active === false ? (
                            <div className="bg-amber-50 rounded-2xl p-6 text-center border border-amber-200">
                                <p className="text-amber-800 text-sm font-medium mb-4 leading-relaxed">
                                    {appSettings.maintenance_message || 'We are currently updating our pricing engine. Please contact the Master Movers team to complete your quote.'}
                                </p>
                            </div>
                        ) : quote?.status === 'booked_paid' ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 text-center space-y-3">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle size={30} />
                                </div>
                                <h3 className="font-black text-slate-900 uppercase tracking-tight">Payment Completed</h3>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    Thank you! Your payment has been received and your moving booking is confirmed.
                                </p>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-black text-emerald-700">
                                    ✓ Booking Confirmed &amp; Paid
                                </div>
                            </div>
                        ) : (
                        <div className={clsx(
                            "bg-white rounded-2xl shadow-sm border border-slate-100 p-8 transition-all duration-500",
                            !accepted ? "opacity-40 grayscale pointer-events-none" : "opacity-100"
                        )}>
                            <div className="flex items-center gap-2 mb-6">
                                <CreditCard className="text-indigo-600" size={20} />
                                <h3 className="font-black text-slate-900 uppercase tracking-tight">Secure Payment</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block px-1">Credit Card / EFT</label>
                                    <PayFastCheckout 
                                        quote={{
                                            id: quote.id,
                                            total_price: quote.total_price,
                                            client_name: quote.client_name,
                                            client_email: quote.client_email,
                                            pickup_address: quote.pickup_address,
                                            dropoff_address: quote.dropoff_address
                                        }}
                                    />
                                </div>
                                <div className="pt-6 border-t border-slate-50">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block px-1">Buy Now, Pay Later</label>
                                    <PayflexCheckout 
                                        quote={{
                                            id: quote.id,
                                            total_price: quote.total_price,
                                            client_name: quote.client_name,
                                            client_email: quote.client_email,
                                            client_phone: quote.client_phone
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Support & Decline Card */}
                        <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100 space-y-3">
                            <p className="text-xs text-slate-500 font-medium mb-1">Questions or need to decline?</p>
                            <a href="tel:+27114937569" className="w-full py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                <Phone size={16} /> Contact a Human
                            </a>
                            {quote?.status !== 'rejected' ? (
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-xs hover:bg-red-100 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                                >
                                    <XCircle size={16} /> Decline / Reject Quote
                                </button>
                            ) : (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                                    <p className="font-bold">Quote Declined</p>
                                    <p className="text-[11px] opacity-80 mt-0.5">Reason: "{quote.rejection_reason || 'No reason provided'}"</p>
                                </div>
                            )}
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-1">Office: {branch ? branch.telDisplay : '+27 11 493 7569'}</p>
                        </div>
                    </div>
                </div>

                {/* General Disclaimer */}
                <div className="mt-8 bg-white shadow-sm border border-slate-200 p-6 rounded-2xl text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-black flex items-center justify-center gap-2">
                        <CheckCircle size={14} className="text-slate-400" />
                        Important Notice
                    </p>
                    <p className="text-sm font-medium text-slate-600 mt-2 max-w-2xl mx-auto leading-relaxed">
                        Prices of quotes are not final until approved by the Master Movers team to see if inventory and location were entered correctly.
                    </p>
                </div>
            </div>

            {/* Reject Reason Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
                        <div className="text-4xl text-center mb-3">💬</div>
                        <h3 className="text-xl font-black text-center text-slate-900 mb-1">Thanks for your feedback</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">
                            Please let us know why you're declining this quote today — our team will follow up with you.
                        </p>
                        <textarea
                            className="w-full rounded-xl border-2 border-gray-200 p-4 text-sm text-slate-700 focus:border-[#e31837] focus:outline-none resize-none h-28 mb-4"
                            placeholder="e.g. Price is too high, need to think about it, dates changed..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                        />
                        <div className="flex flex-col gap-3">
                            <button
                                className="w-full py-4 rounded-2xl bg-[#e31837] hover:bg-[#c0152f] text-white font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50"
                                disabled={isSubmitting}
                                onClick={handleRejectQuote}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit & Close'}
                            </button>
                            <button
                                className="w-full py-3 text-slate-400 text-sm hover:text-slate-600"
                                onClick={() => setShowRejectModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <TermsModal 
                isOpen={isTermsOpen} 
                onClose={() => setIsTermsOpen(false)}
                onAccept={handleAcceptTerms}
            />
        </div>
    );
}

function clsx(...classes) {
    return classes.filter(Boolean).join(' ');
}
