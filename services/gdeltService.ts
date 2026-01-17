import { NewsItem, GdeltEvent } from '../types';

// CAMEO Code Mapping (Simplified for V4)
// 14: Protest, 19: Fight, 17: Coerce, 11: Disapprove, 12: Reject
const CONFLICT_CODES = ['14', '19', '18', '17', '11', '12', '13', '16'];
// 02: Appeal, 03: Express Intent, 04: Consult, 05: Engage Diplomatic, 06: Material Coop
const POSITIVE_CODES = ['01', '02', '03', '04', '05', '06', '07', '08'];

export async function fetchGdeltNews(): Promise<NewsItem[]> {
    try {
        // Attempt 1: GeoJSON endpoint (Visual)
        // Increased timespan to 24h to ensure data density. Added 'tone' sort to get significant events.
        const response = await fetch('https://api.gdeltproject.org/api/v2/geo/geo?query=sourcelang:eng%20toneabs>5&format=geojson&timespan=24h');

        if (!response.ok) {
            console.warn(`GDELT Primary Endpoint Failed: ${response.status}`);
            return generateMockNews();
        }

        const data = await response.json();
        const features = data.features || [];

        if (features.length === 0) {
            console.warn("GDELT returned 0 features. Using Backup Stream.");
            return generateMockNews();
        }

        // Transform GDELT GeoJSON to our NewsItem format
        const newsItems: NewsItem[] = features.map((feature: any, idx: number) => {
            const props = feature.properties;
            const geometry = feature.geometry;
            if (!geometry || !geometry.coordinates) return null; // Skip invalid geometry

            const category = determineCategory(props);
            // Heuristic sentiment based on category for now
            const sentiment = ['conflict', 'disaster'].includes(category) ? 'negative' :
                ['health', 'tech', 'environment'].includes(category) ? 'positive' :
                    (Math.random() > 0.5 ? 'positive' : 'neutral');

            // EXTRACT REAL HEADLINE from HTML
            // Format is usually: <a href="URL" target="_blank">HEADLINE</a>...
            let realTitle = props.name || "Global Event Detected";
            let realUrl = props.url || "#";
            let realImage = props.socialimage || undefined;

            if (props.html) {
                // detailed regex to capture href and text content
                const linkMatch = props.html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/i);
                if (linkMatch) {
                    realUrl = linkMatch[1];
                    const rawTitle = linkMatch[2].replace(/<[^>]+>/g, ''); // strip any inner tags
                    if (rawTitle.length > 5) {
                        realTitle = cleanTitle(rawTitle); // Clean it
                    }
                }

                // Try to extract image if socialimage missing but present in html (rare but possible)
                if (!realImage) {
                    const imgMatch = props.html.match(/<img[^>]+src=["']([^"']+)["']/i);
                    if (imgMatch) realImage = imgMatch[1];
                }
            }

            return {
                id: `gdelt-${idx}-${Date.now()}`,
                title: realTitle,
                summary: `Reporting on: ${realTitle}. Location: ${props.location || 'Unknown'}. Source: Global Intelligence Stream. Analysed by Cortex V4.`,
                lat: geometry.coordinates[1],
                lng: geometry.coordinates[0],
                locationName: props.name || props.location || "Unknown Sector", // Use 'name' (Location) for locationName now!
                category: category,
                sentiment: sentiment as any,
                importance: (realTitle.length > 40 && ['conflict', 'politics'].includes(category)) ? 'high' : 'medium',
                timestamp: new Date().toISOString(),
                timeAgo: 'Just now',
                sourceUrl: realUrl,
                imageUrl: realImage || getFallbackImage(category)
            };
        }).filter((n: NewsItem | null): n is NewsItem => n !== null); // Filter out nulls

        // If filtering removed everything, fallback
        if (newsItems.length === 0) return generateMockNews();

        // Deduplicate and Filter
        const uniqueItems = new Map();
        newsItems.forEach(item => {
            // Filter junk
            if (item.title.length < 20) return; // Too short
            if (item.title.toLowerCase().startsWith('video:')) return;
            if (item.title.toLowerCase().includes('weather forecast')) return;

            // Similarity Check (Simulated by first 15 chars)
            const key = item.title.slice(0, 15).toLowerCase();
            if (!uniqueItems.has(key)) uniqueItems.set(key, item);
        });

        const finalItems = Array.from(uniqueItems.values());

        // Sort by Importance (Length implies detail, high importance flags)
        finalItems.sort((a, b) => {
            const importanceScore = (i: NewsItem) => (i.importance === 'high' ? 2 : 1) + (i.category === 'conflict' ? 1 : 0);
            return importanceScore(b) - importanceScore(a);
        });

        // Return a healthy buffer (100) so client can filter by category
        // The client (App.tsx) will handle showing only top 30 for 'World' view
        if (finalItems.length > 5) {
            return finalItems.slice(0, 100);
        }
        return [...finalItems, ...generateMockNews()];

    } catch (error) {
        console.warn("GDELT Connection Unstable. Switching to Simulation Mode.", error);
        return generateMockNews();
    }
}

