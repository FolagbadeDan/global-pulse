
export interface NavItem {
  id: string;
  label: string;
  icon: any; // Using any for Lucide icons to avoid complex type imports
  active: boolean;
  count?: number;
}

export type NewsCategory = 'politics' | 'disaster' | 'conflict' | 'tech' | 'environment' | 'health' | 'finance' | 'entertainment' | 'world' | 'sports';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  lat: number;
  lng: number;
  locationName: string;
  category: NewsCategory;
  sentiment: 'positive' | 'negative' | 'neutral';
  importance: 'high' | 'medium' | 'low';
  timestamp: string;
  timeAgo?: string;
  sourceUrl: string;
  imageUrl?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

// Sentiment Engine Output
export interface GlobalSentimentMetrics {
  globalTensionIndex: number; // 0-100
  defconLevel: number; // 1-5
  marketOutlook: 'bullish' | 'bearish' | 'volatile' | 'stable';
  summaryReport: string;
  trendingTopics: string[];
  // WW3 Proximity Analysis
  ww3Score?: number;
  activeTheaters?: string[];
  primaryThreat?: string;
}

export interface MarketData {
  symbol: string;
  name: string;
  price: number; // Current price
  change: number; // Percent change
  trend: 'up' | 'down' | 'neutral';
  lastUpdated: string;
}

export interface MarketDashboard {
  gold: MarketData;
  oil: MarketData;
  sp500: MarketData;
  btc?: MarketData;
  eth?: MarketData;
  timestamp: string;
}

export interface GdeltEvent {
  // Rough mapping of GDELT GeoJSON properties
  url: string;
  title: string;
  begins: string; // ISO Date
  lat: number;
  lon: number; // Note: GDELT uses 'lon'
  eventCode: string; // CAMEO code
}
