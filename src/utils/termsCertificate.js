import { getSimpleQuoteNumber } from './quoteHelpers'
import { getBranchDetails } from './branchDetails'

/**
 * Helper to wrap text into lines fitting within maxWidth on HTML5 Canvas
 */
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ')
    const lines = []
    let currentLine = words[0] || ''

    for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = ctx.measureText(currentLine + ' ' + word).width
        if (width < maxWidth) {
            currentLine += ' ' + word
        } else {
            lines.push(currentLine)
            currentLine = word
        }
    }
    if (currentLine) {
        lines.push(currentLine)
    }
    return lines
}

/**
 * Draws a rounded rectangle path on canvas
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
}

/**
 * Generates an official, high-resolution PNG Certificate of the Signed Terms & Conditions.
 * Returns { dataUrl, base64 }
 */
export async function generateSignedTermsCertificatePng({ quote, signatureName, signatureDate }) {
    const width = 800
    const height = 1120

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        throw new Error('Canvas 2D context not supported')
    }

    // 1. Outer Background
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, width, height)

    // 2. White Certificate Card
    const cardX = 30
    const cardY = 30
    const cardW = width - 60
    const cardH = height - 60
    const cardR = 20

    ctx.save()
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()

    // 3. Header Banner (Red Master Movers Header)
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(cardX + cardR, cardY)
    ctx.lineTo(cardX + cardW - cardR, cardY)
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cardR)
    ctx.lineTo(cardX + cardW, cardY + 95)
    ctx.lineTo(cardX, cardY + 95)
    ctx.lineTo(cardX, cardY + cardR)
    ctx.quadraticCurveTo(cardX, cardY, cardX + cardR, cardY)
    ctx.closePath()
    ctx.fillStyle = '#e31837'
    ctx.fill()

    // Header Text
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 24px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('MASTER MOVERS', cardX + 30, cardY + 45)

    ctx.font = '700 11px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillText('OFFICIAL ELECTRONIC TERMS & CONDITIONS AGREEMENT', cardX + 30, cardY + 68)

    // Quote Ref Tag (Top Right)
    const quoteRef = getSimpleQuoteNumber(quote?.id || '')
    const refBadgeText = `REF: MM-${quoteRef}`
    ctx.font = '800 12px monospace'
    const refWidth = ctx.measureText(refBadgeText).width + 24
    const refX = cardX + cardW - 30 - refWidth
    const refY = cardY + 32

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
    drawRoundedRect(ctx, refX, refY, refWidth, 32, 8)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.fillText(refBadgeText, refX + 12, refY + 21)
    ctx.restore()

    // 4. Quote & Client Information Box
    const infoY = cardY + 115
    const infoW = cardW - 60
    const infoX = cardX + 30

    ctx.fillStyle = '#f8fafc'
    drawRoundedRect(ctx, infoX, infoY, infoW, 105, 12)
    ctx.fill()
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.stroke()

    // Info details
    ctx.textAlign = 'left'
    ctx.fillStyle = '#64748b'
    ctx.font = '800 10px system-ui, -apple-system, sans-serif'
    ctx.fillText('CLIENT NAME', infoX + 20, infoY + 26)
    ctx.fillText('SCHEDULED DATE', infoX + 270, infoY + 26)
    ctx.fillText('QUOTE VALUE (INCL. VAT)', infoX + 470, infoY + 26)

    ctx.fillStyle = '#0f172a'
    ctx.font = '700 14px system-ui, -apple-system, sans-serif'
    const clientNameStr = quote?.client_name || 'Valued Client'
    ctx.fillText(clientNameStr.length > 25 ? clientNameStr.slice(0, 24) + '...' : clientNameStr, infoX + 20, infoY + 46)

    const moveDateStr = quote?.move_date ? new Date(quote.move_date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : 'To Be Confirmed'
    ctx.fillText(moveDateStr, infoX + 270, infoY + 46)

    const totalValStr = `R ${(quote?.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ctx.fillStyle = '#e31837'
    ctx.font = '900 15px system-ui, -apple-system, sans-serif'
    ctx.fillText(totalValStr, infoX + 470, infoY + 46)

    // Second line: Route
    ctx.fillStyle = '#64748b'
    ctx.font = '800 10px system-ui, -apple-system, sans-serif'
    ctx.fillText('MOVE ROUTE', infoX + 20, infoY + 74)
    ctx.fillStyle = '#334155'
    ctx.font = '600 12px system-ui, -apple-system, sans-serif'
    const pickupShort = (quote?.pickup_address || 'Pickup Address').split(',')[0]
    const dropoffShort = (quote?.dropoff_address || 'Dropoff Address').split(',')[0]
    ctx.fillText(`${pickupShort}  ➔  ${dropoffShort}`, infoX + 20, infoY + 92)

    // 5. Agreed Terms Clauses Section
    let textY = infoY + 135
    ctx.fillStyle = '#0f172a'
    ctx.font = '900 13px system-ui, -apple-system, sans-serif'
    ctx.fillText('CONTRACTUAL TERMS & CONDITIONS AGREED', infoX, textY)

    textY += 22

    const clauses = [
        {
            num: '1. Booking & Payment',
            body: 'All bookings are subject to availability. A quote is only confirmed once full payment (or agreed deposit) is received. Payment must be made at least 48 hours prior to the scheduled move date.'
        },
        {
            num: '2. Inventory Accuracy',
            body: 'The quote is based on the inventory list provided. Master Movers reserves the right to adjust final pricing on move day if actual volume significantly exceeds the quoted volume.'
        },
        {
            num: '3. Protection Cover & Liability',
            body: 'Standard Goods in Transit (GIT) Protection Cover is included (covers fire, collision, and hijacking). For breakage cover, a "Platinum" all-risk Protection Cover package must be selected separately.'
        },
        {
            num: '4. Access & Surcharges',
            body: 'Prices assume standard access. Surcharges apply for long carries (>30m), stairs (above 1st floor without elevator), or required shuttle vehicles.'
        }
    ]

    const maxClauseWidth = infoW

    clauses.forEach(clause => {
        ctx.fillStyle = '#0f172a'
        ctx.font = '700 11px system-ui, -apple-system, sans-serif'
        ctx.fillText(clause.num, infoX, textY)
        textY += 15

        ctx.fillStyle = '#475569'
        ctx.font = '400 10.5px system-ui, -apple-system, sans-serif'
        const lines = wrapText(ctx, clause.body, maxClauseWidth)
        lines.forEach(line => {
            ctx.fillText(line, infoX, textY)
            textY += 15
        })
        textY += 8
    })

    // 6. Visual Electronic Signature Card (Exact replica of UI in media_1791869915234.png)
    const sigCardY = textY + 10
    const sigCardH = 240
    const sigCardW = infoW

    ctx.save()
    drawRoundedRect(ctx, infoX, sigCardY, sigCardW, sigCardH, 18)
    ctx.fillStyle = '#f0fdf4'
    ctx.fill()
    ctx.strokeStyle = '#bbf7d0'
    ctx.lineWidth = 2
    ctx.stroke()

    // Green Checkmark Circle
    const circleCenterX = infoX + (sigCardW / 2)
    const circleCenterY = sigCardY + 48
    const circleR = 24

    ctx.beginPath()
    ctx.arc(circleCenterX, circleCenterY, circleR, 0, Math.PI * 2)
    ctx.fillStyle = '#dcfce7'
    ctx.fill()
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Checkmark tick
    ctx.beginPath()
    ctx.moveTo(circleCenterX - 9, circleCenterY)
    ctx.lineTo(circleCenterX - 2, circleCenterY + 7)
    ctx.lineTo(circleCenterX + 9, circleCenterY - 7)
    ctx.strokeStyle = '#16a34a'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    // "TERMS ACCEPTED"
    ctx.textAlign = 'center'
    ctx.fillStyle = '#15803d'
    ctx.font = '900 16px system-ui, -apple-system, sans-serif'
    ctx.fillText('TERMS ACCEPTED', circleCenterX, sigCardY + 105)

    // "ELECTRONICALLY SIGNED BY"
    ctx.fillStyle = '#64748b'
    ctx.font = '800 10px system-ui, -apple-system, sans-serif'
    ctx.fillText('ELECTRONICALLY SIGNED BY', circleCenterX, sigCardY + 128)

    // Electronic Signature Name (Serif, italic, large)
    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold italic 28px Georgia, "Times New Roman", serif'
    ctx.fillText(signatureName || clientNameStr, circleCenterX, sigCardY + 166)

    // Date & Timestamp
    const formattedDate = signatureDate 
        ? new Date(signatureDate).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'medium' })
        : new Date().toLocaleString('en-ZA')
    ctx.fillStyle = '#64748b'
    ctx.font = '600 11px system-ui, -apple-system, sans-serif'
    ctx.fillText(formattedDate, circleCenterX, sigCardY + 192)

    // Bottom confirmation quote
    ctx.fillStyle = '#166534'
    ctx.font = 'italic 10px system-ui, -apple-system, sans-serif'
    ctx.fillText('"I hereby confirm that the inventory list is correct and I accept the terms and conditions outlined above."', circleCenterX, sigCardY + 220)
    ctx.restore()

    // 7. Official Legal Footer
    const footerY = cardY + cardH - 25
    const branch = getBranchDetails(quote)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#94a3b8'
    ctx.font = '500 10px system-ui, -apple-system, sans-serif'
    ctx.fillText(`Master Movers (${branch.name})  •  Official Digital Acceptance Record  •  ${branch.telDisplay}  •  mastermovers.co.za`, width / 2, footerY)

    const dataUrl = canvas.toDataURL('image/png')
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')

    return { dataUrl, base64 }
}

/**
 * Triggers a direct browser download of the Signed Terms PNG certificate
 */
export function downloadCertificatePng(dataUrl, filename = 'MasterMovers_Signed_Terms.png') {
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
