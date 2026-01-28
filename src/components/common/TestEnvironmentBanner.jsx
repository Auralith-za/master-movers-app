import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function TestEnvironmentBanner() {
    return (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                <div className="text-center">
                    <p className="font-bold text-lg">TEST ENVIRONMENT - FOR QUOTING ONLY</p>
                    <p className="text-sm opacity-90">Navigation to other pages is disabled in this test mode</p>
                </div>
                <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
        </div>
    );
}
