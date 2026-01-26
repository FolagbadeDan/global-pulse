
/**
 * parses a potential JSON response from an AI model, handling markdown fences and conversational text.
 */
export function parseAIJSON<T>(text: string): T | null {
    try {
        let jsonStr = text.trim();

        // Remove markdown code blocks if present
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '');

        // Find the first '{' and last '}' to isolate the JSON object
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        return JSON.parse(jsonStr) as T;
    } catch (e) {
        console.warn("Failed to parse AI JSON:", e);
        return null;
    }
}
