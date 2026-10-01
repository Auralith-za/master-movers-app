import {
    trackMetaCallbackRequest,
    trackMetaStep2Reached,
    trackMetaLead,
    trackMetaPageView,
} from './metaPixel'

// Re-export Meta Pixel helpers for convenient unified imports
export {
    trackMetaCallbackRequest,
    trackMetaStep2Reached,
    trackMetaLead,
    trackMetaPageView,
}

// Google Ads Conversion ID
export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || 'AW-930634357'

// ─── Page view (for SPA routing) ─────────────────────────────────────────────
export const pageview = (url) => {
    if (typeof window.gtag !== 'undefined') {
        window.gtag('config', GA_TRACKING_ID, {
            page_path: url,
        })
    }
    // Also track Meta Pixel PageView
    trackMetaPageView()
}

// ─── Generic GA4 / Ads event ─────────────────────────────────────────────────
export const event = ({ action, category, label, value }) => {
    if (typeof window.gtag !== 'undefined') {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        })
    }
}

// ─── Google Ads: Purchase Conversion ─────────────────────────────────────────
// Label: AW-930634357/00CyCNqZr78cEPW04bsD (from Google Ads dashboard — Purchase action)
export const trackPurchaseConversion = ({ value = 0, currency = 'ZAR', transactionId = '' } = {}) => {
    if (typeof window.gtag === 'undefined') return
    console.log(`[Google Ads] 🛒 Purchase conversion fired — R${value} (${transactionId})`)
    window.gtag('event', 'conversion', {
        send_to: 'AW-930634357/00CyCNqZr78cEPW04bsD',  // ← exact label from Google Ads
        value: Number(value),
        currency: currency,
        transaction_id: transactionId,
    })
    // Also fire as a standard GA4 purchase event for Analytics
    window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: Number(value),
        currency: currency,
    })
}

// ─── Google Ads: Lead / Call-back Conversion ──────────────────────────────────
// Label: AW-930634357/XJmACObty78cEPW04bsD (Request Call Back Web App)
// Fires on: contact form submit, phone button click, call-back requests (Steps 1-4)
export const trackLeadConversion = ({ label = 'Call Back Request', value = 0 } = {}) => {
    if (typeof window.gtag !== 'undefined') {
        console.log(`[Google Ads] 📞 Lead conversion fired — "${label}"`)
        window.gtag('event', 'conversion', {
            send_to: 'AW-930634357/XJmACObty78cEPW04bsD',  // ← exact label from Google Ads
            value: Number(value),
            currency: 'ZAR',
        })
        // Also fire as GA4 generate_lead event for Analytics
        window.gtag('event', 'generate_lead', {
            currency: 'ZAR',
            value: Number(value),
            lead_source: label,
        })
    }

    // 🔴 Meta Pixel: Lead Conversion (skip if this is a callback request handled specifically by trackCallbackRequest)
    if (!label.startsWith('Call Back Request')) {
        trackMetaLead({ label, value })
    }
}

// ─── Google Ads: Quote Submitted ─────────────────────────────────────────────
export const trackQuoteSubmit = ({ value = 0 } = {}) => {
    if (typeof window.gtag === 'undefined') return
    console.log(`[Google Ads] 📋 Quote submit fired — R${value}`)
    window.gtag('event', 'submit_application', {
        send_to: GA_TRACKING_ID,
        value: Number(value),
        currency: 'ZAR',
    })
}

// ─── Step 1 Complete / Step 2 Reached ────────────────────────────────────────
// Fires when a user successfully completes Step 1 and navigates to Step 2.
// Used as the primary conversion while pricing is temporarily hidden behind
// a "get in touch" message (no payment flow = no purchase conversion).
export const trackStep1Complete = () => {
    if (typeof window.gtag !== 'undefined') {
        console.log('[Google Ads] ✅ Step 1 Complete conversion fired')
        // Primary: fire as dedicated Google Ads "Step 1 Complete — Quote Started" conversion
        window.gtag('event', 'conversion', {
            send_to: 'AW-930634357/WBIqCPHLrc0cEPW04bsD',  // ← Step 1 Complete — Quote Started
            value: 1,
            currency: 'ZAR',
        })
        // Secondary: GA4 custom event so you can see it separately in Analytics
        window.gtag('event', 'quote_step1_complete', {
            event_category: 'Quote Funnel',
            event_label: 'Step 1 → Step 2',
        })
    }

    // 🔴 Meta Pixel: Step 2 Reached (InitiateCheckout + Step2_AccessDetails)
    trackMetaStep2Reached()
}

// ─── Callback / Lead from any step ───────────────────────────────────────────
// Use this on Steps 1, 2, 3 callback buttons so they all fire the same
// "Request Call Back Web App" conversion action in Google Ads and Meta Pixel.
export const trackCallbackRequest = ({ step = '', value = 0 } = {}) => {
    trackLeadConversion({ label: `Call Back Request — ${step}`, value })
    // 🔴 Meta Pixel: Request a Call Back (Standard Lead + Contact + custom RequestCallBack)
    trackMetaCallbackRequest({ step, value })
}

