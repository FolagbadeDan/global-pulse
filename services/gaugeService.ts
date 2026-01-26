
import { fetchGlobalConflictNews } from './trendingService';
import { generateText } from './sentimentEngine'; // Reusing the AI implementation
import { parseAIJSON } from './aiUtils';

const STORAGE_KEY_DATE = 'global_pulse_gauge_date';
const STORAGE_KEY_DATA = 'global_pulse_gauge_data';

export interface TensionData {
    score: number; // 0 - 100
    rationale: string;
    volatility: 'Low' | 'Medium' | 'High' | 'Critical';
}

/**
 * Determines the simplified volatility category from the score.
 */
function getVolatility(score: number): TensionData['volatility'] {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
}

export async function getDailyGlobalTension(): Promise<TensionData> {
    const today = new Date().toDateString();
    const lastCheck = localStorage.getItem(STORAGE_KEY_DATE);
    const cachedData = localStorage.getItem(STORAGE_KEY_DATA);

    // 1. Return Cache if 'Today'
    if (lastCheck === today && cachedData) {
        console.log("Gauge: Using cached daily analysis.");
        return JSON.parse(cachedData);
    }

    console.log("Gauge: Running new daily analysis...");

    // 2. Fetch Context (Top Conflict News)
    const headlines = await fetchGlobalConflictNews();

    if (!headlines || headlines.length === 0) {
        // Fallback if no news (e.g., failed fetch)
        return { score: 50, rationale: "Data unavailable. Holding neutral posture.", volatility: 'Medium' };
    }

    // Format Headlines for AI
    const contextText = headlines.slice(0, 10).map(h => `- ${h.title}`).join('\n');

    // 3. AI Analysis (Deep Context Prompt)
    const prompt = `
    Analyze the following top global news headlines for risk of MAJOR global conflict (World War III scenarios).
    
    Headlines:
    ${contextText}

    Instructions:
    1. **Primary Indicators (High Weight)**:
       - **China/Taiwan**: Any signs of invasion, blockade, or direct US collision.
       - **NATO/Russia**: Direct engagement, Article 5 mentions, or tactical nukes.
       - **Iran/Israel**: Direct state-on-state strikes (beyond proxies) or nuclear expansion.
       - **Global Alliances**: North Korea sending troops, China arming Russia, etc.
    
    2. **Scoring Model (0-100)**:
       - < 40: Regional conflicts only (normal baseline).
       - 40-60: Heightened rhetoric, major military drills, proxy escalation.
       - 60-80: Direct skirmishes between superpowers or breaking of major treaties.
       - > 80: Active declaration of war between nuclear powers or imminent invasion of Taiwan/Baltics.

    3. **Output**:
    Return a JSON object ONLY: 
    { "score": <0-100 integer>, "rationale": "<1 sharp sentence identifying the specific driver (e.g. 'China drill upgrades')>" }
    `;

    // ... (removed)

    try {
        const responseText = await generateText(prompt);

        // Parse JSON from AI response (sanitize markdown if needed)
        const aiResult = parseAIJSON<any>(responseText);

        if (!aiResult) throw new Error("Failed to parse AI response");

        const score = Math.min(100, Math.max(0, aiResult.score || 50));
        const rationale = aiResult.rationale || "AI Analysis completed.";

        const result: TensionData = {
            score,
            rationale,
            volatility: getVolatility(score)
        };

        // 4. Cache Result
        localStorage.setItem(STORAGE_KEY_DATE, today);
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(result));

        return result;

    } catch (error) {
        console.error("Gauge Analysis Failed:", error);
        // Fallback default
        return { score: 30, rationale: "Analysis validation failed. Systems nominal.", volatility: 'Low' };
    }
}
