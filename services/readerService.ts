/// <reference types="vite/client" />
import { Readability } from '@mozilla/readability';

export interface ArticleData {
    title: string;
    content: string;
    textContent: string;
    excerpt: string;
    byline: string;
}

export async function fetchFullArticle(url: string): Promise<ArticleData | null> {
    if (!url || url === '#') return null;

    try {
        // 1. Use AllOrigins as a CORS Proxy
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const html = data.contents; // The raw HTML string

        if (!html) throw new Error("No Content Returned");

        // 2. Parse with Readability
        // We need to create a temporary DOM document for Readability to work
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // 3. Extract Clean Content
        const reader = new Readability(doc);
        const article = reader.parse();

        return article ? {
            title: article.title,
            content: article.content, // HTML with styles stripped
            textContent: article.textContent,
            excerpt: article.excerpt,
            byline: article.byline
        } : null;

    } catch (error) {
        console.warn("Reader Failed:", error);
        return null; // Fallback to "Read Original Source" link
    }
}

// AI REWRITER ENGINE
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const MODEL_ID = "deepseek/deepseek-r1-0528:free"; // Or any fast mix

export async function rewriteNewsWithAI(title: string, rawContent: string): Promise<string | null> {
    if (!OPENROUTER_API_KEY) return null;

    // Truncate raw content to avoid token limits (first 3000 chars is usually enough for digest)
    const context = rawContent.substring(0, 3000).replace(/<[^>]*>?/gm, '');

    const prompt = `
    You are a Strategic Intelligence Officer for "Global Pulse".
    Rewrite the following news article into a secure, copyright-free INTELLIGENCE BRIEFING.
    
    SOURCE TITLE: "${title}"
    SOURCE TEXT:
    ${context}

    DIRECTIVES:
    1. VOICE: Neutral, authoritative, concise (CIA/Stratfor style).
    2. STRUCTURE: 
       - "KEY DEVELOPMENT": 1 sentence summary.
       - "TACTICAL DETAILS": 2-3 paragraphs of the core event, stripped of fluff/ads.
       - "IMPLICATION": 1 paragraph on why this matters geostrategically.
    3. FORMAT: Return semantic HTML (<h3>, <p>, <ul> where needed). NO Markdown.
    4. UNIQUENESS: Do NOT copy phrases. Synthesize the facts in your own words.

    OUTPUT HTML ONLY.
    `;

    try {
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
                "messages": [{ "role": "user", "content": prompt }]
            })
        });

        if (!response.ok) return null;
        const data = await response.json();
        const content = data.choices[0]?.message?.content || "";

        // Clean thinking content if any
        return content.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```html|```/g, "").trim();

    } catch (e) {
        console.warn("AI Rewrite Failed", e);
        return null;
    }
}
