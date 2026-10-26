import React from 'react'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import MoveAssistantChat from '../components/common/MoveAssistantChat'
import FloatingCallButton from '../components/FloatingCallButton'
import FloatingCareersButton from '../components/common/FloatingCareersButton'
import { Outlet, useLocation } from 'react-router-dom'

export default function WebsiteLayout() {
    const location = useLocation()
    const isQuoteOrPayment = location.pathname.startsWith('/quote-review') || 
                             location.pathname.startsWith('/quote/review') || 
                             location.pathname.startsWith('/payment')

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pt-24">
                <Outlet />
            </main>
            <Footer />
            <FloatingCallButton />
            {!isQuoteOrPayment && <FloatingCareersButton />}
        </div>
    )
}
