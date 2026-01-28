/**
 * Test Mode Utilities
 * Provides functions to check if the app is in test mode and handle test mode behavior
 */

export const TEST_MODE_ROUTES = ['/quote-test'];

export const isTestMode = (pathname) => {
    return TEST_MODE_ROUTES.some(route => pathname.startsWith(route));
};

export const TEST_MODE_MESSAGE = 'This is a test environment for quoting only. Navigation to other pages is disabled.';

export const isQuoteFlowPath = (pathname) => {
    return pathname.startsWith('/quote-test') || pathname.startsWith('/quote');
};
