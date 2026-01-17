
import React from 'react';
import { NewsItem, GroundingSource } from '../types';
import { X, ExternalLink, Calendar, MapPin, TrendingUp, ChevronLeft, LayoutList, CheckCircle2, Activity } from 'lucide-react';

interface SidebarProps {
  selectedNews: NewsItem | null;
  onClose: () => void;
  newsList: NewsItem[];
  onItemClick: (news: NewsItem) => void;
  sources: GroundingSource[];
  userLocation: { lat: number; lng: number } | null;
}

// Haversine formula to calculate distance in km
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon1 - lon2);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

const Sidebar: React.FC<SidebarProps> = ({ selectedNews, onClose, newsList, onItemClick, sources, userLocation }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter for Local News (within 1000km)
  const localNews = userLocation
    ? newsList.filter(item => getDistanceKm(userLocation.lat, userLocation.lng, item.lat, item.lng) < 1000)
    : [];

  // Filter for Breaking News (High Importance or Conflict)
  const breakingNews = newsList.filter(item => item.importance === 'high' || item.category === 'conflict');

  // Determine what to show at the top
  const primarySectionTitle = localNews.length > 0 ? "Local Intelligence" : "Breaking News";
  const primaryNews = localNews.length > 0 ? localNews : breakingNews;

  // Remaining unique news for "Global Headlines" (exclude primary to avoid dups if possible, or just show all remainder)
  const primaryIds = new Set(primaryNews.map(n => n.id));
  const globalNews = newsList.filter(n => !primaryIds.has(n.id));

  return (
    <div className="relative z-40 transition-all duration-300 h-full border-r border-white/10 bg-gray-950 flex flex-col shadow-2xl w-full lg:w-[380px]">
      <div className="flex flex-col h-full bg-gray-950">
        <div className="p-8 border-b border-white/5 bg-gray-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <LayoutList className="w-5 h-5 text-blue-500" />
            Latest Headlines
          </h2>
          <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-[0.3em]">Verified World Stream</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

          {/* Primary Section (Local or Breaking) */}
          {primaryNews.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{primarySectionTitle}</h3>
              </div>
              {primaryNews.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer group ${selectedNews?.id === item.id
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    : 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10'
                    }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-widest shadow-lg">
                      {localNews.length > 0 ? "NEARBY" : "ALERT"}
                    </span>
                    <span className="text-[10px] text-blue-300/70 font-bold">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                  <h3 className={`text-sm font-bold leading-snug mb-2 transition-colors ${selectedNews?.id === item.id ? 'text-white' : 'text-white group-hover:text-blue-200'
                    }`}>
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <MapPin className="w-3 h-3" />
                    {item.locationName}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Global Feed */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2 pt-4 border-t border-white/5">
              <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Global Feed</h3>
            </div>
            {globalNews.map((item) => (
              <div
                key={item.id}
                onClick={() => onItemClick(item)}
                className={`p-5 rounded-3xl transition-all cursor-pointer border group ${selectedNews?.id === item.id
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5'
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] font-black px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10 uppercase tracking-widest">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-gray-500 font-bold">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
                <h3 className={`text-sm font-bold leading-snug transition-colors ${selectedNews?.id === item.id ? 'text-white' : 'text-gray-200 group-hover:text-white'
                  }`}>
                  {item.title}
                </h3>
                <div className="mt-3 flex items-center gap-3 text-[10px] text-gray-600 font-bold">
                  <MapPin className="w-3 h-3" />
                  {item.locationName}
                </div>
              </div>
            ))}
          </div>

          {newsList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-10">
              <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse mb-4" />
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Scanning World Frequencies...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
