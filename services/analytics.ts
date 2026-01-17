import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

export function initAnalytics() {
    if (POSTHOG_KEY) {
        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            person_profiles: 'identified_only', // or 'always'
            loaded: (ph) => {
                console.log("PostHog Loaded:", ph.get_distinct_id());
            }
        });
    } else {
        console.warn("PostHog Analytics: Skipped (Key Missing)");
    }
}

export function trackEvent(name: string, properties?: Record<string, any>) {
    if (POSTHOG_KEY) {
        posthog.capture(name, properties);
    }
}
