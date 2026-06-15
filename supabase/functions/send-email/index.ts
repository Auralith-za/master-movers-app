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
        const { type, to, quoteData, contactData, pdfBase64, pdfFilename } = await req.json()

        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        const adminEmailSecret = Deno.env.get('ADMIN_EMAIL') || 'curtleroux7785@gmail.com'
        const adminEmails = adminEmailSecret.split(',').map(e => e.trim()).filter(Boolean)
        const sender = Deno.env.get('EMAIL_SENDER') || 'Master Movers <onboarding@resend.dev>'
        const originUrl = req.headers.get('origin') || 'https://mastermovers.co.za'

        if (!resendApiKey) {
            throw new Error("Missing RESEND_API_KEY environment secret.")
        }

        let subject = ""
        let innerHtml = ""
        let recipients = typeof to === 'string' ? [to] : to

        // Compile standard layout or customer-facing details based on email type
        if (type === 'quote_proposal') {
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
        } else {
            throw new Error(`Unsupported email type: ${type}`)
        }

        const htmlBody = getBrandedTemplate(subject, innerHtml)

        // Compile attachments
        const attachments = []
        if (pdfBase64 && pdfFilename) {
            const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '')
            attachments.push({
                content: cleanBase64,
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