export async function fetchLocalNews(lat: number, lng: number): Promise<NewsItem[]> {
    try {
        console.log(`📍 Locating user context for: ${lat}, ${lng}`);

        // 1. Reverse Geocode (Free API - BigDataCloud) to get Country/City
        // This is necessary because GDELT needs a string query (e.g. "Nigeria"), not coords.
        const geoResp = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        if (!geoResp.ok) throw new Error("GeoLookup Failed");
        const geoData = await geoResp.json();

        const country = geoData.countryName; // e.g., "United Kingdom", "Nigeria"
        const locality = geoData.locality || "";
        console.log(`📍 Detected Location: ${locality}, ${country}`);

        if (!country) return [];

        // 2. Query GDELT for this specific location
        // We use the same format as fetchGdeltNews but restrict the query by location.
        // We also lower the 'tone' threshold to catch more local "soft" news.
        const query = `location:"${country}" sourcelang:eng`;
        const url = `https://api.gdeltproject.org/api/v2/geo/geo?query=${encodeURIComponent(query)}&format=geojson&timespan=48h&max=30`;

        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json();
        const features = data.features || [];

        // 3. Transform to NewsItems
        return features.map((feature: any, idx: number) => {
            const props = feature.properties;
            const geometry = feature.geometry;
            // Skip invalid or item without title
            if (!geometry || !geometry.coordinates || !props.name) return null;

            const category = determineCategory(props);

            // Extract better title
            let realTitle = props.name;
            let realUrl = props.url || "#";
            if (props.html) {
                const linkMatch = props.html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/i);
                if (linkMatch) {
                    realUrl = linkMatch[1];
                    const rawTitle = linkMatch[2].replace(/<[^>]+>/g, '');
                    if (rawTitle.length > 5) realTitle = cleanTitle(rawTitle);
                }
            }

            return {
                id: `local-${idx}-${Date.now()}`,
                title: realTitle,
                summary: `Local Report (${country}): ${realTitle}. Detected near ${locality || country}.`,
                lat: geometry.coordinates[1],
                lng: geometry.coordinates[0],
                locationName: props.name || locality || country,
                category: category,
                sentiment: 'neutral', // Default, could use AI enrichment later
                importance: 'medium', // Local news is personally important, but maybe not globally "High"
                timestamp: new Date().toISOString(),
                timeAgo: 'Local Stream',
                sourceUrl: realUrl,
                imageUrl: getFallbackImage(category)
            };
        }).filter((n: any) => n !== null);

    } catch (e) {
        console.warn("Local News Fetch Failed:", e);
        return [];
    }
}

/**
 * FETCHES ONLY MAJOR GLOBAL NETWORKS (CNN, BBC, Reuters, Al Jazeera)
 * aimed at mirroring "TV News" coverage.
 */
