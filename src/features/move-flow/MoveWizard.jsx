import React, { useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useMoveStore } from '../inventory/store/moveStore'
import { detectCityCode } from '../inventory/data/pricingRates'
import { formatClientName } from '../../utils/quoteHelpers'
import { emailService } from '../../services/emailService'
import { INVENTORY_ITEMS } from '../inventory/data/mockItems'
import { hasCompletedEmailAndPhone, hasContactInfo, hasEarlyLeadInfo } from '../../lib/utils'
import Step1Details from './Step1Details'
import Step2Access from './Step2Access'
import Step3Inventory from './Step3Inventory'
import Step4Summary from './Step4Summary'
import TestCalcBreakdown from '../../components/TestCalcBreakdown'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// ─── Helper: send abandoned lead alert directly (no PDF, safe for tab close) ───
function sendInstantLeadAlert(quoteData) {
    if (!quoteData) return
    const email = quoteData.client_email || quoteData.contactEmail
    const phone = quoteData.client_phone || quoteData.contactPhone
    if (!hasContactInfo(email, phone)) {
        console.log('Skipping instant lead alert: valid email or phone number required.')
        return
    }

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

    const basePath = location.pathname.startsWith('/quote-test') ? '/quote-test' :
        location.pathname.startsWith('/admin/quotes/new') ? '/admin/quotes/new' : '/quote'
    const isAdmin = basePath === '/admin/quotes/new'
    const isTest = basePath === '/quote-test'

    // Track the latest saved quote for use inside effects
    const lastSavedQuoteRef = useRef(lastSavedQuote)

    // Keep lastSavedQuoteRef in sync
    useEffect(() => {
        lastSavedQuoteRef.current = lastSavedQuote
    }, [lastSavedQuote])

    // ─── Helper: has entered name and either phone or email to trigger auto-save/alert ─────────
    const hasLeadProgress = useCallback(() => {
        return hasEarlyLeadInfo(
            moveDetails?.contactName,
            moveDetails?.surname,
            moveDetails?.contactEmail,
            moveDetails?.contactPhone
        )
    }, [
        moveDetails?.contactName,
        moveDetails?.surname,
        moveDetails?.contactEmail,
        moveDetails?.contactPhone
    ])


    // ─── Auto-Reset if returning to an already completed quote ──────────────
    useEffect(() => {
        const currentBase = location.pathname.startsWith('/quote-test') ? '/quote-test' :
            location.pathname.startsWith('/admin/quotes/new') ? '/admin/quotes/new' : '/quote';
        const isOnStep1 = location.pathname === currentBase || location.pathname === currentBase + '/'

        if (!isOnStep1 || !lastSavedQuote) return

        // Always reset if the quote was fully completed
        if (['booked', 'paid', 'booked_paid', 'completed'].includes(lastSavedQuote.status)) {
            console.log('Previous quote was completed. Auto-resetting for a fresh quote.')
            useMoveStore.getState().reset()
            return
        }

        // Reset if the saved quote is more than 2 hours old (stale session)
        // This ensures a new browser session / returning visitor gets a fresh record
        const savedAt = lastSavedQuote.created_at || lastSavedQuote.updated_at
        if (savedAt) {
            const ageHours = (Date.now() - new Date(savedAt).getTime()) / (1000 * 60 * 60)
            if (ageHours > 2) {
                console.log(`Stale quote (${ageHours.toFixed(1)}h old). Auto-resetting for fresh session.`)
                useMoveStore.getState().reset()
            }
        }
    }, [lastSavedQuote?.id, lastSavedQuote?.status, location.pathname])

    // ─── 1. Debounced Auto-Save to Database (Fast: 1.5s) ──────────────────────
    useEffect(() => {
        // Auto-save once any lead progress detail is entered (Name + Phone or Email)
        if (!hasLeadProgress()) return

        const timeoutId = setTimeout(async () => {
            // Preserve existing advanced statuses, but always at least 'lead'
            const currentStatus = lastSavedQuote?.status
            const advancedStatuses = ['processing', 'pending_payment', 'booked', 'paid', 'booked_paid', 'completed', 'rejected', 'on_hold']
            const statusToUse = (currentStatus && advancedStatuses.includes(currentStatus)) ? currentStatus : 'lead'
            console.log('Auto-saving progress to database as status:', statusToUse)
            
            await submitQuote({ status: statusToUse }).catch(console.error)
        }, 1500)

        return () => clearTimeout(timeoutId)
    }, [moveDetails, accessDetails, inventory, submitQuote, lastSavedQuote?.status, hasLeadProgress])

    // ─── 2. Step 1 Lead Email Triggers (Tier 1: 30s Inactivity/Abandon; Tier 2: 45s Inactivity/Abandon) ─────
    useEffect(() => {
        const currentPath = location.pathname.toLowerCase().replace(/\/$/, '')
        const basePathNormalized = basePath.toLowerCase().replace(/\/$/, '')
        const isOnStep1 = currentPath === basePathNormalized

        if (!isOnStep1 || isAdmin || isTest || !hasLeadProgress()) return

        const cleanEmail = (moveDetails?.contactEmail || '').trim().toLowerCase()
        const cleanPhone = (moveDetails?.contactPhone || '').replace(/\D/g, '')
        const contactKey = cleanEmail || cleanPhone || (lastSavedQuote?.id ? String(lastSavedQuote.id) : '')
        if (!contactKey) return

        const hasCompletedName = Boolean(moveDetails?.contactName?.trim() || moveDetails?.surname?.trim())
        const hasValidContact = hasContactInfo(moveDetails?.contactEmail, moveDetails?.contactPhone)
        const hasCompletedAddresses = Boolean(moveDetails?.pickupAddress?.trim() && (moveDetails?.dropoffAddress?.trim() || moveDetails?.storageDestination))
        const hasMoveDate = Boolean(moveDetails?.moveDate)

        const earlySentKey = `mm_step1_early_sent_${contactKey}`
        const fullSentKey = `mm_step1_full_sent_${contactKey}`

        const isEarlySent = Boolean(sessionStorage.getItem(earlySentKey) || (lastSavedQuote?.id && sessionStorage.getItem(`mm_step1_early_sent_${lastSavedQuote.id}`)))
        const isFullSent = Boolean(sessionStorage.getItem(fullSentKey) || (lastSavedQuote?.id && sessionStorage.getItem(`mm_step1_full_sent_${lastSavedQuote.id}`)))

        const pickupCity = detectCityCode(moveDetails?.pickupAddress)
        const dropoffCity = detectCityCode(moveDetails?.dropoffAddress)
        const isNational = (pickupCity && dropoffCity && pickupCity !== dropoffCity) || (moveDetails?.distanceKm > 250)
        const moveType = isNational ? 'National Move' : (moveDetails?.storageDestination ? 'Storage Move' : 'Local Move')

        // TIER 2: Completed Step 1 info (addresses captured)
        // Fires only after 45s of genuine inactivity on Step 1, or immediately on tab hide/exit
        if (hasCompletedName && hasValidContact && hasCompletedAddresses) {
            if (!isFullSent) {
                const sendFullAlert = async () => {
                    const quoteId = lastSavedQuote?.id || null
                    if (sessionStorage.getItem(fullSentKey)) return

                    sessionStorage.setItem(fullSentKey, '1')
                    if (quoteId) {
                        sessionStorage.setItem(`mm_step1_full_sent_${quoteId}`, '1')
                        sessionStorage.setItem(earlySentKey, '1')
                        sessionStorage.setItem(`mm_step1_early_sent_${quoteId}`, '1')
                    }

                    console.log(`[Step1 Lead Trigger] User idle on Step 1 with addresses. Dispatching lead alert for ${contactKey} (Quote: ${quoteId ?? 'unsaved'})...`)
                    const alertRes = await emailService.sendAbandonedLeadAlert({
                        quoteId: quoteId,
                        clientName: formatClientName(moveDetails?.contactName, moveDetails?.surname),
                        clientEmail: moveDetails?.contactEmail || '',
                        clientPhone: moveDetails?.contactPhone || '',
                        moveDate: moveDetails?.moveDate || '',
                        referralSource: moveDetails?.referralSource || '',
                        pickupAddress: moveDetails?.pickupAddress || '',
                        dropoffAddress: moveDetails?.dropoffAddress || '',
                        moveType: moveType,
                        total: 0,
                        isInstant: true,
                        leadTier: 'Step 1 Complete (Addresses Captured)',
                        isUpdate: isEarlySent
                    })

                    if (alertRes && alertRes.success === false) {
                        sessionStorage.removeItem(fullSentKey)
                        if (quoteId) sessionStorage.removeItem(`mm_step1_full_sent_${quoteId}`)
                        console.warn(`[Step1 Lead Trigger] Full lead alert failed:`, alertRes.error)
                    } else {
                        console.log(`[Step1 Lead Trigger] Full lead alert sent successfully for ${contactKey}`)
                    }
                }

                // Inactivity timer: 45 seconds of staying on Step 1 without proceeding
                const fullTimer = setTimeout(sendFullAlert, 45000)

                // Tab visibility / leave handler
                const handleVisibility = () => {
                    if (document.visibilityState === 'hidden') {
                        sendFullAlert()
                    }
                }

                document.addEventListener('visibilitychange', handleVisibility)

                return () => {
                    clearTimeout(fullTimer)
                    document.removeEventListener('visibilitychange', handleVisibility)
                }
            }
        }
        // TIER 1: Contact entered, but stopped there (addresses not complete)
        // Fires only after 25s of inactivity on Step 1, or immediately on tab hide/exit
        else if (hasCompletedName && hasValidContact && !hasCompletedAddresses) {
            if (!isEarlySent && !isFullSent) {
                const sendEarlyAlert = async () => {
                    const quoteId = lastSavedQuote?.id || null
                    if (sessionStorage.getItem(earlySentKey) || sessionStorage.getItem(fullSentKey)) return

                    sessionStorage.setItem(earlySentKey, '1')
                    if (quoteId) sessionStorage.setItem(`mm_step1_early_sent_${quoteId}`, '1')

                    console.log(`[Step1 Lead Trigger] User stopped on Step 1. Dispatching EARLY contact lead alert for ${contactKey} (Quote: ${quoteId ?? 'unsaved'})...`)
                    const alertRes = await emailService.sendAbandonedLeadAlert({
                        quoteId: quoteId,
                        clientName: formatClientName(moveDetails?.contactName, moveDetails?.surname),
                        clientEmail: moveDetails?.contactEmail || '',
                        clientPhone: moveDetails?.contactPhone || '',
                        moveDate: moveDetails?.moveDate || '',
                        referralSource: moveDetails?.referralSource || '',
                        pickupAddress: moveDetails?.pickupAddress || 'Not entered yet',
                        dropoffAddress: moveDetails?.dropoffAddress || 'Not entered yet',
                        moveType: moveType,
                        total: 0,
                        isInstant: true
                    })

                    if (alertRes && alertRes.success === false) {
                        sessionStorage.removeItem(earlySentKey)
                        if (quoteId) sessionStorage.removeItem(`mm_step1_early_sent_${quoteId}`)
                        console.warn(`[Step1 Lead Trigger] Early lead alert failed:`, alertRes.error)
                    } else {
                        console.log(`[Step1 Lead Trigger] Early lead alert sent successfully for ${contactKey}`)
                    }
                }

                // Inactivity timer: 25 seconds without proceeding or entering addresses
                const idleTimer = setTimeout(sendEarlyAlert, 25000)

                // Tab visibility / leave handler
                const handleVisibility = () => {
                    if (document.visibilityState === 'hidden') {
                        sendEarlyAlert()
                    }
                }

                document.addEventListener('visibilitychange', handleVisibility)

                return () => {
                    clearTimeout(idleTimer)
                    document.removeEventListener('visibilitychange', handleVisibility)
                }
            }
        }
    }, [
        moveDetails,
        lastSavedQuote?.id,
        hasLeadProgress,
        isAdmin,
        isTest,
        location.pathname,
        basePath
    ])

    const STEPS = useMemo(() => [
        { id: 'details', label: 'Details', path: basePath },
        { id: 'access', label: 'Site Access', path: `${basePath}/access` },
        { id: 'inventory', label: 'Inventory', path: `${basePath}/inventory` },
        { id: 'summary', label: 'Summary', path: `${basePath}/summary` },
    ], [basePath])

    const normalizedPath = location.pathname.toLowerCase().replace(/\/$/, '')
    const currentStepIndex = STEPS.findIndex(s => s.path.toLowerCase() === normalizedPath) !== -1
        ? STEPS.findIndex(s => s.path.toLowerCase() === normalizedPath)
        : 0

    const isStep1Ok = useMemo(() => {
        if (isAdmin || isTest) return true

        const hasPickup = !!(moveDetails?.pickupAddress && moveDetails.pickupAddress.trim().length > 0)
        const hasDropoff = !!((moveDetails?.dropoffAddress && moveDetails.dropoffAddress.trim().length > 0) || moveDetails?.storageDestination)
        const hasDate = !!moveDetails?.moveDate
        const hasName = !!(moveDetails?.contactName && moveDetails.contactName.trim().length > 0)
        const hasPhone = !!(moveDetails?.contactPhone && moveDetails.contactPhone.trim().length > 0)
        const emailTrimmed = (moveDetails?.contactEmail || '').trim()
        const hasEmail = emailTrimmed.includes('@') && emailTrimmed.includes('.')
        const hasReferral = !!(moveDetails?.referralSource && moveDetails.referralSource.trim().length > 0)

        return hasPickup && hasDropoff && hasDate && hasName && hasPhone && hasEmail && hasReferral
    }, [moveDetails, isAdmin, isTest])

    const hasInventory = Object.keys(inventory || {}).length > 0

    const isStepCompleted = (stepId) => {
        if (stepId === 'details') return true
        if (stepId === 'access' || stepId === 'inventory') return isStep1Ok
        if (stepId === 'summary') return isStep1Ok && hasInventory
        return true
    }

    // Auto-redirect invalid step paths safely
    useEffect(() => {
        const currentStep = STEPS[currentStepIndex]
        if (!currentStep) return

        // Step 2, 3, 4 require Step 1 completion
        if (currentStep.id !== 'details' && !isStep1Ok) {
            navigate(basePath, { replace: true })
            return
        }

        // Step 4 also requires at least 1 item in inventory
        if (currentStep.id === 'summary' && !hasInventory) {
            navigate(`${basePath}/inventory`, { replace: true })
            return
        }
    }, [location.pathname, currentStepIndex, basePath, navigate, isStep1Ok, hasInventory])

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [location.pathname])

    const renderCurrentStepComponent = () => {
        const path = location.pathname.toLowerCase().replace(/\/$/, '')
        if (path.endsWith('/access')) {
            return <Step2Access />
        }
        if (path.endsWith('/inventory')) {
            return <Step3Inventory />
        }
        if (path.endsWith('/summary')) {
            return <Step4Summary submissionType={isTest ? 'test' : (isAdmin ? 'admin' : 'standard')} />
        }
        return <Step1Details />
    }

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

            {/* Step Content — test mode gets a 2-col layout with inspector on the right */}
            {isTest ? (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
                    {/* Left: Normal wizard steps */}
                    <div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderCurrentStepComponent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right: Sticky live calculation inspector */}
                    <div className="sticky top-6">
                        <TestCalcBreakdown />
                    </div>
                </div>
            ) : (
                /* Normal (non-test) layout */
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderCurrentStepComponent()}
                    </motion.div>
                </AnimatePresence>
            )}
            {/* Bottom Info Section explaining surcharges / additional items */}
            <div className="mt-16 bg-slate-50 border border-slate-200/60 rounded-2xl p-6 md:p-8 max-w-4xl mx-auto">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <span className="inline-block w-2.5 h-6 bg-red-600 rounded-full mr-3"></span>
                    Understanding Additional Services & Surcharges
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-slate-800">Shuttle Vehicle Service</h4>
                            <p className="text-slate-600 mt-1">
                                Used when a large delivery truck cannot access your complex or street due to narrow roads, low bridges, or weight limits. A smaller shuttle vehicle is deployed to transfer items between the residence and the main truck.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">Long Carry Surcharge</h4>
                            <p className="text-slate-600 mt-1">
                                Applies when the distance between where the moving truck can safely park and the entrance of your residence exceeds 60 meters. Carrying items over long distances increases labor and time.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-slate-800">Hoisting Service</h4>
                            <p className="text-slate-600 mt-1">
                                Required for large furniture items (like large couches, table tops, or mattresses) that cannot fit through doorways, passages, stairwells, or elevators, and must be hoisted over balconies or window frames.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">Special Wrapping / Protective Sleeves</h4>
                            <p className="text-slate-600 mt-1">
                                Delicate items (Glass, Marble) require special protective bubble wrapping or blankets to guarantee safe transit. Couches, beds, and mattresses automatically receive heavy-duty plastic protective sleeves.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
