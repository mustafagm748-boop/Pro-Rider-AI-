import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { Flame, MapPin, Zap, Navigation, TrendingUp, Compass, Filter, RefreshCw, CheckCircle2, ChevronRight, Layers, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_KEY = (process.env.GOOGLE_MAPS_PLATFORM_KEY) || (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export interface DemandHotspot {
  id: string;
  name: string;
  nameUrdu: string;
  sector: string;
  lat: number;
  lng: number;
  demandLevel: 'ultra' | 'high' | 'medium';
  requestCount: number;
  surgeMultiplier: number;
  avgWaitMins: number;
  recommendation: string;
  recommendationUrdu: string;
  city: 'Islamabad' | 'Rawalpindi';
}

const INITIAL_HOTSPOTS: DemandHotspot[] = [
  {
    id: 'hs-1',
    name: 'Centaurus Mall & F-8',
    nameUrdu: 'سینٹورس مال اور ایف 8',
    sector: 'F-8 / Blue Area West',
    lat: 33.7078,
    lng: 73.0560,
    demandLevel: 'ultra',
    requestCount: 26,
    surgeMultiplier: 2.0,
    avgWaitMins: 2,
    recommendation: 'Position near Centaurus main gate for instant high-fare rides',
    recommendationUrdu: 'سینٹورس مین گیٹ کے قریب جائیں، فوری زیادہ کرایے والی سواریاں دستیاب ہیں',
    city: 'Islamabad'
  },
  {
    id: 'hs-2',
    name: 'Blue Area Commercial Hub',
    nameUrdu: 'بلیو ایریا کمرشل مرکز',
    sector: 'F-6 / G-6 Sector',
    lat: 33.7225,
    lng: 73.0683,
    demandLevel: 'ultra',
    requestCount: 21,
    surgeMultiplier: 1.8,
    avgWaitMins: 3,
    recommendation: 'Office commuter peak — head towards Stock Exchange Metro station',
    recommendationUrdu: 'دفاتر کے اوقات کار کی چوٹی - اسٹاک ایکسچینج میٹرو اسٹیشن کی طرف جائیں',
    city: 'Islamabad'
  },
  {
    id: 'hs-3',
    name: 'F-7 Jinnah Super Market',
    nameUrdu: 'ایف 7 جناح سپر مارکیٹ',
    sector: 'F-7 Markaz',
    lat: 33.7214,
    lng: 73.0526,
    demandLevel: 'high',
    requestCount: 16,
    surgeMultiplier: 1.5,
    avgWaitMins: 3,
    recommendation: 'Evening shopping & dining surge near Safa Gold Mall',
    recommendationUrdu: 'صفا گولڈ مال کے قریب شام کے شاپنگ اور ڈائننگ کا دباؤ',
    city: 'Islamabad'
  },
  {
    id: 'hs-4',
    name: 'Commercial Market Satellite Town',
    nameUrdu: 'کمرشل مارکیٹ سیٹلائٹ ٹاؤن',
    sector: 'Satellite Town / 6th Road',
    lat: 33.6358,
    lng: 73.0694,
    demandLevel: 'ultra',
    requestCount: 24,
    surgeMultiplier: 1.9,
    avgWaitMins: 2,
    recommendation: 'High shopping surge — position along 6th Road main artery',
    recommendationUrdu: 'شاپنگ کا بڑا اضافہ - چھٹی روڈ کی مرکزی شاہراہ پر پوزیشن حاصل کریں',
    city: 'Rawalpindi'
  },
  {
    id: 'hs-5',
    name: 'I-8 Markaz & Park Road',
    nameUrdu: 'آئی 8 مرکز اور پارک روڈ',
    sector: 'I-8 Sector',
    lat: 33.6685,
    lng: 73.0754,
    demandLevel: 'high',
    requestCount: 18,
    surgeMultiplier: 1.6,
    avgWaitMins: 3,
    recommendation: 'Student & office hub — high demand towards Rawalpindi',
    recommendationUrdu: 'طلباء اور دفاتر کا گڑھ - راولپنڈی جانے والی سواریوں کا شدید دباؤ',
    city: 'Islamabad'
  },
  {
    id: 'hs-6',
    name: 'Faizabad Interchange',
    nameUrdu: 'فیض آباد انٹرچینج',
    sector: 'I-9 / Murree Road Junction',
    lat: 33.6628,
    lng: 73.0850,
    demandLevel: 'high',
    requestCount: 19,
    surgeMultiplier: 1.7,
    avgWaitMins: 2,
    recommendation: 'Major transit hub connecting Twin Cities commuters',
    recommendationUrdu: 'جڑواں شہروں کو ملانے والا مرکزی ٹرانزٹ پوائنٹ',
    city: 'Rawalpindi'
  },
  {
    id: 'hs-7',
    name: 'G-9 Karachi Company',
    nameUrdu: 'جی 9 کراچی کمپنی',
    sector: 'G-9 Markaz',
    lat: 33.6897,
    lng: 73.0287,
    demandLevel: 'medium',
    requestCount: 12,
    surgeMultiplier: 1.3,
    avgWaitMins: 4,
    recommendation: 'High mini & bike requests near local bus terminal',
    recommendationUrdu: 'بس ٹرمینل کے قریب منسٹ اور بائیک کی زبردست مانگ',
    city: 'Islamabad'
  },
  {
    id: 'hs-8',
    name: 'Saddar Rawalpindi & Cantt',
    nameUrdu: 'صدر راولپنڈی اور کینٹ',
    sector: 'Saddar Bazaar / Railway Station',
    lat: 33.5972,
    lng: 73.0551,
    demandLevel: 'high',
    requestCount: 15,
    surgeMultiplier: 1.5,
    avgWaitMins: 4,
    recommendation: 'Train arrival rush — position near Cantt Railway Station',
    recommendationUrdu: 'ٹرین کی آمد کا دباؤ - کینٹ ریلوے اسٹیشن کے قریب پوزیشن لیں',
    city: 'Rawalpindi'
  }
];

// Helper to draw circle heat overlays on Google Map
function MapHeatCircles({ hotspots }: { hotspots: DemandHotspot[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const circles: google.maps.Circle[] = [];

    hotspots.forEach(hs => {
      const color = hs.demandLevel === 'ultra' ? '#ef4444' : hs.demandLevel === 'high' ? '#f97316' : '#eab308';
      const radius = hs.demandLevel === 'ultra' ? 900 : hs.demandLevel === 'high' ? 700 : 500;

      const circle = new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.22,
        map,
        center: { lat: hs.lat, lng: hs.lng },
        radius
      });

      circles.push(circle);
    });

    return () => {
      circles.forEach(c => c.setMap(null));
    };
  }, [map, hotspots]);

  return null;
}

