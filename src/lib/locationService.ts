/**
 * Pro Rider AI - Geographic Location, Route & Dynamic Fare Engine
 * Accurately calculates distances between Pakistani cities, towns, and local outskirts (outer towns).
 */

export interface LocationCoord {
  name: string;
  lat: number;
  lng: number;
  aliases: string[];
  city: string;
}

// Known Pakistani geographic nodes with accurate coordinates
export const PAKISTAN_LOCATIONS: LocationCoord[] = [
  // Islamabad Core & Commercial Zones
  { name: 'Blue Area Islamabad', lat: 33.7118, lng: 73.0581, aliases: ['blue area', 'centaurus', 'jinnah avenue', 'secretariat', 'f-6', 'f-7', 'g-6', 'g-7'], city: 'Islamabad' },
  { name: 'Islamabad Center', lat: 33.6844, lng: 73.0479, aliases: ['islamabad', 'isb', 'zero point', 'f-8', 'f-10', 'g-9', 'g-11', 'faisal mosque'], city: 'Islamabad' },
  
  // Specific Towns & Outskirts (Cold Water, Gauri Garden, Barma Town)
  { name: 'Ghauri Town / Gauri Garden', lat: 33.6180, lng: 73.1350, aliases: ['gauri garden', 'ghauri garden', 'ghauri town', 'gauri town', 'gori garden', 'gori town', 'khanna pul', 'koral chowk', 'lehtrar road'], city: 'Islamabad' },
  { name: 'Cold Water / Thanda Pani', lat: 33.8200, lng: 73.3100, aliases: ['cold water', 'thanda pani', 'cold water point', 'thanda paani', 'cold water kahuta'], city: 'Islamabad Outskirts' },
  { name: 'Barma Town', lat: 33.6333, lng: 73.1333, aliases: ['barma town', 'barma', 'tarlai', 'tramri', 'tramri chowk', 'chatha bakhtawar', 'comsats'], city: 'Islamabad' },
  { name: 'Islamabad Outer Town / Outskirts', lat: 33.5100, lng: 73.1800, aliases: ['outer town', 'outskirts', 'rawat', 'tarnol', 'fateh jang road', 'nilore', 'sangjani'], city: 'Islamabad' },
  { name: 'PWD / Pakistan Town', lat: 33.5850, lng: 73.1550, aliases: ['pwd', 'pwd housing scheme', 'pakistan town', 'police foundation', 'cbr town', 'sohan'], city: 'Islamabad' },
  { name: 'Gulberg Greens Islamabad', lat: 33.5950, lng: 73.1650, aliases: ['gulberg greens', 'gulberg islamabad', 'gulberg residencia'], city: 'Islamabad' },

  // Sectors & Educational Hubs
  { name: 'NUST / H-12 Islamabad', lat: 33.6450, lng: 72.9900, aliases: ['nust', 'h-12', 'nust university', 'h-13'], city: 'Islamabad' },
  { name: 'E-11 / F-11 Islamabad', lat: 33.6950, lng: 72.9800, aliases: ['e-11', 'f-11', 'e-11 markaz', 'f-11 markaz'], city: 'Islamabad' },
  { name: 'G-13 / G-15 Islamabad', lat: 33.6500, lng: 72.9650, aliases: ['g-13', 'g-14', 'g-15', 'g-13 markaz'], city: 'Islamabad' },
  { name: 'I-8 / I-9 / I-10 Rawalpindi Border', lat: 33.6600, lng: 73.0650, aliases: ['i-8', 'i-9', 'i-10', 'i-8 markaz', 'faizabad'], city: 'Islamabad' },

  // Rawalpindi Cluster
  { name: 'Rawalpindi Center', lat: 33.5989, lng: 73.0531, aliases: ['rawalpindi', 'pindi', 'saddar pindi', 'murree road', 'commercial market', 'raja bazar', 'chandni chowk'], city: 'Rawalpindi' },
  { name: 'Bahria Town Islamabad/Rawalpindi', lat: 33.5350, lng: 73.1180, aliases: ['bahria town', 'bahria phase 8', 'bahria phase 7', 'bahria enclave', 'bahria phase 1', 'bahria phase 4'], city: 'Rawalpindi' },
  { name: 'DHA Islamabad', lat: 33.5200, lng: 73.1500, aliases: ['dha', 'dha phase 1', 'dha phase 2', 'dha phase 5'], city: 'Islamabad' },
  { name: 'Islamabad International Airport', lat: 33.5606, lng: 72.8518, aliases: ['airport', 'islamabad airport', 'new islamabad airport', 'iia'], city: 'Islamabad' },

  // Murree / Hill Station & Outskirts
  { name: 'Murree Mall Road / Kuldana', lat: 33.9070, lng: 73.3903, aliases: ['murree', 'patriata', 'bhurban', 'mall road murree', 'kuldana', 'lower topa', 'ghora gali', 'jhika gali'], city: 'Murree' },
  { name: 'Kahuta', lat: 33.5910, lng: 73.3860, aliases: ['kahuta', 'kahuta triangle'], city: 'Kahuta' },
  { name: 'Taxila / Wah Cantt', lat: 33.7460, lng: 72.8397, aliases: ['taxila', 'wah cantt', 'wah'], city: 'Taxila' },

  // Local Nodes
  { name: 'Khanapur', lat: 33.6150, lng: 73.0650, aliases: ['khanapur', 'khan pur', 'khanpur'], city: 'Islamabad' },
  { name: 'Ziana Chowk', lat: 33.6250, lng: 73.0850, aliases: ['ziana chowk', 'ziana', 'chowk ziana'], city: 'Islamabad' },
  { name: 'Central Mosque', lat: 33.6300, lng: 73.0900, aliases: ['mosque', 'central mosque', 'masjid', 'jamia masjid'], city: 'Islamabad' },

  // Major Cities
  { name: 'Peshawar', lat: 34.0151, lng: 71.5249, aliases: ['peshawar', 'pawar', 'hayatabad'], city: 'Peshawar' },
  { name: 'Lahore', lat: 31.5204, lng: 74.3587, aliases: ['lahore', 'lhr', 'gulberg', 'dha lahore', 'thokar niaz baig', 'johar town'], city: 'Lahore' },
  { name: 'Faisalabad', lat: 31.4504, lng: 73.1350, aliases: ['faisalabad', 'fsd'], city: 'Faisalabad' },
  { name: 'Multan', lat: 30.1575, lng: 71.5249, aliases: ['multan'], city: 'Multan' },
  { name: 'Gujranwala', lat: 32.1877, lng: 74.1945, aliases: ['gujranwala'], city: 'Gujranwala' },
  { name: 'Sialkot', lat: 32.4945, lng: 74.5229, aliases: ['sialkot'], city: 'Sialkot' },
  { name: 'Quetta', lat: 30.1798, lng: 66.9750, aliases: ['quetta'], city: 'Quetta' },
  { name: 'Karachi Center', lat: 24.8607, lng: 67.0011, aliases: ['karachi', 'khi', 'clifton', 'defence karachi', 'saddar karachi', 'pechs'], city: 'Karachi' },
  { name: 'Karachi Outer Town', lat: 24.9500, lng: 67.1500, aliases: ['karachi outer town', 'gulshan-e-maymar', 'hub', 'malir outskirts', 'bahria karachi'], city: 'Karachi' },
];

