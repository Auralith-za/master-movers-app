import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Step1Details from './Step1Details'
import Step2Access from './Step2Access'
import Step3Inventory from './Step3Inventory'
import Step4Summary from './Step4Summary'

const STEPS = [
    { id: 'details', label: 'Details', path: '/quote' },
    { id: 'access', label: 'Site Access', path: '/quote/access' },
    { id: 'inventory', label: 'Inventory', path: '/quote/inventory' },
    { id: 'summary', label: 'Summary', path: '/quote/summary' },
]

export default function MoveWizard() {
    const location = useLocation()
    const navigate = useNavigate()

    const currentStepIndex = STEPS.findIndex(s => s.path === location.pathname) || 0

    return (
        <div className="max-w-6xl mx-auto">
            {/* Stepper Header */}
            <div className="mb-8 max-w-4xl mx-auto text-center md:text-left">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Plan Your Move</h1>
                <p className="text-slate-500">Get an instant quote in 4 easy steps.</p>

                {/* Progress Bar */}
                <div className="mt-6 relative">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600 transition-all duration-500"
                        />
                    </div>

                    <div className="flex justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {STEPS.map((step, idx) => (
                            <div
                                key={step.id}
                                className={clsx(
                                    "cursor-pointer transition-colors hover:text-primary-600 flex flex-col items-center md:items-start",
                                    idx <= currentStepIndex ? "text-primary-600 font-bold" : "text-gray-400"
                                )}
                                onClick={() => navigate(step.path)}
                            >
                                <span>{step.label}</span>
                            </div>
                        ))}
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
                        <Route path="summary" element={<Step4Summary />} />
                    </Routes>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
