import React, { useState } from 'react';
import { Calculator, MapPin, Navigation, Zap, Clock, TrendingUp, ShieldAlert, Sparkles } from 'lucide-react';
import { VehicleType, ServiceType } from '../types';
import { calculateLocationDistanceKm, calculateAccurateFare } from '../lib/locationService';

interface FareCalculatorProps {
  onClose: () => void;
}

const FARES: Record<VehicleType, { base: number; perKm: number; label: string }> = {
  bike: { base: 80, perKm: 25, label: 'Bike' },
  rickshaw: { base: 100, perKm: 30, label: 'Rickshaw (Pindi/Rural)' },
  mini: { base: 200, perKm: 30, label: 'Mini Car' },
  sedan: { base: 300, perKm: 35, label: 'Sedan AC' },
  comfortable: { base: 400, perKm: 45, label: 'Comfort Sedan' },
  premium: { base: 600, perKm: 65, label: 'Premium Luxury' },
  seven_seater: { base: 500, perKm: 55, label: '7-Seater MPV' },
  seven_seater_ocean: { base: 550, perKm: 60, label: '7-Seater Ocean' },
  hiace_15: { base: 800, perKm: 90, label: '15-Seater HiAce/Cabin' },
  loading_cargo: { base: 700, perKm: 80, label: 'Cargo / Loading Pickup' },
};

