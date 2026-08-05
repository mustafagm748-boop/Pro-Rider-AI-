import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Mic, X, Zap, Users, Check, Clock, Calendar, Calculator, Sparkles, Navigation, History } from 'lucide-react';
import { voiceService } from '../lib/voice';
import { Language } from '../types';
import { calculateLocationDistanceKm, calculateAccurateFare, findLocationNode } from '../lib/locationService';

interface BookingFormProps {
  onClose?: () => void;
  language: Language;
  onSave: (data: any) => void;
  initialMode?: 'instant' | 'carpool';
  hasActiveRide?: boolean;
}

export default function BookingForm({ onClose, language, onSave, initialMode = 'instant', hasActiveRide = false }: BookingFormProps) {
  const [formType, setFormType] = useState<'instant' | 'carpool'>(initialMode);
  
  // Locations
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  
  // Recent Locations State
  const [recentLocations, setRecentLocations] = useState<string[]>(() => {
    const saved = localStorage.getItem('prorider_recent_locations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      'Barma Town, Islamabad',
      'Centaurus Mall, Islamabad',
      'Faizabad, Rawalpindi',
      'Bahria Town Phase 8, Rawalpindi',
      'G-9 Markaz, Islamabad',
      'F-7 Markaz, Islamabad',
      'Blue Area, Islamabad',
      'Saddar, Rawalpindi',
      'DHA Phase 2, Islamabad',
      'Comsats University, Islamabad'
    ];
  });
  const [activeDropdown, setActiveDropdown] = useState<'pickup' | 'dropoff' | null>(null);
  
  // Carpool Times & Days
  const [pickupTime, setPickupTime] = useState('08:00');
  const [dropoffTime, setDropoffTime] = useState('17:00');
  const [selectedDaysOption, setSelectedDaysOption] = useState<'22' | '26' | '30' | '10' | '5'>('22');
  
  // Carpool Distance (Daily Round-Trip in KM)
  const [dailyKm, setDailyKm] = useState<number>(10);

  const isUrdu = language === 'ur';

  // Dynamic vehicle fares configuration synced from Admin Panel/Firestore
  const faresConfig = React.useMemo(() => {
    const saved = localStorage.getItem('prorider_vehicle_fares');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.bike && parsed.bike.base < 300) {
          return parsed;
        }
      } catch (e) {}
    }
    return {
      bike: { base: 50, perKm: 18, label: 'Bike' },
      rickshaw: { base: 70, perKm: 22, label: 'Rickshaw (Pindi/Rural)' },
      mini: { base: 120, perKm: 25, label: 'Mini Car' },
      sedan: { base: 150, perKm: 28, label: 'Sedan AC' },
      comfortable: { base: 200, perKm: 32, label: 'Comfort Sedan' },
      premium: { base: 350, perKm: 45, label: 'Premium Luxury' },
      seven_seater: { base: 300, perKm: 40, label: '7-Seater MPV' },
      seven_seater_ocean: { base: 350, perKm: 45, label: '7-Seater Ocean' },
      hiace_15: { base: 500, perKm: 60, label: '15-Seater HiAce/Cabin' },
      loading_cargo: { base: 450, perKm: 55, label: 'Cargo / Loading Pickup' },
    };
  }, []);

  // Selected Fleet
  const [fleetType, setFleetType] = useState<'bike' | 'rickshaw' | 'mini' | 'ac_car' | 'van'>('mini');
  const [customFare, setCustomFare] = useState<number | null>(null);

  // Auto-estimate distance based on pickup and dropoff locations if typed
  React.useEffect(() => {
    if (!pickup || !dropoff) return;
    const computedKm = calculateLocationDistanceKm(pickup, dropoff);
    const mappedType = fleetType === 'ac_car' ? 'sedan' : fleetType === 'van' ? 'seven_seater' : fleetType;
    const calc = calculateAccurateFare(computedKm, mappedType as any, 'instant', faresConfig);
    setCustomFare(calc.totalFare);
  }, [pickup, dropoff, fleetType, formType, faresConfig]);

  React.useEffect(() => {
    voiceService.speak(isUrdu ? 'سواری بک کریں' : 'Book Ride', isUrdu ? 'ur-PK' : 'en-US');
  }, []);

  React.useEffect(() => {
    if (!pickup || !dropoff) return;
    const computedKm = calculateLocationDistanceKm(pickup, dropoff);
    setDailyKm(computedKm);
  }, [pickup, dropoff]);
  
  const [isListening, setIsListening] = useState<'pickup' | 'dropoff' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available fleets with rate per KM and instant base fare loaded dynamically
  const fleetOptions = [
    { 
      id: 'bike', 
      icon: '🏍️', 
      name: isUrdu ? 'بائیک' : 'Bike', 
      ratePerKm: faresConfig.bike?.perKm || 18,
      instantFare: faresConfig.bike?.base || 50,
      desc: isUrdu ? 'سستی اور تیز ترین سواری' : 'Economical Single Seat' 
    },
    { 
      id: 'rickshaw', 
      icon: '🛺', 
      name: isUrdu ? 'ریکشہ' : 'Rickshaw', 
      ratePerKm: faresConfig.rickshaw?.perKm || 22,
      instantFare: faresConfig.rickshaw?.base || 70,
      desc: isUrdu ? 'لوکل سفر کے لیے بہترین' : 'Convenient Local' 
    },
    { 
      id: 'mini', 
      icon: '🚗', 
      name: isUrdu ? 'منی کار' : 'Car Mini', 
      ratePerKm: faresConfig.mini?.perKm || 25,
      instantFare: faresConfig.mini?.base || 120,
      desc: isUrdu ? 'معیاری بجٹ گاڑی' : 'Standard Economy' 
    },
    { 
      id: 'ac_car', // maps to sedan
      icon: '🚘', 
      name: isUrdu ? 'ای سی کمفرٹ' : 'AC Comfort', 
      ratePerKm: faresConfig.sedan?.perKm || 28,
      instantFare: faresConfig.sedan?.base || 150,
      desc: isUrdu ? 'کمفرٹ سڈان اے سی' : 'Comfort Sedan' 
    },
    { 
      id: 'premium', 
      icon: '🚙', 
      name: isUrdu ? 'پریمیم لگژری' : 'Premium Luxury', 
      ratePerKm: faresConfig.premium?.perKm || 45,
      instantFare: faresConfig.premium?.base || 350,
      desc: isUrdu ? 'وی آئی پی سفر کے لیے' : 'VIP Travel' 
    },
    { 
      id: 'van', // maps to seven_seater
      icon: '🚐', 
      name: isUrdu ? 'فلیٹ وین' : 'Group Fleet', 
      ratePerKm: faresConfig.seven_seater?.perKm || 40,
      instantFare: faresConfig.seven_seater?.base || 300,
      desc: isUrdu ? 'گروپ یا تعلیمی اداروں کے لیے' : 'Group & Executive' 
    },
    { 
      id: 'seven_seater_ocean', 
      icon: '🚌', 
      name: isUrdu ? 'سیون سیٹر اوشین' : '7-Seater Ocean', 
      ratePerKm: faresConfig.seven_seater_ocean?.perKm || 45,
      instantFare: faresConfig.seven_seater_ocean?.base || 350,
      desc: isUrdu ? 'زیادہ آرام دہ گروپ سفر' : 'Comfort Group' 
    },
    { 
      id: 'hiace_15', 
      icon: '🚌', 
      name: isUrdu ? '15-سیٹر ہائی ایس' : '15-Seater HiAce', 
      ratePerKm: faresConfig.hiace_15?.perKm || 60,
      instantFare: faresConfig.hiace_15?.base || 500,
      desc: isUrdu ? 'بڑے گروپ کے لیے' : 'Large Group' 
    },
    { 
      id: 'loading_cargo', 
      icon: '🚚', 
      name: isUrdu ? 'کارگو پک اپ' : 'Cargo Pickup', 
      ratePerKm: faresConfig.loading_cargo?.perKm || 55,
      instantFare: faresConfig.loading_cargo?.base || 450,
      desc: isUrdu ? 'سامان کی منتقلی' : 'Goods Transfer' 
    }
  ];

  // AUTOMATIC BUDGET CALCULATION FORMULA:
  // Total KM = Daily KM * Days Selected
  // Raw Cost = Total KM * Rate per KM
  // Budget is strictly clamped between Minimum Rs. 15,000 and Maximum Rs. 50,000
  const activeFleet = fleetOptions.find(f => f.id === fleetType) || fleetOptions[2];
  const travelDaysCount = parseInt(selectedDaysOption, 10) || 22;
  const totalMonthlyKm = dailyKm * travelDaysCount;
  const rawCalculatedCost = totalMonthlyKm * activeFleet.ratePerKm;
  
  // Clamped Budget (Min 15,000 - Max 50,000)
  const finalBudget = Math.min(50000, Math.max(15000, Math.round(rawCalculatedCost)));

  const handleVoiceInput = async (field: 'pickup' | 'dropoff') => {
    setIsListening(field);
    try {
      const text = await voiceService.listen();
      if (field === 'pickup') setPickup(text);
      if (field === 'dropoff') setDropoff(text);
      voiceService.speak(isUrdu ? "مقام ریکارڈ ہو گیا" : "Location captured.");
    } catch (err) {
      console.warn("Voice input notice:", err);
    } finally {
      setIsListening(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const computedKm = calculateLocationDistanceKm(pickup, dropoff);
    const mappedType = fleetType === 'ac_car' ? 'sedan' : fleetType === 'van' ? 'seven_seater' : fleetType;
    const instantFareCalc = calculateAccurateFare(computedKm, mappedType as any, 'instant', faresConfig);

    const nodeA = findLocationNode(pickup);
    const nodeB = findLocationNode(dropoff);

    const bookingData = formType === 'instant' ? {
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      pickupCoords: nodeA ? { lat: nodeA.lat, lng: nodeA.lng } : null,
      dropoffCoords: nodeB ? { lat: nodeB.lat, lng: nodeB.lng } : null,
      serviceType: 'instant',
      vehicleType: mappedType,
      vehicleName: activeFleet.name,
      fare: customFare || instantFareCalc.totalFare,
      distance: `${computedKm} km`,
      status: 'pending',
      createdAt: Date.now(),
    } : {
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      pickupCoords: nodeA ? { lat: nodeA.lat, lng: nodeA.lng } : null,
      dropoffCoords: nodeB ? { lat: nodeB.lat, lng: nodeB.lng } : null,
      pickupTime,
      dropoffTime,
      travelDays: travelDaysCount,
      dailyKm: computedKm,
      totalMonthlyKm,
      ratePerKm: activeFleet.ratePerKm,
      serviceType: 'carpool',
      vehicleType: fleetType,
      vehicleName: activeFleet.name,
      fare: finalBudget,
      distance: `${computedKm} km`,
      status: 'admin_pending_carpool',
      carpoolRightsStatus: 'pending',
      createdAt: Date.now(),
    };

    const updatedLocations = Array.from(new Set([pickup, dropoff, ...recentLocations])).filter(Boolean).slice(0, 15);
    setRecentLocations(updatedLocations);
    localStorage.setItem('prorider_recent_locations', JSON.stringify(updatedLocations));

    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      }).catch(() => null);

      onSave(bookingData);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-[20px] sm:rounded-3xl p-2.5 sm:p-6 w-full shadow-2xl space-y-2.5 sm:space-y-4 relative border-2 sm:border-4 border-black my-auto overflow-y-auto max-h-[92vh] box-border"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1 text-[10px] font-black uppercase text-yellow-600 tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'پرو رائڈر فلیٹ' : 'Pro Rider Fleet'}</span>
          </div>
          <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-black mt-0.5">
            {isUrdu ? 'سواری بک کریں' : 'Book Ride'}
          </h3>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="p-2 sm:p-2.5 bg-gray-100 hover:bg-black hover:text-yellow-400 text-gray-700 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 sm:w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-lg sm:rounded-2xl border border-gray-200">
        <button
          type="button"
          onClick={() => setFormType('instant')}
          className={`py-1.5 sm:py-3 px-2 rounded-md sm:rounded-xl text-left transition-all ${
            formType === 'instant' 
              ? 'bg-black text-yellow-400 shadow-md' 
              : 'text-gray-600 hover:text-black'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
              {isUrdu ? 'فوری سواری' : 'Instant Ride'}
            </span>
          </div>
          <p className="text-[9px] text-gray-400 font-medium mt-0.5 leading-none">
            {isUrdu ? 'ابھی بک کریں، ابھی جائیں' : 'Book Now, Go Now'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFormType('carpool')}
          className={`py-1.5 sm:py-3 px-2 rounded-md sm:rounded-xl text-left transition-all ${
            formType === 'carpool' 
              ? 'bg-black text-yellow-400 shadow-md' 
              : 'text-gray-600 hover:text-black'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
              {isUrdu ? 'ماہانہ کارپول' : 'Monthly Carpool'}
            </span>
          </div>
          <p className="text-[9px] text-gray-400 font-medium mt-0.5 leading-none">
            {isUrdu ? 'ماہانہ یا روزانہ پیکج' : 'Monthly / Daily Subscription'}
          </p>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        
        {/* FARE ADJUSTMENT FOR INSTANT RIDE */}
        {formType === 'instant' && (
          <div className="bg-yellow-50 p-2 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-yellow-400/50 space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-yellow-700" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-yellow-800">
                  {isUrdu ? 'آپ کا کرایہ' : 'Your Offer'}
                </span>
              </div>
              <div className="bg-black text-yellow-400 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                Est. Rs. {calculateAccurateFare(calculateLocationDistanceKm(pickup, dropoff), fleetType === 'ac_car' ? 'sedan' : fleetType === 'van' ? 'seven_seater' : fleetType as any, 'instant', faresConfig).totalFare}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setCustomFare(prev => Math.max(50, (prev || 0) - 10))}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white border-2 border-yellow-400 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-base active:scale-90 transition-all"
              >
                -
              </button>
              <input 
                type="number"
                value={customFare || ''}
                onChange={(e) => setCustomFare(parseInt(e.target.value, 10))}
                className="flex-1 bg-white border-2 border-black rounded-lg sm:rounded-xl py-1.5 px-2 text-center font-black text-base focus:ring-2 focus:ring-yellow-400 outline-none"
                placeholder="Fare"
              />
              <button 
                type="button"
                onClick={() => setCustomFare(prev => (prev || 0) + 10)}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white border-2 border-yellow-400 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-base active:scale-90 transition-all"
              >
                +
              </button>
            </div>
            <p className="text-[8px] sm:text-[9px] text-yellow-700 font-bold text-center uppercase tracking-widest">
              {isUrdu ? 'بارگین ہو سکتا ہے' : 'Drivers can bargain'}
            </p>
          </div>
        )}

        {/* PICK-UP LOCATION */}
        <div className="space-y-0.5 relative">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">
              {isUrdu ? 'پک اپ کا مقام' : 'Pick-up Location'} *
            </label>
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'pickup' ? null : 'pickup')}
              className="text-[9px] font-black uppercase tracking-wider text-yellow-600 hover:text-yellow-700 flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200"
            >
              <History className="w-3 h-3" />
              <span>{isUrdu ? 'حالیہ' : 'Recent'}</span>
            </button>
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600" />
            <input
              type="text"
              value={pickup}
              onChange={(e) => {
                setPickup(e.target.value);
                setActiveDropdown('pickup');
              }}
              onFocus={() => setActiveDropdown('pickup')}
              className="w-full pl-9 sm:pl-11 pr-20 sm:pr-24 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold text-black focus:border-yellow-400 focus:bg-white outline-none transition-all"
              placeholder={isUrdu ? 'پک اپ ایڈریس لکھیں' : 'Enter pick-up address'}
              required
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleVoiceInput('pickup')}
                className={`p-1.5 rounded-lg transition-all ${
                  isListening === 'pickup' ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Voice Input"
              >
                <Mic className="w-3 h-3 sm:w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'pickup' ? null : 'pickup')}
                className="p-1.5 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-all"
                title="Recent Locations"
              >
                <History className="w-3 h-3 sm:w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* RECENT LOCATIONS DROPDOWN */}
          {activeDropdown === 'pickup' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-black rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto p-2 space-y-1"
            >
              <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100">
                <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-yellow-600" />
                  {isUrdu ? 'حالیہ مقامات (تاریخچہ)' : 'Recent Locations'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(null)}
                  className="text-[9px] text-gray-400 hover:text-black font-bold"
                >
                  Close
                </button>
              </div>
              {recentLocations
                .filter(loc => !pickup || loc.toLowerCase().includes(pickup.toLowerCase()))
                .map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPickup(loc);
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-gray-800 hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-2 group"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 group-hover:text-black shrink-0" />
                    <span className="truncate">{loc}</span>
                  </button>
                ))}
            </motion.div>
          )}
        </div>

        {/* DROP-OFF LOCATION */}
        <div className="space-y-0.5 relative">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">
              {isUrdu ? 'ڈراپ آف مقام' : 'Drop-off Location'} *
            </label>
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'dropoff' ? null : 'dropoff')}
              className="text-[9px] font-black uppercase tracking-wider text-yellow-600 hover:text-yellow-700 flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200"
            >
              <History className="w-3 h-3" />
              <span>{isUrdu ? 'حالیہ' : 'Recent'}</span>
            </button>
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-600" />
            <input
              type="text"
              value={dropoff}
              onChange={(e) => {
                setDropoff(e.target.value);
                setActiveDropdown('dropoff');
              }}
              onFocus={() => setActiveDropdown('dropoff')}
              className="w-full pl-9 sm:pl-11 pr-20 sm:pr-24 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold text-black focus:border-yellow-400 focus:bg-white outline-none transition-all"
              placeholder={isUrdu ? 'منزل کا ایڈریس لکھیں' : 'Enter drop-off destination'}
              required
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleVoiceInput('dropoff')}
                className={`p-1.5 rounded-lg transition-all ${
                  isListening === 'dropoff' ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Voice Input"
              >
                <Mic className="w-3 h-3 sm:w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'dropoff' ? null : 'dropoff')}
                className="p-1.5 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-all"
                title="Recent Locations"
              >
                <History className="w-3 h-3 sm:w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* RECENT LOCATIONS DROPDOWN */}
          {activeDropdown === 'dropoff' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-black rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto p-2 space-y-1"
            >
              <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100">
                <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-yellow-600" />
                  {isUrdu ? 'حالیہ مقامات (تاریخچہ)' : 'Recent Locations'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(null)}
                  className="text-[9px] text-gray-400 hover:text-black font-bold"
                >
                  Close
                </button>
              </div>
              {recentLocations
                .filter(loc => !dropoff || loc.toLowerCase().includes(dropoff.toLowerCase()))
                .map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDropoff(loc);
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-gray-800 hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-2 group"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-600 group-hover:text-black shrink-0" />
                    <span className="truncate">{loc}</span>
                  </button>
                ))}
            </motion.div>
          )}
        </div>

        {/* CARPOOL SPECIFIC FIELDS: Pick-up Time, Drop-off Time, Travel Days, Distance & Calculation */}
        {formType === 'carpool' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-2 border-t-2 border-dashed border-gray-200"
          >
            {/* Pick-up Time & Drop-off Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 ml-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-yellow-600" />
                  <span>{isUrdu ? 'پک اپ کا وقت' : 'Pick-up Time'}</span>
                </label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-xs font-bold text-black focus:border-yellow-400 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 ml-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-red-600" />
                  <span>{isUrdu ? 'ڈراپ آف وقت' : 'Drop-off Time'}</span>
                </label>
                <input
                  type="time"
                  value={dropoffTime}
                  onChange={(e) => setDropoffTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-xs font-bold text-black focus:border-yellow-400 outline-none"
                  required
                />
              </div>
            </div>

            {/* Travel Days Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 ml-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-black" />
                <span>{isUrdu ? 'سفر کے دن (ماہانہ)' : 'Travel Days (Monthly)'}</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: '22', label: isUrdu ? '5 دن/ہفتہ (22 دن)' : '5 Days (22d)' },
                  { id: '26', label: isUrdu ? '6 دن/ہفتہ (26 دن)' : '6 Days (26d)' },
                  { id: '30', label: isUrdu ? '7 دن/ہفتہ (30 دن)' : 'Full (30d)' },
                  { id: '10', label: isUrdu ? '10 دن' : '10 Days' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDaysOption(d.id as any)}
                    className={`py-2 px-1.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                      selectedDaysOption === d.id 
                        ? 'bg-yellow-400 text-black border-yellow-500 shadow-sm' 
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Route Distance Slider / Input */}
            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-gray-700 uppercase flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-yellow-600" />
                  {isUrdu ? 'روزانہ کا فاصلہ (کلومیٹر)' : 'Daily Round-Trip Distance'}
                </span>
                <span className="text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-lg border border-yellow-300">
                  {dailyKm} km / day
                </span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="60" 
                step="1"
                value={dailyKm}
                onChange={(e) => setDailyKm(parseInt(e.target.value, 10))}
                className="w-full accent-black cursor-pointer"
              />
              <p className="text-[10px] text-gray-500 font-medium">
                {isUrdu 
                  ? `${dailyKm} کلومیٹر x ${travelDaysCount} دن = ${totalMonthlyKm} کلومیٹر کل ماہانہ سفر`
                  : `Monthly Total: ${dailyKm} km/day × ${travelDaysCount} days = ${totalMonthlyKm} Total KM`}
              </p>
            </div>
          </motion.div>
        )}

        {/* FLOATING SELECTABLE FLEET CARDS */}
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-wider text-gray-500 ml-1">
            {isUrdu ? 'گاڑی اور فلیٹ کی قسم منتخب کریں' : 'Choose Vehicle Fleet'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
            {fleetOptions.map((f) => {
              const isSelected = fleetType === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFleetType(f.id as any)}
                  className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 text-left transition-all flex flex-col justify-between relative overflow-hidden ${
                    isSelected
                      ? 'bg-black text-yellow-400 border-black shadow-lg scale-[1.01]'
                      : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-base sm:text-xl">{f.icon}</span>
                    {isSelected && <Check className="w-3 h-3 sm:w-4 h-4 text-yellow-400" />}
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-xs font-black uppercase leading-tight">{f.name}</p>
                    {formType === 'carpool' ? (
                      <p className={`text-[8px] sm:text-[10px] font-black mt-0.5 ${isSelected ? 'text-yellow-400' : 'text-gray-900'}`}>
                        Rs. {f.ratePerKm}/km
                      </p>
                    ) : (
                      <p className={`text-[8px] sm:text-[10px] font-black mt-0.5 ${isSelected ? 'text-yellow-400' : 'text-gray-900'}`}>
                        Est. Rs. {f.instantFare}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* AUTOMATIC BUDGET SUMMARY BOX FOR CARPOOLING */}
        {formType === 'carpool' && (
          <div className="bg-yellow-400 text-black p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-black space-y-1 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Calculator className="w-3 h-3 text-black" />
                <span className="text-[9px] font-black uppercase tracking-wider">
                  {isUrdu ? 'خودکار ماہانہ بجٹ' : 'Auto-Calculated Budget'}
                </span>
              </div>
              <span className="text-[9px] font-black bg-black text-yellow-400 px-1.5 py-0.5 rounded-lg">
                Rs. {finalBudget.toLocaleString()} / month
              </span>
            </div>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-center w-full pt-0">
          <button
            type="submit"
            disabled={isSubmitting || !pickup || !dropoff || hasActiveRide}
            className={`w-full py-2 sm:py-3.5 rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-[9px] sm:text-xs transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 border-2 ${
              hasActiveRide 
                ? 'bg-gray-400 border-gray-500 text-gray-200 cursor-not-allowed' 
                : 'bg-yellow-400 hover:bg-yellow-500 border-black text-black'
            }`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <Zap className={`w-3.5 h-3.5 ${hasActiveRide ? 'text-gray-200' : 'text-black'}`} />
                <span className="whitespace-nowrap">
                  {hasActiveRide 
                    ? (isUrdu ? 'پہلے سے جاری سواری' : 'Active Ride Active')
                    : formType === 'instant' 
                      ? (isUrdu ? 'فوری سواری بک کریں' : 'Book Instant Ride') 
                      : (isUrdu ? `بک کار پولنگ` : `Book Car Pooling`)}
                </span>
              </div>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
