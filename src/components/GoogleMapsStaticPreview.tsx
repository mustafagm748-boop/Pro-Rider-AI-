import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Map as MapIcon, Image as ImageIcon } from 'lucide-react';

interface GoogleMapsStaticPreviewProps {
  pickup: string;
  destination: string;
  width?: number;
  height?: number;
  className?: string;
  showOpenInMapsButton?: boolean;
  language?: string;
}

export function GoogleMapsStaticPreview({
  pickup,
  destination,
  width = 600,
  height = 250,
  className = '',
  showOpenInMapsButton = true,
  language = 'en'
}: GoogleMapsStaticPreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';
  const isUrdu = language === 'ur';

  const encodedPickup = encodeURIComponent(pickup);
  const encodedDest = encodeURIComponent(destination);

  // Construct Google Maps Static API URL
  const staticMapUrl = API_KEY
    ? `https://maps.googleapis.com/maps/api/staticmap?size=${width}x${height}&scale=2&maptype=roadmap` +
      `&markers=color:0xeab308%7Clabel:P%7C${encodedPickup}` +
      `&markers=color:0xef4444%7Clabel:D%7C${encodedDest}` +
      `&path=color:0x3b82f6ff%7Cweight:5%7C${encodedPickup}%7C${encodedDest}` +
      `&key=${API_KEY}`
    : '';

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodedPickup}&destination=${encodedDest}`;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 group shadow-lg ${className}`}>
      {/* Overlay Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-yellow-400/30 rounded-lg text-white">
        <MapIcon className="w-3 h-3 text-yellow-400 animate-pulse" />
        <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400">
          {isUrdu ? 'گوگل میپس روٹ پریویو' : 'Google Maps Route Preview'}
        </span>
      </div>

      {/* External Directions Link Button */}
      {showOpenInMapsButton && (
        <a
          href={googleMapsDirectionsUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute top-2.5 right-2.5 z-10 p-1.5 bg-black/80 hover:bg-yellow-400 hover:text-black text-white rounded-lg transition-colors border border-white/20 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider"
          title={isUrdu ? 'گوگل میپس میں نیویگیٹ کریں' : 'Open in Google Maps'}
        >
          <Navigation className="w-3 h-3" />
          <span className="hidden sm:inline">{isUrdu ? 'گوگل میپس' : 'Open Map'}</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}

      {/* Loading Skeleton */}
      {!imageLoaded && !imageError && API_KEY && (
        <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center text-neutral-600 gap-2">
          <MapIcon className="w-6 h-6 animate-spin text-yellow-400" />
          <span className="text-xs font-bold text-gray-400">
            {isUrdu ? 'گوگل میپس کی تیاری...' : 'Loading Google Maps Static Route...'}
          </span>
        </div>
      )}

      {/* Static Map Image */}
      {API_KEY && !imageError ? (
        <img
          src={staticMapUrl}
          alt={`Static map route from ${pickup} to ${destination}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ minHeight: `${Math.min(height / 2, 120)}px` }}
        />
      ) : (
        /* Fallback UI when key is missing or API call fails */
        <div className="w-full relative py-8 px-4 bg-slate-950 text-gray-300 flex flex-col items-center justify-center text-center space-y-3 overflow-hidden border border-white/5 min-h-[160px]">
          {/* Subtle Street Map Background */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
            style={{ 
              backgroundImage: `linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }} 
          />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[40%] bg-emerald-500/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 shadow-xl">
            <MapIcon className="w-6 h-6 animate-pulse" />
          </div>
          
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              {pickup} <span className="text-yellow-400 mx-1">➔</span> {destination}
            </p>
            <p className="text-[8px] text-gray-500 mt-1 font-bold uppercase tracking-widest leading-relaxed">
              {isUrdu 
                ? 'اسٹریٹ میپ پریویو - عارضی طور پر غیر فعال' 
                : 'Street Map Preview - System Postponed'}
              <br/>
              <span className="text-emerald-500/60">Using Internal Routing Engine</span>
            </p>
          </div>
          
          <div className="relative z-10 flex gap-2">
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-900 text-yellow-400 font-black text-[9px] uppercase tracking-widest rounded-xl border border-yellow-400/30 hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-2 shadow-lg"
            >
              <Navigation className="w-3.5 h-3.5" />
              {isUrdu ? 'گوگل میپس پر دیکھیں' : 'Directions'}
            </a>
          </div>
        </div>
      )}

      {/* Pickup & Dropoff Labels Overlay at bottom */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 pt-6 flex items-center justify-between text-[10px] font-bold text-white z-10">
        <div className="flex items-center gap-1.5 truncate max-w-[48%]">
          <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
          <span className="truncate text-gray-200"><strong className="text-yellow-400">P:</strong> {pickup}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate max-w-[48%] justify-end text-right">
          <span className="truncate text-gray-200"><strong className="text-red-400">D:</strong> {destination}</span>
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        </div>
      </div>
    </div>
  );
}