export async function fetchMajorNetworkNews(): Promise<NewsItem[]> {
    try {
        // Domains: cnn.com, bbc.com, reuters.com, aljazeera.com, apnews.com
        // Query: (domain:cnn.com OR domain:bbc.com OR domain:reuters.com OR domain:aljazeera.com OR domain:apnews.com) sourcelang:eng
        const domains = 'domain:cnn.com OR domain:bbc.com OR domain:reuters.com OR domain:aljazeera.com OR domain:apnews.com';
        const query = `(${domains}) sourcelang:eng toneabs>3`; // Lower tone threshold to catch everything big

        // Timespan: 4h (Very fresh)
        // Max: 50 items
        const url = `https://api.gdeltproject.org/api/v2/geo/geo?query=${encodeURIComponent(query)}&format=geojson&timespan=4h&max=50`;

        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json();
        const features = data.features || [];

        return features.map((feature: any, idx: number) => {
            const props = feature.properties;
            const geometry = feature.geometry;
            if (!geometry || !geometry.coordinates || !props.name) return null;

            const category = determineCategory(props);

            // Extract better title
            let realTitle = props.name;
            let realUrl = props.url || "#";
            if (props.html) {
                const linkMatch = props.html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/i);
                if (linkMatch) {
                    realUrl = linkMatch[1];
                    const rawTitle = linkMatch[2].replace(/<[^>]+>/g, '');
                    if (rawTitle.length > 5) realTitle = cleanTitle(rawTitle);
                }
            }

            return {
                id: `major-${idx}-${Date.now()}`,
                title: realTitle,
                summary: `Breaking Report from Major Network: ${realTitle}`,
                lat: geometry.coordinates[1],
                lng: geometry.coordinates[0],
                locationName: props.location || "Global",
                category: category,
                sentiment: 'neutral',
                importance: 'high', // Force High Importance
                timestamp: new Date().toISOString(), // GDELT geojson doesn't give exact time per item easily, assume fresh
                timeAgo: 'LIVE',
                sourceUrl: realUrl,
                imageUrl: getFallbackImage(category)
            };
        }).filter((n: any) => n !== null);

    } catch (e) {
        console.warn("Major Network Fetch Failed", e);
        return [];
    }
}

// Helper to generate mock news when API fails
function generateMockNews(): NewsItem[] {
    const mockTitles = [
        "Global Markets Rally as Inflation Data Shows Cooling Trend",
        "New Climate Accord Signed by 150 Nations in Historic Summit",
        "Tech Giant Unveils Revolutionary Quantum Processor",
        "Diplomatic Breakthrough in Middle East Peace Talks",
        "Major Sports League Announces Expansion Teams for 2026",
        "Breakthrough in Cancer Research Shows Promising Trial Results",
        "SpaceX Successfully Launches Next-Gen Satellite Constellation",
        "Crypto Markets Volatile Amid New Regulatory Framework Proposals",
        "Electric Vehicle Sales Surpass Traditional Autos in Key Markets",
        "UN Warns of Rising Sea Levels in Coastal Regions Report"
    ];

    return mockTitles.map((title, i) => ({
        id: `mock-${i}-${Date.now()}`,
        title,
        summary: `This is a simulated news item generated by the system fallback protocol. Real-time data stream was interrupted. Source: System Core.`,
        lat: (Math.random() * 140) - 70,
        lng: (Math.random() * 300) - 150,
        locationName: "Simulated Sector",
        category: i % 2 === 0 ? 'finance' : (i % 3 === 0 ? 'tech' : 'world'),
        sentiment: Math.random() > 0.5 ? 'positive' : 'neutral',
        importance: Math.random() > 0.7 ? 'high' : 'medium',
        timestamp: new Date().toISOString(),
        timeAgo: '2h ago',
        sourceUrl: '#',
        imageUrl: getFallbackImage(i % 2 === 0 ? 'finance' : 'tech')
    }));
}

