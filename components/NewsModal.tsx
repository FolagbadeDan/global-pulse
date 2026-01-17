import React, { useState, useEffect } from 'react';
import { NewsItem, GroundingSource } from '../types';
import { X, ExternalLink, Calendar, MapPin, TrendingUp, CheckCircle2, Activity, Share2, Search, Database } from 'lucide-react';
import { fetchFullArticle, ArticleData, rewriteNewsWithAI } from '../services/readerService';
// import SEOHead from './SEOHead';
import { checkArticleExists, saveArticle } from '../services/databaseService';

interface NewsModalProps {
    news: NewsItem | null;
    onClose: () => void;
    sources: GroundingSource[];
}

const NewsModal: React.FC<NewsModalProps> = ({ news, onClose, sources }) => {
    const [article, setArticle] = useState<ArticleData | null>(null);
    const [loadingReader, setLoadingReader] = useState(false);
    const [aiContent, setAiContent] = useState<string | null>(null);
    const [loadingAI, setLoadingAI] = useState(false);

    // Reset state when news changes
    useEffect(() => {
        if (!news) return;

        // Reset
        setArticle(null);
        setAiContent(null);
        setLoadingReader(true);
        setLoadingAI(false);

        let mounted = true;

        const loadContent = async () => {
            try {
                // 1. Check Vault (Database)
                const saved = await checkArticleExists(news.sourceUrl);

                if (saved && mounted) {
                    console.log("Vault Hit:", saved.title);
                    setAiContent(saved.ai_content);
                    setLoadingReader(false);
                    return;
                }

                // 2. Fetch Live (if not in vault)
                const fetchedArticle = await fetchFullArticle(news.sourceUrl);

                if (mounted) {
                    setArticle(fetchedArticle);
                    setLoadingReader(false);

                    // 3. Trigger AI Rewrite
                    if (fetchedArticle) {
                        setLoadingAI(true);
                        const rewritten = await rewriteNewsWithAI(fetchedArticle.content, news.title);
                        if (mounted) {
                            setAiContent(rewritten);
                            setLoadingAI(false);

                            // 4. Save to Vault (Background)
                            saveArticle({
                                source_url: news.sourceUrl,
                                title: news.title,
                                summary: news.summary,
                                ai_content: rewritten,
                                category: news.category,
                                image_url: news.imageUrl,
                                source_name: news.sourceUrl,
                                published_at: news.timestamp
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("Content Load Failed", err);
                if (mounted) setLoadingReader(false);
            }
        };

        loadContent();

        return () => { mounted = false; };
    }, [news]);

    const handleShare = () => {
        if (navigator.share && news) {
            navigator.share({
                title: news.title,
                text: news.summary,
                url: window.location.href,
            });
        }
    };

    if (!news) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">

            {/* Overlay */}
            <div
                className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-3xl max-h-[90vh] bg-gray-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Close & Share */}
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <button
                        onClick={handleShare}
                        className="p-2 bg-black/50 hover:bg-blue-600 text-white rounded-full backdrop-blur-md transition-colors"
                        title="Share this Story"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Hero Image */}
                <div className="relative h-64 sm:h-80 w-full shrink-0">
                    <img
                        src={news.imageUrl || `https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=800`}
                        alt={news.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-blue-600 text-white shadow-lg">
                                {news.category}
                            </span>

                            {/* Vault Indicator */}
                            {loadingReader === false && aiContent && (
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 backdrop-blur-md">
                                    <Database className="w-3.5 h-3.5" />
                                    Vault Archived
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight shadow-black drop-shadow-lg">
                            {news.title}
                        </h2>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">

                    {/* Loading Reader */}
                    {loadingReader && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-70">
                            <Search className="w-8 h-8 text-blue-400 animate-bounce" />
                            <span className="text-xs uppercase tracking-widest text-blue-200">Acquiring Target Source...</span>
                        </div>
                    )}

                    {/* Loading AI */}
                    {!loadingReader && loadingAI && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />
                            <div className="text-center">
                                <span className="block text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">Synthesizing Intelligence</span>
                                <span className="text-[10px] text-emerald-400/60">Global Pulse AI is rewriting this report...</span>
                            </div>
                        </div>
                    )}

                    {/* AI Content */}
                    {!loadingReader && aiContent && !loadingAI && (
                        <div className="animate-in fade-in duration-500">
                            <div className="flex items-center gap-2 mb-6 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg w-fit">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Global Pulse Certified Brief</span>
                            </div>
                            <div className="prose prose-invert prose-lg max-w-none text-gray-200 leading-relaxed font-sans">
                                <div dangerouslySetInnerHTML={{ __html: aiContent }} />
                            </div>
                            <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-gray-500">
                                <span className="italic">Synthesized from multiple sources.</span>
                                <span className="font-mono text-emerald-500/50">AI-AGENT-V4 // VERIFIED</span>
                            </div>
                        </div>
                    )}

                    {/* Fallback to Article if no AI */}
                    {!loadingReader && article && !aiContent && !loadingAI && (
                        <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-looose font-serif tracking-wide opacity-80 decoration-slice">
                            <div dangerouslySetInnerHTML={{ __html: article.content }} />
                        </div>
                    )}

                    {/* Fallback to Summary */}
                    {!loadingReader && !article && !aiContent && !loadingAI && (
                        <p className="text-gray-200 text-xl leading-relaxed font-medium mb-8">
                            {news.summary}
                        </p>
                    )}

                    <div className="flex justify-center pt-6 border-t border-white/5 mt-8">
                        <a
                            href={news.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold rounded-full uppercase text-xs tracking-widest transition-all border border-white/10 hover:border-white/20"
                        >
                            Read Source
                            <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsModal;
