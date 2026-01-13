import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import WebsiteLayout from './layouts/WebsiteLayout'
import MoveWizard from './features/move-flow/MoveWizard'
import LandingPage from './pages/LandingPage'
import ServicesPage from './pages/ServicesPage'
import ContactPage from './pages/ContactPage'
import PackingMaterialsPage from './pages/PackingMaterialsPage'
import AreasPage from './pages/AreasPage'
import LoginPage from './pages/LoginPage'
import SuccessPage from './pages/payment/SuccessPage'
import CancelPage from './pages/payment/CancelPage'
import DashboardPage from './pages/admin/DashboardPage'
import QuotesPage from './pages/admin/QuotesPage'
import QuoteDetailPage from './pages/admin/QuoteDetailPage'
import LeadsPage from './pages/admin/LeadsPage'

function App() {
  return (
    <Router>
      <Routes>
        {/* Website Routes */}
        <Route element={<WebsiteLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/packing-materials" element={<PackingMaterialsPage />} />
          <Route path="/areas-we-serve" element={<AreasPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/payment/success" element={<SuccessPage />} />
          <Route path="/payment/cancel" element={<CancelPage />} />
          {/* Add other site pages here later */}
        </Route>

        {/* Quote Flow - Use WebsiteLayout to show full header */}
        <Route path="/quote" element={<WebsiteLayout />}>
          <Route index element={<MoveWizard />} />
          <Route path="*" element={<MoveWizard />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="quotes" element={<QuotesPage />} />
          <Route path="quotes/:id" element={<QuoteDetailPage />} />
          <Route path="leads" element={<LeadsPage />} />
          {/* Add more admin routes here */}
        </Route>
      </Routes>
    </Router>
  )
}

export default App
