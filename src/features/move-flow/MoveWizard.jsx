import React, { useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useMoveStore } from '../inventory/store/moveStore'
import { emailService } from '../../services/emailService'
import { INVENTORY_ITEMS } from '../inventory/data/mockItems'
import Step1Details from './Step1Details'
import Step2Access from './Step2Access'
import Step3Inventory from './Step3Inventory'
import Step4Summary from './Step4Summary'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// ─── Helper: send abandoned lead alert directly (no PDF, safe for tab close) ───
function sendInstantLeadAlert(quoteData) {
    if (!quoteData) return
    const { client_name, client_email, client_phone } = quoteData
    if (!client_email && !client_phone) return

    try {
        fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            keepalive: true, // survives tab close
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                type: 'abandoned_lead_alert',
                quoteData,
                pdfBase64: null,
                pdfFilename: null
            })
        })
    } catch (_) {
        // Silent fail — tab may be closing
    }
}

export default function MoveWizard() {
    const location = useLocation()
    const navigate = useNavigate()
    const { moveDetails, accessDetails, inventory, getTotals, submitQuote, lastSavedQuote } = useMoveStore()

    // Track whether a "new lead" alert has already been sent this session
    const leadAlertSentRef = useRef(false)
    // Track the latest saved quote for use inside event listeners (avoids stale closure)
    const lastSavedQuoteRef = useRef(lastSavedQuote)
    // Inactivity timer ref
    const inactivityTimerRef = useRef(null)

    // Keep lastSavedQuoteRef in sync
    useEffect(() => {
        lastSavedQuoteRef.current = lastSavedQuote
    }, [lastSavedQuote])

    // ─── Helper: has enough contact info to send a lead alert ───────────────
    const hasContactInfo = useCallback(() => {
        return !!(moveDetails?.contactEmail || moveDetails?.contactPhone)
    }, [moveDetails?.contactEmail, moveDetails?.contactPhone])

    // ─── 1. Debounced Auto-Save to Database ─────────────────────────────────
    useEffect(() => {
        if (!moveDetails?.contactEmail && !moveDetails?.contactPhone && !moveDetails?.contactName) return

        const timeoutId = setTimeout(() => {
            console.log("Auto-saving progress to database...")
            submitQuote({ status: lastSavedQuote?.status || 'new' }).catch(console.error)
        }, 3000)

        return () => clearTimeout(timeoutId)
    }, [moveDetails, accessDetails, inventory, submitQuote, lastSavedQuote?.status])

    // ─── 2. Inactivity Timer (2 min idle = send lead alert) ─────────────────
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)

        inactivityTimerRef.current = setTimeout(() => {
            if (!hasContactInfo()) return
            if (leadAlertSentRef.current) return

            const quote = lastSavedQuoteRef.current
            if (!quote) return

            console.log('⏰ 2-min inactivity detected — sending lead alert...')
            leadAlertSentRef.current = true
            sessionStorage.setItem('mm_lead_alert_sent', quote.id || 'sent')

            sendInstantLeadAlert(quote)
        }, 2 * 60 * 1000) // 2 minutes
    }, [hasContactInfo])

    useEffect(() => {
        // Only watch for inactivity when we have contact info to make it useful
        if (!hasContactInfo()) return

        // Restore dedup guard from sessionStorage
        const savedQuoteId = lastSavedQuote?.id
        if (savedQuoteId && sessionStorage.getItem('mm_lead_alert_sent') === String(savedQuoteId)) {
            leadAlertSentRef.current = true
            return // Already sent for this quote session
        }

        const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart']
        events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }))
        resetInactivityTimer() // Start immediately

        return () => {
            events.forEach(e => window.removeEventListener(e, resetInactivityTimer))
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
        }
    }, [hasContactInfo, resetInactivityTimer, lastSavedQuote?.id])

    // ─── 3. Tab Close / Navigate Away (beforeunload + visibilitychange) ─────
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (!hasContactInfo()) return
            if (leadAlertSentRef.current) return

            const quote = lastSavedQuoteRef.current
            if (!quote) return

            console.log('🚪 Tab closing — sending instant lead alert...')
            leadAlertSentRef.current = true
            sendInstantLeadAlert(quote)
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                if (!hasContactInfo()) return
                if (leadAlertSentRef.current) return

                const quote = lastSavedQuoteRef.current
                if (!quote) return

                console.log('👁 Page hidden — sending lead alert...')
                leadAlertSentRef.current = true
                sessionStorage.setItem('mm_lead_alert_sent', quote.id || 'sent')
                sendInstantLeadAlert(quote)
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [hasContactInfo])

    // ─── 4. "New Lead" Instant Email on first contact info capture ──────────
    //    Fires once as soon as the customer has been auto-saved with contact info
    const newLeadAlertSentRef = useRef(false)
    useEffect(() => {
        if (newLeadAlertSentRef.current) return
        if (!lastSavedQuote?.id) return
        if (!lastSavedQuote?.client_email && !lastSavedQuote?.client_phone) return

        // Don't send for admin-created quotes or test flows
        const currentBase = location.pathname.startsWith('/quote-test') ? '/quote-test' :
            location.pathname.startsWith('/admin/quotes/new') ? '/admin/quotes/new' : '/quote'
        if (currentBase !== '/quote') return

        // Check if this quote already had a new-lead alert sent
        const sentKey = `mm_new_lead_${lastSavedQuote.id}`
        if (sessionStorage.getItem(sentKey)) return

        // Don't re-send for quotes that are already past the lead stage
        if (['lead', 'abandoned', 'booked', 'confirmed'].includes(lastSavedQuote.status)) return

        console.log('⭐ New lead captured — sending instant new-lead alert...')
        newLeadAlertSentRef.current = true
        sessionStorage.setItem(sentKey, '1')

        sendInstantLeadAlert(lastSavedQuote)
    }, [lastSavedQuote?.id, lastSavedQuote?.client_email, lastSavedQuote?.client_phone, lastSavedQuote?.status, location.pathname])

    // ─── Determine base path & admin mode ────────────────────────────────────
    const basePath = location.pathname.startsWith('/quote-test') ? '/quote-test' :
        location.pathname.startsWith('/admin/quotes/new') ? '/admin/quotes/new' : '/quote'

    const isAdmin = basePath === '/admin/quotes/new'

    const STEPS = useMemo(() => [
        { id: 'details', label: 'Details', path: basePath },
        { id: 'access', label: 'Site Access', path: `${basePath}/access` },
        { id: 'inventory', label: 'Inventory', path: `${basePath}/inventory` },
        { id: 'summary', label: 'Summary', path: `${basePath}/summary` },
    ], [basePath])

    const currentStepIndex = STEPS.findIndex(s => s.path === location.pathname) !== -1
        ? STEPS.findIndex(s => s.path === location.pathname)
        : 0

    const isStepCompleted = (stepId) => {
        if (stepId === 'details') return true

        const step1Ok = !!(
            moveDetails?.pickupAddress &&
            moveDetails?.dropoffAddress &&
            moveDetails?.moveDate &&
            moveDetails?.contactName &&
            moveDetails?.surname &&
            moveDetails?.contactPhone &&
            moveDetails?.contactEmail &&
            moveDetails?.contactEmail.includes('@') &&
            moveDetails?.contactEmail.includes('.')
        )

        if (stepId === 'access') return step1Ok
        if (stepId === 'inventory') return step1Ok

        const hasInventory = Object.keys(inventory || {}).length > 0
        if (stepId === 'summary') return step1Ok && hasInventory

        return false
    }

    // Auto-redirect invalid step paths
    useEffect(() => {
        const currentStep = STEPS[currentStepIndex]
        if (currentStep) {
            if (currentStep.id === 'access' && !isStepCompleted('access')) {
                navigate(basePath, { replace: true })
            } else if (currentStep.id === 'inventory' && !isStepCompleted('inventory')) {
                navigate(basePath, { replace: true })
            } else if (currentStep.id === 'summary' && !isStepCompleted('summary')) {
                if (!isStepCompleted('inventory')) {
                    navigate(basePath, { replace: true })
                } else {
                    navigate(`${basePath}/inventory`, { replace: true })
                }
            }
        }
    }, [location.pathname, moveDetails, inventory, currentStepIndex, basePath, navigate])

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [location.pathname])

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
                            const isCompleted = idx < currentStepIndex
                            const isActive = idx === currentStepIndex
                            const isAllowed = isStepCompleted(step.id)

                            return (
                                <div
                                    key={step.id}
                                    className={clsx(
                                        "flex flex-col items-center group",
                                        isAllowed ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                                    )}
                                    onClick={() => {
                                        if (isAllowed) {
                                            navigate(step.path)
                                        }
                                    }}
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
                                        isActive ? "text-slate-900 opacity-100" :
                                            isAllowed ? "text-slate-400 opacity-50 group-hover:opacity-100" :
                                                "text-slate-300 opacity-40"
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                            )
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
