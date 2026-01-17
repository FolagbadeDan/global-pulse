
import { createClient } from '@supabase/supabase-js';

// Credentials provided by user
const SUPABASE_URL = 'https://opwgkwunnwfjpiwzwdfm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nKL7jnc-7r5RGlpmdBAecg_AnY6iQ6W';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface SavedArticle {
    id: string;
    source_url: string;
    title: string;
    summary: string;
    ai_summary: string;
    ai_content: string;
    category: string;
    image_url: string;
    source_name: string;
    published_at: string;
    created_at: string;
}

/**
 * Checks if an article URL already exists in the Vault.
 * Returns the article data if found, null otherwise.
 */
export async function checkArticleExists(url: string): Promise<SavedArticle | null> {
    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('source_url', url)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.warn("Supabase Check Error:", error);
        }

        return data as SavedArticle | null;
    } catch (err) {
        console.error("Database Connection Failed:", err);
        return null;
    }
}

/**
 * Saves a new article to the Vault.
 */
export async function saveArticle(article: Partial<SavedArticle>): Promise<SavedArticle | null> {
    try {
        const { data, error } = await supabase
            .from('articles')
            .insert([article])
            .select()
            .single();

        if (error) {
            console.error("Supabase Save Error:", error);
            return null;
        }

        return data as SavedArticle;
    } catch (err) {
        console.error("Save Failed:", err);
        return null;
    }
}
