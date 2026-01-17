import { NewsItem, GlobalSentimentMetrics } from "../types";

// Using OpenRouter for flexible model access (Free Tier for testing)
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const MODEL_ID = "deepseek/deepseek-r1-0528:free"; // User requested free model

// Local Heuristic Fallback (When API is offline/unconfigured)
function calculateLocalSentiment(news: NewsItem[]): GlobalSentimentMetrics {
    let tension = 50; // Start at midpoint
    let neg = 0;
    let pos = 0;

    // Analyze density of negative news
    news.forEach(n => {
        if (n.sentiment === 'negative') neg++;
        if (n.sentiment === 'positive') pos++;
        if (n.importance === 'high' && n.sentiment === 'negative') neg += 2; // Critical negative news weighs double
    });

    const total = news.length || 1;
    const negRatio = neg / total;
    const posRatio = pos / total;

    // Dynamic swing
    if (negRatio > 0.3) tension += 20; // Some negative
    if (negRatio > 0.5) tension += 20; // Mostly negative
    if (posRatio > 0.6) tension -= 30; // Very positive

    // Cap
    tension = Math.min(Math.max(tension, 10), 95);

    return {
        globalTensionIndex: tension,
        defconLevel: tension > 80 ? 2 : tension > 60 ? 3 : 4,
        marketOutlook: tension > 70 ? 'bearish' : tension < 40 ? 'bullish' : 'volatile',
        summaryReport: `Global systems detect ${negRatio > 0.5 ? 'elevated' : 'moderate'} instability. Sector analysis complete.`,
        trendingTopics: news.slice(0, 3).map(n => n.title.slice(0, 20) + "...")
    };
}

// WW3 Proximity Tracker
export interface WW3Status {
    proximityScore: number; // 0-100
    activeConflictZones: string[];
    defcon: number;
    primaryThreat: string;
    recentEscalations: string[];
}

export function analyzeWW3Proximity(news: NewsItem[]): WW3Status {
    let score = 15; // Base tension
    const conflicts = new Set<string>();
    const escalations: string[] = [];
    let nuclearThreat = false;

    news.forEach(n => {
        const t = n.title.toLowerCase();
        // High Impact Keywords
        if (t.includes('nuclear') || t.includes('atomic') || t.includes('icbm') || t.includes('warhead')) {
            score += 25;
            nuclearThreat = true;
            escalations.push(`Nuclear risk: ${n.title.slice(0, 40)}...`);
        }
        if (t.includes('nato') || t.includes('article 5') || t.includes('alliance')) {
            score += 15;
            escalations.push(`NATO alert: ${n.title.slice(0, 40)}...`);
        }

        // Specific Flashpoints
        if ((t.includes('china') || t.includes('chinese')) && (t.includes('taiwan') || t.includes('invasion') || t.includes('drill') || t.includes('strait'))) {
            conflicts.add('China-Taiwan Crisis');
            score += 10;
        }
        if (t.includes('russia') && (t.includes('ukraine') || t.includes('missile') || t.includes('offensive'))) {
            conflicts.add('Russia-Ukraine War');
        }
        if (t.includes('israel') || t.includes('gaza') || t.includes('hamas') || t.includes('hezbollah') || t.includes('beirut')) {
            conflicts.add('Israel-Multi-Front War');
            score += 5;
        }
        if (t.includes('iran') || t.includes('yemen') || t.includes('houthi') || t.includes('red sea') || t.includes('drone')) {
            conflicts.add('Iran/Proxy Escalation');
            score += 5;
        }
        if (t.includes('korea') && (t.includes('missile') || t.includes('north') || t.includes('kim'))) {
            conflicts.add('Korean Peninsula');
        }
    });

    // Score per major theater
    score += conflicts.size * 10;

    // Cap
    score = Math.min(score, 99);

    // Determine Defcon (Inverse of score roughly)
    // Score 20 -> Defcon 5
    // Score 50 -> Defcon 4
    // Score 70 -> Defcon 3
    // Score 90 -> Defcon 2
    let defcon = 5;
    if (score > 40) defcon = 4;
    if (score > 60) defcon = 3;
    if (score > 80) defcon = 2;
    if (nuclearThreat) defcon = Math.min(defcon, 2);

    return {
        proximityScore: score,
        activeConflictZones: Array.from(conflicts),
        defcon: defcon,
        primaryThreat: nuclearThreat ? 'Nuclear Escalation' : conflicts.size > 1 ? 'Multi-Front Conflict' : 'Regional Instability',
        recentEscalations: escalations.slice(0, 3)
    };
}

