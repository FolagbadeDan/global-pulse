
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { NewsItem } from '../types';
import { renderToString } from 'react-dom/server';
import {
  Flame,
  ShieldAlert,
  Zap,
  Heart,
  Sprout,
  Swords,
  Globe2,
  Trophy,
  TrendingUp,
} from 'lucide-react';

interface WorldMapProps {
  news: NewsItem[];
  selectedId: string | null;
  onMarkerClick: (news: NewsItem) => void;
  onReadMore: (news: NewsItem) => void;
  onHover: (lng: number | null) => void;
  initialCenter?: [number, number];
}

const MapInteraction: React.FC<{ onHover: (lng: number | null) => void }> = ({ onHover }) => {
  useMapEvents({
    mousemove(e) {
      onHover(e.latlng.lng);
    },
    mouseout() {
      onHover(null);
    }
  });
  return null;
};

const ChangeView: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5, easeLinearity: 0.1 });
  }, [center, zoom, map]);
  return null;
};

// Component to handle initial positioning
const InitialView: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 4);
  }, [center, map]);
  return null;
};

const getCategoryIcon = (category: string, sentiment: string, title: string) => {
  // Color Logic: Red (Negative/Conflict), Emerald (Positive), Blue (Neutral/Tech), Amber (Warning/Politics)
  let color = '#3b82f6'; // Default Blue
  let glow = 'shadow-blue-500/50';

  if (sentiment === 'negative' || category === 'conflict' || category === 'disaster') {
    color = '#ef4444'; // Red
    glow = 'shadow-rose-500/50';
  } else if (sentiment === 'positive') {
    color = '#10b981'; // Emerald
    glow = 'shadow-emerald-500/50';
  } else if (category === 'finance') {
    color = '#f59e0b'; // Amber/Gold
    glow = 'shadow-amber-500/50';
  }

  const iconProps = { size: 16, color: '#FFFFFF', strokeWidth: 2.5 };
  let iconMarkup = '';

  // Content-Aware Icon Mapping checks Title text if category is generic
  const lowerTitle = title.toLowerCase();

  // PRIORITIZE SPECIFIC TITLE MATCHES (Sports, etc) BEFORE GENERIC CATEGORIES
  if (lowerTitle.includes('sport') || lowerTitle.includes('football') || lowerTitle.includes('game') || lowerTitle.includes('squad') || lowerTitle.includes('cup') || lowerTitle.includes('racing') || lowerTitle.includes('prix') || lowerTitle.includes('moto') || lowerTitle.includes('f1') || lowerTitle.includes('nba') || lowerTitle.includes('cricket')) {
    iconMarkup = renderToString(<Trophy {...iconProps} />);
    color = '#8b5cf6'; // Violet for Sports
    glow = 'shadow-violet-500/50';
  }
  else if (category === 'disaster') iconMarkup = renderToString(<Flame {...iconProps} />);
  else if (category === 'conflict') iconMarkup = renderToString(<Swords {...iconProps} />);
  else if (category === 'health') iconMarkup = renderToString(<Heart {...iconProps} />);
  else if (category === 'tech') iconMarkup = renderToString(<Zap {...iconProps} />);
  else if (category === 'politics') iconMarkup = renderToString(<ShieldAlert {...iconProps} />);
  else if (category === 'finance') iconMarkup = renderToString(<TrendingUp {...iconProps} />); // Using TrendingUp for finance
  else iconMarkup = renderToString(<Globe2 {...iconProps} />);

  return L.divIcon({
    html: `
      <div class="relative group">
        <div class="absolute inset-0 bg-current rounded-full blur-md opacity-30 animate-pulse ${glow}" style="color: ${color}"></div>
        <div class="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:scale-125 duration-300 relative z-10 border border-white/30 shadow-sm" style="background-color: ${color}">
          ${iconMarkup}
        </div>
      </div>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const MapController: React.FC<{ selectedId: string | null; news: NewsItem[] }> = ({ selectedId, news }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedId) {
      const item = news.find(n => n.id === selectedId);
      if (item) {
        // Offset logic: Fly to slightly North of the marker so the Popup (above marker) is centered
        // At zoom 5, 1 degree is significant. Let's try centering exactly first, or small offset.
        // Actually, let's just center exactly. The user said 'sometimes not centered', suggesting it doesn't move.
        // We force a move here.
        map.flyTo([item.lat, item.lng], 6, {
          animate: true,
          duration: 1.0 // Faster duration
        });
      }
    }
  }, [selectedId, map, news]);

  return null;
};

const WorldMap: React.FC<WorldMapProps> = ({ news, selectedId, onMarkerClick, onReadMore, onHover, initialCenter }) => {
  const selectedItem = useMemo(() => news.find(n => n.id === selectedId), [news, selectedId]);

  // Fix Leaflet component type issues by using 'any' cast or proper props where possible
  // For MapContainer, center is valid but Typescript might be strict about IntrinsicAttributes

  // ... inside WorldMap ...

  return (
    <div className=".w-full h-full relative cursor-default">
      <MapContainer
        center={(initialCenter || [20, 0]) as LatLngExpression}
        zoom={3}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
        maxBounds={[[-85, -180], [85, 180]]}
        minZoom={2}
      // @ts-ignore - Leaflet types are often finicky with center prop
      >
        <MapInteraction onHover={onHover} />
        <MapController selectedId={selectedId} news={news} />

        {initialCenter && <InitialView center={initialCenter} />}

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          // @ts-ignore - subdomains prop exists in Leaflet but might be missing in React-Leaflet types
          subdomains="abcd"
          opacity={0.8}
        />

        {news.map((item) => (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            icon={getCategoryIcon(item.category, item.sentiment, item.title)}
            eventHandlers={{
              click: () => onMarkerClick(item),
            }}
          >
            <Popup className="custom-popup" offset={[0, -10]} autoPan={true} autoPanPadding={[100, 100]}>
              <div
                className="p-4 max-w-[280px] bg-white rounded-xl shadow-2xl font-sans"
                onWheel={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black text-white uppercase tracking-widest ${item.sentiment === 'positive' ? 'bg-emerald-500' : item.sentiment === 'negative' ? 'bg-rose-500' : 'bg-blue-600'}`}>
                    {item.category}
                  </span>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{item.locationName}</p>
                </div>

                <h3 className="font-black text-gray-950 text-base leading-tight mb-2">{item.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-2">
                  {item.summary.substring(0, 100)}...
                </p>

                <div className="pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReadMore(item);
                    }}
                    className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors"
                  >
                    Read Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default WorldMap;