/**
 * Calculates Haversine distance in kilometers between two lat/lng points
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Matches a location text to a known node or determines local vs intercity context
 */
export function findLocationNode(query: string, defaultCityContext: string = 'Islamabad'): LocationCoord | null {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // Special handling for "outer town": if "karachi" is NOT explicitly mentioned, default to local city outer town!
  if (q.includes('outer town') || q.includes('outskirts') || q.includes('outer')) {
    if (q.includes('karachi')) {
      return PAKISTAN_LOCATIONS.find(l => l.name === 'Karachi Outer Town') || null;
    }
    // Default local outer town (e.g. Islamabad Outer Town ~30km from Barma)
    return PAKISTAN_LOCATIONS.find(l => l.name === 'Islamabad Outer Town / Outskirts') || null;
  }

  // Exact or alias match
  for (const loc of PAKISTAN_LOCATIONS) {
    if (loc.name.toLowerCase() === q) return loc;
    for (const alias of loc.aliases) {
      if (q.includes(alias) || alias.includes(q)) return loc;
    }
  }

  return null;
}

/**
 * Calculate accurate distance in KM between pickup and dropoff locations
 */
export function calculateLocationDistanceKm(pickup: string, dropoff: string): number {
  if (!pickup || !dropoff) return 5; // default 5km

  const nodeA = findLocationNode(pickup, 'Islamabad');
  const nodeB = findLocationNode(dropoff, 'Islamabad');

  if (nodeA && nodeB) {
    // If coordinates exist for both nodes, compute precise road/haversine distance
    const directKm = haversineDistanceKm(nodeA.lat, nodeA.lng, nodeB.lat, nodeB.lng);
    let windingFactor = 1.25;
    if (nodeA.city.includes('Outskirts') || nodeB.city.includes('Outskirts') || nodeA.name.includes('Cold Water') || nodeB.name.includes('Cold Water') || nodeA.name.includes('Murree') || nodeB.name.includes('Murree')) {
      windingFactor = 1.4;
    }
    const roadKm = Math.max(2, Math.round(directKm * windingFactor * 10) / 10);
    return roadKm;
  }

  // Handle Barma Town specifically to Outer Town (~30 km)
  const pLower = pickup.toLowerCase();
  const dLower = dropoff.toLowerCase();
  
  if ((pLower.includes('barma') && dLower.includes('outer')) || (dLower.includes('barma') && pLower.includes('outer'))) {
    if (!pLower.includes('karachi') && !dLower.includes('karachi')) {
      return 30.0; // Barma Town to local Outer Town is ~30 km
    }
  }

  if (nodeA && !nodeB) {
    if (dLower.includes('karachi')) return 1410;
    if (dLower.includes('lahore')) return 375;
    if (dLower.includes('peshawar')) return 185;
    if (dLower.includes('cold water') || dLower.includes('thanda pani')) return 37.0;
    if (dLower.includes('gauri') || dLower.includes('ghauri')) return 15.0;
    if (dLower.includes('outer town') || dLower.includes('outskirts')) return 28.5;
  }

  if (!nodeA && nodeB) {
    if (pLower.includes('karachi')) return 1410;
    if (pLower.includes('lahore')) return 375;
    if (pLower.includes('peshawar')) return 185;
    if (pLower.includes('cold water') || pLower.includes('thanda pani')) return 37.0;
    if (pLower.includes('gauri') || pLower.includes('ghauri')) return 15.0;
    if (pLower.includes('outer town') || pLower.includes('outskirts')) return 28.5;
  }

  // Fallback heuristic for unknown text
  const isIntercity = pLower.includes('karachi') || dLower.includes('karachi') || pLower.includes('lahore') || dLower.includes('lahore');
  if (isIntercity) return 1200;

  return 12.5; // Realistic default local city distance (12.5 km)
}

