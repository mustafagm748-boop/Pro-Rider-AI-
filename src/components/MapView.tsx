import React, { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Car, Navigation, ShieldCheck, Zap, Layers, Activity, Maximize, Minimize } from 'lucide-react';
import { calculateLocationDistanceKm, getCurrentGPSLocation } from '../lib/locationService';

const API_KEY = (process.env.GOOGLE_MAPS_PLATFORM_KEY) || (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface RouteDisplayProps {
  origin: string | google.maps.LatLngLiteral;
  destination: string | google.maps.LatLngLiteral;
  showLiveVehicle?: boolean;
  driverName?: string;
  vehicleType?: string;
  onRouteInfo?: (info: { distance: string; duration: string }) => void;
  onPathUpdated?: (path: google.maps.LatLng[]) => void;
}

function TrafficLayerComponent({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!trafficLayerRef.current && typeof google !== 'undefined' && google?.maps?.TrafficLayer) {
      trafficLayerRef.current = new google.maps.TrafficLayer();
    }

    if (trafficLayerRef.current) {
      trafficLayerRef.current.setMap(enabled ? map : null);
    }

    return () => {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    };
  }, [map, enabled]);

  return null;
}

function MapStyler({ styles }: { styles: google.maps.MapTypeStyle[] }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.setOptions({ styles });
    }
  }, [map, styles]);
  return null;
}

function RouteDisplay({ origin, destination, showLiveVehicle, driverName, vehicleType, onRouteInfo, onPathUpdated }: RouteDisplayProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;

    // Clear previous route
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING' as any,
      fields: ['path', 'viewport', 'distanceMeters', 'duration'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => {
          p.setOptions({
            strokeColor: '#3b82f6', // Ride-hailing blue
            strokeWeight: 5,
            strokeOpacity: 0.9
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;
        
        if (routes[0].viewport) {
          map.fitBounds(routes[0].viewport);
        }

        const route = routes[0] as any;
        if (route.path && onPathUpdated) {
          onPathUpdated(route.path);
        }

        if (onRouteInfo) {
          const distKm = (route.distanceMeters || 0) / 1000;
          const durationStr = route.duration || '';
          onRouteInfo({
            distance: distKm.toFixed(1),
            duration: durationStr
          });
        }
      }
    }).catch(err => {
      console.error('Error computing routes:', err);
    });

    return () => polylinesRef.current.forEach(p => p.setMap(null));
  }, [routesLib, map, origin, destination, onRouteInfo, onPathUpdated]);

  return null;
}

const customMapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e0e0e0' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#f8d7da' }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#e5e5e5' }]
  }
];

interface MapViewProps {
  pickup: string;
  destination: string;
  pickupCoords?: { lat: number; lng: number } | null;
  dropoffCoords?: { lat: number; lng: number } | null;
  className?: string;
  showLiveVehicle?: boolean;
  driverCoords?: { lat: number; lng: number } | null;
  driverName?: string;
  vehicleType?: string;
  onRouteInfo?: (info: { distance: string; duration: string }) => void;
  showTrafficToggle?: boolean;
  defaultTrafficEnabled?: boolean;
}

