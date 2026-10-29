import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck } from 'lucide-react';

export default function TermsModal({ isOpen, onClose, onAccept }) {
    const [name, setName] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setIdNumber('');
            setAccepted(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isValid = accepted && name.trim().length > 0 && idNumber.trim().length > 0;

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl sm:rounded-t-3xl">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-red-600" size={24} />
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase">Terms &amp; Conditions</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors cursor-pointer" aria-label="Close terms modal">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-4 sm:space-y-6 text-xs sm:text-sm text-slate-600">
                    <section>
                        <h3 className="font-bold text-slate-900 mb-2">1. Booking &amp; Payment</h3>
                        <p>All bookings are subject to availability. A quote is only confirmed once the full payment (or agreed deposit) is received. Payment must be made at least 48 hours prior to the move date.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-slate-900 mb-2">2. Inventory Accuracy</h3>
                        <p>The quote is based on the inventory list provided. Master Movers reserves the right to adjust final pricing on move day if the actual volume significantly exceeds the quoted volume.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-slate-900 mb-2">3. Protection Cover &amp; Liability</h3>
                        <p>Standard Goods in Transit (GIT) Protection Cover is included. This covers fire, collision, and hijacking. For breakage cover, a &ldquo;Platinum&rdquo; all-risk Protection Cover package must be selected separately.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-slate-900 mb-2">4. Access &amp; Surcharges</h3>
                        <p>Prices assume standard access. Surcharges apply for long carries (&gt;30m), stairs (above 1st floor without elevator), or required shuttle vehicles.</p>
                    </section>

                    <div className="bg-red-50 p-5 sm:p-6 rounded-2xl border border-red-100 mt-4 space-y-4">
                        <p className="text-red-900 font-bold text-xs sm:text-sm leading-snug">
                            I hereby confirm that the inventory list is correct and I accept the terms and conditions outlined above.
                        </p>

                        <div className="flex items-center gap-3 pt-1">
                            <input 
                                type="checkbox" 
                                id="acceptTerms"
                                className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                            />
                            <label htmlFor="acceptTerms" className="text-xs sm:text-sm font-semibold text-red-800 cursor-pointer select-none">
                                I accept the standard moving terms
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-red-100">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">
                                    Electronic Signature (Full Name) <span className="text-red-600">*</span>
                                </label>
                                <input 
                                    type="text"
                                    className="w-full border-b-2 border-red-200 focus:border-red-600 outline-none py-2 font-serif text-base sm:text-lg bg-transparent text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:text-xs sm:placeholder:text-sm transition-colors"
                                    placeholder="Your Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">
                                    ID / Passport Number <span className="text-red-600">*</span>
                                </label>
                                <input 
                                    type="text"
                                    className="w-full border-b-2 border-red-200 focus:border-red-600 outline-none py-2 font-mono text-sm sm:text-base bg-transparent text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:text-xs sm:placeholder:text-sm tracking-wide transition-colors"
                                    placeholder="ID or Passport Number"
                                    value={idNumber}
                                    onChange={(e) => setIdNumber(e.target.value)}
                                    autoComplete="off"
                                    required
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                            * ID or Passport number is required for contract validation and transit insurance verification.
                        </p>
                    </div>
                </div>

                <div className="p-4 sm:p-6 bg-slate-50 border-t border-gray-100 rounded-b-2xl sm:rounded-b-3xl pb-8 sm:pb-6">
                    <button 
                        className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                        disabled={!isValid}
                        onClick={() => {
                            if (!isValid) return;
                            onAccept({
                                name: name.trim(),
                                idNumber: idNumber.trim(),
                                date: new Date().toISOString()
                            });
                        }}
                    >
                        <CheckCircle size={20} />
                        Accept &amp; Sign Quote
                    </button>
                </div>
            </div>
        </div>
    );
}
