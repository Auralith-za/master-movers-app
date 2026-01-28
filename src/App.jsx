import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import WebsiteLayout from './layouts/WebsiteLayout'
import TestModeLayout from './layouts/TestModeLayout'
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
import CommercialMoversPage from './pages/services/CommercialMoversPage'
import ResidentialMoversPage from './pages/services/ResidentialMoversPage'
import InternationalMoversPage from './pages/services/InternationalMoversPage'
import CommercialStoragePage from './pages/services/storage/CommercialStoragePage'
import CapeTownStoragePage from './pages/services/storage/CapeTownStoragePage'
import DurbanStoragePage from './pages/services/storage/DurbanStoragePage'
import JohannesburgStoragePage from './pages/services/storage/JohannesburgStoragePage'
import BlogPage from './pages/BlogPage'
import CarMovingPage from './pages/services/CarMovingPage'
import HomeCleaningPage from './pages/services/HomeCleaningPage'
import DeclutteringPage from './pages/services/DeclutteringPage'
import HeritageMoversPage from './pages/services/HeritageMoversPage'
import PetMovingPage from './pages/services/PetMovingPage'
import SupabaseTest from './pages/debug/SupabaseTest'
import MoversDurban from './pages/locations/MoversDurban'

function App() {
  return (
    <Router>
      <Routes>
        {/* Website Routes */}
        <Route element={<WebsiteLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/commercial-movers" element={<CommercialMoversPage />} />
          <Route path="/services/residential-movers" element={<ResidentialMoversPage />} />
          <Route path="/services/international-movers" element={<InternationalMoversPage />} />
          <Route path="/services/storage/commercial" element={<CommercialStoragePage />} />
          <Route path="/services/storage/cape-town-storage" element={<CapeTownStoragePage />} />
          <Route path="/services/storage/durban-storage" element={<DurbanStoragePage />} />
          <Route path="/services/storage/johannesburg-storage" element={<JohannesburgStoragePage />} />

          {/* New Service Routes */}
          <Route path="/services/car-moving" element={<CarMovingPage />} />
          <Route path="/services/home-cleaning" element={<HomeCleaningPage />} />
          <Route path="/services/decluttering" element={<DeclutteringPage />} />
          <Route path="/services/heritage-moves" element={<HeritageMoversPage />} />
          <Route path="/services/pet-moving" element={<PetMovingPage />} />

          <Route path="/debug/supabase" element={<SupabaseTest />} />

          <Route path="/blog" element={<BlogPage />} />
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/packing-materials" element={<PackingMaterialsPage />} />
          <Route path="/areas-we-serve" element={<AreasPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/payment/success" element={<SuccessPage />} />
          <Route path="/payment/cancel" element={<CancelPage />} />
          <Route path="/locations/movers-durban" element={<MoversDurban />} />
          {/* Add other site pages here later */}
        </Route>

        {/* Test Mode Quote Flow - Restricted navigation for sales testing */}
        <Route path="/quote-test" element={<TestModeLayout />}>
          <Route index element={<MoveWizard />} />
          <Route path="*" element={<MoveWizard />} />
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
