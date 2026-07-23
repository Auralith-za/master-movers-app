export const getSimpleQuoteNumber = (uuid) => {
    if (!uuid || uuid === 'new') return 'MM-' + Math.floor(Math.random() * 10000);
    const num = parseInt(uuid.toString().replace(/-/g, '').substring(0, 8), 16) % 1000000;
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

