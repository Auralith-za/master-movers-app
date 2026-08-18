export const getSimpleQuoteNumber = (uuid) => {
    if (!uuid || uuid === 'new' || uuid === 'undefined' || uuid === 'null') {
        return 'MM-' + Math.floor(100000 + Math.random() * 900000);
    }

    // If an object was passed (e.g. quote object)
    if (typeof uuid === 'object') {
        const extracted = uuid.id || uuid.quoteId || uuid.quote_id;
        if (extracted) return getSimpleQuoteNumber(extracted);
    }

    const str = String(uuid).trim();

    // If it is already a valid MM-XXXXXX reference
    if (/^MM-\d+$/i.test(str)) {
        const digits = str.replace(/[^0-9]/g, '');
        return 'MM-' + digits.padStart(6, '0').slice(-6);
    }

    // Strip non-hex characters for UUID hex parsing
    const cleanHex = str.replace(/-/g, '').replace(/[^0-9a-fA-F]/g, '');
    if (!cleanHex || cleanHex.length < 2) {
        // Fallback: stable hash from string
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        const safeNum = Math.abs(hash) % 1000000;
        return 'MM-' + safeNum.toString().padStart(6, '0');
    }

    const hexPart = cleanHex.substring(0, 8);
    const parsed = parseInt(hexPart, 16);

    if (isNaN(parsed)) {
        return 'MM-' + Math.floor(100000 + Math.random() * 900000);
    }

    const num = parsed % 1000000;
    return 'MM-' + num.toString().padStart(6, '0');
};

/**
 * Removes consecutive duplicate words or phrases in a name string.
 * e.g. "Marné Van Aarde Van Aarde" -> "Marné Van Aarde"
 */
export const cleanClientName = (nameStr) => {
    if (!nameStr) return '';
    let cleaned = nameStr.trim();
    while (/\b(.+?)\s+\1\b/i.test(cleaned)) {
        cleaned = cleaned.replace(/\b(.+?)\s+\1\b/gi, '$1').trim();
    }
    return cleaned;
};

/**
 * Formats full client name from contactName and surname safely.
 * Prevents duplicating surname if contactName already contains or ends with it.
 */
export const formatClientName = (contactName = '', surname = '') => {
    const first = (contactName || '').trim();
    const last = (surname || '').trim();
    if (!first && !last) return '';
    if (!last) return cleanClientName(first);
    if (!first) return cleanClientName(last);

    if (first.toLowerCase().endsWith(last.toLowerCase())) {
        return cleanClientName(first);
    }
    return cleanClientName(`${first} ${last}`);
};

