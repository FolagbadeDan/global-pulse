
import React, { useEffect, useState } from 'react';
import { fetchGlobalConflictNews } from '../services/trendingService';
import { NewsItem } from '../types';
import { Flame, AlertTriangle } from 'lucide-react';

const BreakingNewsTicker: React.FC = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTrends = async () => {
            const items = await fetchGlobalConflictNews();
            // Filter only high priority or just take top 5
            setNews(items.slice(0, 8));
            setLoading(false);
        };
        loadTrends();
    }, []);

    if (loading || news.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-red-500/30 text-white h-12 flex items-center overflow-hidden shadow-2xl">

            {/* Label */}
            <div className="bg-red-600 h-full px-4 flex items-center gap-2 z-10 shrink-0 font-black uppercase text-xs tracking-widest shadow-xl">
                <Flame className="w-4 h-4 animate-pulse fill-white" />
                Global Alert
            </div>

            {/* Scrolling Track */}
            <div className="flex animate-marquee whitespace-nowrap items-center">
                {/* Duplicate logic for smooth loop can be added later, simple map for now */}
                {[...news, ...news].map((item, i) => ( // Double list for loop illusion
                    <div key={`${item.id}-${i}`} className="flex items-center mx-8 group cursor-pointer hover:text-red-400 transition-colors">
                        <span className="text-xs font-bold mr-2 text-red-500/70">
                            {new Date(item.timestamp).getHours()}:{String(new Date(item.timestamp).getMinutes()).padStart(2, '0')}
                        </span>
                        <span className="text-sm font-medium tracking-wide">
                            {item.title}
                        </span>
                        {/* Separator */}
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-700 ml-8" />
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

export default BreakingNewsTicker;
