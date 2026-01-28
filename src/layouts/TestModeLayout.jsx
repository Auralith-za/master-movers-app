import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import TestEnvironmentBanner from '../components/common/TestEnvironmentBanner';
import TestModeAlert from '../components/common/TestModeAlert';
import { isTestMode, TEST_MODE_MESSAGE } from '../lib/testMode';

export default function TestModeLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [showAlert, setShowAlert] = useState(false);

    // Intercept navigation attempts
    useEffect(() => {
        const handleClick = (e) => {
            // Check if the clicked element or its parent is a link
            const link = e.target.closest('a');

            if (link && link.href) {
                const url = new URL(link.href);
                const targetPath = url.pathname;

                // Allow navigation within the quote-test flow
                if (targetPath.startsWith('/quote-test')) {
                    return; // Allow this navigation
                }

                // Block all other navigation - prevent BEFORE showing alert
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                // Show custom modal instead of alert
                setShowAlert(true);

                return false;
            }
        };

        // Add click listener to intercept all link clicks with capture phase
        document.addEventListener('click', handleClick, true);

        return () => {
            document.removeEventListener('click', handleClick, true);
        };
    }, [location]);

    // Prevent browser back/forward navigation outside quote flow
    useEffect(() => {
        const handlePopState = (e) => {
            if (!isTestMode(window.location.pathname)) {
                e.preventDefault();
                setShowAlert(true);
                navigate('/quote-test', { replace: true });
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate]);

    return (
        <div className="flex flex-col min-h-screen">
            {/* Fixed banner at the top */}
            <div className="fixed top-0 left-0 right-0 z-50">
                <TestEnvironmentBanner />
            </div>
            {/* Navbar with offset for banner */}
            <div className="mt-[72px]">
                <Navbar />
            </div>
            <main className="flex-1 pt-20">
                <Outlet />
            </main>
            <Footer />

            {/* Custom alert modal */}
            <TestModeAlert
                isOpen={showAlert}
                onClose={() => setShowAlert(false)}
                message={TEST_MODE_MESSAGE}
            />
        </div>
    );
}
