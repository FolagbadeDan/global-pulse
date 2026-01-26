import { clarity } from 'react-microsoft-clarity';

const CLARITY_ID = import.meta.env.VITE_CLARITY_ID;

export function initAnalytics() {
    if (CLARITY_ID) {
        clarity.init(CLARITY_ID);
        // Check if clarity has started is not directly sync available immediately usually, 
        // but init starts the script injection.
        console.log("Microsoft Clarity Initialized");
    } else {
        console.warn("Microsoft Clarity: Skipped (ID Missing). Set VITE_CLARITY_ID in .env");
    }
}

export function trackEvent(name: string, properties?: Record<string, any>) {
    // Clarity is primarily for session replay. 
    // We can use 'setTag' for high-level segmenting if needed, but for now we keep it simple.
    if (CLARITY_ID) {
        // Example: clarity.setTag("event", name);
        // Or specific conversions if configured in Clarity dashboard.
    }
}

