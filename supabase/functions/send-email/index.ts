import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to clean duplicate consecutive words in client names (e.g. "Marné Van Aarde Van Aarde" -> "Marné Van Aarde")
function cleanClientName(name?: string): string {
    if (!name) return ''
    let cleaned = name.trim()
    while (/\b(.+?)\s+\1\b/i.test(cleaned)) {
        cleaned = cleaned.replace(/\b(.+?)\s+\1\b/gi, '$1').trim()
    }
    return cleaned
}

// Helper to format inventory list as clean HTML table for email templates
function renderInventoryTableHtml(rawItemsInput: any, totalVolume?: number | string): string {
    if (!rawItemsInput) return ''

    let rawItems: any = rawItemsInput
    if (typeof rawItems === 'string') {
        try {
            rawItems = JSON.parse(rawItems)
        } catch (_) {
            return ''
        }
    }

    if (rawItems && typeof rawItems === 'object' && !Array.isArray(rawItems)) {
        if (rawItems.items) {
            rawItems = rawItems.items
        }
    }

    const itemRows: Array<{ name: string; qty: number; room?: string }> = []

    if (Array.isArray(rawItems)) {
        for (const it of rawItems) {
            if (!it) continue
            const qty = Number(it.quantity || it.qty || it.count || 1)
            if (qty <= 0) continue
            const name = it.name || it.item_name || it.description || it.id || 'Item'
            const room = it.room || it.category || undefined
            itemRows.push({ name: String(name), qty, room: room ? String(room) : undefined })
        }
    } else if (rawItems && typeof rawItems === 'object') {
        for (const [key, val] of Object.entries(rawItems)) {
            const qty = Number(val)
            if (isNaN(qty) || qty <= 0) continue

            let itemKey = key
            let room: string | undefined = undefined

            if (itemKey.includes('__room:')) {
                const parts = itemKey.split('__room:')
                itemKey = parts[0]
                room = parts[1]
            } else if (itemKey.includes('_room:')) {
                const parts = itemKey.split('_room:')
                itemKey = parts[0]
                room = parts[1]
            } else if (itemKey.includes(' Room:')) {
                const parts = itemKey.split(' Room:')
                itemKey = parts[0]
                room = parts[1]
            } else if (itemKey.includes(' room:')) {
                const parts = itemKey.split(' room:')
                itemKey = parts[0]
                room = parts[1]
            } else if (itemKey.includes('__')) {
                const parts = itemKey.split('__')
                itemKey = parts[0]
                room = parts[1]
            }

            if (room) {
                room = room.replace(/^room:\s*/i, '').replace(/_/g, ' ').trim()
                if (room) {
                    room = room.replace(/\b\w/g, (c: string) => c.toUpperCase())
                } else {
                    room = undefined
                }
            }

            let cleanName = itemKey
                .replace(/_/g, ' ')
                .replace(/-/g, ' ')
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .replace(/\b(\w)/g, (c: string) => c.toUpperCase())
                .replace(/\b3seater\b/i, '3-Seater')
                .replace(/\b2seater\b/i, '2-Seater')
                .replace(/\b1seater\b/i, '1-Seater')
                .replace(/\b4seater\b/i, '4-Seater')
                .trim()

            itemRows.push({ name: cleanName, qty, room })
        }
    }

    if (itemRows.length === 0) return ''

    const totalQty = itemRows.reduce((sum, item) => sum + item.qty, 0)
    const hasRooms = itemRows.some(item => !!item.room)

    let rowsHtml = ''

    if (hasRooms) {
        const grouped: { [room: string]: Array<{ name: string; qty: number }> } = {}
        for (const item of itemRows) {
            const roomName = item.room || 'General Inventory'
            if (!grouped[roomName]) grouped[roomName] = []
            grouped[roomName].push(item)
        }

        for (const [roomName, items] of Object.entries(grouped)) {
            rowsHtml += `
                <tr style="background:#f1f5f9;">
                    <td colspan="2" style="padding:8px 14px;font-size:11px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;border-top:1px solid #e2e8f0;">
                        📍 ${roomName}
                    </td>
                </tr>
            `
            for (const item of items) {
                rowsHtml += `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:10px 14px;font-size:13px;color:#334155;">${item.name}</td>
                        <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#0f172a;text-align:center;">${item.qty}</td>
                    </tr>
                `
            }
        }
    } else {
        for (let i = 0; i < itemRows.length; i++) {
            const item = itemRows[i]
            const bgStyle = i % 2 === 1 ? 'background-color:#f8fafc;' : ''
            rowsHtml += `
                <tr style="border-bottom:1px solid #f1f5f9;${bgStyle}">
                    <td style="padding:10px 14px;font-size:13px;color:#334155;">${item.name}</td>
                    <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#0f172a;text-align:center;">${item.qty}</td>
                </tr>
            `
        }
    }

    const volText = totalVolume ? Number(totalVolume).toFixed(1) : null

    return `
        <div style="margin:25px 0;">
            <div style="margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e2e8f0;">
                <table style="width:100%;">
                    <tr>
                        <td style="font-size:14px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">
                            📦 Order Inventory <span style="font-size:12px;font-weight:600;color:#64748b;text-transform:none;">(${totalQty} ${totalQty === 1 ? 'item' : 'items'})</span>
                        </td>
                        ${volText ? `
                        <td style="text-align:right;">
                            <span style="font-size:11px;font-weight:700;color:#059669;background:#ecfdf5;padding:4px 10px;border-radius:20px;border:1px solid #a7f3d0;display:inline-block;">
                                Volume: ${volText} cuft
                            </span>
                        </td>
                        ` : ''}
                    </tr>
                </table>
            </div>
            <table style="width:100%;border-collapse:collapse;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
                <thead>
                    <tr style="background:#0f172a;color:#ffffff;">
                        <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Item Description</th>
                        <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;width:70px;">Qty</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>
    `
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
                    <p>Call: <a href="tel:+27114937569">+27 11 493 7569</a> | Email: <a href="mailto:sales1@mastermoversjhb.co.za">sales1@mastermoversjhb.co.za</a></p>
                    <p style="font-size: 10px; margin-top: 15px; opacity: 0.6;">&copy; ${new Date().getFullYear()} Master Movers. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `
}

function buildStandardDetailsTable({
    ref,
    name,
    phone,
    email,
    pickup,
    dropoff,
    moveDate,
    moveType,
    referralSource,
    paymentMethod,
    subtotal,
    vat,
    total,
    step,
    notes
}: {
    ref?: string,
    name?: string,
    phone?: string,
    email?: string,
    pickup?: string,
    dropoff?: string,
    moveDate?: string,
    moveType?: string,
    referralSource?: string,
    paymentMethod?: string,
    subtotal?: string | number,
    vat?: string | number,
    total?: string | number,
    step?: string,
    notes?: string
}) {
    const cleanRef = ref ? (ref.startsWith('MM-') ? ref : `MM-${ref}`) : '—'
    const phoneDisplay = phone ? `<a href="tel:${phone}" style="color:#e31837;font-weight:700;">${phone}</a>` : '—'
    const emailDisplay = email ? `<a href="mailto:${email}">${email}</a>` : '—'
    
    const numTotal = Number(total || 0)
    const subtotalDisplay = (subtotal && Number(subtotal) > 0)
        ? `R ${Number(subtotal).toFixed(2)}`
        : (numTotal > 0 ? `R ${(numTotal / 1.15).toFixed(2)}` : '—')

    const vatDisplay = (vat && Number(vat) > 0)
        ? `R ${Number(vat).toFixed(2)}`
        : (numTotal > 0 ? `R ${(numTotal - numTotal / 1.15).toFixed(2)}` : '—')

    const totalDisplay = numTotal > 0 ? `R ${numTotal.toFixed(2)} (Incl. VAT)` : '—'

    return `
    <table class="details-table">
        <tr><td class="label">Quote / Booking Ref:</td><td class="value" style="font-family:monospace;font-weight:900;">${cleanRef}</td></tr>
        <tr><td class="label">Customer Name:</td><td class="value"><strong>${name || '—'}</strong></td></tr>
        <tr><td class="label">Phone Number:</td><td class="value">${phoneDisplay}</td></tr>
        <tr><td class="label">Email Address:</td><td class="value">${emailDisplay}</td></tr>
        <tr><td class="label">Collection From:</td><td class="value">${pickup || '—'}</td></tr>
        <tr><td class="label">Delivery To:</td><td class="value">${dropoff || '—'}</td></tr>
        <tr><td class="label">Preferred Move Date:</td><td class="value"><strong>${moveDate || '—'}</strong></td></tr>
        <tr><td class="label">Move Type / Route:</td><td class="value">${moveType || '—'}</td></tr>
        <tr><td class="label">Heard About Us:</td><td class="value"><strong>${referralSource || '—'}</strong></td></tr>
        <tr><td class="label">Payment Method:</td><td class="value" style="text-transform:uppercase;">${paymentMethod || '—'}</td></tr>
        <tr><td class="label">Subtotal (excl. VAT):</td><td class="value">${subtotalDisplay}</td></tr>
        <tr><td class="label">VAT (15%):</td><td class="value">${vatDisplay}</td></tr>
        <tr><td class="label" style="font-size:14px;color:#0f172a;">Total Price:</td><td class="value" style="font-size:16px;font-weight:900;color:#059669;">${totalDisplay}</td></tr>
        <tr><td class="label">Flow Step / Status:</td><td class="value">${step || '—'}</td></tr>
        <tr><td class="label">Notes / Details:</td><td class="value" style="${notes ? 'font-weight:600;color:#334155;' : ''}">${notes || '—'}</td></tr>
    </table>
    `
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { type, to, quoteData, contactData, pdfBase64, pdfFilename, paymentLink } = await req.json()

        if (quoteData && quoteData.client_name) {
            quoteData.client_name = cleanClientName(quoteData.client_name)
        }
        if (contactData && contactData.name) {
            contactData.name = cleanClientName(contactData.name)
        }

        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        
        // Designated admin recipients for all internal notifications (new leads, callbacks, outline areas, quotes, bookings, etc.)
        const adminEmails = [
            'curtleroux7785@gmail.com',
            'ray@nova-gg.com',
            'sales1@mastermoversjhb.co.za',
            'melonie@nova-gg.com',
            'accounts@mastermoversjhb.co.za'
        ]
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

            let inventoryData = quoteData?.items_json || quoteData?.inventory || quoteData?.items
            let totalVolume = quoteData?.total_volume || quoteData?.totalVolume || quoteData?.items_json?.total_volume || quoteData?.items_json?.breakdown?.cubicFeet

            if ((!inventoryData || (typeof inventoryData === 'object' && Object.keys(inventoryData).length === 0)) && quoteData?.id) {
                try {
                    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
                    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
                    if (supabaseUrl && serviceKey) {
                        const supabaseAdmin = createClient(supabaseUrl, serviceKey)
                        const { data: qData } = await supabaseAdmin
                            .from('quotes')
                            .select('items_json, total_volume')
                            .eq('id', quoteData.id)
                            .maybeSingle()
                        if (qData) {
                            if (qData.items_json) inventoryData = qData.items_json
                            if (qData.total_volume && !totalVolume) totalVolume = qData.total_volume
                        }
                    }
                } catch (e) {
                    console.warn('Could not fetch quote inventory fallback:', e)
                }
            }

            const inventoryHtml = renderInventoryTableHtml(inventoryData, totalVolume)

            innerHtml = `
                <h1 style="color:#0f172a;">🔔 New Pending Quote</h1>
                <p>A customer has completed their inventory and is <strong>viewing their quote on Step 4</strong>. They may need a follow-up call to convert to a booking.</p>

                ${buildStandardDetailsTable({
                    ref: ref,
                    name: quoteData?.client_name,
                    phone: quoteData?.client_phone,
                    email: quoteData?.client_email,
                    pickup: quoteData?.pickup_address,
                    dropoff: quoteData?.dropoff_address,
                    moveDate: quoteData?.move_date,
                    moveType: quoteData?.move_type,
                    referralSource: quoteData?.referral_source || quoteData?.items_json?.referral_source || quoteData?.items_json?.referralSource,
                    paymentMethod: quoteData?.payment_method || 'Awaiting Selection',
                    total: quoteData?.total_price,
                    step: 'Step 4 — Quote Summary (Awaiting Payment)',
                    notes: quoteData?.customer_comments
                })}

                ${inventoryHtml}

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

            let inventoryData = quoteData?.items_json || quoteData?.inventory || quoteData?.items
            let totalVolume = quoteData?.total_volume || quoteData?.totalVolume || quoteData?.items_json?.total_volume || quoteData?.items_json?.breakdown?.cubicFeet

            if ((!inventoryData || (typeof inventoryData === 'object' && Object.keys(inventoryData).length === 0)) && quoteData?.id) {
                try {
                    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
                    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
                    if (supabaseUrl && serviceKey) {
                        const supabaseAdmin = createClient(supabaseUrl, serviceKey)
                        const { data: qData } = await supabaseAdmin
                            .from('quotes')
                            .select('items_json, total_volume')
                            .eq('id', quoteData.id)
                            .maybeSingle()
                        if (qData) {
                            if (qData.items_json) inventoryData = qData.items_json
                            if (qData.total_volume && !totalVolume) totalVolume = qData.total_volume
                        }
                    }
                } catch (e) {
                    console.warn('Could not fetch quote inventory fallback:', e)
                }
            }

            const inventoryHtml = renderInventoryTableHtml(inventoryData, totalVolume)

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

                ${inventoryHtml}

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

            let inventoryData = quoteData?.items_json || quoteData?.inventory || quoteData?.items
            let totalVolume = quoteData?.total_volume || quoteData?.totalVolume || quoteData?.items_json?.total_volume || quoteData?.items_json?.breakdown?.cubicFeet

            if ((!inventoryData || (typeof inventoryData === 'object' && Object.keys(inventoryData).length === 0)) && quoteData?.id) {
                try {
                    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
                    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
                    if (supabaseUrl && serviceKey) {
                        const supabaseAdmin = createClient(supabaseUrl, serviceKey)
                        const { data: qData } = await supabaseAdmin
                            .from('quotes')
                            .select('items_json, total_volume')
                            .eq('id', quoteData.id)
                            .maybeSingle()
                        if (qData) {
                            if (qData.items_json) inventoryData = qData.items_json
                            if (qData.total_volume && !totalVolume) totalVolume = qData.total_volume
                        }
                    }
                } catch (e) {
                    console.warn('Could not fetch quote inventory fallback:', e)
                }
            }

            const inventoryHtml = renderInventoryTableHtml(inventoryData, totalVolume)

            innerHtml = `
                <h1 style="color:#059669;">✅ Booking Confirmed — Payment Received</h1>
                <p>A customer has successfully paid. The move is officially booked.</p>

                ${buildStandardDetailsTable({
                    ref: ref,
                    name: quoteData?.client_name,
                    phone: quoteData?.client_phone,
                    email: quoteData?.client_email,
                    pickup: quoteData?.pickup_address,
                    dropoff: quoteData?.dropoff_address,
                    moveDate: quoteData?.move_date,
                    moveType: quoteData?.move_type,
                    referralSource: quoteData?.referral_source || quoteData?.items_json?.referral_source || quoteData?.items_json?.referralSource,
                    paymentMethod: (quoteData?.payment_method || 'Card / EFT').toUpperCase(),
                    total: quoteData?.total_price,
                    step: 'Booking Confirmed / Payment Received',
                    notes: quoteData?.customer_comments
                })}

                ${inventoryHtml}

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

            let inventoryData = quoteData?.items_json || quoteData?.inventory || quoteData?.items
            let totalVolume = quoteData?.total_volume || quoteData?.totalVolume || quoteData?.items_json?.total_volume || quoteData?.items_json?.breakdown?.cubicFeet

            if ((!inventoryData || (typeof inventoryData === 'object' && Object.keys(inventoryData).length === 0)) && quoteData?.id) {
                try {
                    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
                    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
                    if (supabaseUrl && serviceKey) {
                        const supabaseAdmin = createClient(supabaseUrl, serviceKey)
                        const { data: qData } = await supabaseAdmin
                            .from('quotes')
                            .select('items_json, total_volume')
                            .eq('id', quoteData.id)
                            .maybeSingle()
                        if (qData) {
                            if (qData.items_json) inventoryData = qData.items_json
                            if (qData.total_volume && !totalVolume) totalVolume = qData.total_volume
                        }
                    }
                } catch (e) {
                    console.warn('Could not fetch quote inventory fallback:', e)
                }
            }

            const inventoryHtml = renderInventoryTableHtml(inventoryData, totalVolume)

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

                ${inventoryHtml}

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
            const isJobApp = (contactData?.name || '').includes('[JOB APPLICATION]') ||
                             (contactData?.message || '').includes('[JOB APPLICATION]') ||
                             (contactData?.message || '').toLowerCase().includes('job application') ||
                             to === 'marketing@mastermoversjhb.co.za'

            if (isJobApp) {
                recipients = ['marketing@mastermoversjhb.co.za']
            } else {
                recipients = adminEmails // Send contact messages to all admin emails
            }

            innerHtml = `
                <h1>New Website Contact Message</h1>
                <p>You have received a new message submitted via the contact form on the website.</p>
                
                ${buildStandardDetailsTable({
                    name: contactData?.name,
                    phone: contactData?.phone,
                    email: contactData?.email,
                    step: 'Website Contact Page Form',
                    notes: contactData?.message
                })}
                
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

                ${buildStandardDetailsTable({
                    name: contactData?.name,
                    phone: contactData?.phone,
                    email: contactData?.email,
                    pickup: contactData?.pickup,
                    dropoff: contactData?.dropoff,
                    moveDate: contactData?.moveDate,
                    referralSource: contactData?.referral_source || contactData?.referralSource,
                    step: contactData?.step || 'Quote Flow Callback Request',
                    notes: contactData?.notes || contactData?.comments
                })}

                <p>Call them back immediately on <strong>${contactData?.phone || '—'}</strong> or reply to this email.</p>
            `
        } else if (type === 'outline_area_alert') {
            subject = `🚛 Outline area request for quote (${contactData?.name || 'Customer'})`
            recipients = adminEmails

            innerHtml = `
                <h1 style="color:#e31837;">🚛 Outline Area Custom Quote Request</h1>
                <p>A customer has selected an outline area that our trucks don't regularly service. They have requested a custom quote.</p>
                
                ${buildStandardDetailsTable({
                    name: contactData?.name,
                    phone: contactData?.phone,
                    email: contactData?.email,
                    pickup: contactData?.pickup,
                    dropoff: contactData?.dropoff,
                    step: 'Outlaying Area Custom Quote Request',
                    notes: contactData?.notes || contactData?.comments
                })}

                <p>Please contact them on <strong>${contactData?.phone || '—'}</strong> to discuss their requirements and prepare a custom quote.</p>
            `
        } else if (type === 'job_application_alert') {
            subject = `💼 New Job Application: ${contactData?.name || 'Applicant'} — ${contactData?.position || 'Position'}`
            recipients = ['marketing@mastermoversjhb.co.za']

            innerHtml = `
                <h1 style="color:#e31837;">💼 New Job Application Received</h1>
                <p>A new job candidate has submitted their application via the Master Movers Careers portal.</p>

                <div class="highlight-box" style="border-left-color:#0f172a; background:#f8fafc;">
                    <p style="font-weight:900;font-size:18px;color:#0f172a;margin:0 0 4px;">${contactData?.name || 'Candidate'}</p>
                    <p style="margin:0;font-size:14px;color:#e31837;font-weight:700;">Applied Position: ${contactData?.position || '—'}</p>
                </div>

                <table class="details-table">
                    <tr><td class="label">Candidate Name:</td><td class="value"><strong>${contactData?.name || '—'}</strong></td></tr>
                    <tr><td class="label">Position:</td><td class="value"><strong>${contactData?.position || '—'}</strong></td></tr>
                    <tr><td class="label">Phone:</td><td class="value"><a href="tel:${contactData?.phone || ''}"><strong>${contactData?.phone || '—'}</strong></a></td></tr>
                    <tr><td class="label">Email:</td><td class="value"><a href="mailto:${contactData?.email || ''}">${contactData?.email || '—'}</a></td></tr>
                    <tr><td class="label">Experience:</td><td class="value">${contactData?.experience || 'N/A'}</td></tr>
                    <tr><td class="label">Driver License:</td><td class="value">${contactData?.license || 'None'}</td></tr>
                    <tr><td class="label">Start Availability:</td><td class="value"><strong>${contactData?.availability || 'Immediate'}</strong></td></tr>
                </table>

                ${contactData?.notes ? `
                <div class="highlight-box" style="margin-top:16px;">
                    <p style="font-weight:700;color:#0f172a;margin-bottom:6px;">Experience & Qualifications Notes:</p>
                    <p style="white-space:pre-wrap;margin:0;font-size:13px;color:#334155;">"${contactData.notes}"</p>
                </div>
                ` : ''}

                <p style="margin-top:20px;">You can view and manage all applications in the <a href="https://mastermovers.co.za/admin/job-applications" style="color:#e31837;font-weight:bold;">Admin Job Applications Portal</a>.</p>
            `
        } else if (type === 'location_not_found_alert') {
            subject = `📍 Client cant find address - assist (${contactData?.name || 'Customer'})`
            recipients = adminEmails

            innerHtml = `
                <h1 style="color:#e31837;">📍 Location Assistance Lead</h1>
                <p>A customer could not find their address using the map search and requested assistance.</p>
                
                ${buildStandardDetailsTable({
                    name: contactData?.name,
                    phone: contactData?.phone,
                    email: contactData?.email,
                    pickup: `${contactData?.fieldName || 'Field'}: ${contactData?.enteredValue || '—'}`,
                    step: `Location Search Assistance (${contactData?.fieldName || 'Address'})`,
                    notes: contactData?.comments
                })}

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
                inventoryHtml = renderInventoryTableHtml(rawItems, quoteData?.total_volume)
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

                ${buildStandardDetailsTable({
                    ref: ref !== 'NEW' ? ref : undefined,
                    name: quoteData?.client_name,
                    phone: quoteData?.client_phone,
                    email: quoteData?.client_email,
                    pickup: quoteData?.pickup_address,
                    dropoff: quoteData?.dropoff_address,
                    moveDate: quoteData?.move_date,
                    moveType: quoteData?.move_type,
                    referralSource: quoteData?.referral_source || quoteData?.items_json?.referral_source || quoteData?.items_json?.referralSource,
                    paymentMethod: quoteData?.payment_method,
                    total: quoteData?.total_price,
                    step: stepDropped,
                    notes: hasInventory ? `${itemEntries.reduce((s, [, q]) => s + Number(q), 0)} items added in inventory` : 'No inventory added yet'
                })}

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
        } else if (type === 'quote_rejected_alert') {
            const ref = quoteData?.id ? quoteData.id.toString().substring(0, 8).toUpperCase() : 'NEW'
            subject = `❌ QUOTE REJECTED — ${quoteData?.client_name || 'Customer'} [MM-${ref}]`
            recipients = adminEmails

            const reasonText = quoteData?.rejection_reason || quoteData?.reject_reason || 'No reason provided'

            innerHtml = `
                <h1 style="color:#e31837;">❌ Quote Rejected by Client</h1>
                <p>A customer has rejected/declined their move quote on the website. Details and customer reason are provided below for follow-up.</p>

                <div class="highlight-box" style="background:#fff5f5; border-left-color:#e31837;">
                    <p style="margin:0 0 6px 0; font-size:11px; font-weight:800; color:#e31837; text-transform:uppercase; letter-spacing:1px;">Reason for Rejection:</p>
                    <p style="margin:0; font-size:15px; font-weight:700; color:#0f172a; white-space:pre-wrap;">"${reasonText}"</p>
                </div>

                ${buildStandardDetailsTable({
                    ref: ref,
                    name: quoteData?.client_name,
                    phone: quoteData?.client_phone,
                    email: quoteData?.client_email,
                    pickup: quoteData?.pickup_address,
                    dropoff: quoteData?.dropoff_address,
                    moveDate: quoteData?.move_date,
                    moveType: quoteData?.move_type,
                    referralSource: quoteData?.referral_source || quoteData?.items_json?.referral_source || quoteData?.items_json?.referralSource,
                    paymentMethod: quoteData?.payment_method,
                    total: quoteData?.total_price,
                    step: 'Quote Declined / Rejected by Client',
                    notes: reasonText
                })}

                <div style="text-align:center;margin:30px 0;">
                    <a href="https://mastermovers.co.za/admin/quotes/${quoteData?.id || ''}" class="btn" style="background:#e31837;">
                        View Quote in Admin →
                    </a>
                </div>

                <p style="font-size:13px;color:#64748b;">Contact the customer on <strong>${quoteData?.client_phone || '—'}</strong> to discuss alternative pricing or options.</p>
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

        // Job application guard: Job application emails MUST ONLY go to marketing@mastermoversjhb.co.za
        const isJobApplication = type === 'job_application_alert' || 
                                 (subject || '').toLowerCase().includes('job application') ||
                                 (contactData?.name || '').includes('[JOB APPLICATION]') ||
                                 (contactData?.message || '').includes('[JOB APPLICATION]')

        if (isJobApplication) {
            recipients = ['marketing@mastermoversjhb.co.za']
        }

        // Explicitly exclude Jose and any iCloud email addresses from recipients list
        const isJoseOrIcloud = (email: string) => {
            if (typeof email !== 'string') return true
            const lower = email.toLowerCase().trim()
            return lower.includes('icloud') || lower.includes('jose')
        }

        if (Array.isArray(recipients)) {
            recipients = recipients.filter(email => !isJoseOrIcloud(email))
        } else if (typeof recipients === 'string') {
            recipients = isJoseOrIcloud(recipients) ? [] : [recipients]
        }

        if (!recipients || recipients.length === 0) {
            console.warn("No valid recipients remaining after filtering out Jose/iCloud emails. Skipping send.")
            return new Response(
                JSON.stringify({ success: true, message: "No recipients to send to after filtering." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
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