// Enhanced Street Background for when Google Maps is disabled/postponed
const StreetMapBackground = () => (
  <div className="absolute inset-0 bg-[#0f172a] overflow-hidden">
    {/* Large City Blocks / Grid */}
    <div className="absolute inset-0 opacity-[0.15]" 
      style={{ 
        backgroundImage: `linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} 
    />
    {/* Finer Grid Detail */}
    <div className="absolute inset-0 opacity-[0.05]" 
      style={{ 
        backgroundImage: `linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)`,
        backgroundSize: '15px 15px'
      }} 
    />
    
    {/* Abstract City Shapes / Parks */}
    <div className="absolute top-[20%] left-[10%] w-[15%] h-[25%] bg-emerald-950/20 rounded-3xl blur-2xl transform rotate-12" />
    <div className="absolute bottom-[15%] right-[5%] w-[20%] h-[30%] bg-blue-950/20 rounded-full blur-3xl" />
    <div className="absolute top-[60%] left-[40%] w-[10%] h-[15%] bg-slate-800/30 rounded-lg blur-xl" />

    {/* Simulated "Main Roads" */}
    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/10 blur-[1px]" />
    <div className="absolute top-0 left-1/3 w-[2px] h-full bg-white/10 blur-[1px]" />
  </div>
);

export const MapView: React.FC<MapViewProps> = ({ 
  pickup, 
  destination, 
  pickupCoords,
  dropoffCoords,
  className = "w-full h-full", 
  showLiveVehicle = true,
  driverCoords = null,
  driverName = "",
  vehicleType = "Sedan",
  onRouteInfo,
  showTrafficToggle = true,
  defaultTrafficEnabled = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [routePath, setRoutePath] = useState<any[]>([]);
  const [simulatedVehiclePos, setSimulatedVehiclePos] = useState<{ lat: number; lng: number } | null>(null);
  const [vehicleSpeed, setVehicleSpeed] = useState<number>(45);
  const [simProgress, setSimProgress] = useState<number>(15);
  const [isTrafficEnabled, setIsTrafficEnabled] = useState<boolean>(defaultTrafficEnabled);

  // Simulated position progress for live vehicle movement (ONLY if driverCoords is NOT provided)
  useEffect(() => {
    if (!showLiveVehicle || driverCoords) return;

    const interval = setInterval(() => {
      setSimProgress(prev => {
        const next = prev + 1;
        return next > 95 ? 95 : next;
      });
      setVehicleSpeed(Math.floor(38 + Math.random() * 18));
    }, 800);

    return () => clearInterval(interval);
  }, [showLiveVehicle, driverCoords]);

  // Update simulated vehicle coordinate if Google Maps route path is available
  useEffect(() => {
    if (driverCoords) return;

    if (routePath.length > 0) {
      const idx = Math.floor((simProgress / 100) * (routePath.length - 1));
      const pt = routePath[idx];
      if (pt) {
        setSimulatedVehiclePos({ lat: pt.lat(), lng: pt.lng() });
      }
    } else {
      // Default Islamabad / Rawalpindi center interpolation fallback
      const startLat = 33.609742;
      const startLng = 72.9952283;
      const endLat = 33.6500;
      const endLng = 73.0800;
      const ratio = simProgress / 100;
      setSimulatedVehiclePos({
        lat: startLat + (endLat - startLat) * ratio,
        lng: startLng + (endLng - startLng) * ratio
      });
    }
  }, [routePath, simProgress, driverCoords]);

  const effectiveVehiclePos = driverCoords || simulatedVehiclePos;

  useEffect(() => {
    if (!hasValidKey && pickup && destination && onRouteInfo) {
      const computedKm = calculateLocationDistanceKm(pickup, destination);
      const distStr = computedKm.toFixed(1);
      const durMin = Math.ceil((computedKm / 45) * 60) + ' mins';
      const timeout = setTimeout(() => {
        onRouteInfo({ distance: distStr, duration: durMin });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [pickup, destination, onRouteInfo, hasValidKey]);

  if (!hasValidKey) {
    return (
      <div className={`flex flex-col items-center justify-between bg-slate-950 text-white p-5 overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[9999]' : `relative rounded-3xl border border-white/5 ${className}`}`}>
        
        {/* Street Map Background */}
        <StreetMapBackground />

        {/* Floating Controls */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          {showTrafficToggle && (
            <button
              id="driver-map-traffic-toggle-fallback"
              type="button"
              onClick={() => setIsTrafficEnabled(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-2xl transition-all duration-200 border cursor-pointer ${
                isTrafficEnabled
                  ? 'bg-neutral-950/90 text-emerald-400 border-emerald-500/60 ring-2 ring-emerald-500/30 shadow-emerald-950/80'
                  : 'bg-neutral-900/80 text-gray-400 border-white/15 hover:text-white hover:bg-black/90'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isTrafficEnabled && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isTrafficEnabled ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
              </span>
              <Layers className={`w-3.5 h-3.5 ${isTrafficEnabled ? 'text-emerald-400 animate-pulse' : 'text-gray-400'}`} />
              <span>{isTrafficEnabled ? 'Traffic' : 'Traffic'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-neutral-900/80 text-gray-400 border border-white/15 hover:text-white hover:bg-black/90 backdrop-blur-md shadow-2xl transition-all"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>

        {/* Top Header Live Status Badge */}
        <div className="w-full flex items-center justify-between relative z-10 bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              Live Navigation
            </span>
          </div>
          <div className="flex items-center gap-2 bg-yellow-400/10 px-2.5 py-1 rounded-lg border border-yellow-400/30">
            <Zap className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            <span className="text-[10px] font-black text-yellow-400">{vehicleSpeed} km/h</span>
          </div>
        </div>

        {/* Live Route Graphic & Moving Vehicle Visualizer */}
        <div className="my-auto w-full max-w-xs relative py-6 px-4 z-10 flex flex-col items-center">
          {/* Traffic Status Indicator Pill */}
          {isTrafficEnabled && (
            <div className="mb-4 flex items-center justify-center gap-1.5 bg-emerald-950/80 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider shadow-lg animate-fade-in">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Street Map: Active Route Tracking</span>
            </div>
          )}

          <div className="relative h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-white/10 shadow-inner">
            {/* Route track fill */}
            <div 
              className={`h-full transition-all duration-500 ease-out ${
                isTrafficEnabled 
                  ? 'bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-400' 
                  : 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300'
              }`}
              style={{ width: `${simProgress}%` }}
            />
          </div>

          {/* Animated Moving Vehicle Marker */}
          {showLiveVehicle && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out flex flex-col items-center pointer-events-none z-30"
              style={{ left: `calc(${simProgress}% + 4px)` }}
            >
              <div className="px-2 py-0.5 bg-slate-900 text-yellow-400 border border-yellow-400/30 text-[8px] font-black rounded-md whitespace-nowrap shadow-lg mb-1 flex items-center gap-1 backdrop-blur-md">
                <Car className="w-2.5 h-2.5 inline" /> {driverName || 'Captain'}
              </div>
              <div className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black shadow-lg shadow-yellow-500/30 border-2 border-white animate-bounce">
                <Navigation className="w-4 h-4 transform rotate-45 fill-current" />
              </div>
            </div>
          )}

          {/* Pickup & Dropoff Labels */}
          <div className="flex justify-between items-center w-full mt-8 text-[10px] font-black uppercase tracking-wider">
            <div className="flex items-center gap-1.5 text-yellow-400 bg-black/40 px-2 py-1 rounded-lg border border-yellow-400/20">
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block animate-pulse" />
              <span className="truncate max-w-[80px]">{pickup || "Pickup"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 bg-black/40 px-2 py-1 rounded-lg border border-emerald-400/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span className="truncate max-w-[80px]">{destination || "Dropoff"}</span>
            </div>
          </div>
        </div>

        {/* API Key Instructions Overlay - Subtle Minimalist Version */}
        <div className="w-full relative z-10 text-left bg-slate-900/60 backdrop-blur-md p-3 rounded-2xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> API System Postponed
            </p>
            <span className="text-[8px] font-bold text-emerald-500/60 uppercase">Street Map Mode</span>
          </div>
          <p className="text-[8px] text-gray-500 leading-tight uppercase font-bold tracking-wider">
            Full Google Maps integration will be activated in the next update. Using internal navigation engine.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[9999] bg-slate-950' : className}`}>
      {/* Floating Controls */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        {showTrafficToggle && (
          <button
            id="driver-map-traffic-toggle-live"
            type="button"
            onClick={() => setIsTrafficEnabled(prev => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-2xl transition-all duration-200 border cursor-pointer ${
              isTrafficEnabled
                ? 'bg-neutral-950/95 text-emerald-400 border-emerald-500/60 ring-2 ring-emerald-500/30 shadow-emerald-950/80'
                : 'bg-neutral-900/90 text-gray-300 border-white/20 hover:text-white hover:bg-black'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              {isTrafficEnabled && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isTrafficEnabled ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
            </span>
            <Layers className={`w-4 h-4 ${isTrafficEnabled ? 'text-emerald-400 animate-pulse' : 'text-gray-400'}`} />
            <span>{isTrafficEnabled ? 'Traffic' : 'Traffic'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsFullscreen(prev => !prev)}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-900/90 text-gray-300 border border-white/20 hover:text-white hover:bg-black backdrop-blur-md shadow-2xl transition-all"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>

      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={{ lat: 33.609742, lng: 72.9952283 }} // Islamabad/Rawalpindi center
          defaultZoom={11}
          mapId="8e0a97af9386fef"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          disableDefaultUI={true}
        >
          <MapStyler styles={customMapStyles} />
          <TrafficLayerComponent enabled={isTrafficEnabled} />
          <RouteDisplay 
            origin={pickupCoords || pickup} 
            destination={dropoffCoords || destination} 
            showLiveVehicle={showLiveVehicle}
            driverName={driverName}
            vehicleType={vehicleType}
            onRouteInfo={onRouteInfo}
            onPathUpdated={setRoutePath}
          />

          {/* Animated Vehicle Advanced Marker */}
          {showLiveVehicle && effectiveVehiclePos && (
            <AdvancedMarker position={effectiveVehiclePos} title={`${driverName} - ${vehicleType}`}>
              <div className="flex flex-col items-center">
                <div className="px-2 py-0.5 bg-black/90 text-yellow-400 text-[9px] font-black rounded-lg border border-yellow-400/40 shadow-xl mb-1 flex items-center gap-1 backdrop-blur-md whitespace-nowrap">
                  <Car className="w-3 h-3 text-yellow-400" />
                  <span>{driverName}</span>
                  {driverCoords ? (
                    <span className="text-emerald-400 ml-1 font-mono">LIVE</span>
                  ) : (
                    <span className="text-emerald-400 ml-1 font-mono">{vehicleSpeed} km/h</span>
                  )}
                </div>
                <div className="w-9 h-9 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black shadow-2xl border-2 border-black transform transition-transform duration-300">
                  <Navigation className="w-5 h-5 fill-current transform rotate-45" />
                </div>
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>
    </div>
  );
};
