import React, { useEffect } from 'react';

interface SEOHeadProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article';
}

const SEOHead: React.FC<SEOHeadProps> = ({
    title = "Global Pulse | Real-Time Conflict Intelligence",
    description = "Live geopolitical monitoring, AI-powered situational analysis, and conflict tracking map. Stay ahead of global events.",
    image = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
    url = "https://globalpulse.app",
    type = "website"
}) => {
    const siteTitle = title.includes("Global Pulse") ? title : `${title} | Global Pulse`;

    useEffect(() => {
        // Update Title
        document.title = siteTitle;

        // Update Meta Tags Helper
        const updateMeta = (name: string, content: string, property: boolean = false) => {
            const selector = property ? `meta[property='${name}']` : `meta[name='${name}']`;
            let element = document.querySelector(selector);

            if (!element) {
                element = document.createElement('meta');
                if (property) {
                    element.setAttribute('property', name);
                } else {
                    element.setAttribute('name', name);
                }
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Standard
        updateMeta('description', description);

        // Open Graph
        updateMeta('og:type', type, true);
        updateMeta('og:title', title, true);
        updateMeta('og:description', description, true);
        updateMeta('og:image', image, true);
        updateMeta('og:url', url, true);
        updateMeta('og:site_name', 'Global Pulse Intelligence', true);

    }, [siteTitle, description, image, url, type]);

    return null; // Logic only
};

export default SEOHead;
