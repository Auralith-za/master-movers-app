// Meta Pixel (Dataset ID: 2153382678867201)
export const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '2153382678867201'

/**
 * Safe helper to call window.fbq for standard events
 */
export const fbqTrack = (eventName, params = {}) => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        console.log(`[Meta Pixel] 🎯 Event: ${eventName}`, params)
        window.fbq('track', eventName, params)
    }
}

/**
 * Safe helper to call window.fbq for custom events
 */
export const fbqTrackCustom = (eventName, params = {}) => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        console.log(`[Meta Pixel] 🎯 Custom Event: ${eventName}`, params)
        window.fbq('trackCustom', eventName, params)
    }
}

/**
 * Track Request a Call Back
 * Fires standard Meta 'Lead' and 'Contact' events with step context
 */
export const trackMetaCallbackRequest = ({ step = '', value = 0 } = {}) => {
    console.log(`[Meta Pixel] 📞 Call Back Request fired — "${step}"`)

    // 1. Standard Lead event (primary conversion signal for Meta Ads)
    fbqTrack('Lead', {
        content_name: 'Request Call Back',
        content_category: 'Callback Request',
        step: step,
        currency: 'ZAR',
        value: Number(value) || 0
    })

    // 2. Standard Contact event
    fbqTrack('Contact', {
        content_name: 'Request Call Back',
        step: step
    })

    // 3. Custom event for dedicated custom audience targeting
    fbqTrackCustom('RequestCallBack', {
        step: step
    })
}

/**
 * Track Step 2 Reached on Plan Your Move
 * Fires when user reaches Step 2 (Site Access)
 * Includes session deduplication to prevent double-counting on component remounts
 */
export const trackMetaStep2Reached = ({ quoteId = '', value = 0, force = false } = {}) => {
    const key = `mm_meta_step2_fired_${quoteId || 'current'}`
    if (!force && typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) {
        return
    }
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, '1')
    }

    console.log('[Meta Pixel] 🚚 Step 2 Reached (Plan Your Move — Site Access)')

    // 1. Standard InitiateCheckout event (standard e-commerce/quote funnel stage)
    fbqTrack('InitiateCheckout', {
        content_name: 'Plan Your Move - Step 2 (Site Access)',
        content_category: 'Quote Funnel',
        num_items: 1,
        currency: 'ZAR',
        value: Number(value) || 0
    })

    // 2. Custom event specifically for Step 2 targeting / retargeting
    fbqTrackCustom('Step2_AccessDetails', {
        funnel_name: 'Plan Your Move',
        step_number: 2,
        step_name: 'Site Access',
        quote_id: quoteId
    })
}

/**
 * Track Lead conversion (General contact form, summary lead, etc.)
 */
export const trackMetaLead = ({ label = 'General Lead', value = 0 } = {}) => {
    fbqTrack('Lead', {
        content_name: label,
        currency: 'ZAR',
        value: Number(value) || 0
    })
}

/**
 * Track PageView for SPA navigation
 */
export const trackMetaPageView = () => {
    fbqTrack('PageView')
}
