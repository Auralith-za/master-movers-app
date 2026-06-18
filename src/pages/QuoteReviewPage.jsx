import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MapPin, Calendar, Truck, Package, ShieldCheck, CheckCircle, CreditCard, Phone } from 'lucide-react';
import { INVENTORY_ITEMS } from '../features/inventory/data/mockItems';
import TermsModal from '../components/TermsModal';
import PayFastCheckout from '../features/payment/PayFastCheckout';
import PayflexCheckout from '../features/payment/PayflexCheckout';

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
            // Use edge function (service role) to bypass RLS on the public quote page
            const response = await fetch(`${SUPABASE_URL}/functions/v1/accept-terms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    quoteId: id,
                    signatureName: sig.name
                })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Failed to save acceptance')

            setAccepted(true);
            setSignatureData(sig);
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

    const inventory = quote.items_json?.items || quote.items_json || {};

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="bg-slate-900 overflow-hidden relative">
                <div className="max-w-4xl mx-auto px-6 py-16 text-white relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">Official Quote</span>
                            <h1 className="text-4xl font-black tracking-tight">Review Your Move</h1>
                            <p className="text-slate-400 mt-2">Reference: <span className="text-white font-bold tracking-wider">#{quote.id.toString().substring(0, 8).toUpperCase()}</span></p>
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
                                    <div className="text-lg font-bold text-slate-300">R {exVatSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-2 mb-1">VAT (15%)</div>
                                    <div className="text-lg font-bold text-slate-300">R {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <div className="w-full border-t border-slate-700 my-2"></div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Total (incl. VAT)</div>
                                    <div className="text-4xl font-black text-red-500">R {inclVatTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
                            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Truck size={20} className="text-red-500" /> Logistics Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pickup Address</label>
                                        <p className="text-slate-900 font-bold leading-snug mt-1">{quote.pickup_address}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <Calendar size={16} />
                                        <span>Scheduled for: <strong className="text-slate-800">{new Date(quote.move_date).toLocaleDateString()}</strong></span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dropoff Address</label>
                                        <p className="text-slate-900 font-bold leading-snug mt-1">{quote.dropoff_address}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <Truck size={16} />
                                        <span>Distance: <strong className="text-slate-800">{quote.distance_km} km</strong> {quote.is_shared_load && <span className="ml-2 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Shared Load</span>}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Move Services Card */}
                        {(quote.packaging_option !== 'none' || quote.insurance_enabled) && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                                <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <ShieldCheck size={20} className="text-emerald-500" /> Included Services
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {quote.packaging_option !== 'none' && (
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                            <Package className="text-red-600" size={24} />
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase">Packaging: {quote.packaging_option === 'boxes_only' ? 'Supplying Boxes' : 'Full Packing Service'}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{quote.st7_boxes || 0}x ST7, {quote.linen_boxes || 0}x Linen</p>
                                            </div>
                                        </div>
                                    )}
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
                            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Package size={20} className="text-red-500" /> Quoted Inventory List
                            </h2>
                            <div className="space-y-3">
                                {Object.entries(inventory).map(([idKey, qty]) => {
                                    const [id, variation] = idKey.split('_');
                                    const item = INVENTORY_ITEMS.find(i => i.id === id);
                                    return (
                                        <div key={idKey} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                                                    {item?.image
                                                        ? <img src={item.image} alt={item.name} className="w-6 h-6 object-contain" onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='📦'; }} />
                                                        : <span className="text-lg">📦</span>
                                                    }
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{item?.name || idKey} {variation ? <span className="text-slate-400 font-normal">({variation})</span> : ''}</span>
                                            </div>
                                            <span className="text-slate-900 font-black">x{qty}</span>
                                        </div>
                                    );
                                })}
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
                                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">Please review and accept our contract terms and insurance policy to proceed.</p>
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
                                    <p className="text-[10px] text-slate-400 mt-1">{new Date(signatureData?.date).toLocaleString()}</p>
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

                        {/* Support Card */}
                        <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
                            <p className="text-xs text-slate-500 font-medium mb-3">Questions about your quote?</p>
                            <a href="tel:+27114937569" className="w-full py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 mb-2">
                                <Phone size={16} /> Contact a Human
                            </a>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Office: +27 11 493 7569</p>
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
