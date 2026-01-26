import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Calendar, ChevronLeft, Loader2, Globe, Share2 } from 'lucide-react';
import { articleService, Article } from '../services/articleService';
import ReactMarkdown from 'react-markdown'; // Assuming user might want markdown, but we'll use simple rendering first

const ArticleDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadArticle(id);
        }
    }, [id]);

    const loadArticle = async (articleId: string) => {
        setLoading(true);
        const data = await articleService.getArticleById(articleId);
        setArticle(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
                <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
                <Link to="/articles" className="text-blue-400 hover:underline">Return to Archive</Link>
            </div>
        );
    }

    // Determine content to show: prefer AI generated content if available, else summary
    const content = article.ai_content || article.summary;

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans">
            <div className="h-20 bg-gray-950/80 backdrop-blur-md border-b border-white/5 flex items-center px-6 sticky top-0 z-50">
                <Link to="/articles" className="text-gray-400 font-bold flex items-center gap-2 hover:text-white transition-colors uppercase text-xs tracking-widest">
                    <ChevronLeft className="w-4 h-4" /> Back
                </Link>
                <div className="flex-1"></div>
            </div>

            <article className="max-w-4xl mx-auto px-6 py-12">
                <header className="mb-12 text-center">
                    <div className="inline-block bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-blue-500/20 mb-6">
                        {article.category || 'Intelligence Report'}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-6">
                        {article.title}
                    </h1>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-500 font-mono uppercase">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(article.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        {/* Optional: Add Source if external */}
                        {article.source_url && (
                            <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                                <Globe className="w-4 h-4" />
                                Original Source
                            </a>
                        )}
                    </div>
                </header>

                {article.image_url && (
                    <div className="rounded-3xl overflow-hidden mb-12 border border-white/5 shadow-2xl">
                        <img src={article.image_url} alt={article.title} className="w-full h-auto max-h-[600px] object-cover" />
                    </div>
                )}

                <div className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-gray-300 prose-p:leading-8 prose-a:text-blue-400">
                    <div className="whitespace-pre-wrap">{content}</div>
                </div>
            </article>
        </div>
    );
};

export default ArticleDetailPage;