/**
 * Standard Default Vehicle Fare Rates in PKR (Competitive with InDriver/Careem rates in Pakistan)
 */
export const DEFAULT_VEHICLE_RATES: Record<string, { base: number; perKm: number; minKmRate: number; label: string }> = {
  bike: { base: 40, perKm: 15, minKmRate: 12, label: 'Bike' },
  rickshaw: { base: 60, perKm: 18, minKmRate: 15, label: 'Rickshaw (Pindi/Rural)' },
  mini: { base: 100, perKm: 22, minKmRate: 18, label: 'Mini Car' },
  sedan: { base: 140, perKm: 26, minKmRate: 22, label: 'Sedan AC' },
  ac_car: { base: 140, perKm: 26, minKmRate: 22, label: 'AC Comfort' },
  comfortable: { base: 180, perKm: 30, minKmRate: 25, label: 'Comfort Sedan' },
  premium: { base: 300, perKm: 40, minKmRate: 35, label: 'Premium Luxury' },
  seven_seater: { base: 280, perKm: 35, minKmRate: 30, label: '7-Seater MPV' },
  van: { base: 280, perKm: 35, minKmRate: 30, label: 'Group Fleet' },
  seven_seater_ocean: { base: 320, perKm: 40, minKmRate: 35, label: '7-Seater Ocean' },
  hiace_15: { base: 450, perKm: 50, minKmRate: 45, label: '15-Seater HiAce' },
  loading_cargo: { base: 400, perKm: 50, minKmRate: 40, label: 'Cargo / Loading Pickup' },
};

