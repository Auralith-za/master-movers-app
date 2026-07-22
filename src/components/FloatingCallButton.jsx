import React from 'react';
import { Phone } from 'lucide-react';
import { trackLeadConversion } from '../lib/gtag';

export default function FloatingCallButton() {
    const handleCallClick = () => {
        // Fire Google Ads lead conversion every time someone taps the call button
        trackLeadConversion({ label: 'Phone Button Click', value: 0 })
    }

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3">
            <a 
                href="tel:+27114937569" 
                onClick={handleCallClick}
                className="flex items-center gap-3 bg-red-600 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-red-700 transition-all hover:scale-105 active:scale-95 group"
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
            <a
                href="https://wa.me/27679126122"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLeadConversion({ label: 'WhatsApp Click', value: 0 })}
                className="flex items-center justify-center bg-[#25D366] text-white w-[58px] h-[58px] rounded-full shadow-2xl hover:bg-[#20bd5a] transition-all hover:scale-105 active:scale-95"
                title="Chat on WhatsApp"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" height="32" width="32">
                    <path d="M12.031 0C5.392 0 .012 5.38.012 12.019c0 2.122.553 4.192 1.602 6.012L.012 24l6.115-1.604a11.972 11.972 0 005.904 1.554h.005c6.637 0 12.017-5.381 12.017-12.02C24.053 5.38 18.67 0 12.031 0zm0 21.966a9.96 9.96 0 01-5.076-1.385l-.364-.216-3.771.989.998-3.676-.237-.377a9.932 9.932 0 01-1.523-5.283c0-5.513 4.488-10.001 10.003-10.001 5.514 0 10.001 4.488 10.001 10.001s-4.487 10.001-10.001 10.001zm5.492-7.502c-.302-.151-1.782-.879-2.059-.98-.277-.101-.48-.151-.681.151-.202.302-.779.98-.956 1.182-.176.202-.353.227-.655.076-1.553-.78-2.673-1.464-3.69-3.26-.201-.353-.021-.546.13-.697.135-.136.302-.353.454-.529.151-.176.202-.302.302-.504.101-.202.05-.378-.025-.529-.076-.151-.681-1.64-.932-2.245-.246-.591-.496-.511-.681-.52-.176-.01-.378-.01-.58-.01-.202 0-.529.076-.806.378-.277.302-1.058 1.034-1.058 2.52s1.083 2.923 1.235 3.125c.151.202 2.129 3.25 5.156 4.557.72.311 1.282.497 1.722.636.723.23 1.38.197 1.897.12.58-.086 1.782-.729 2.034-1.435.252-.706.252-1.311.176-1.436-.075-.126-.277-.202-.579-.353z" />
                </svg>
            </a>
        </div>
    );
}
