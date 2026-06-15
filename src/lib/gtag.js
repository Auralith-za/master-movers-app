// Google Ads Conversion ID
export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || 'AW-930634357'

// ─── Page view (for SPA routing) ─────────────────────────────────────────────
export const pageview = (url) => {
    if (typeof window.gtag !== 'undefined') {
        window.gtag('config', GA_TRACKING_ID, {
            page_path: url,
        })
    }
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
// Fires when a customer submits a call-back request or quote lead
export const trackLeadConversion = ({ label = 'Call Back Request', value = 0 } = {}) => {
    if (typeof window.gtag === 'undefined') return
    console.log(`[Google Ads] 📞 Lead conversion fired — "${label}"`)
    window.gtag('event', 'conversion', {
        send_to: `${GA_TRACKING_ID}/lead`,
        value: Number(value),
        currency: 'ZAR',
    })
    // Also fire as GA4 generate_lead event
    window.gtag('event', 'generate_lead', {
        currency: 'ZAR',
        value: Number(value),
        lead_source: label,
    })
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