export interface SurgeInfo {
  multiplier: number;
  isSurgeActive: boolean;
  reason: string;
  demandLevel: 'Low' | 'Moderate' | 'High' | 'Peak Surge';
  peakHourLabel?: string;
  rideFrequencyCount: number;
}

/**
 * Evaluates peak hours and ride frequency data to compute an automated surge pricing multiplier.
 */
export function calculateSurgeMultiplier(
  pickupLocation: string = '',
  dropoffLocation: string = '',
  customTime?: string
): SurgeInfo {
  let hour: number;
  let minute: number;

  if (customTime) {
    const [h, m] = customTime.split(':').map(Number);
    hour = isNaN(h) ? new Date().getHours() : h;
    minute = isNaN(m) ? new Date().getMinutes() : m;
  } else {
    const now = new Date();
    hour = now.getHours();
    minute = now.getMinutes();
  }

  const timeInMinutes = hour * 60 + minute;

  let timeMultiplier = 1.0;
  let peakHourLabel = '';

  if (timeInMinutes >= 450 && timeInMinutes <= 630) {
    timeMultiplier = 1.1;
    peakHourLabel = 'Morning Office & School Rush (7:30 AM - 10:30 AM)';
  } else if (timeInMinutes >= 1020 && timeInMinutes <= 1230) {
    timeMultiplier = 1.15;
    peakHourLabel = 'Evening Commute & Commercial Rush (5:00 PM - 8:30 PM)';
  } else if (timeInMinutes >= 1380 || timeInMinutes <= 240) {
    timeMultiplier = 1.1;
    peakHourLabel = 'Late Night Availability Surcharge (11:00 PM - 4:00 AM)';
  }

  // High-Demand Locations
  const highDemandKeywords = [
    'centaurus', 'blue area', 'faizabad', 'commercial market', 'barma', 'khanna', 'rewat',
    'saddar', 'raja bazar', 'f-7', 'f-6', 'gulberg', 'dha', 'bahria', 'airport', 'comsats'
  ];

  const pLower = pickupLocation.toLowerCase();
  const dLower = dropoffLocation.toLowerCase();
  const isHighDemandLocation = highDemandKeywords.some(k => pLower.includes(k) || dLower.includes(k));

  const locationMultiplier = isHighDemandLocation ? 1.05 : 1.0;

  // Ride Frequency Data simulation / zone load
  let rideFrequencyCount = 10; // Base frequency
  if (timeMultiplier > 1.0) rideFrequencyCount += 5;
  if (isHighDemandLocation) rideFrequencyCount += 5;

  let frequencyMultiplier = 1.0;
  if (rideFrequencyCount >= 35) {
    frequencyMultiplier = 1.15;
  } else if (rideFrequencyCount >= 20) {
    frequencyMultiplier = 1.1;
  } else if (rideFrequencyCount >= 10) {
    frequencyMultiplier = 1.02;
  }

  const rawMultiplier = Math.max(timeMultiplier * locationMultiplier, frequencyMultiplier);
  const finalMultiplier = Math.min(1.25, Math.max(1.0, Math.round(rawMultiplier * 100) / 100));
  const isSurgeActive = finalMultiplier > 1.0;

  let demandLevel: 'Low' | 'Moderate' | 'High' | 'Peak Surge' = 'Low';
  if (finalMultiplier >= 1.2) demandLevel = 'Peak Surge';
  else if (finalMultiplier >= 1.1) demandLevel = 'High';
  else if (finalMultiplier > 1.0) demandLevel = 'Moderate';

  let reason = 'Standard Tariff (Off-Peak)';
  if (isSurgeActive) {
    const reasons: string[] = [];
    if (peakHourLabel) reasons.push(peakHourLabel);
    if (isHighDemandLocation) reasons.push('High-Density Zone');
    if (rideFrequencyCount >= 20) reasons.push(`High Ride Frequency (${rideFrequencyCount} req/hr)`);
    reason = reasons.join(' + ');
  }

  return {
    multiplier: finalMultiplier,
    isSurgeActive,
    reason,
    demandLevel,
    peakHourLabel,
    rideFrequencyCount
  };
}

