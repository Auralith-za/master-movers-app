import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Branded CSS/HTML Wrapper
function getBrandedTemplate(title: string, innerHtml: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }
            .wrapper {
                width: 100%;
                background-color: #f8fafc;
                padding: 30px 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                border: 1px solid #e2e8f0;
            }
            .header {
                background-color: #0f172a;
                padding: 30px 40px;
                text-align: center;
                border-bottom: 4px solid #e31837;
            }
            .logo-text {
                color: #ffffff;
                font-size: 24px;
                font-weight: 900;
                letter-spacing: 2px;
                margin: 0;
                text-transform: uppercase;
            }
            .logo-sub {
                color: #e31837;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 3px;
                margin: 5px 0 0 0;
                text-transform: uppercase;
            }
            .content {
                padding: 40px;
                color: #334155;
                line-height: 1.6;
            }
            h1 {
                font-size: 20px;
                font-weight: 800;
                color: #0f172a;
                margin-top: 0;
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: -0.5px;
            }
            p {
                margin: 0 0 16px 0;
                font-size: 15px;
            }
            .highlight-box {
                background-color: #f1f5f9;
                border-left: 4px solid #e31837;
                padding: 20px;
                border-radius: 0 8px 8px 0;
                margin-bottom: 25px;
            }
            .details-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 25px;
            }
            .details-table td {
                padding: 10px 0;
                border-bottom: 1px solid #f1f5f9;
                font-size: 14px;
            }
            .details-table td.label {
                font-weight: 700;
                color: #64748b;
                width: 35%;
                text-transform: uppercase;
                font-size: 11px;
                letter-spacing: 0.5px;
            }
            .details-table td.value {
                color: #0f172a;
                font-weight: 500;
            }
            .btn {
                display: inline-block;
                background-color: #e31837;
                color: #ffffff !important;
                text-decoration: none;
                padding: 14px 30px;
                font-size: 14px;
                font-weight: 700;
                border-radius: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-top: 10px;
                box-shadow: 0 4px 6px -1px rgba(227, 24, 55, 0.2);
            }
            .footer {
                background-color: #0f172a;
                padding: 30px 40px;
                text-align: center;
                color: #94a3b8;
                font-size: 12px;
                border-top: 1px solid #1e293b;
            }
            .footer p {
                margin: 0 0 8px 0;
            }
            .footer a {
                color: #ffffff;
                text-decoration: none;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <div class="logo-text">Master Movers</div>
                    <div class="logo-sub">Professional Moving Solutions</div>
                </div>
                <div class="content">
                    ${innerHtml}
                </div>
                <div class="footer">
                    <p><strong>Master Movers NextGen Logistics</strong></p>
                    <p>17 Indianapolis Blvd, Germiston | Unit 1 Bosal Park, Epping, Cape Town</p>
                    <p>Call: <a href="tel:+27114937569">+27 11 493 7569</a> | Email: <a href="mailto:info@mastermovers.co.za">info@mastermovers.co.za</a></p>
                    <p style="font-size: 10px; margin-top: 15px; opacity: 0.6;">&copy; ${new Date().getFullYear()} Master Movers. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { type, to, quoteData, contactData, pdfBase64, pdfFilename, paymentLink } = await req.json()

        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        const adminEmailSecret = Deno.env.get('ADMIN_EMAIL') || 'curtleroux7785@gmail.com'
        let adminEmails = adminEmailSecret.split(',').map(e => e.trim()).filter(Boolean)
        
        // Remove old incorrect @mastermovers.co.za emails
        adminEmails = adminEmails.filter(email => !email.toLowerCase().endsWith('@mastermovers.co.za'))

        if (!adminEmails.includes('melonie@nova-gg.com')) {
            adminEmails.push('melonie@nova-gg.com')
        }

        const additionalEmails = [
            'sales@mastermoversjhb.co.za',
            'sales1@mastermoversjhb.co.za',
            'carla@mastermoversjhb.co.za',
            'sales3@mastermoversjhb.co.za',
            'office@mastermoverscpt.co.za',
            'info@mastermoverscpt.co.za',
            'sales@mastermoversdbn.co.za',
            'office@mastermoversdbn.co.za'
        ];

        for (const email of additionalEmails) {
            if (!adminEmails.includes(email)) {
                adminEmails.push(email);
            }
        }
        const sender = Deno.env.get('EMAIL_SENDER') || 'Master Movers <onboarding@resend.dev>'
        const originUrl = 'https://mastermovers.co.za'

        if (!resendApiKey) {
            throw new Error("Missing RESEND_API_KEY environment secret.")
        }

        let subject = ""
        let innerHtml = ""
        let recipients = typeof to === 'string' ? [to] : to

        // Compile standard layout or customer-facing details based on email type
        if (type === 'pending_quote_alert') {
            // Admin-only: fires when customer reaches Step 4 (pending, not yet paid)
            const ref = quoteData?.id ? quoteData.id.toString().substring(0, 8).toUpperCase() : 'NEW'
            subject = `🔔 NEW PENDING QUOTE — ${quoteData?.client_name || 'Customer'} [MM-${ref}]`
            recipients = adminEmails // Admin-only

            innerHtml = `
                <h1 style="color:#0f172a;">🔔 New Pending Quote</h1>
                <p>A customer has completed their inventory and is <strong>viewing their quote on Step 4</strong>. They may need a follow-up call to convert to a booking.</p>

                <div class="highlight-box" style="background:#eff6ff; border-left-color:#2563eb;">
                    <p style="font-weight:900;font-size:22px;color:#1e40af;margin:0;">R ${Number(quoteData?.total_price || 0).toFixed(2)} <span style="font-size:13px;font-weight:500;color:#64748b;">(Incl. VAT)</span></p>
                    <p style="margin:4px 0 0;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Quote Total — Awaiting Payment</p>
                </div>

                <table class="details-table">
                    <tr><td class="label">Ref:</td><td class="value" style="font-family:monospace;font-weight:900;">MM-${ref}</td></tr>
                    <tr><td class="label">Customer:</td><td class="value"><strong>${quoteData?.client_name || '—'}</strong></td></tr>
                    <tr><td class="label">Phone:</td><td class="value"><strong><a href="tel:${quoteData?.client_phone || ''}" style="color:#e31837;">${quoteData?.client_phone || '—'}</a></strong></td></tr>
                    <tr><td class="label">Email:</td><td class="value"><a href="mailto:${quoteData?.client_email || ''}">${quoteData?.client_email || '—'}</a></td></tr>
                    <tr><td class="label">Move Date:</td><td class="value">${quoteData?.move_date || 'TBD'}</td></tr>
                    <tr><td class="label">Collection From:</td><td class="value">${quoteData?.pickup_address || '—'}</td></tr>
                    <tr><td class="label">Delivery To:</td><td class="value">${quoteData?.dropoff_address || '—'}</td></tr>
                    <tr><td class="label">Move Type:</td><td class="value">${quoteData?.move_type || '—'}</td></tr>
                    <tr><td class="label">Payment Method:</td><td class="value">${quoteData?.payment_method || 'Not selected'}</td></tr>
                </table>

                <div style="text-align:center;margin:30px 0;">
                    <a href="https://mastermovers.co.za/admin/quotes/${quoteData?.id || ''}" class="btn" style="background:#2563eb;">
                        View Quote in Admin →
                    </a>
                </div>

                <p style="font-size:13px;color:#64748b;">Call the customer on <strong>${quoteData?.client_phone || '—'}</strong> to assist with payment or answer questions.</p>
            `
        } else if (type === 'quote_proposal') {
            const ref = quoteData?.id ? quoteData.id.toString().substring(0, 8).toUpperCase() : 'MM-NEW'
            subject = `Your Master Movers Move Proposal [Ref: ${ref}]`
            
            // Add all admin emails to recipient list to ensure notification
            for (const email of adminEmails) {
                if (!recipients.includes(email)) {
                    recipients.push(email)
                }
            }

            innerHtml = `
                <h1>Move Quote Proposal</h1>
                <p>Dear ${quoteData?.client_name || 'Valued Customer'},</p>
                <p>Thank you for choosing Master Movers. We have processed your inventory and route details and prepared a customized proposal for your upcoming move.</p>
                
                <div class="highlight-box">
                    <p style="margin-bottom: 5px; font-weight: 700; color: #0f172a;">Estimated Total Amount Due:</p>
                    <p style="font-size: 24px; font-weight: 900; color: #e31837; margin: 0;">R ${Number(quoteData?.total_price || 0).toFixed(2)} <span style="font-size: 12px; font-weight: 500; color: #64748b;">(Incl. VAT)</span></p>
                </div>

                <table class="details-table">
                    <tr>
                        <td class="label">Booking Ref:</td>
                        <td class="value">MM-${ref}</td>
                    </tr>
                    <tr>
                        <td class="label">Proposed Date:</td>
                        <td class="value">${quoteData?.move_date || 'TBD'}</td>
                    </tr>
                    <tr>
                        <td class="label">Collection From:</td>
                        <td class="value">${quoteData?.pickup_address || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Delivery To:</td>
                        <td class="value">${quoteData?.dropoff_address || 'N/A'}</td>
                    </tr>
                </table>

                <p>We have attached the official, itemized PDF quote detailing all inventory items and services requested.</p>
                <p>To confirm and lock in this booking, you can proceed with card or interest-free Payflex payments directly from your quote summary page, or reach out to our booking team to pay via bank EFT.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${originUrl}/quote-review?id=${quoteData?.id}" class="btn">View & Pay Proposal</a>
                </div>
            `
        } else if (type === 'booking_confirmed_alert') {
            // Admin-only booking alert — with PDF, instant, always fires
            const ref = quoteData?.id ? quoteData.id.toString().substring(0, 8).toUpperCase() : 'NEW'
            subject = `✅ BOOKING CONFIRMED — ${quoteData?.client_name || 'Customer'} [MM-${ref}] — R ${Number(quoteData?.total_price || 0).toFixed(2)}`
            recipients = adminEmails

            innerHtml = `
                <h1 style="color:#059669;">✅ Booking Confirmed — Payment Received</h1>
                <p>A customer has successfully paid. The move is officially booked.</p>

                <div class="highlight-box" style="background:#ecfdf5; border-left-color:#059669;">
                    <p style="font-weight:900;font-size:24px;color:#059669;margin:0;">R ${Number(quoteData?.total_price || 0).toFixed(2)} <span style="font-size:13px;font-weight:500;color:#64748b;">(Incl. VAT)</span></p>
                    <p style="margin:4px 0 0;font-size:12px;color:#065f46;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Payment Received via ${(quoteData?.payment_method || 'Card').toUpperCase()}</p>
                </div>

                <table class="details-table">
                    <tr><td class="label">Booking Ref:</td><td class="value" style="font-family:monospace;font-weight:900;font-size:16px;">MM-${ref}</td></tr>
                    <tr><td class="label">Customer:</td><td class="value"><strong>${quoteData?.client_name || '—'}</strong></td></tr>
                    <tr><td class="label">Phone:</td><td class="value"><strong><a href="tel:${quoteData?.client_phone || ''}" style="color:#e31837;">${quoteData?.client_phone || '—'}</a></strong></td></tr>
                    <tr><td class="label">Email:</td><td class="value"><a href="mailto:${quoteData?.client_email || ''}">${quoteData?.client_email || '—'}</a></td></tr>
                    <tr><td class="label">Move Date:</td><td class="value"><strong>${quoteData?.move_date || 'TBD'}</strong></td></tr>
                    <tr><td class="label">Collection From:</td><td class="value">${quoteData?.pickup_address || '—'}</td></tr>
                    <tr><td class="label">Delivery To:</td><td class="value">${quoteData?.dropoff_address || '—'}</td></tr>
                    <tr><td class="label">Payment Method:</td><td class="value" style="text-transform:uppercase;font-weight:700;">${quoteData?.payment_method || '—'}</td></tr>
                    <tr><td class="label">Subtotal (excl. VAT):</td><td class="value">R ${(Number(quoteData?.total_price || 0) / 1.15).toFixed(2)}</td></tr>
                    <tr><td class="label">VAT (15%):</td><td class="value">R ${(Number(quoteData?.total_price || 0) - Number(quoteData?.total_price || 0) / 1.15).toFixed(2)}</td></tr>
                    <tr><td class="label" style="font-size:14px;color:#0f172a;">Total Paid:</td><td class="value" style="font-size:18px;font-weight:900;color:#059669;">R ${Number(quoteData?.total_price || 0).toFixed(2)}</td></tr>
                </table>

                <div style="text-align:center;margin:30px 0;">
                    <a href="https://mastermovers.co.za/admin/quotes/${quoteData?.id || ''}" class="btn" style="background:#059669;">
                        View Booking in Admin →
                    </a>
                </div>

                <p style="font-size:13px;color:#64748b;">Our operations team should contact the customer <strong>48 hours before the move date</strong> to confirm arrival times and crew details.</p>
            `
        } else if (type === 'booking_confirmation') {
            const ref = quoteData?.id ? quoteData.id.toString().substring(0, 8).toUpperCase() : 'MM-NEW'
            subject = `Booking Secured! Master Movers Move [Ref: ${ref}]`
            
            // Add all admin emails to recipient list to ensure notification
            for (const email of adminEmails) {
                if (!recipients.includes(email)) {
                    recipients.push(email)
                }
            }

            innerHtml = `
                <h1>Booking Confirmation</h1>
                <p>Dear ${quoteData?.client_name || 'Valued Customer'},</p>
                <p><strong>Excellent news!</strong> Your payment has been processed successfully and your upcoming move with Master Movers is officially booked and secured.</p>
                
                <div class="highlight-box" style="border-left-color: #10b981; background-color: #ecfdf5;">
                    <p style="margin-bottom: 5px; font-weight: 700; color: #065f46;">✅ Payment Confirmed:</p>
                    <p style="font-size: 28px; font-weight: 900; color: #059669; margin: 0;">R ${Number(quoteData?.total_price || 0).toFixed(2)} <span style="font-size: 13px; font-weight: 500; color: #6b7280;">(Incl. VAT)</span></p>
                </div>

                <!-- Quote Summary -->
                <table class="details-table">
                    <tr><td class="label">Booking Ref:</td><td class="value" style="font-family:monospace;font-size:16px;font-weight:900;">MM-${ref}</td></tr>
                    <tr><td class="label">Move Date:</td><td class="value">${quoteData?.move_date || 'TBD'}</td></tr>
                    <tr><td class="label">Collection From:</td><td class="value">${quoteData?.pickup_address || 'N/A'}</td></tr>
                    <tr><td class="label">Delivery To:</td><td class="value">${quoteData?.dropoff_address || 'N/A'}</td></tr>
                    <tr><td class="label">Payment Method:</td><td class="value" style="text-transform: uppercase;">${quoteData?.payment_method || 'Card/EFT'}</td></tr>
                </table>

                <!-- Pricing Breakdown -->
                <div style="background:#f8fafc;border-radius:10px;padding:20px;margin-bottom:24px;">
                    <p style="font-weight:800;font-size:13px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin:0 0 14px 0;">Price Breakdown</p>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr style="border-bottom:1px solid #e2e8f0;">
                            <td style="padding:8px 0;font-size:13px;color:#64748b;">Subtotal (excl. VAT)</td>
                            <td style="padding:8px 0;font-size:13px;text-align:right;color:#0f172a;">R ${(Number(quoteData?.total_price || 0) / 1.15).toFixed(2)}</td>
                        </tr>
                        <tr style="border-bottom:1px solid #e2e8f0;">
                            <td style="padding:8px 0;font-size:13px;color:#64748b;">VAT (15%)</td>
                            <td style="padding:8px 0;font-size:13px;text-align:right;color:#0f172a;">R ${(Number(quoteData?.total_price || 0) - Number(quoteData?.total_price || 0) / 1.15).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding:12px 0 4px;font-size:15px;font-weight:900;color:#0f172a;">Total Paid</td>
                            <td style="padding:12px 0 4px;font-size:18px;font-weight:900;text-align:right;color:#059669;">R ${Number(quoteData?.total_price || 0).toFixed(2)}</td>
                        </tr>
                    </table>
                </div>

                <p>Our operations planning team will contact you <strong>48 hours before your move date</strong> to confirm arrival times, crew details, and vehicle dispatching.</p>
                <p>If you have any questions in the meantime, call us on <strong>+27 11 493 7569</strong> or reply to this email.</p>
                <p>Thank you for moving with the masters! 🚛</p>
            `
        } else if (type === 'contact_message') {
            subject = `New Website Message from ${contactData?.name || 'Inquirer'}`
            recipients = adminEmails // Send contact messages to all admin emails

            innerHtml = `
                <h1>New Website Contact Message</h1>
                <p>You have received a new message submitted via the contact form on the website.</p>
                
                <table class="details-table">
                    <tr>
                        <td class="label">From:</td>
                        <td class="value">${contactData?.name || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Email Address:</td>
                        <td class="value">${contactData?.email || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Phone Number:</td>
                        <td class="value">${contactData?.phone || 'N/A'}</td>
                    </tr>
                </table>

                <div class="highlight-box">
                    <p style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">Message Content:</p>
                    <p style="white-space: pre-wrap; margin: 0; font-size: 14px; font-style: italic;">"${contactData?.message || ''}"</p>
                </div>
                
                <p>Please follow up with the customer directly at your earliest convenience.</p>
            `
        } else if (type === 'callback_notification') {
            subject = `📞 URGENT: Call Back Request — ${contactData?.name || 'Customer'}`
            recipients = adminEmails // Admin-only alert

            innerHtml = `
                <h1 style="color:#e31837;">📞 Callback Request</h1>
                <p>A customer has requested a call back via the website. Please contact them as soon as possible.</p>

                <div class="highlight-box" style="border-left-color:#e31837; background:#fff5f5;">
                    <p style="font-weight:900;font-size:18px;color:#0f172a;margin:0 0 4px;">${contactData?.name || 'Unknown Customer'}</p>
                    <p style="margin:0;font-size:15px;color:#e31837;font-weight:700;">${contactData?.phone || 'No phone provided'}</p>
                </div>

                <table class="details-table">
                    <tr><td class="label">Name:</td><td class="value">${contactData?.name || '—'}</td></tr>
                    <tr><td class="label">Phone:</td><td class="value"><strong>${contactData?.phone || '—'}</strong></td></tr>
                    <tr><td class="label">Email:</td><td class="value">${contactData?.email || '—'}</td></tr>
                    <tr><td class="label">Step:</td><td class="value">${contactData?.step || 'Quote Flow'}</td></tr>
                    <tr><td class="label">From:</td><td class="value">${contactData?.pickup || '—'}</td></tr>
                    <tr><td class="label">To:</td><td class="value">${contactData?.dropoff || '—'}</td></tr>
                    <tr><td class="label">Move Date:</td><td class="value">${contactData?.moveDate || 'TBD'}</td></tr>
                </table>

                <p>Call them back immediately on <strong>${contactData?.phone || '—'}</strong> or reply to this email.</p>
            `
        } else if (type === 'outline_area_alert') {
            subject = `🚛 Outline area request for quote (${contactData?.name || 'Customer'})`
            recipients = adminEmails

            innerHtml = `
                <h1 style="color:#e31837;">🚛 Outline Area Custom Quote Request</h1>
                <p>A customer has selected an outline area that our trucks don't regularly service. They have requested a custom quote.</p>
                
                <table class="details-table">
                    <tr><td class="label">Name:</td><td class="value">${contactData?.name || '—'}</td></tr>
                    <tr><td class="label">Phone:</td><td class="value"><strong><a href="tel:${contactData?.phone || ''}">${contactData?.phone || '—'}</a></strong></td></tr>
                    <tr><td class="label">Email:</td><td class="value"><a href="mailto:${contactData?.email || ''}">${contactData?.email || '—'}</a></td></tr>
                    <tr><td class="label">From:</td><td class="value">${contactData?.pickup || '—'}</td></tr>
                    <tr><td class="label">To:</td><td class="value">${contactData?.dropoff || '—'}</td></tr>
                </table>

                <p>Please contact them on <strong>${contactData?.phone || '—'}</strong> to discuss their requirements and prepare a custom quote.</p>
            `
        } else if (type === 'location_not_found_alert') {
            subject = `📍 Client cant find address - assist (${contactData?.name || 'Customer'})`
            recipients = adminEmails

            innerHtml = `
                <h1 style="color:#e31837;">📍 Location Assistance Lead</h1>
                <p>A customer could not find their address using the map search and requested assistance.</p>
                
                <table class="details-table">
                    <tr><td class="label">Name:</td><td class="value">${contactData?.name || '—'}</td></tr>
                    <tr><td class="label">Phone:</td><td class="value"><strong><a href="tel:${contactData?.phone || ''}">${contactData?.phone || '—'}</a></strong></td></tr>
                    <tr><td class="label">Email:</td><td class="value"><a href="mailto:${contactData?.email || ''}">${contactData?.email || '—'}</a></td></tr>
                    <tr><td class="label">Field:</td><td class="value">${contactData?.fieldName || '—'}</td></tr>
                    <tr><td class="label">Entered Value:</td><td class="value">${contactData?.enteredValue || '—'}</td></tr>
                    <tr><td class="label">Comments:</td><td class="value">${contactData?.comments || '—'}</td></tr>
                </table>

                <p>Please contact them on <strong>${contactData?.phone || '—'}</strong> immediately to assist with their quote.</p>
            `
        } else if (type === 'abandoned_lead_alert') {
            const ref = quoteData?.id ? quoteData.id.toString().substring(0, 8).toUpperCase() : 'NEW'
            subject = `⭐️ NEW LEAD — ${quoteData?.client_name || 'Unknown Customer'} [MM-${ref}]`
            recipients = adminEmails // Admin-only

            // Build inventory HTML from items_json
            // items_json can be { items: {...} } or a flat { itemId: qty } object
            const rawItems = quoteData?.items_json?.items || quoteData?.items_json || {}
            const itemEntries = Object.entries(rawItems).filter(([, qty]) => Number(qty) > 0)

            let inventoryHtml = ''
            if (itemEntries.length > 0) {
                const totalQty = itemEntries.reduce((sum, [, qty]) => sum + Number(qty), 0)
                const rows = itemEntries.map(([itemId, qty]) => {
                    // Clean up the item ID — strip variation suffix (e.g. "sofa_3seater" → "Sofa 3Seater")
                    const cleanName = itemId
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (c: string) => c.toUpperCase())
                    return `<tr>
                        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;">${cleanName}</td>
                        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:#0f172a;text-align:center;">${qty}</td>
                    </tr>`
                }).join('')

                inventoryHtml = `
                <div style="margin-top:24px;">
                    <p style="font-weight:800;font-size:12px;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px 0;">
                        📦 Inventory Added (${totalQty} item${totalQty !== 1 ? 's' : ''})
                    </p>
                    <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
                        <thead>
                            <tr style="background:#0f172a;">
                                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Item</th>
                                <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Qty</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    ${quoteData?.total_volume ? `<p style="font-size:12px;color:#64748b;margin:8px 0 0;font-weight:600;">Total Volume: <strong style="color:#0f172a;">${Number(quoteData.total_volume).toFixed(1)} cuft</strong></p>` : ''}
                </div>`
            } else {
                inventoryHtml = `
                <div style="margin-top:20px;padding:12px 16px;background:#fefce8;border-left:3px solid #eab308;border-radius:6px;">
                    <p style="margin:0;font-size:12px;font-weight:600;color:#92400e;">⚠️ No inventory added yet — customer dropped off before Step 3</p>
                </div>`
            }

            // Work out which step the customer dropped off at
            const hasAddresses = !!(quoteData?.pickup_address && quoteData?.dropoff_address)
            const hasInventory = itemEntries.length > 0
            const hasPrice = Number(quoteData?.total_price || 0) > 0
            let stepDropped = ''
            let stepColor = '#64748b'
            if (!hasAddresses) {
                stepDropped = 'Step 1 — Details (addresses not entered)'
                stepColor = '#dc2626'
            } else if (!hasInventory) {
                stepDropped = 'Step 3 — Inventory (not yet started)'
                stepColor = '#d97706'
            } else if (!hasPrice) {
                stepDropped = 'Step 3 — Inventory (in progress)'
                stepColor = '#d97706'
            } else {
                stepDropped = 'Step 4 — Quote Summary (saw price, did not submit)'
                stepColor = '#059669'
            }

            innerHtml = `
                <h1 style="color:#059669;">⭐️ New Lead</h1>
                <p>A customer has started a quote but has not yet completed it. Please follow up to assist them.</p>

                ${hasInventory && hasPrice ? `
                <div class="highlight-box" style="background:#f0fdf4; border-left-color:#059669;">
                    <p style="font-weight:900;font-size:22px;color:#047857;margin:0;">R ${Number(quoteData?.total_price || 0).toFixed(2)} <span style="font-size:13px;font-weight:500;color:#10b981;">(Current Total)</span></p>
                    <p style="margin:4px 0 0;font-size:12px;color:#10b981;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Incomplete Quote Flow</p>
                </div>
                ` : `
                <div style="padding:12px 16px;background:#f8fafc;border-left:3px solid #94a3b8;border-radius:6px;margin-bottom:16px;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:#64748b;">No price yet — customer has not added inventory</p>
                </div>
                `}

                <table class="details-table">
                    <tr><td class="label">Customer:</td><td class="value"><strong>${quoteData?.client_name || '—'}</strong></td></tr>
                    <tr><td class="label">Phone:</td><td class="value"><strong><a href="tel:${quoteData?.client_phone || ''}" style="color:#e31837;">${quoteData?.client_phone || '—'}</a></strong></td></tr>
                    <tr><td class="label">Email:</td><td class="value"><a href="mailto:${quoteData?.client_email || ''}">${quoteData?.client_email || '—'}</a></td></tr>
                    <tr><td class="label">Collection From:</td><td class="value">${quoteData?.pickup_address || '—'}</td></tr>
                    <tr><td class="label">Delivery To:</td><td class="value">${quoteData?.dropoff_address || '—'}</td></tr>
                    <tr><td class="label">Move Date:</td><td class="value">${quoteData?.move_date || 'TBD'}</td></tr>
                    <tr>
                        <td class="label">Step:</td>
                        <td class="value" style="font-weight:700;color:${stepColor};">${stepDropped}</td>
                    </tr>
                    <tr>
                        <td class="label">Inventory:</td>
                        <td class="value" style="${!hasInventory ? 'color:#94a3b8;font-style:italic;' : 'font-weight:700;color:#0f172a;'}">
                            ${hasInventory ? `${itemEntries.reduce((s, [,q]) => s + Number(q), 0)} items added` : 'Not completed yet'}
                        </td>
                    </tr>
                </table>

                ${inventoryHtml}

                <div style="text-align:center;margin:24px 0 12px;">
                    <a href="https://mastermovers.co.za/admin/quotes/${quoteData?.id || ''}" class="btn" style="background:#059669;">
                        View Lead in Admin →
                    </a>
                </div>

                <p style="font-size:13px;color:#64748b;">Call the customer on <strong>${quoteData?.client_phone || '—'}</strong> to assist with their move requirements.</p>
            `
        } else if (type === 'payment_link') {
            const ref = quoteData?.id ? quoteData.id.toString().substring(0, 8).toUpperCase() : 'MM'
            subject = `Complete Your Master Movers Booking [Ref: MM-${ref}]`
            recipients = typeof to === 'string' ? [to] : (to || [quoteData?.client_email])

            innerHtml = `
                <h1>Your Move is Ready to Book!</h1>
                <p>Dear ${quoteData?.client_name || 'Valued Customer'},</p>
                <p>Your moving quote from Master Movers is saved and ready. Click the button below to view your full quote summary and complete your payment securely online.</p>

                <div class="highlight-box">
                    <p style="margin-bottom: 5px; font-weight: 700; color: #0f172a;">Quote Total:</p>
                    <p style="font-size: 28px; font-weight: 900; color: #e31837; margin: 0;">R ${Number(quoteData?.total_price || 0).toFixed(2)} <span style="font-size: 13px; font-weight: 500; color: #6b7280;">(Incl. VAT)</span></p>
                </div>

                <table class="details-table">
                    <tr><td class="label">Booking Ref:</td><td class="value" style="font-family:monospace;font-weight:900;">MM-${ref}</td></tr>
                    <tr><td class="label">Move Date:</td><td class="value">${quoteData?.move_date || 'TBD'}</td></tr>
                    <tr><td class="label">From:</td><td class="value">${quoteData?.pickup_address || 'N/A'}</td></tr>
                    <tr><td class="label">To:</td><td class="value">${quoteData?.dropoff_address || 'N/A'}</td></tr>
                </table>

                <p>We accept <strong>credit/debit card</strong> and <strong>Payflex interest-free instalments</strong> (4 payments over 6 weeks).</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${paymentLink || '#'}" class="btn" style="font-size:16px;padding:18px 40px;">
                        View Quote &amp; Pay Now →
                    </a>
                </div>

                <p style="font-size:12px;color:#94a3b8;text-align:center;">This link is unique to your quote. If you have any questions, call us on <strong>+27 11 493 7569</strong>.</p>
            `
        } else {
            throw new Error(`Unsupported email type: ${type}`)
        }

        const htmlBody = getBrandedTemplate(subject, innerHtml)

        // Compile attachments
        const attachments = []
        if (pdfBase64 && pdfFilename) {
            attachments.push({
                content: pdfBase64,
                filename: pdfFilename,
            })
        }

        // Call Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: sender,
                to: recipients,
                subject: subject,
                html: htmlBody,
                attachments: attachments.length > 0 ? attachments : undefined
            }),
        })

        const result = await response.json()

        if (!response.ok) {
            console.error("Resend API Error:", result)
            throw new Error(result.message || "Failed to send email via Resend")
        }

        console.log(`Email sent successfully! Type: ${type}, ID: ${result.id}`)

        return new Response(
            JSON.stringify({ success: true, messageId: result.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error) {
        console.error("Error in send-email function:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
