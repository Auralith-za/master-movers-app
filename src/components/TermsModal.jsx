import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck } from 'lucide-react';

export default function TermsModal({ isOpen, onClose, onAccept }) {
    const [name, setName] = useState('');
    const [accepted, setAccepted] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-red-600" size={24} />
                        <h2 className="text-xl font-black text-slate-900 uppercase">Terms & Conditions</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 text-sm text-slate-600">
                    <section>
                        <h3 className="font-bold text-slate-900 mb-2">1. Booking & Payment</h3>
                        <p>All bookings are subject to availability. A quote is only confirmed once the full payment (or agreed deposit) is received. Payment must be made at least 48 hours prior to the move date.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-slate-900 mb-2">2. Inventory Accuracy</h3>
                        <p>The quote is based on the inventory list provided. Master Movers reserves the right to adjust final pricing on move day if the actual volume significantly exceeds the quoted volume.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-slate-900 mb-2">3. Insurance & Liability</h3>
                        <p>Standard Goods in Transit (GIT) insurance is included. This covers fire, collision, and hijacking. For breakage cover, a "Platinum" all-risk insurance package must be selected separately.</p>
                    </section>
                    <section>
                        <h3 className="font-bold text-slate-900 mb-2">4. Access & Surcharges</h3>
                        <p>Prices assume standard access. Surcharges apply for long carries (>30m), stairs (above 1st floor without elevator), or required shuttle vehicles.</p>
                    </section>
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mt-4">
                        <p className="text-red-900 font-bold mb-4">I hereby confirm that the inventory list is correct and I accept the terms and conditions outlined above.</p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    id="acceptTerms"
                                    className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                                    checked={accepted}
                                    onChange={(e) => setAccepted(e.target.checked)}
                                />
                                <label htmlFor="acceptTerms" className="text-sm font-semibold text-red-800">I accept the standard moving terms</label>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-1">Electronic Signature (Type Full Name)</label>
                                <input 
                                    type="text"
                                    className="w-full border-b-2 border-red-100 focus:border-red-600 outline-none py-2 font-serif text-lg bg-transparent"
                                    placeholder="Your Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-gray-100 rounded-b-3xl">
                    <button 
                        className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                        disabled={!accepted || !name.trim()}
                        onClick={() => onAccept({ name, date: new Date().toISOString() })}
                    >
                        <CheckCircle size={20} />
                        Accept & Sign Quote
                    </button>
                </div>
            </div>
        </div>
    );
}
