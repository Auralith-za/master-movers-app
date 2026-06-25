import { generateProfessionalQuote } from './pdfService'

/**
 * Service to handle triggering emails from the frontend via Supabase Edge Functions
 */
export const emailService = {
    /**
     * Generate PDF and send quote email (quote_proposal or booking_confirmation)
     */
    sendQuoteEmail: async ({ type, quoteId, clientName, clientEmail, clientPhone, moveDate, pickupAddress, dropoffAddress, total, vat, subTotal, inventory, breakdown, inventoryItems, paymentMethod = 'paid' }) => {
        try {
            if (!clientEmail) {
                console.warn("Skipping email: No client email provided.")
                return { success: false, error: "Missing email address" }
            }

            console.log(`Generating in-memory PDF for email type: ${type}...`)

            // 1. Generate the PDF instance silently (shouldSave = false)
            const doc = await generateProfessionalQuote({
                quoteId,
                clientName,
                clientEmail,
                clientPhone,
                pickupAddress,
                dropoffAddress,
                moveDate,
                inventory,
                breakdown,
                total,
                vat,
                subTotal,
                inventoryItems,
                isSharedLoad: breakdown?.isSharedLoad || false,
                shouldSave: false
            })

            // 2. Convert PDF to raw base64 string (no data URI prefix)
            const pdfBase64 = doc.output('base64')
            const pdfFilename = `MasterMovers_Quote_${quoteId || 'New'}.pdf`

            // 3. Construct quote payload for the email template
            const quoteData = {
                id: quoteId,
                client_name: clientName,
                client_email: clientEmail,
                client_phone: clientPhone,
                move_date: moveDate,
                pickup_address: pickupAddress,
                dropoff_address: dropoffAddress,
                total_price: total,
                payment_method: paymentMethod
            }

            // 4. Send request to Supabase Edge Function
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
            const url = `${supabaseUrl}/functions/v1/send-email`

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    type, // 'quote_proposal' or 'booking_confirmation'
                    to: clientEmail,
                    quoteData,
                    pdfBase64,
                    pdfFilename
                })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || "Failed to trigger email function")

            console.log(`Email trigger successful for type: ${type}`)
            return { success: true, messageId: result.messageId }

        } catch (error) {
            console.error("Failed to send quote email:", error)
            return { success: false, error: error.message }
        }
    },

    /**
     * Send contact page message to admin
     */
    sendContactEmail: async ({ name, email, phone, message }) => {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
            const url = `${supabaseUrl}/functions/v1/send-email`

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    type: 'contact_message',
                    contactData: { name, email, phone, message }
                })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || "Failed to trigger contact email function")

            console.log("Contact form email sent successfully to admin")
            return { success: true, messageId: result.messageId }

        } catch (error) {
            console.error("Failed to send contact email:", error)
            return { success: false, error: error.message }
        }
    },

    /**
     * Admin-only booking confirmed alert — no PDF, fires instantly after payment
     * Separate from the customer email so admins always get notified
     */
    sendBookingConfirmedAlert: async ({ quoteId, clientName, clientEmail, clientPhone, moveDate, pickupAddress, dropoffAddress, total, vat, subTotal, inventory, breakdown, inventoryItems, paymentMethod = 'card/eft' }) => {
        try {
            console.log(`Generating in-memory PDF for booking confirmed alert...`)

            const doc = await generateProfessionalQuote({
                quoteId,
                clientName,
                clientEmail,
                clientPhone,
                pickupAddress,
                dropoffAddress,
                moveDate,
                inventory,
                breakdown,
                total,
                vat,
                subTotal,
                inventoryItems,
                isSharedLoad: breakdown?.isSharedLoad || false,
                shouldSave: false
            })

            const pdfBase64 = doc.output('base64')
            const pdfFilename = `MasterMovers_Quote_${quoteId || 'New'}.pdf`

            const quoteData = {
                id: quoteId,
                client_name: clientName,
                client_email: clientEmail,
                client_phone: clientPhone,
                move_date: moveDate,
                pickup_address: pickupAddress,
                dropoff_address: dropoffAddress,
                total_price: total,
                payment_method: paymentMethod
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
            const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ type: 'booking_confirmed_alert', quoteData, pdfBase64, pdfFilename })
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Booking alert failed')
            console.log('✅ Booking confirmed admin alert sent to all admins')
            return { success: true }
        } catch (error) {
            console.error('sendBookingConfirmedAlert error:', error)
            return { success: false, error: error.message }
        }
    },

    /**
     * Send instant admin-only alert when a customer reaches Step 4 (pending quote)
     * No PDF needed — fires immediately so sales team can follow up
     */
    sendPendingQuoteAlert: async ({ quoteId, clientName, clientEmail, clientPhone, moveDate, pickupAddress, dropoffAddress, moveType, total, vat, subTotal, inventory, breakdown, inventoryItems, paymentMethod = 'not selected' }) => {
        try {
            console.log(`Generating in-memory PDF for pending quote alert...`)

            const doc = await generateProfessionalQuote({
                quoteId,
                clientName,
                clientEmail,
                clientPhone,
                pickupAddress,
                dropoffAddress,
                moveDate,
                inventory,
                breakdown,
                total,
                vat,
                subTotal,
                inventoryItems,
                isSharedLoad: breakdown?.isSharedLoad || false,
                shouldSave: false
            })

            const pdfBase64 = doc.output('base64')
            const pdfFilename = `MasterMovers_Quote_${quoteId || 'New'}.pdf`

            const quoteData = {
                id: quoteId,
                client_name: clientName,
                client_email: clientEmail,
                client_phone: clientPhone,
                move_date: moveDate,
                pickup_address: pickupAddress,
                dropoff_address: dropoffAddress,
                total_price: total,
                move_type: moveType,
                payment_method: paymentMethod
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
            const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    type: 'pending_quote_alert',
                    quoteData,
                    pdfBase64,
                    pdfFilename
                })
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Pending quote alert failed')
            console.log('🔔 Pending quote admin alert sent')
            return { success: true }
        } catch (error) {
            console.error('sendPendingQuoteAlert error:', error)
            return { success: false, error: error.message }
        }
    },

    /**
     * Send admin alert for an abandoned lead after inactivity
     * Uses whatever data is available from the incomplete form
     */
    sendAbandonedLeadAlert: async ({ quoteId, clientName, clientEmail, clientPhone, moveDate, pickupAddress, dropoffAddress, moveType, total, vat, subTotal, inventory, breakdown, inventoryItems, paymentMethod = 'abandoned', isInstant = false }) => {
        try {
            let pdfBase64 = null;
            let pdfFilename = null;

            // Only generate PDF if we have time (not an instant tab close)
            if (!isInstant) {
                console.log(`Generating in-memory PDF for abandoned lead alert...`)
                const doc = await generateProfessionalQuote({
                    quoteId,
                    clientName,
                    clientEmail,
                    clientPhone,
                    pickupAddress,
                    dropoffAddress,
                    moveDate,
                    inventory: inventory || {},
                    breakdown: breakdown || {},
                    total: total || 0,
                    vat: vat || 0,
                    subTotal: subTotal || 0,
                    inventoryItems: inventoryItems || [],
                    isSharedLoad: breakdown?.isSharedLoad || false,
                    shouldSave: false
                })
                pdfBase64 = doc.output('base64')
                pdfFilename = `MasterMovers_Abandoned_${quoteId || 'Lead'}.pdf`
            }

            const quoteData = {
                id: quoteId,
                client_name: clientName,
                client_email: clientEmail,
                client_phone: clientPhone,
                move_date: moveDate,
                pickup_address: pickupAddress,
                dropoff_address: dropoffAddress,
                total_price: total || 0,
                move_type: moveType || 'Unknown',
                payment_method: paymentMethod
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
            const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                method: 'POST',
                keepalive: isInstant, // Ensures the request finishes even if the tab is closing
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    type: 'abandoned_lead_alert',
                    quoteData,
                    pdfBase64,
                    pdfFilename
                })
            })
            
            // Note: if isInstant is true (tab closing), we might not even get a response back here, 
            // but the request is guaranteed to be sent to the server.
            if (!isInstant) {
                const result = await response.json()
                if (!response.ok) throw new Error(result.error || 'Abandoned lead alert failed')
                console.log('⚠️ Abandoned lead admin alert sent')
            }
            return { success: true }
        } catch (error) {
            console.error('sendAbandonedLeadAlert error:', error)
            return { success: false, error: error.message }
        }
    },

    /**
     * Send urgent callback notification to ALL admins
     * Called from Step 1, 2, 3 and 4 when customer requests a call back
     */
    sendCallbackEmail: async ({ name, email, phone, step, pickup, dropoff, moveDate }) => {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
            const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    type: 'callback_notification',
                    contactData: { name, email, phone, step, pickup, dropoff, moveDate }
                })
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Callback email failed')
            console.log('📞 Callback notification sent to all admins')
            return { success: true }
        } catch (error) {
            console.error('sendCallbackEmail error:', error)
            return { success: false, error: error.message }
        }
    },

    sendLocationNotFoundEmail: async ({ name, email, phone, fieldName, enteredValue, comments }) => {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
            const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    type: 'location_not_found_alert',
                    contactData: { name, email, phone, fieldName, enteredValue, comments }
                })
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Location alert email failed')
            console.log('📞 Location Not Found alert email sent to admins')
            return { success: true }
        } catch (error) {
            console.error('sendLocationNotFoundEmail error:', error)
            return { success: false, error: error.message }
        }
    },

    sendOutlineAreaEmail: async ({ name, email, phone, pickup, dropoff }) => {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
            const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    type: 'outline_area_alert',
                    contactData: { name, email, phone, pickup, dropoff }
                })
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Outlaying area email failed')
            console.log('🚛 Outlaying Area alert email sent to admins')
            return { success: true }
        } catch (error) {
            console.error('sendOutlineAreaEmail error:', error)
            return { success: false, error: error.message }
        }
    },

    sendEmail: async ({ type, to, quoteData, paymentLink }) => {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
            const url = `${supabaseUrl}/functions/v1/send-email`

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ type, to, quoteData, paymentLink })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Email function error')
            return { success: true, messageId: result.messageId }
        } catch (error) {
            console.error('sendEmail error:', error)
            return { success: false, error: error.message }
        }
    }
}
