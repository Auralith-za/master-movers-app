import React from 'react'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import MoveAssistantChat from '../components/common/MoveAssistantChat'
import { Outlet } from 'react-router-dom'

export default function WebsiteLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pt-20">
                <Outlet />
            </main>
            <Footer />
            <MoveAssistantChat />
        </div>
    )
}
