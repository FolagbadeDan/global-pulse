import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { articleService, Article } from '../services/articleService';
import Header from '../components/Header'; // Assuming we reuse the Header or wrap this elsewhere

const ArticlesPage: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        loadArticles();
    }, [page]);

    const loadArticles = async () => {
        setLoading(true);
        const { data, count } = await articleService.getArticles(page);
        setArticles(data);
        setTotalCount(count);
        setLoading(false);
    };

    const totalPages = Math.ceil(totalCount / 12);

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
            {/* Navigation Mockup - In real app, this should be consistent */}
            <div className="h-20 bg-gray-950 border-b border-white/5 flex items-center px-6">
                <Link to="/" className="text-blue-400 font-bold flex items-center gap-2 hover:text-blue-300 transition-colors">
                    <ChevronLeft className="w-5 h-5" /> Back to Dashboard
                </Link>
                <div className="flex-1 text-center">
                    <h1 className="text-xl font-black tracking-tight uppercase">Intelligence Archive</h1>
                </div>
                <div className="w-24"></div>
            </div>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-12">
                {/* Breadcrumbs */}
                <div className="text-xs text-gray-500 mb-8 uppercase tracking-widest font-bold">
                    <Link to="/" className="hover:text-blue-400">Home</Link> / <span className="text-gray-300">Articles</span>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {articles.map(article => (
                                <Link to={`/articles/${article.id}`} key={article.id} className="group flex flex-col bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-300">
                                    <div className="h-48 bg-gray-900 relative overflow-hidden">
                                        {article.image_url ? (
                                            <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-900 border-b border-white/5">
                                                <FileText className="w-12 h-12 text-gray-700" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-black/60 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider text-blue-300 border border-blue-500/20">
                                                {article.category || 'General'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mb-3 uppercase">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(article.created_at).toLocaleDateString()}
                                        </div>
                                        <h2 className="text-lg font-bold leading-snug mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                                            {article.title}
                                        </h2>
                                        <p className="text-sm text-gray-400 leading-relaxed mb-6 line-clamp-3 flex-1">
                                            {article.summary}
                                        </p>
                                        <div className="mt-auto">
                                            <span className="text-xs font-bold text-blue-500 group-hover:underline decoration-blue-500/50 underline-offset-4 uppercase tracking-wider">Read Analysis &rarr;</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="mt-16 flex justify-center items-center gap-4">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all text-white"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                Page {page} of {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all text-white"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ArticlesPage;