export default function FareCalculator({ onClose }: FareCalculatorProps) {
  const [pickupTown, setPickupTown] = useState<string>('Barma Town');
  const [dropoffTown, setDropoffTown] = useState<string>('Outer Town');
  const [distance, setDistance] = useState<string>('30');
  const [vehicle, setVehicle] = useState<VehicleType>('sedan');
  const [service, setService] = useState<ServiceType>('city');

  // Surge Controls State
  const [autoSurgeEnabled, setAutoSurgeEnabled] = useState<boolean>(true);
  const [selectedTimePreset, setSelectedTimePreset] = useState<'current' | 'morning' | 'evening' | 'night' | 'offpeak'>('current');
  const [customSurgeOverride, setCustomSurgeOverride] = useState<number | null>(null);

  const faresConfig = React.useMemo(() => {
    const saved = localStorage.getItem('prorider_vehicle_fares');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return FARES;
  }, []);

  // Recalculate distance whenever pickupTown or dropoffTown changes
  const handleTownChange = (pickup: string, dropoff: string) => {
    setPickupTown(pickup);
    setDropoffTown(dropoff);
    if (pickup && dropoff) {
      const computed = calculateLocationDistanceKm(pickup, dropoff);
      setDistance(computed.toString());
    }
  };

  const simulatedTimeStr = React.useMemo(() => {
    switch (selectedTimePreset) {
      case 'morning': return '08:30';
      case 'evening': return '18:30';
      case 'night': return '01:00';
      case 'offpeak': return '14:00';
      default: return undefined; // current real time
    }
  }, [selectedTimePreset]);

  const fareResult = React.useMemo(() => {
    const d = parseFloat(distance) || 0;
    const mappedService = service === 'city-to-city' ? 'city-to-city' : service === 'long-route' ? 'long-route' : 'instant';

    return calculateAccurateFare(
      d,
      vehicle,
      mappedService,
      faresConfig,
      {
        applySurge: autoSurgeEnabled,
        surgeMultiplier: customSurgeOverride ?? undefined,
        pickupLocation: pickupTown,
        dropoffLocation: dropoffTown,
        customTime: simulatedTimeStr
      }
    );
  }, [distance, vehicle, service, faresConfig, autoSurgeEnabled, customSurgeOverride, pickupTown, dropoffTown, simulatedTimeStr]);

  return (
    <div className="p-4 md:p-6 bg-white flex flex-col space-y-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter text-black flex items-center gap-2">
            <Calculator className="w-5 h-5 text-yellow-500" />
            Geo-Location Fare Calculator
          </h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            With Automated Peak-Hours & Ride Frequency Surge Engine
          </p>
        </div>
        <button onClick={onClose} className="text-[10px] font-black uppercase text-gray-400 hover:text-black">Close</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Left Side: Route & Vehicle Inputs */}
        <div className="space-y-3">
          {/* Towns / Location Route Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Pickup Location</label>
              <input 
                type="text" 
                value={pickupTown} 
                onChange={(e) => handleTownChange(e.target.value, dropoffTown)}
                className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 focus:border-yellow-400 rounded-xl outline-none font-bold text-xs"
                placeholder="e.g. Barma Town"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Dropoff Location</label>
              <input 
                type="text" 
                value={dropoffTown} 
                onChange={(e) => handleTownChange(pickupTown, e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 focus:border-yellow-400 rounded-xl outline-none font-bold text-xs"
                placeholder="e.g. Outer Town / Karachi"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Calculated Distance (KM)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
              <input 
                type="number" 
                value={distance} 
                onChange={(e) => setDistance(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-transparent focus:border-yellow-400 rounded-2xl outline-none font-bold text-sm"
                placeholder="km..."
              />
            </div>
          </div>

          {/* SURGE PRICING CONTROLS */}
          <div className="bg-amber-50/70 border-2 border-amber-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                Peak & Frequency Surge Logic
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-[9px] font-bold text-amber-800">Auto Surge</span>
                <input 
                  type="checkbox" 
                  checked={autoSurgeEnabled}
                  onChange={(e) => {
                    setAutoSurgeEnabled(e.target.checked);
                    if (!e.target.checked) setCustomSurgeOverride(null);
                  }}
                  className="accent-amber-500 w-3.5 h-3.5"
                />
              </label>
            </div>

            {/* Time Window Presets */}
            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase text-amber-800 tracking-wider">Simulate Peak Hour Window:</span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'current', label: 'Current Time' },
                  { id: 'morning', label: 'Morning Peak (8:30)' },
                  { id: 'evening', label: 'Evening Rush (18:30)' },
                  { id: 'night', label: 'Late Night (01:00)' },
                  { id: 'offpeak', label: 'Off-Peak (14:00)' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedTimePreset(preset.id as any);
                      setCustomSurgeOverride(null);
                    }}
                    className={`py-1 px-1.5 rounded-lg text-[8px] font-black uppercase tracking-tight border transition-all ${
                      selectedTimePreset === preset.id
                        ? 'bg-amber-500 text-black border-amber-600 shadow-xs'
                        : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Surge Multiplier Slider */}
            <div className="space-y-1 pt-1 border-t border-amber-200/60">
              <div className="flex justify-between items-center text-[8px] font-black text-amber-900 uppercase">
                <span>Custom Multiplier Override:</span>
                <span className="font-mono text-xs">{customSurgeOverride ? `${customSurgeOverride}x` : 'Auto Computed'}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={customSurgeOverride || fareResult.surgeMultiplier}
                  onChange={(e) => setCustomSurgeOverride(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 h-1.5 bg-amber-200 rounded-lg cursor-pointer"
                />
                {customSurgeOverride && (
                  <button
                    type="button"
                    onClick={() => setCustomSurgeOverride(null)}
                    className="text-[8px] font-bold underline text-amber-700 hover:text-amber-900"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Vehicle Type</label>
            <div className="grid grid-cols-2 gap-1.5 h-[140px] overflow-y-auto pr-1">
              {(Object.keys(FARES) as VehicleType[]).map(v => (
                <button 
                  key={v}
                  onClick={() => setVehicle(v)}
                  className={`py-2 px-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all flex flex-col items-start ${
                    vehicle === v ? 'border-black bg-black text-yellow-400 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200'
                  }`}
                >
                  <span className="truncate w-full">{(faresConfig[v] || FARES[v]).label}</span>
                  <span className="opacity-70 text-[8px]">Rs.{(faresConfig[v] || FARES[v]).perKm}/km</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Surge & Fare Breakdown Card */}
        <div className="flex flex-col justify-between bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 rounded-[24px] border-2 border-yellow-300 p-5 space-y-3 relative overflow-hidden">
          {fareResult.isSurgeActive && (
            <div className="absolute top-3 right-3 bg-amber-500 text-black font-black text-[9px] uppercase px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              <Zap className="w-3 h-3 fill-black" />
              {fareResult.surgeMultiplier}x Surge
            </div>
          )}

          <div className="space-y-2">
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Estimated Fare Breakdown</p>
              <div className="text-4xl font-black text-black flex items-start gap-1 mt-1">
                <span className="text-xs mt-1 opacity-60 font-black italic">Rs.</span>
                {fareResult.totalFare.toLocaleString()}
              </div>
            </div>

            {/* Surge Active Reason Banner */}
            {fareResult.isSurgeActive ? (
              <div className="bg-amber-100 border border-amber-300 rounded-xl p-2.5 space-y-1 text-left">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-900 uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Surge Active ({fareResult.surgeMultiplier}x)</span>
                </div>
                <p className="text-[9px] text-amber-800 font-bold leading-tight">
                  {fareResult.surgeReason}
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-left">
                <span className="text-[9px] font-bold text-emerald-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  Standard Rates Applied (Off-Peak Hours & Normal Frequency)
                </span>
              </div>
            )}

            {/* Ride Frequency & Demand Indicator */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="bg-white/90 p-2 rounded-xl border border-yellow-200 space-y-0.5">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Zone Ride Frequency</span>
                <span className="text-xs font-black text-black flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-amber-600" />
                  {fareResult.rideFrequencyCount} req/hr
                </span>
              </div>
              <div className="bg-white/90 p-2 rounded-xl border border-yellow-200 space-y-0.5">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Demand Level</span>
                <span className={`text-xs font-black ${
                  fareResult.demandLevel === 'Peak Surge' ? 'text-red-600' :
                  fareResult.demandLevel === 'High' ? 'text-amber-600' :
                  fareResult.demandLevel === 'Moderate' ? 'text-yellow-600' : 'text-emerald-600'
                }`}>
                  {fareResult.demandLevel}
                </span>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white/80 px-3.5 py-2.5 rounded-xl border border-yellow-300 text-[10px] font-bold text-gray-700 space-y-1 text-left">
              <div className="flex justify-between items-center border-b pb-1">
                <span className="text-gray-500">Distance ({fareResult.distanceKm} km):</span>
                <span className="font-mono text-black">Rs. {fareResult.baseUnsurgedFare}</span>
              </div>
              {fareResult.isSurgeActive && (
                <div className="flex justify-between items-center border-b pb-1 text-amber-900 font-black">
                  <span>Surge Surcharge (+{Math.round((fareResult.surgeMultiplier - 1) * 100)}%):</span>
                  <span className="font-mono text-amber-600">+Rs. {fareResult.surgeAmount}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-0.5 text-xs font-black text-black">
                <span>Final Total:</span>
                <span className="font-mono">Rs. {fareResult.totalFare}</span>
              </div>
            </div>
          </div>

          <p className="text-[8px] text-gray-500 font-bold text-center">
            * Surge pricing automatically adapts to peak commute windows, location density, and real-time ride frequency.
          </p>
        </div>
      </div>

      <button onClick={onClose} className="w-full py-3 bg-black text-yellow-400 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform">
        <Navigation className="w-4 h-4" />
        Calculate & Close
      </button>
    </div>
  );
}

