import React, { useState, useEffect } from 'react';
import { Language } from '../types';

interface ExpectedDurationDisplayProps {
  status?: string;
  distance?: string;
  acceptedAt?: number;
  startedAt?: number;
  isUrdu?: boolean;
  language?: Language;
  logoUrl?: string;
  estimatedMinutes?: number;
  distanceKm?: number;
}

export function ExpectedDurationDisplay({
  status,
  distance,
  acceptedAt,
  startedAt,
  isUrdu = false,
  language = 'en',
  logoUrl,
  estimatedMinutes = 22,
  distanceKm = 13.5
}: ExpectedDurationDisplayProps) {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicks(t => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const urduMode = isUrdu || language === 'ur';

  if (status === 'accepted') {
    const distVal = parseFloat(distance || '5');
    const basePickupDuration = Math.max(2, Math.ceil(distVal * 0.7) || 4);
    const elapsedMinutes = acceptedAt ? Math.floor((Date.now() - acceptedAt) / 60000) : 0;
    const remaining = Math.max(1, basePickupDuration - elapsedMinutes);
    return (
      <div className="bg-yellow-400 text-black px-3 py-1.5 rounded-[12px] font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md border border-yellow-300">
        <span>⏱️ {urduMode ? 'پک اپ میں باقی وقت:' : 'Driver ETA:'}</span>
        <span className="bg-black text-yellow-400 px-2 py-0.5 rounded font-mono text-xs">
          {remaining} {urduMode ? 'منٹ' : 'mins'}
        </span>
      </div>
    );
  }

  if (status === 'arrived') {
    return (
      <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-[12px] font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md border border-emerald-500">
        <span>📍 {urduMode ? 'ڈرائیور پہنچ گیا ہے' : 'Driver Arrived'}</span>
        <span className="bg-black text-emerald-400 px-2 py-0.5 rounded font-mono text-xs">
          {urduMode ? 'مقام پر' : 'At Pickup'}
        </span>
      </div>
    );
  }

  if (status === 'ongoing') {
    const distVal = parseFloat(distance || '5');
    const baseTripDuration = Math.max(3, Math.ceil(distVal * 2.2) || 10);
    const elapsedMinutes = startedAt ? Math.floor((Date.now() - startedAt) / 60000) : 0;
    const remaining = Math.max(1, baseTripDuration - elapsedMinutes);
    return (
      <div className="bg-amber-500 text-white px-3 py-1.5 rounded-[12px] font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md border border-amber-400">
        <span>⏱️ {urduMode ? 'سفر کا بقیہ وقت:' : 'Trip ETA:'}</span>
        <span className="bg-black text-amber-400 px-2 py-0.5 rounded font-mono text-xs">
          {remaining} {urduMode ? 'منٹ' : 'mins'}
        </span>
      </div>
    );
  }

  // Default summary display card with logo
  return (
    <div className={`p-4 bg-white rounded-2xl border border-yellow-200 shadow-sm space-y-3 ${urduMode ? 'rtl font-urdu' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {logoUrl && (
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-yellow-400 bg-black flex items-center justify-center shrink-0">
              <img 
                src={logoUrl} 
                alt="Pro Rider Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo.png';
                }}
              />
            </div>
          )}
          <div>
            <h4 className="text-xs font-black uppercase tracking-tight text-black">
              {urduMode ? 'متوقع وقت اور سفر کا فاصلہ' : 'Expected Journey & Duration'}
            </h4>
            <p className="text-[9px] text-gray-400 font-bold uppercase">Islamabad - Rawalpindi Express Route</p>
          </div>
        </div>
        <div className="px-2.5 py-1 bg-yellow-400 text-black rounded-xl text-[10px] font-black uppercase">
          {estimatedMinutes} {urduMode ? 'منٹ' : 'MINS'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
        <div className="p-2.5 bg-gray-50 rounded-xl">
          <p className="text-[9px] text-gray-400 font-bold uppercase">{urduMode ? 'فاصلہ' : 'Distance'}</p>
          <p className="text-xs font-black text-black mt-0.5">{distanceKm} KM</p>
        </div>
        <div className="p-2.5 bg-yellow-50/50 rounded-xl">
          <p className="text-[9px] text-yellow-700 font-bold uppercase">{urduMode ? 'ٹریفک کی صورتحال' : 'Traffic Condition'}</p>
          <p className="text-xs font-black text-black mt-0.5">{urduMode ? 'روانگی معمول پر' : 'Smooth & Clear'}</p>
        </div>
      </div>
    </div>
  );
}
