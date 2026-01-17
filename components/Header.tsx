
import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, MapPin, Clock, TrendingUp, TrendingDown, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { GlobalSentimentMetrics, MarketDashboard, MarketData } from '../types';
import GradientText from './ui/GradientText';
import WorldHeadingGauge from './ui/WorldHeadingGauge';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  userLocation: { lat: number, lng: number } | null;
  sentimentMetrics: GlobalSentimentMetrics | null;
  marketData: MarketDashboard | null;
  tensionData?: { score: number; rationale: string; volatility: string };
}

const Header: React.FC<HeaderProps> = ({ onRefresh, isRefreshing, userLocation, sentimentMetrics, marketData, tensionData }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper for Market Ticker
  const MarketItem = ({ p, label }: { p: MarketData | undefined, label: string }) => {
    if (!p) return null;
    const isUp = p.trend === 'up';
    return (
      <div className="flex flex-col items-end border-l border-white/5 pl-4 ml-4 first:ml-0 first:pl-0 first:border-0">
        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">{label}</span>
        <div className={`flex items-center gap-1.5 text-xs font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {p.price.toFixed(2)}
        </div>
      </div>
    );
  };

  return (
    <header className="h-20 px-6 bg-gray-950/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between z-[60] sticky top-0 shadow-2xl">
      <div className="flex items-center gap-8">
        {/* Logo Area */}
        <div className="flex items-center gap-4 pr-8 border-r border-white/5">
          <div className="p-2 bg-blue-600/10 rounded-xl border border-blue-500/10 hover:scale-105 transition-transform">
            <Globe className="w-6 h-6 text-blue-400 animate-pulse-slow" />
          </div>
          <div className="flex flex-col">
            <GradientText colors={["#60a5fa", "#a78bfa", "#f472b6", "#60a5fa"]} animationSpeed={6} showBorder={false} className="px-0 py-0">
              <span className="text-xl font-black tracking-tight">GLOBAL PULSE</span>
            </GradientText>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.25em] ml-0.5">Real-time News</span>
          </div>
        </div>

        {/* Improved World Heading Gauge - AI Powered */}
        <div className="hidden lg:flex">
          <WorldHeadingGauge score={tensionData?.score || sentimentMetrics?.globalTensionIndex || 50} />
          {tensionData && (
            <div className="ml-4 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">Global Threat Level</span>
              <span className={`text-xs font-bold ${tensionData.volatility === 'Critical' ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>
                {tensionData.volatility.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 overflow-hidden max-w-[400px]">
        {/* Market Data Module - Now Scrolling */}
        {marketData && (
          <div className="flex items-center gap-8 animate-marquee-slow whitespace-nowrap">
            {/* Duplicate items for seamless scroll if needed, or just list them all */}
            <MarketItem p={marketData.sp500} label="S&P 500" />
            <MarketItem p={marketData.btc} label="Bitcoin" />
            <MarketItem p={marketData.eth} label="Ethereum" />
            <MarketItem p={marketData.gold} label="Gold (XAU)" />
            <MarketItem p={marketData.oil} label="Crude (WTI)" />
            {/* Repeat for optical illusion of infinite scroll if list is short */}
            <MarketItem p={marketData.sp500} label="S&P 500" />
            <MarketItem p={marketData.btc} label="Bitcoin" />
          </div>
        )}

        <style>{`
          @keyframes marquee-slow {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-slow {
            animation: marquee-slow 20s linear infinite;
          }
        `}</style>

        <div className="hidden md:flex items-center gap-6 border-l border-white/5 pl-6">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-bold font-mono">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] hover:scale-105 active:scale-95 border border-white/5 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 group"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : 'text-blue-400 group-hover:rotate-180 transition-transform duration-500'}`} />
        </button>
      </div>
    </header>
  );
};

export default Header;
