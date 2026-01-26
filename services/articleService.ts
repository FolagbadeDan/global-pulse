
import { supabase } from './databaseService';

export interface Article {
    id: string;
    title: string;
    summary: string;
    image_url: string;
    source_url: string;
    created_at: string;
    category: string;
    ai_content?: string;
}

const PAGE_SIZE = 12;

export const articleService = {
    async getArticles(page: number = 1): Promise<{ data: Article[]; count: number }> {
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error, count } = await supabase
            .from('articles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching articles:', error);
            return { data: [], count: 0 };
        }

        return { data: data as Article[], count: count || 0 };
    },

    async getArticleById(id: string): Promise<Article | null> {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching article:', error);
            return null;
        }

        return data as Article;
    }
};