// GENERIC AI TEXT GENERATOR
export async function generateText(prompt: string): Promise<string> {
    if (!OPENROUTER_API_KEY) throw new Error("API Key Missing");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000",
            "X-Title": "Global Pulse"
        },
        body: JSON.stringify({
            "model": MODEL_ID,
            "messages": [
                { "role": "user", "content": prompt }
            ]
        })
    });

    if (!response.ok) throw new Error(`OpenRouter API Error: ${response.status}`);

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";
    // Sanitize
    return content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

export async function analyzeGlobalSentiment(news: NewsItem[]): Promise<GlobalSentimentMetrics> {
    // If no news, return default
    if (!news || news.length === 0) return calculateLocalSentiment([]);

    // Check for API Key - If missing, use Local Heuristic immediately
    if (!OPENROUTER_API_KEY) {
        console.warn("OpenRouter API Key missing. Using Local Heuristic Engine.");
        return calculateLocalSentiment(news);
    }

    // Calculate WW3 stats regardless of API key (Hybrid approach)
    const ww3 = analyzeWW3Proximity(news);

    try {
        // Prepare a digest for the AI
        const headlines = news.slice(0, 30).map(n => `- ${n.title} (${n.category})`).join("\n");

        const prompt = `
      Analyze the following global news headlines as if you are a high-tech "Global Stability Engine".
      
      HEADLINES:
      ${headlines}
      
      Task:
      1. Calculate "Global Tension Index" (0-100). BE REACTIVE. If there is WAR/CONFLICT/CRISIS, score must be > 75. If peaceful, < 30. Do not default to 50.
      2. Set DEFCON (5=Peace, 1=Nuke).
      3. Predict Market (Bullish/Bearish/Volatile/Stable).
      4. Write "Summary Report" (2 sentences, tactical style).
      5. List 3 trending topics.
      6. Provide "Strategic Insight" (1 sentence).

      Return JSON ONLY.
      {
        "globalTensionIndex": number,
        "defconLevel": number,
        "marketOutlook": string,
        "summaryReport": string,
        "trendingTopics": string[],
        "strategicInsight": string
      }
    `;

        const cleanContent = await generateText(prompt);
        let jsonStr = cleanContent;

        // Attempt to isolate JSON if AI chatted
        const firstBrace = cleanContent.indexOf('{');
        const lastBrace = cleanContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = cleanContent.substring(firstBrace, lastBrace + 1);
        }

        const result = JSON.parse(jsonStr) as GlobalSentimentMetrics;

        // Merge AI result with Deterministic WW3 stats
        return {
            ...result,
            ww3Score: ww3.proximityScore,
            activeTheaters: ww3.activeConflictZones,
            primaryThreat: ww3.primaryThreat
        };

    } catch (error) {
        console.warn("Sentiment Analysis Failed (OpenRouter). Switching to Local Heuristic.", error);
        return calculateLocalSentiment(news);
    }
}

// BATCH ENRICHMENT: Takes top 20 news items and corrects their category/sentiment via AI
export async function enrichNewsWithAI(news: NewsItem[]): Promise<NewsItem[]> {
    if (!OPENROUTER_API_KEY || news.length === 0) return news;

    try {
        // Only take top 15 items to save tokens/time (focus on what user sees first)
        const targetNews = news.slice(0, 15);
        if (targetNews.length === 0) return news;

        const digest = targetNews.map(n => `ID:${n.id}|TITLE:${n.title}|CURR_CAT:${n.category}`).join("\n");

        const prompt = `
      You are an Intelligence Analyst. Correct the categories for these news items.
      Rules:
      1. "Army/Military" doing "Medical/Aid/Rescue" is category "health" or "world", NOT "conflict".
      2. "Conflict" is ONLY for active violence (fighting, missiles, attacks).
      3. Return a JSON object mapping ID to new data.
      
      News Layout:
      ${digest}

      Output Format (JSON Only):
      {
        "corrections": [
          { "id": "...", "category": "...", "sentiment": "positive"|"negative"|"neutral" }
        ]
      }
    `;

        // REUSE generic text generator here too, but we need JSON parsing
        const cleanContent = await generateText(prompt);

        let jsonStr = cleanContent;
        const firstBrace = cleanContent.indexOf('{');
        const lastBrace = cleanContent.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) return news;

        jsonStr = cleanContent.substring(firstBrace, lastBrace + 1);
        const result = JSON.parse(jsonStr);
        const corrections = result.corrections || [];

        // Apply corrections
        const correctionMap = new Map(corrections.map((c: any) => [c.id, c]));

        return news.map(item => {
            const correction = correctionMap.get(item.id);
            if (correction) {
                return {
                    ...item,
                    category: correction.category || item.category,
                    sentiment: correction.sentiment || item.sentiment
                };
            }
            return item;
        });

    } catch (e) {
        console.warn("AI Enrichment skipped:", e);
        return news; // Fail gracefully, return original news
    }
}