interface DemandHeatmapViewProps {
  language?: 'en' | 'ur' | 'de';
  theme?: 'light' | 'dark';
  onNavigateToHotspot?: (hotspot: DemandHotspot) => void;
}

export function DemandHeatmapView({ language = 'en', onNavigateToHotspot }: DemandHeatmapViewProps) {
  const isUrdu = language === 'ur';
  const [hotspots, setHotspots] = useState<DemandHotspot[]>(INITIAL_HOTSPOTS);
  const [selectedHotspot, setSelectedHotspot] = useState<DemandHotspot | null>(INITIAL_HOTSPOTS[0]);
  const [filterCity, setFilterCity] = useState<'all' | 'Islamabad' | 'Rawalpindi'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 'ultra' | 'high'>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate dynamic live demand fluctuations
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setHotspots(prev => prev.map(hs => ({
        ...hs,
        requestCount: Math.max(5, hs.requestCount + Math.floor(Math.random() * 7) - 3),
        surgeMultiplier: parseFloat((hs.surgeMultiplier + (Math.random() * 0.2 - 0.1)).toFixed(1))
      })));
      setLastRefreshed(new Date());
      setIsRefreshing(false);
    }, 600);
  };

  const filteredHotspots = hotspots.filter(hs => {
    if (filterCity !== 'all' && hs.city !== filterCity) return false;
    if (filterLevel !== 'all' && hs.demandLevel !== filterLevel) return false;
    return true;
  });

  const getDemandBadgeColor = (level: 'ultra' | 'high' | 'medium') => {
    switch (level) {
      case 'ultra':
        return 'bg-red-500 text-white border-red-400';
      case 'high':
        return 'bg-amber-500 text-white border-amber-400';
      case 'medium':
        return 'bg-yellow-400 text-black border-yellow-500';
    }
  };

  return (
    <div className="w-full flex flex-col bg-neutral-950 text-white rounded-[32px] border border-neutral-800 shadow-2xl overflow-y-auto custom-scrollbar max-h-[80vh] sm:max-h-[850px] shrink-0">
      {/* Header Bar */}
      <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20 shrink-0">
            <Flame className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-tight text-white">
                {isUrdu ? 'ڈیلیوری اور سواری کی مانگ کا ہیٹ میپ' : 'Live Demand Heatmap'}
              </h2>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md text-[9px] font-black uppercase tracking-widest animate-pulse">
                {isUrdu ? 'لائیو فیڈ' : 'LIVE FEED'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              {isUrdu ? 'زیادہ طلب والے علاقوں میں پوزیشن لے کر 2x تک زیادہ کمائیں' : 'Position near high-density sectors for back-to-back rides & surge earnings'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const container = document.getElementById('driver-dashboard-scroll-container');
              if (container) {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
              }
            }}
            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all rounded-lg text-xs font-bold text-gray-300 flex items-center gap-1 border border-neutral-700"
            title="Scroll Down to Sector List"
          >
            <span className="text-[10px] uppercase font-black">{isUrdu ? 'نیچے جائیں' : 'Scroll Down'}</span>
            <ChevronRight className="w-3.5 h-3.5 rotate-90" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all rounded-lg text-xs font-bold text-yellow-400 flex items-center gap-1.5 border border-neutral-700"
            title="Refresh Heatmap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-[10px] uppercase font-black">{isUrdu ? 'تازہ کریں' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="px-4 py-2.5 bg-black/60 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-yellow-400" /> {isUrdu ? 'فلٹر' : 'City'}:
          </span>
          <button
            onClick={() => setFilterCity('all')}
            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${filterCity === 'all' ? 'bg-yellow-400 text-black shadow-md' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}
          >
            {isUrdu ? 'تمام' : 'All Twin Cities'}
          </button>
          <button
            onClick={() => setFilterCity('Islamabad')}
            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${filterCity === 'Islamabad' ? 'bg-yellow-400 text-black shadow-md' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}
          >
            🏛️ Islamabad
          </button>
          <button
            onClick={() => setFilterCity('Rawalpindi')}
            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${filterCity === 'Rawalpindi' ? 'bg-yellow-400 text-black shadow-md' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}
          >
            🏙️ Rawalpindi
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 mr-1">
            {isUrdu ? 'شدت' : 'Surge'}:
          </span>
          <button
            onClick={() => setFilterLevel(filterLevel === 'ultra' ? 'all' : 'ultra')}
            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${filterLevel === 'ultra' ? 'bg-red-600 text-white shadow-md' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}
          >
            🔥 Ultra (2.0x)
          </button>
        </div>
      </div>

      {/* Main Content Area: Google Map + Hotspot Sidebar */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 relative">
        {/* Map Container (Left 7 Cols on desktop) */}
        <div className="lg:col-span-7 h-[300px] sm:h-[360px] lg:h-[520px] relative bg-neutral-900 border-b lg:border-b-0 lg:border-r border-neutral-800 shrink-0">
          {hasValidKey ? (
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={{ lat: 33.609742, lng: 72.9952283 }}
                defaultZoom={10.5}
                mapId="DEMAND_HEATMAP_MAP"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                disableDefaultUI={false}
                gestureHandling="cooperative"
              >
                <MapHeatCircles hotspots={filteredHotspots} />

                {filteredHotspots.map(hs => (
                  <AdvancedMarker
                    key={hs.id}
                    position={{ lat: hs.lat, lng: hs.lng }}
                    onClick={() => setSelectedHotspot(hs)}
                  >
                    <div className="flex flex-col items-center cursor-pointer group">
                      <div className={`px-2 py-0.5 rounded-md text-[10px] font-black border shadow-xl flex items-center gap-1 backdrop-blur-md transition-transform group-hover:scale-110 ${getDemandBadgeColor(hs.demandLevel)}`}>
                        <Zap className="w-2.5 h-2.5" />
                        <span>{hs.surgeMultiplier}x</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-black border-2 border-yellow-400 flex items-center justify-center text-yellow-400 font-black shadow-2xl mt-0.5 animate-bounce">
                        <Flame className="w-4 h-4 text-red-500 fill-current" />
                      </div>
                    </div>
                  </AdvancedMarker>
                ))}

                {selectedHotspot && (
                  <InfoWindow
                    position={{ lat: selectedHotspot.lat, lng: selectedHotspot.lng }}
                    onCloseClick={() => setSelectedHotspot(null)}
                  >
                    <div className="p-2 text-black max-w-xs font-sans">
                      <div className="flex items-center justify-between gap-2 border-b pb-1.5 mb-1.5">
                        <span className="font-black text-xs uppercase tracking-tight text-neutral-900">
                          {isUrdu ? selectedHotspot.nameUrdu : selectedHotspot.name}
                        </span>
                        <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[9px] font-black">
                          {selectedHotspot.surgeMultiplier}x SURGE
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-neutral-600 mb-1">
                        📍 {selectedHotspot.sector}
                      </p>
                      <p className="text-[10px] text-neutral-700 bg-neutral-100 p-1.5 rounded border border-neutral-200 leading-tight mb-2">
                        💡 {isUrdu ? selectedHotspot.recommendationUrdu : selectedHotspot.recommendation}
                      </p>
                      <button
                        onClick={() => {
                          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedHotspot.lat},${selectedHotspot.lng}`;
                          window.open(mapsUrl, '_blank');
                        }}
                        className="w-full py-1.5 bg-black text-yellow-400 rounded text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                      >
                        <Navigation className="w-3 h-3" />
                        {isUrdu ? 'اس ہاٹ اسپاٹ پر نیویگیٹ کریں' : 'Navigate Here'}
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          ) : (
            /* Styled Vector Canvas Map Fallback when Google Maps Key is absent */
            <div className="w-full h-full relative bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-6 flex flex-col justify-between overflow-hidden">
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ef4444_1.5px,transparent_1.5px)] [background-size:20px_20px]" />

              {/* Top Vector overlay status */}
              <div className="relative z-10 flex items-center justify-between bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                    {isUrdu ? 'اسلام آباد / راولپنڈی میں 8 ہاٹ اسپاٹس فعال ہیں' : '8 Twin City Hotspots Active'}
                  </span>
                </div>
                <div className="text-[9px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                  {filteredHotspots.reduce((acc, curr) => acc + curr.requestCount, 0)} {isUrdu ? 'مجموعی درخواستیں' : 'Total Requests'}
                </div>
              </div>

              {/* Graphical Hotspot Radar Nodes */}
              <div className="my-auto relative h-48 w-full max-w-md mx-auto flex items-center justify-center z-10">
                <div className="absolute w-40 h-40 rounded-full border border-red-500/20 animate-ping pointer-events-none" />
                <div className="absolute w-64 h-64 rounded-full border border-yellow-500/10 pointer-events-none" />

                {filteredHotspots.slice(0, 5).map((hs, idx) => {
                  const offsets = [
                    { top: '15%', left: '20%' },
                    { top: '25%', left: '70%' },
                    { top: '65%', left: '30%' },
                    { top: '70%', left: '75%' },
                    { top: '42%', left: '48%' },
                  ];
                  const pos = offsets[idx % offsets.length];
                  const isSelected = selectedHotspot?.id === hs.id;

                  return (
                    <button
                      key={hs.id}
                      onClick={() => setSelectedHotspot(hs)}
                      style={{ top: pos.top, left: pos.left }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all cursor-pointer ${isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'}`}
                    >
                      <div className={`px-2 py-0.5 rounded-full text-[8px] font-black whitespace-nowrap shadow-xl flex items-center gap-1 border border-white/20 ${getDemandBadgeColor(hs.demandLevel)}`}>
                        <Zap className="w-2 h-2" />
                        <span>{hs.surgeMultiplier}x</span>
                        <span className="opacity-80">({hs.requestCount})</span>
                      </div>
                      <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white mx-auto mt-0.5 shadow-lg animate-pulse" />
                    </button>
                  );
                })}
              </div>

              {/* Map Key instructions note */}
              <div className="relative z-10 bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-neutral-800 text-[9px] text-gray-400 flex items-center justify-between">
                <span>📍 {isUrdu ? 'نقشے پر ہاٹ اسپاٹ کو دبا کر تفصیلات دیکھیں' : 'Click any hotspot badge to view sector positioning strategy'}</span>
                <span className="text-yellow-400 font-bold">2.0x Max Surge</span>
              </div>
            </div>
          )}
        </div>

        {/* Hotspot Sector List & Recommendation Panel (Right 5 Cols) */}
        <div className="lg:col-span-5 bg-neutral-950 p-4 space-y-4 lg:h-[520px] lg:overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
            <div>
              <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block">
                {isUrdu ? 'سرگرم سیکٹرز' : 'High Demand Sectors'}
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                {isUrdu ? 'ڈرائیور کی پوزیشننگ کی تجاویز' : 'Strategic Driver Positions'}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-gray-400 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800">
              {filteredHotspots.length} {isUrdu ? 'علاقے' : 'Zones'}
            </span>
          </div>

          {/* Selected Hotspot Detailed Spotlight Card */}
          {selectedHotspot && (
            <div className="bg-gradient-to-br from-neutral-900 to-black p-4 rounded-2xl border-2 border-yellow-500/30 space-y-3 relative overflow-hidden shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 bg-red-500 text-white font-black text-[8px] uppercase tracking-widest rounded-md inline-block mb-1">
                    🔥 {selectedHotspot.surgeMultiplier}x {isUrdu ? 'سرج ملٹی پلائر' : 'Surge Multiplier'}
                  </span>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">
                    {isUrdu ? selectedHotspot.nameUrdu : selectedHotspot.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                    📍 {selectedHotspot.sector} • {selectedHotspot.city}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-yellow-400">
                    {selectedHotspot.requestCount}
                  </span>
                  <span className="text-[8px] font-black uppercase text-gray-400 block">
                    {isUrdu ? 'طلب کی درخواستیں' : 'Active Requests'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] leading-relaxed text-gray-300">
                <span className="font-bold text-yellow-400 block mb-0.5 text-[9px] uppercase tracking-wider">
                  💡 {isUrdu ? 'AI ڈرائیور کی پوزیشننگ کی تجویز' : 'AI Driver Recommendation'}:
                </span>
                {isUrdu ? selectedHotspot.recommendationUrdu : selectedHotspot.recommendation}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="bg-neutral-900/80 p-2 rounded-xl border border-neutral-800">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">
                    {isUrdu ? 'متوقع پوزیشننگ وقت' : 'Estimated Pickup Wait'}
                  </span>
                  <span className="text-xs font-black text-emerald-400">
                    ~{selectedHotspot.avgWaitMins} mins
                  </span>
                </div>
                <div className="bg-neutral-900/80 p-2 rounded-xl border border-neutral-800">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">
                    {isUrdu ? 'آمدنی میں اضافہ' : 'Earnings Boost'}
                  </span>
                  <span className="text-xs font-black text-yellow-400">
                    +{Math.round((selectedHotspot.surgeMultiplier - 1) * 100)}% Extra
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onNavigateToHotspot) {
                    onNavigateToHotspot(selectedHotspot);
                  } else {
                    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedHotspot.lat},${selectedHotspot.lng}`;
                    window.open(mapsUrl, '_blank');
                  }
                }}
                className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 active:scale-[0.98] text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Navigation className="w-3.5 h-3.5" />
                {isUrdu ? 'اس سیکٹر میں نیویگیٹ کریں' : 'Position Driver in Sector'}
              </button>
            </div>
          )}

          {/* List of Hotspot Cards */}
          <div className="space-y-2">
            {filteredHotspots.map(hs => {
              const isSelected = selectedHotspot?.id === hs.id;
              return (
                <div
                  key={hs.id}
                  onClick={() => setSelectedHotspot(hs)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all border ${isSelected ? 'bg-neutral-900 border-yellow-400 shadow-md' : 'bg-neutral-900/40 border-neutral-800 hover:bg-neutral-900/80 hover:border-neutral-700'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${hs.demandLevel === 'ultra' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                        {hs.surgeMultiplier}x
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-white uppercase tracking-tight">
                          {isUrdu ? hs.nameUrdu : hs.name}
                        </h5>
                        <p className="text-[9px] text-gray-400">
                          {hs.sector}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-black text-yellow-400">
                          {hs.requestCount}
                        </span>
                        <span className="text-[8px] text-gray-500 uppercase tracking-widest block">
                          {isUrdu ? 'درخواستیں' : 'Rides'}
                        </span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-yellow-400 translate-x-1' : 'text-gray-600'}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
