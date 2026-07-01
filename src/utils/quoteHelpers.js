export const getSimpleQuoteNumber = (uuid) => {
    if (!uuid || uuid === 'new') return 'MM-' + Math.floor(Math.random() * 10000);
    const num = parseInt(uuid.toString().replace(/-/g, '').substring(0, 8), 16) % 1000000;
    return 'MM-' + num.toString().padStart(6, '0');
};
