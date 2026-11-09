/**
 * Standard sales and move consultants at Master Movers
 */
export const DEFAULT_CONSULTANTS = [
    'Melonie',
    'Sally',
    'Wendy',
    'Ray',
    'Curt'
]

/**
 * Helper to get consultant name safely from a quote object
 */
export function getQuoteConsultant(quote) {
    if (!quote) return ''
    return (
        quote.consultant_name ||
        quote.items_json?.consultant_name ||
        quote.items_json?.consultant ||
        quote.consultant ||
        ''
    ).trim()
}