function determineCategory(props: any): NewsItem['category'] {
    const text = ((props.name || "") + " " + (props.html || "")).toLowerCase();

    // 1. STRONG EXCLUSION (Sports & Finance often use war metaphors)
    const isSports = text.match(/sport|football|soccer|game|league|cup|player|team|score|win|match|olympic|nba|nfl|racing|moto|f1|prix|tournament|squad|coach|athlete|stadium|championship/);
    const isFinance = text.match(/market|stock|economy|trade|tariff|bank|money|finance|inflation|rate|price|ceo|business|profit|loss|invest|fund|currency|crypto|bitcoin|nasdaq|dow jones/);
    const isHealth = text.match(/health|virus|disease|doctor|hospital|medicine|flu|covid|cancer|pandemic|vaccine|patient|study|trial|drug|mental/);
    const isPolitics = text.match(/election|vote|policy|government|president|minister|law|bill|congress|senate|diploma|treaty|parliament|leader|campaign|poll|candidate|court|judge|legal/);
    const isTech = text.match(/tech|ai |cyber|data|science|space|nasa|robot|digital|software|app |launch|satellite|innovation|processor|quantum|chip/);

    // 2. STRONG CONFLICT (Overrides almost everything except Sports sometimes)
    // "Bomb", "Missile", "Terrorist", "Hostage", "Genocide"
    const hasStrongConflict = text.match(/bomb|blast|missile|terror|hostage|genocide|invade|invasion|airstrike|warhead|execution|massacre|battlefield/);

    if (hasStrongConflict && !isSports) return 'conflict';

    // 3. WEAK CONFLICT (Metaphors common)
    // "Fight", "Battle", "Attack", "Crisis", "Strike", "Kill" (Kill is usually strong, but "Kill the bill"?)
    const hasWeakConflict = text.match(/war|fight|kill|attack|gun|shoot|army|military|conflict|strike|dead|death|murder|crime|battle|troop|wound|casualty/);

    // 4. DISASTER (High Priority)
    if (text.match(/storm|quake|fire|flood|hurricane|tornado|tsunami|volcano|typhoon|earthquake|landslide|wildfire/) && !isFinance) return 'disaster';
    if (text.includes('crash') && !isFinance && !isSports && !isTech) return 'disaster'; // "App crash", "Stock crash" excluded

    // 5. EVALUATE WEAK CONFLICT vs CONTEXT
    if (hasWeakConflict) {
        // "Army medical", "Military aid", "Relief troops" -> World/Health (NOT Conflict)
        if (text.match(/medical|aid|relief|rescue|peace|support|help|donate|offer|care|humanitarian/)) return 'world';

        // "Fighting cancer" -> Health
        if (isHealth) return 'health';
        // "Political battle", "Attack ads" -> Politics
        if (isPolitics) return 'politics';
        // "Trade war", "Fighting inflation" -> Finance
        if (isFinance) return 'finance';
        // "Fighting for first place" -> Sports
        if (isSports) return 'sports';

        // If no other context, it's likely real conflict
        return 'conflict';
    }

    // 6. CATEGORIZE REST
    if (isTech) return 'tech';
    if (isHealth) return 'health';
    if (isFinance) return 'finance';
    if (isPolitics) return 'politics';

    // Sports implies Entertainment/World often in GDELTv2
    if (isSports) return 'world';

    return 'world';
}

function determineSentiment(props: any): 'positive' | 'negative' | 'neutral' {
    const text = ((props.name || "") + " " + (props.html || "")).toLowerCase();

    // Explicit Negative Keywords
    if (text.match(/kill|dead|death|crisis|down|fall|drop|warn|threat|fear|danger|attack|destroy|injure|fail|bankruptcy|scandal|arrest|prison|collapse/)) {
        return 'negative';
    }

    // Explicit Positive Keywords
    if (text.match(/win|record|gain|up|success|breakthrough|recover|safe|peace|agreement|growth|profit|honor|award|save|rescue|innovat|boost|rally|victory/)) {
        return 'positive';
    }

    return 'neutral';
}

function cleanTitle(title: string): string {
    // Decode HTML entities
    let clean = title.replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

    // Remove ellipses
    clean = clean.replace(/\.\.\.$/, "").trim();
    // Remove source attribution in parens common in GDELT (e.g. "Headline (Source)")
    clean = clean.replace(/\s*\([^)]+\)$/, "");
    // Remove trailing source attribution common in GDELT (e.g. "Headline - Source")
    clean = clean.replace(/\s*-\s*[^-]+$/, "");
    return clean;
}

function getFallbackImage(category: string): string {
    switch (category) {
        case 'finance': return 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?auto=format&fit=crop&q=80&w=800';
        case 'tech': return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800';
        case 'politics': return 'https://images.unsplash.com/photo-1541872703-74c5963631df?auto=format&fit=crop&q=80&w=800';
        case 'conflict': return 'https://images.unsplash.com/photo-1494412574643-35d3d4018519?auto=format&fit=crop&q=80&w=800';
        case 'disaster': return 'https://images.unsplash.com/photo-1454789476662-b9774432158f?auto=format&fit=crop&q=80&w=800';
        case 'environment': return 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800';
        case 'sports': return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800';
        case 'health': return 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800';
        default: return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800'; // Global Earth
    }
}