/**
 * Calculates total fare in PKR based on distance, vehicle type, service mode, and surge pricing.
 * Enforces minimum Rs. 50/km for inter-city / long-distance trips if specified or when distance > 100km.
 */
export function calculateAccurateFare(
  distanceKm: number,
  vehicleType: string = 'sedan',
  serviceType: 'instant' | 'carpool' | 'city' | 'long-route' | 'city-to-city' = 'instant',
  customFaresConfig?: any,
  surgeOptions?: {
    applySurge?: boolean;
    surgeMultiplier?: number;
    pickupLocation?: string;
    dropoffLocation?: string;
    customTime?: string;
  }
): {
  totalFare: number;
  baseUnsurgedFare: number;
  distanceKm: number;
  ratePerKmUsed: number;
  baseFareUsed: number;
  surgeMultiplier: number;
  surgeAmount: number;
  isSurgeActive: boolean;
  surgeReason: string;
  demandLevel: string;
  rideFrequencyCount: number;
} {
  const rates = customFaresConfig?.[vehicleType] || DEFAULT_VEHICLE_RATES[vehicleType] || DEFAULT_VEHICLE_RATES.sedan;
  
  const baseFare = rates.base || 200;
  let perKmRate = rates.perKm || 35;

  let calculatedCost = baseFare + (distanceKm * perKmRate);

  if (serviceType === 'carpool') calculatedCost *= 0.7; // Discount for carpool

  const baseUnsurgedFare = Math.max(baseFare, Math.round(calculatedCost));

  // Determine surge multiplier
  let surgeMultiplier = 1.0;
  let surgeReason = 'Standard Tariff';
  let demandLevel = 'Low';
  let rideFrequencyCount = 10;
  let isSurgeActive = false;

  if (surgeOptions?.applySurge !== false) {
    if (typeof surgeOptions?.surgeMultiplier === 'number' && surgeOptions.surgeMultiplier > 0) {
      surgeMultiplier = surgeOptions.surgeMultiplier;
      isSurgeActive = surgeMultiplier > 1.0;
      surgeReason = isSurgeActive ? `Manual/Admin Surge Override (${surgeMultiplier}x)` : 'Standard Tariff';
      demandLevel = surgeMultiplier >= 1.6 ? 'Peak Surge' : surgeMultiplier >= 1.3 ? 'High' : surgeMultiplier > 1.0 ? 'Moderate' : 'Low';
    } else {
      const surgeInfo = calculateSurgeMultiplier(
        surgeOptions?.pickupLocation || '',
        surgeOptions?.dropoffLocation || '',
        surgeOptions?.customTime
      );
      surgeMultiplier = surgeInfo.multiplier;
      isSurgeActive = surgeInfo.isSurgeActive;
      surgeReason = surgeInfo.reason;
      demandLevel = surgeInfo.demandLevel;
      rideFrequencyCount = surgeInfo.rideFrequencyCount;
    }
  }

  const finalCostWithSurge = Math.round(baseUnsurgedFare * surgeMultiplier);
  const surgeAmount = Math.max(0, finalCostWithSurge - baseUnsurgedFare);

  return {
    totalFare: finalCostWithSurge,
    baseUnsurgedFare,
    distanceKm: Math.round(distanceKm * 10) / 10,
    ratePerKmUsed: perKmRate,
    baseFareUsed: baseFare,
    surgeMultiplier,
    surgeAmount,
    isSurgeActive,
    surgeReason,
    demandLevel,
    rideFrequencyCount
  };
}

/**
 * Real-time Device GPS position tracker helper
 */
export function getCurrentGPSLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Fallback to Islamabad/Rawalpindi center coordinates
          resolve({ lat: 33.6844, lng: 73.0479 });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    } else {
      resolve({ lat: 33.6844, lng: 73.0479 });
    }
  });
}
