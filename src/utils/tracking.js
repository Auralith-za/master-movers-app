/**
 * Utility for capturing, storing, and retrieving Google Click IDs (gclid, gbraid, wbraid)
 * and UTM campaign parameters for Google Ads Offline Conversion Import (OCI).
 */

const STORAGE_KEY = 'mm_attribution_data'
const GCLID_COOKIE_NAME = 'mm_gclid'

/**
 * Helper to set a cookie with a 90-day expiration (standard Google Ads attribution window).
 */
function setCookie(name, value, days = 90) {
    try {
        const d = new Date()
        d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
        const expires = `expires=${d.toUTCString()}`
        document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`
    } catch (e) {
        console.warn('[Tracking] Failed to set cookie:', e)
    }
}

/**
 * Helper to read a cookie value.
 */
function getCookie(name) {
    try {
        const nameEQ = `${name}=`
        const ca = document.cookie.split(';')
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim()
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length))
        }
    } catch (e) {
        console.warn('[Tracking] Failed to read cookie:', e)
    }
    return null
}

/**
 * Initialize and capture URL tracking parameters on landing.
 * Should be called when the app initializes (e.g. in App.jsx).
 */
export function initTracking() {
    if (typeof window === 'undefined') return

    try {
        const searchParams = new URLSearchParams(window.location.search)
        const newTracking = {}

        const trackingFields = [
            'gclid',
            'gbraid',
            'wbraid',
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_term',
            'utm_content'
        ]

        let foundNewField = false

        trackingFields.forEach((field) => {
            const val = searchParams.get(field)
            if (val && val.trim() !== '') {
                newTracking[field] = val.trim()
                foundNewField = true
            }
        })

        // If new tracking parameters were present in URL, update storage
        if (foundNewField) {
            const existing = getStoredTrackingData()
            const updated = {
                ...existing,
                ...newTracking,
                captured_at: new Date().toISOString()
            }

            const jsonStr = JSON.stringify(updated)
            localStorage.setItem(STORAGE_KEY, jsonStr)
            sessionStorage.setItem(STORAGE_KEY, jsonStr)

            if (updated.gclid) {
                setCookie(GCLID_COOKIE_NAME, updated.gclid)
            }

            console.log('[Tracking] Captured attribution data:', updated)
        }
    } catch (err) {
        console.error('[Tracking] Error initializing tracking:', err)
    }
}

/**
 * Get current stored tracking data from localStorage / sessionStorage / cookie.
 * @returns {Object} Object containing gclid, gbraid, wbraid, utm_*, etc.
 */
export function getStoredTrackingData() {
    if (typeof window === 'undefined') return {}

    let data = {}

    try {
        // Try localStorage first
        const localData = localStorage.getItem(STORAGE_KEY)
        if (localData) {
            data = JSON.parse(localData)
        } else {
            // Fallback to sessionStorage
            const sessionData = sessionStorage.getItem(STORAGE_KEY)
            if (sessionData) {
                data = JSON.parse(sessionData)
            }
        }

        // Fallback to cookie for gclid if missing in local/session storage
        if (!data.gclid) {
            const cookieGclid = getCookie(GCLID_COOKIE_NAME)
            if (cookieGclid) {
                data.gclid = cookieGclid
            }
        }
    } catch (err) {
        console.warn('[Tracking] Error reading stored tracking data:', err)
    }

    return {
        gclid: data.gclid || null,
        gbraid: data.gbraid || null,
        wbraid: data.wbraid || null,
        utm_source: data.utm_source || null,
        utm_medium: data.utm_medium || null,
        utm_campaign: data.utm_campaign || null,
        utm_term: data.utm_term || null,
        utm_content: data.utm_content || null,
        captured_at: data.captured_at || null
    }
}

/**
 * Clear stored tracking data (e.g. after successful submission if required).
 */
export function clearTrackingData() {
    try {
        localStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(STORAGE_KEY)
    } catch (e) {
        console.warn('[Tracking] Failed to clear tracking data:', e)
    }
}
