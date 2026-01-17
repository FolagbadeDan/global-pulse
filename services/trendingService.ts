import { NewsItem } from '../types';
import { fetchGdeltNews, fetchLocalNews, fetchMajorNetworkNews } from './gdeltService';

/**
 * Keywords that signal potential global conflict or high-impact crises.
 */
const CONFLICT_KEYWORDS = [
    'War', 'Nuclear', 'Missile', 'Strike', 'Invasion', 'Military',
    'Army', 'Weapon', 'Sanctions', 'Treaty', 'Escalation', 'Crisis',
    'NATO', 'Russia', 'China', 'Iran', 'Israel', 'Gaza', 'Ukraine',
    'Venezuela', 'Guyana', 'Essequibo', 'Yemen', 'Red Sea', 'Houthi',
    'Taiwan', 'Strait', 'Korea', 'Lebanon', 'Hezbollah', 'Pentagon',
    'White House', 'Drill', 'Offensive', 'Deploy'
];

/**
 * Calculates a "Heat Score" to rank news items.
 * Formula: (Tone * 2) + (KeywordBonus * 10) + (RecencyBonus)
 */
function calculateHeatScore(item: NewsItem): number {
    let score = 0;

    // 1. Keyword Boost
    const title = item.title.toLowerCase();

    CONFLICT_KEYWORDS.forEach(word => {
        if (title.includes(word.toLowerCase())) {
            score += 20; // Increased boost
        }
    });

    // 2. Source Velocity / "Breaking" factor
    const hoursAgo = (Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 4) score += 15; // "Breaking" (< 4 hrs)
    else if (hoursAgo < 12) score += 5;

    // 3. Source Credibility Check
    const url = (item.sourceUrl || "").toLowerCase();
    const isMajor = url.includes('cnn') || url.includes('bbc') || url.includes('reuters') || url.includes('apnews') || url.includes('aljazeera');

    if (isMajor) {
        score += 25; // Massive boost for verified major sources
    }

    return score;
}

/**
 * Fetches "Global Conflict" news for the Ticker and Gauge.
 * PRIORITIZES Major Networks to align with TV News.
 */
export async function fetchGlobalConflictNews(): Promise<NewsItem[]> {
    try {
        // Parallel Fetch: General Stream + Major Networks
        const [generalNews, majorNews] = await Promise.all([
            fetchGdeltNews(),
            fetchMajorNetworkNews()
        ]);

        // Merge, preferring Major News for deduplication
        // We actually want Major News to definitely show up if it exists
        const allNews = [...majorNews, ...generalNews];
        const unique = new Map<string, NewsItem>();

        allNews.forEach(item => {
            // Simple dedup key: title snippet
            const key = item.title.slice(0, 20).toLowerCase();
            if (!unique.has(key)) {
                unique.set(key, item);
            } else {
                // If we have a duplicate, keep the one that is 'High Importance' or from Major Network
                const existing = unique.get(key)!;
                if (item.importance === 'high' && existing.importance !== 'high') {
                    unique.set(key, item);
                }
            }
        });

        const mergedList = Array.from(unique.values());

        // Score everything
        const scoredNews = mergedList.map(item => ({
            ...item,
            heatScore: calculateHeatScore(item)
        }));

        // Sort by Heat Score (Descending)
        scoredNews.sort((a, b) => b.heatScore - a.heatScore);

        // Return top 20 High Impact items
        return scoredNews.slice(0, 20);

    } catch (error) {
        console.error("Failed to fetch global conflict news", error);
        return [];
    }
}

/**
 * Fetches "Local Breaking" news for the Sidebar.
 * Uses the standard location query but ranks by impact.
 */
export async function fetchLocalBreakingNews(lat: number, lng: number): Promise<NewsItem[]> {
    try {
        const rawNews = await fetchLocalNews(lat, lng);

        // We want "Breaking/Trending", so we sort by Recency + minor Keyword importance
        // We don't want ONLY war news here, but general important local news.
        const scoredNews = rawNews.map(item => {
            let localScore = 0;
            // Recency is king for local
            const hoursAgo = (Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60);
            localScore += (24 - hoursAgo); // Newer = Higher

            return { ...item, heatScore: localScore };
        });

        scoredNews.sort((a, b) => b.heatScore - a.heatScore);

        return scoredNews;
    } catch (error) {
        console.error("Failed to fetch local breaking news", error);
        // Fallback to empty if fails
        return [];
    }
}
