
import { GoogleGenAI, Type } from "@google/genai";
import { NewsItem, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function fetchGlobalNews(
  category: string = 'world', 
  userLocation?: { lat: number, lng: number }
): Promise<{ news: NewsItem[], sources: GroundingSource[] }> {
  try {
    const locationContext = userLocation 
      ? `The user is currently located near ${userLocation.lat}, ${userLocation.lng}. Prioritize any significant news from this region if available.`
      : "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the 12 most significant news events from the last 12 hours specifically for the category: "${category}". ${locationContext} Focus on high-impact stories. For each event, return an object with: title, lat/lng (numbers), locationName (City, Country), category, summary (2 easy-to-read sentences), sentiment (positive/negative/neutral), importance, sourceUrl, and a representative imageUrl. Strictly follow the JSON format.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              locationName: { type: Type.STRING },
              category: { type: Type.STRING },
              sentiment: { type: Type.STRING },
              importance: { type: Type.STRING },
              timestamp: { type: Type.STRING },
              sourceUrl: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
            },
            required: ["title", "summary", "lat", "lng", "locationName", "category", "sentiment", "importance", "sourceUrl"]
          }
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const newsData = JSON.parse(text) as NewsItem[];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));

    const newsWithIds = newsData.map((item, idx) => ({
      ...item,
      id: item.id || `news-${idx}-${Date.now()}`,
      timestamp: item.timestamp || new Date().toISOString()
    }));

    return { news: newsWithIds, sources };
  } catch (error) {
    console.error("Error fetching news from Gemini:", error);
    return { news: [], sources: [] };
  }
}
