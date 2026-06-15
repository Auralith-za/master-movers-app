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

            // 2. Convert PDF to base64 data URL
            const pdfBase64 = doc.output('datauristring')
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
    }
}
