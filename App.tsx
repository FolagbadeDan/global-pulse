import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Radio } from 'lucide-react';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WorldMap from './components/WorldMap';
import CategoryBar from './components/CategoryBar';
import NewsModal from './components/NewsModal';
import LocationPrompt from './components/LocationPrompt';
import SEOHead from './components/SEOHead';
import BreakingNewsTicker from './components/BreakingNewsTicker';

// Services
import { fetchGdeltNews } from './services/gdeltService';
import { fetchLocalBreakingNews } from './services/trendingService'; // Updated Import
import { getDailyGlobalTension, TensionData } from './services/gaugeService'; // Updated Import
import { analyzeGlobalSentiment } from './services/sentimentEngine';
import { fetchMarketData } from './services/marketService';
import { initAnalytics } from './services/analytics';

// Types
import { NewsItem, GlobalSentimentMetrics, MarketDashboard, NewsCategory, GroundingSource } from './types';

const STORAGE_KEY = 'global_pulse_cache_v4';

const App: React.FC = () => {
  // State
  const [news, setNews] = useState<NewsItem[]>([]);
  const [sidebarNews, setSidebarNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [readingNews, setReadingNews] = useState<NewsItem | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState<boolean>(false);

  const [sentimentMetrics, setSentimentMetrics] = useState<GlobalSentimentMetrics | null>(null);
  const [marketData, setMarketData] = useState<MarketDashboard | null>(null);
  const [tensionData, setTensionData] = useState<TensionData | undefined>(undefined);

  const [activeCategory, setActiveCategory] = useState<NewsCategory | 'all'>('all');

  // Fake sources for now or derive
  const sources: GroundingSource[] = [
    { title: "Reuters", uri: "https://reuters.com" },
    { title: "AP News", uri: "https://apnews.com" },
    { title: "Al Jazeera", uri: "https://aljazeera.com" }
  ];

  // Logic: Load Data
  const loadData = useCallback(async (refresh: boolean = false) => {
    if (refresh) setIsRefreshing(true);
    setError(null);

    try {
      // 1. Primary Fetch: News & Gauge (Parallel)
      // We need news to analyze sentiment, and tension to analyze market
      const [newsData, dayTension] = await Promise.all([
        fetchGdeltNews(),
        getDailyGlobalTension()
      ]);

      let allNews = newsData;

      // 2. Local Breakdown (if available)
      if (userLocation) {
        try {
          const localBreaking = await fetchLocalBreakingNews(userLocation.lat, userLocation.lng);
          const existingIds = new Set(allNews.map(n => n.id));
          const newLocal = localBreaking.filter(n => !existingIds.has(n.id));
          allNews = [...newLocal, ...allNews];
        } catch (e) {
          console.warn("Failed to fetch local breakdown", e);
        }
      }

      // 3. Dependent Analysis: Sentiment (Requires News)
      // Now we have the actual news to analyze
      const sentimentData = await analyzeGlobalSentiment(allNews);

      // 4. Dependent Analysis: Market (Requires Tension)
      // Use the daily tension score to bias market data
      const marketDashboard = await fetchMarketData(dayTension.score);

      // 5. Update State
      setNews(allNews);
      setSidebarNews(allNews);
      setSentimentMetrics(sentimentData);
      setMarketData(marketDashboard);
      setTensionData(dayTension);

      // Cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        news: allNews,
        sentiment: sentimentData,
        market: marketDashboard,
        timestamp: Date.now()
      }));

    } catch (err: any) {
      console.error("Data Load Failed:", err);
      setError(err.message || "Failed to initialize intelligence stream.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [userLocation]);

  // Effect: Initial Load & Location Check
  useEffect(() => {
    const cachedLoc = localStorage.getItem('user_location');
    if (cachedLoc) {
      setUserLocation(JSON.parse(cachedLoc));
    } else {
      setTimeout(() => setShowLocationPrompt(true), 2000);
    }

    loadData();

    const interval = setInterval(() => loadData(), 300000);
    return () => clearInterval(interval);
  }, []);

  // Effect: Reload when location changes
  useEffect(() => {
    if (userLocation) loadData();
  }, [userLocation]);


  // Handlers
  const handleRequestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          localStorage.setItem('user_location', JSON.stringify(loc));
          setShowLocationPrompt(false);
        },
        (err) => {
          console.error("Location denied", err);
          setShowLocationPrompt(false);
        }
      );
    }
  };

  const handleDismissLocation = () => {
    setShowLocationPrompt(false);
  };

  const handleCategoryChange = (cat: NewsCategory | 'all') => {
    setActiveCategory(cat);
    if (cat === 'all') {
      setSidebarNews(news);
    } else {
      setSidebarNews(news.filter(n => n.category === cat));
    }
  };

  const handleReadMore = (newsItem: NewsItem) => {
    setReadingNews(newsItem);
  };

  // Filter displayed news on map based on category
  const finalDisplayedNews = activeCategory === 'all'
    ? news
    : news.filter(n => n.category === activeCategory);

  return (
    <div className="flex flex-col h-screen w-full bg-gray-950 overflow-hidden font-sans">

      {/* Default SEO Metadata */}
      <SEOHead />

      {/* Modal Overlay */}
      <NewsModal
        news={readingNews}
        onClose={() => setReadingNews(null)}
        sources={sources}
      />

      {showLocationPrompt && (
        <LocationPrompt
          onDismiss={handleDismissLocation}
          onRequest={handleRequestLocation}
        />
      )}

      <Header
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        userLocation={userLocation}
        sentimentMetrics={sentimentMetrics}
        marketData={marketData}
        tensionData={tensionData}
      />

      <CategoryBar activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

      <main className="flex-1 relative flex z-10 flex-col lg:flex-row overflow-hidden pb-12">
        {/* Sidebar Area */}
        <div className="order-2 lg:order-1 flex-1 lg:flex-none h-[60vh] lg:h-auto overflow-hidden">
          <Sidebar
            selectedNews={selectedNews}
            onClose={() => setSelectedNews(null)}
            newsList={sidebarNews}
            onItemClick={setSelectedNews}
            sources={sources}
            userLocation={userLocation}
          />
        </div>

        {/* Map Area */}
        <div className="order-1 lg:order-2 lg:flex-1 relative h-[40vh] lg:h-auto w-full lg:w-auto shrink-0 lg:shrink">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-50">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full border-t-2 border-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radio className="w-6 h-6 text-blue-400 animate-pulse" />
                </div>
              </div>
              <p className="text-white text-lg font-bold tracking-tight">Syncing Global Intelligence...</p>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* Error Banner */}
              {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-rose-500/10 border border-rose-500/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 pointer-events-none">
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                  <span className="text-[10px] font-bold text-rose-200 uppercase tracking-wider">Data Stream Unstable - Using Backup Protocols</span>
                </div>
              )}

              <WorldMap
                news={finalDisplayedNews}
                selectedId={selectedNews?.id || null}
                onMarkerClick={setSelectedNews}
                onReadMore={handleReadMore}
                onHover={() => { }}
                initialCenter={userLocation ? [userLocation.lat, userLocation.lng] : undefined}
              />
            </div>
          )}
        </div>
      </main>

      {/* Global Stream Ticker */}
      <BreakingNewsTicker />

    </div>
  );
};

export default App;
