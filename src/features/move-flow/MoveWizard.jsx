import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Step1Details from './Step1Details'
import Step2Access from './Step2Access'
import Step3Inventory from './Step3Inventory'
import Step4Summary from './Step4Summary'

export default function MoveWizard() {
    const location = useLocation()
    const navigate = useNavigate()

    // Determine if we're in test mode or admin mode based on current path
    const basePath = location.pathname.startsWith('/quote-test') ? '/quote-test' : 
                     location.pathname.startsWith('/admin/quotes/new') ? '/admin/quotes/new' : '/quote';
    
    const isAdmin = basePath === '/admin/quotes/new';

    const STEPS = useMemo(() => [
        { id: 'details', label: 'Details', path: basePath },
        { id: 'access', label: 'Site Access', path: `${basePath}/access` },
        { id: 'inventory', label: 'Inventory', path: `${basePath}/inventory` },
        { id: 'summary', label: 'Summary', path: `${basePath}/summary` },
    ], [basePath]);

    const currentStepIndex = STEPS.findIndex(s => s.path === location.pathname) !== -1
        ? STEPS.findIndex(s => s.path === location.pathname)
        : 0;

    // Scroll to top on step change
    React.useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [location.pathname]);

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
            {/* Stepper Header */}
            <div className="mb-8 max-w-4xl mx-auto text-center md:text-left">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{isAdmin ? 'Create Manual Quote' : 'Plan Your Move'}</h1>
                <p className="text-slate-500">{isAdmin ? 'Step-by-step quote generation for internal processing.' : 'Get an instant quote in 4 easy steps.'}</p>

                {/* Modern Stepper */}
                <div className="mt-8 relative px-4">
                    {/* Background Line */}
                    <div className="absolute top-4 left-0 w-full h-1 bg-gray-100 rounded-full" />

                    {/* Active Progress Line */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                        className="absolute top-4 left-0 h-1 bg-red-600 rounded-full shadow-[0_0_10px_rgba(225,29,72,0.3)] z-10"
                        transition={{ duration: 0.6, ease: "circOut" }}
                    />

                    <div className="relative z-20 flex justify-between">
                        {STEPS.map((step, idx) => {
                            const isCompleted = idx < currentStepIndex;
                            const isActive = idx === currentStepIndex;

                            return (
                                <div
                                    key={step.id}
                                    className="flex flex-col items-center group cursor-pointer"
                                    onClick={() => navigate(step.path)}
                                >
                                    {/* Dot / Indicator */}
                                    <div className={clsx(
                                        "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 mb-2 font-bold text-xs",
                                        isCompleted ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20" :
                                            isActive ? "bg-white border-red-600 text-red-600 shadow-xl" :
                                                "bg-white border-gray-200 text-gray-400"
                                    )}>
                                        {isCompleted ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (idx + 1)}
                                    </div>

                                    {/* Label */}
                                    <span className={clsx(
                                        "text-[10px] uppercase tracking-widest font-black transition-all duration-300 md:block hidden",
                                        isActive ? "text-slate-900 opacity-100" : "text-slate-400 opacity-50 group-hover:opacity-100"
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    <Routes>
                        <Route index element={<Step1Details />} />
                        <Route path="access" element={<Step2Access />} />
                        <Route path="inventory" element={<Step3Inventory />} />
                        <Route path="summary" element={<Step4Summary submissionType={isAdmin ? 'admin' : (basePath === '/quote-test' ? 'test' : 'standard')} />} />
                    </Routes>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
