import React from 'react';
import { Phone } from 'lucide-react';

export default function FloatingCallButton() {
    return (
        <a 
            href="tel:+27114937569" 
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-red-600 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-red-700 transition-all hover:scale-105 active:scale-95 group"
        >
            <div className="relative">
                <Phone size={24} className="animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-none mb-1">Call us at any time</span>
                <span className="text-lg font-black leading-none">+27 11 493 7569</span>
            </div>
        </a>
    );
}
