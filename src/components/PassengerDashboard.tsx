import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, Wallet, MapPin, Sparkles, Navigation, X, Clock, AlertTriangle, Phone, PhoneCall, Shield, ArrowRight, RefreshCw, Calculator, ChevronRight, Star, ThumbsUp, CheckCircle2, MessageSquare } from 'lucide-react';
import { UserProfile, DriverProfile, Language, Theme, Ride } from '../types';
import BookingForm from './BookingForm';
import FareCalculator from './FareCalculator';
import { RideTrackingView } from './RideTrackingView';
import { updateRideInFirestore } from '../lib/firestoreService';
import { voiceService } from '../lib/voice';
import { MapView } from './MapView';

interface PassengerDashboardProps {
  user: UserProfile;
  language: Language;
  theme: Theme;
  walletBalance: number;
  activeRides?: Ride[];
  availableDrivers?: DriverProfile[];
  activePassengerRide?: Ride | null;
  onBookRide?: (rideData: any) => void;
  onCancelRide?: (rideId: string) => void;
  onNavigate?: (tab: string) => void;
  onAcceptOffer?: (rideId: string, offer: any) => void;
  onStartCall?: (rideId: string, role: 'driver' | 'passenger') => void;
}

export default function PassengerDashboard({
  user,
  language,
  theme,
  walletBalance,
  activeRides = [],
  availableDrivers = [],
  activePassengerRide: propsActivePassengerRide = null,
  onBookRide,
  onCancelRide,
  onNavigate,
  onAcceptOffer,
  onStartCall,
}: PassengerDashboardProps) {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showFareCalcModal, setShowFareCalcModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [trackingRide, setTrackingRide] = useState<Ride | null>(null);
  const [isDismissedActiveCard, setIsDismissedActiveCard] = useState(false);
  const [cancellingRideId, setCancellingRideId] = useState<string | null>(null);

  // Feedback & Rating state for completed rides
  const [completedRideToRate, setCompletedRideToRate] = useState<Ride | null>(null);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [selectedQuickTags, setSelectedQuickTags] = useState<string[]>([]);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState<boolean>(false);
  const [ratingSubmittedSuccess, setRatingSubmittedSuccess] = useState<boolean>(false);

  // Rated ride IDs saved in localStorage
  const [ratedRideIds, setRatedRideIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('prorider_rated_ride_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Watch activeRides for rides updated to 'completed' belonging to this passenger that haven't been rated yet
  useEffect(() => {
    if (!activeRides || activeRides.length === 0) return;

    const completedRide = activeRides.find(r => 
      (r.passengerId === user.id || r.passengerPhone === user.phone) &&
      r.status === 'completed' &&
      !ratedRideIds.includes(r.id) &&
      !r.passengerRating
    );

    if (completedRide && (!completedRideToRate || completedRideToRate.id !== completedRide.id)) {
      setTrackingRide(null); // Instantly dismiss tracking screen to reveal mandatory rating overlay
      setCompletedRideToRate(completedRide);
      setRatingStars(5);
      setFeedbackComment('');
      setSelectedQuickTags([]);
      setRatingSubmittedSuccess(false);
    }
  }, [activeRides, user.id, user.phone, ratedRideIds, completedRideToRate]);

  const handleToggleTag = (tag: string) => {
    if (selectedQuickTags.includes(tag)) {
      setSelectedQuickTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedQuickTags(prev => [...prev, tag]);
    }
  };

  const handleSkipRating = () => {
    if (completedRideToRate) {
      const updatedRated = [...ratedRideIds, completedRideToRate.id];
      setRatedRideIds(updatedRated);
      try {
        localStorage.setItem('prorider_rated_ride_ids', JSON.stringify(updatedRated));
      } catch (e) {}
    }
    setCompletedRideToRate(null);
  };

  const handleSubmitRating = async () => {
    if (!completedRideToRate) return;
    setIsRatingSubmitting(true);

    const fullComment = [
      feedbackComment.trim(),
      selectedQuickTags.length > 0 ? `[${selectedQuickTags.join(', ')}]` : ''
    ].filter(Boolean).join(' ');

    try {
      await updateRideInFirestore(completedRideToRate.id, {
        driverRating: ratingStars,
        passengerRating: ratingStars,
        passengerComment: fullComment,
        ratedAt: Date.now()
      });
    } catch (e) {
      console.warn('Could not update ride rating in Firestore:', e);
    }

    const updatedRated = [...ratedRideIds, completedRideToRate.id];
    setRatedRideIds(updatedRated);
    try {
      localStorage.setItem('prorider_rated_ride_ids', JSON.stringify(updatedRated));
    } catch (e) {}

    setIsRatingSubmitting(false);
    setRatingSubmittedSuccess(true);

    try {
      if (voiceService && typeof voiceService.speak === 'function') {
        voiceService.speak(
          language === 'ur' 
            ? "درجہ بندی دینے کا بہت شکریہ!" 
            : "Thank you for rating your driver!"
        );
      }
    } catch (e) {}

    setTimeout(() => {
      setCompletedRideToRate(null);
      setRatingSubmittedSuccess(false);
    }, 1600);
  };

  const isUrdu = language === 'ur';

  // Filter rides relevant to current user
  const userActiveRides = (activeRides || []).filter(
    r => (r.passengerId === user.id || r.passengerPhone === user.phone) && 
         ['pending', 'driver_offered', 'passenger_approved', 'accepted', 'arrived', 'ongoing', 'driver_pending_admin'].includes(r.status) &&
         r.serviceType !== 'carpool' && r.serviceType !== 'monthly'
  );

  const currentActiveRide = propsActivePassengerRide || (userActiveRides.length > 0 ? userActiveRides[0] : null);

  const handleCancelClick = async (rideId: string) => {
    setCancellingRideId(rideId);
    try {
      if (onCancelRide) {
        await onCancelRide(rideId);
      }
    } finally {
      setCancellingRideId(null);
      setTrackingRide(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'driver_offered':
        return {
          label: isUrdu ? 'ڈرائیور کی آفرز چیک کریں' : 'Check Captain Offers...',
          color: 'bg-amber-100 text-amber-800 border-amber-300'
        };
      case 'driver_pending_admin':
        return {
          label: isUrdu ? 'ایڈمن کی منظوری کا انتظار' : 'Awaiting Admin Approval',
          color: 'bg-orange-100 text-orange-800 border-orange-300 animate-pulse'
        };
      case 'accepted':
        return {
          label: isUrdu ? 'ڈرائیور آ رہا ہے' : 'Driver on the Way',
          color: 'bg-blue-100 text-blue-800 border-blue-300'
        };
      case 'arrived':
        return {
          label: isUrdu ? 'ڈرائیور پہنچ گیا ہے' : 'Driver Arrived!',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        };
      case 'ongoing':
        return {
          label: isUrdu ? 'سفر جاری ہے' : 'Trip in Progress',
          color: 'bg-purple-100 text-purple-800 border-purple-300'
        };
      default:
        return {
          label: isUrdu ? 'سواری کی حالت' : 'Ride Active',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
    }
  };

  if (currentActiveRide && (currentActiveRide.status === 'pending' || currentActiveRide.status === 'driver_pending_admin' || currentActiveRide.status === 'driver_offered' || currentActiveRide.status === 'admin_pending_carpool')) {
    const isPendingAdmin = currentActiveRide.status === 'driver_pending_admin' || currentActiveRide.status === 'admin_pending_carpool';
    return (
      <div className={`h-full flex flex-col items-center justify-between p-6 relative overflow-hidden ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}`}>
        
        {/* Pulsing Sonar Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-96 h-96 border border-yellow-400/20 rounded-full animate-ping absolute duration-1000" />
          <div className="w-80 h-80 border-2 border-yellow-400/10 rounded-full absolute animate-pulse" />
          <div className="w-56 h-56 border border-yellow-400/30 rounded-full absolute animate-ping duration-2000" />
          <div className="w-32 h-32 bg-yellow-400/5 rounded-full absolute" />
        </div>

        {/* Top bar */}
        <div className="w-full flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-600">
              {isPendingAdmin 
                ? (isUrdu ? 'ایڈمن منظوری کا انتظار ہے' : 'Awaiting Admin Approval')
                : currentActiveRide.status === 'driver_offered'
                ? (isUrdu ? 'کپتان کی آفرز موصول ہوئیں' : 'Captain Offers Received')
                : (isUrdu ? 'قریبی سواری کی تلاش' : 'Searching for Nearest Captain')}
            </span>
          </div>
          <div className="px-3 py-1 bg-black text-yellow-400 text-[10px] font-black uppercase rounded-lg">
            Rs. {currentActiveRide.fare}
          </div>
        </div>

        {/* Center Animated Radar or Captain Offers */}
        <div className="flex flex-col items-center justify-center z-10 flex-1 my-4 w-full max-w-md overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {(!isPendingAdmin && currentActiveRide.driverFareOffers && currentActiveRide.driverFareOffers.length > 0) ? (
            <div className="w-full space-y-4">
              <div className="text-center">
                <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                  {isUrdu ? `${currentActiveRide.driverFareOffers.length} آفرز موصول ہوئیں` : `${currentActiveRide.driverFareOffers.length} Offers Received`}
                </span>
                <h2 className="text-xl font-black uppercase tracking-tight mt-2 text-yellow-500">
                  {isUrdu ? 'کپتانوں کی آفرز منتخب کریں' : 'Choose Your Captain'}
                </h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {isUrdu ? 'اپنی پسندیدہ آفر اور گاڑی کا انتخاب کریں' : 'Select your preferred fare or driver rating'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {currentActiveRide.driverFareOffers.map((offer, idx) => {
                  const diff = offer.fare - currentActiveRide.fare;
                  const isDiscount = diff < 0;
                  const isSame = diff === 0;

                  return (
                    <motion.div 
                      key={offer.driverId || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-2xl p-4 shadow-md hover:border-yellow-400 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={offer.driverSelfie || "https://images.unsplash.com/photo-1500648767791-0-dcc994a43e?w=150"} 
                          alt="Driver Selfie" 
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full border-2 border-yellow-400 object-cover shrink-0" 
                        />
                        <div className="min-w-0">
                          <h4 className="font-black text-sm uppercase text-black dark:text-white truncate">
                            {offer.driverName}
                          </h4>
                          <p className="text-[10px] font-bold text-yellow-600 flex items-center gap-1">
                            <span>★</span>
                            <span>{offer.driverRating || 4.9}</span>
                            <span className="text-gray-400 font-normal">| {offer.driverVehicle || 'Pro Vehicle'}</span>
                          </p>
                          <span className="text-[9px] text-gray-500 font-bold block truncate max-w-[180px]">
                            {offer.driverPhone}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400 font-black uppercase tracking-wider">Offered Fare</p>
                        <p className="text-base font-black text-yellow-500 font-mono">Rs. {offer.fare}</p>
                        <span className={`text-[9px] font-black uppercase block ${isDiscount ? 'text-green-500' : isSame ? 'text-gray-400' : 'text-red-500'}`}>
                          {isDiscount ? `Save Rs. ${Math.abs(diff)}` : isSame ? 'Original Fare' : `+ Rs. ${diff}`}
                        </span>
                        
                        <button
                          onClick={() => onAcceptOffer?.(currentActiveRide.id, offer)}
                          className="mt-2 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow active:scale-95 cursor-pointer"
                        >
                          {isUrdu ? 'قبول کریں' : 'Accept'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Spinning Radar */}
              <div className="relative w-44 h-44 bg-black rounded-full flex items-center justify-center shadow-2xl border-4 border-yellow-400">
                {/* Spinning Radar line */}
                <div className="absolute inset-1 rounded-full border-t-2 border-r-2 border-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
                
                {/* Pulsing Vehicle Avatar */}
                <div className="w-32 h-32 bg-yellow-400 rounded-full flex flex-col items-center justify-center p-2 text-center text-black">
                  <span className="text-4xl mb-1">
                    {currentActiveRide.vehicleType === 'bike' ? '🏍️' : 
                     currentActiveRide.vehicleType === 'rickshaw' ? '🛺' : 
                     currentActiveRide.vehicleType === 'mini' ? '🚗' : 
                     currentActiveRide.vehicleType === 'sedan' ? '🚘' : 
                     currentActiveRide.vehicleType === 'comfortable' ? '🚙' : '🚐'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider">{currentActiveRide.vehicleType}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 bg-yellow-100 text-yellow-900 border border-yellow-300 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider animate-bounce">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{isUrdu ? 'نزدیک 3-5 کپتان آن لائن موجود ہیں (1.5 km)' : '3-5 Captains Active Nearby (1.5 km)'}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-center mt-4">
                {isPendingAdmin 
                  ? (isUrdu ? 'ڈرائیور مل گیا ہے!' : 'Driver Found!') 
                  : (isUrdu ? 'ڈرائیور کی تلاش جاری ہے...' : 'Finding Your Captain...')}
              </h2>
              <p className="text-xs text-gray-500 font-bold text-center mt-2 max-w-xs uppercase tracking-wider">
                {isPendingAdmin 
                  ? (isUrdu ? `ڈرائیور ${currentActiveRide.driverName} نے درخواست قبول کی ہے۔ برائے مہربانی ایڈمن کی حتمی منظوری کے لیے ہولڈ کریں۔` : `Captain ${currentActiveRide.driverName} accepted. Please hold for Admin's final approval.`)
                  : (isUrdu ? 'آپ کے علاقے کے قریب ترین کپتانوں کو آفر بھیج دی گئی ہے۔ جیسے ہی کوئی ڈرائیور آفر کرے گا یہاں ظاہر ہوگی۔' : 'Request broadcasted to nearby captains. Offers will appear here as drivers respond.')}
              </p>
            </>
          )}
        </div>

        {/* Ride Location Summary Card */}
        <div className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-4 rounded-3xl space-y-3 z-10 shrink-0 max-w-md shadow-lg">
          <div className="w-full h-40 rounded-2xl overflow-hidden mb-2 relative z-0">
            <MapView
              pickup={currentActiveRide.pickupLocation}
              destination={currentActiveRide.dropoffLocation}
              pickupCoords={currentActiveRide.pickupCoords}
              dropoffCoords={currentActiveRide.dropoffCoords}
              showLiveVehicle={false}
              showTrafficToggle={false}
            />
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[8px] font-black uppercase text-gray-400 block tracking-widest">{isUrdu ? 'پک اپ لوکیشن' : 'Pickup Location'}</span>
              <span className="text-xs font-bold text-black dark:text-white truncate block">{currentActiveRide.pickupLocation}</span>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-gray-100 dark:border-neutral-800 pt-2.5">
            <Navigation className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[8px] font-black uppercase text-gray-400 block tracking-widest">{isUrdu ? 'منزل' : 'Dropoff Location'}</span>
              <span className="text-xs font-bold text-black dark:text-white truncate block">{currentActiveRide.dropoffLocation}</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="w-full mt-6 flex gap-4 z-10 shrink-0 max-w-md">
          <button 
            onClick={() => handleCancelClick(currentActiveRide.id)}
            disabled={cancellingRideId === currentActiveRide.id}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {cancellingRideId === currentActiveRide.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            <span>{isUrdu ? 'درخواست منسوخ کریں' : 'Cancel Request'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col p-3 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar relative ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Top Welcome Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-[9px] font-bold text-yellow-600 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            {isUrdu ? 'پرو رائڈر ڈیش بورڈ' : 'Pro Rider Dashboard'}
          </p>
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight mt-0.5">
            {user.name || (isUrdu ? 'محترم مسافر' : 'Valued Passenger')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div 
            onClick={() => onNavigate && onNavigate('wallet')}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-yellow-400 rounded-xl cursor-pointer hover:bg-gray-900 transition-all shadow-md active:scale-95"
          >
            <Wallet className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[10px] font-bold">Rs. {walletBalance}</span>
          </div>
        </div>
      </div>

      {/* ACTIVE RIDE TRACKING CARD / LIVE RIDE MONITOR */}
      {currentActiveRide && !isDismissedActiveCard && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-black text-white p-4 sm:p-5 rounded-3xl border-2 border-yellow-400 shadow-2xl relative overflow-hidden space-y-4 shrink-0"
        >
          {/* Card Top Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border ${getStatusBadge(currentActiveRide.status).color}`}>
                {getStatusBadge(currentActiveRide.status).label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded-lg">
                Rs. {currentActiveRide.fare}
              </span>
              <button 
                onClick={() => setIsDismissedActiveCard(true)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Assigned Driver Row (If Captain is assigned) */}
          {currentActiveRide.driverName ? (
            <div className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-2xl">
              <div className="flex items-center gap-3">
                <img 
                  src={currentActiveRide.driverSelfie || "https://images.unsplash.com/photo-1500648767791-0dcc994a43e?w=150"} 
                  alt="Captain Selfie" 
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full border-2 border-yellow-400 object-cover shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-black text-xs uppercase text-white truncate flex items-center gap-1.5">
                    <span>{currentActiveRide.driverName}</span>
                    <span className="text-[9px] bg-yellow-400 text-black px-1.5 py-0.2 rounded font-mono">★ 4.9</span>
                  </h4>
                  <p className="text-[10px] text-yellow-400 font-bold uppercase truncate mt-0.5">
                    {currentActiveRide.driverVehicle || 'Pro Captain Fleet'}
                  </p>
                  <p className="text-[9px] text-gray-400 font-mono truncate">
                    {currentActiveRide.driverPhone || '0300-0000000'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] text-emerald-400 font-black uppercase px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg inline-block">
                  {isUrdu ? 'کپتان فعال ہے' : 'Captain Active'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-yellow-400/10 border border-yellow-400/30 p-2.5 rounded-2xl text-[10px]">
              <span className="text-yellow-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-yellow-400" />
                {isUrdu ? 'کپتان کی آفرز کا انتظار ہے...' : 'Searching for nearest Captain...'}
              </span>
              <span className="text-[9px] text-gray-400 uppercase font-mono">
                {currentActiveRide.vehicleType}
              </span>
            </div>
          )}

          {/* Route Summary */}
          <div className="space-y-2 text-xs bg-black/40 p-2.5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-gray-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold truncate text-[11px]">{currentActiveRide.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-200 pl-0.5">
              <ArrowRight className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span className="font-bold truncate text-[11px]">{currentActiveRide.dropoffLocation}</span>
            </div>
          </div>

          {/* Bottom Action Grid */}
          <div className="flex items-center gap-2 pt-1">
            <button 
              onClick={() => handleCancelClick(currentActiveRide.id)}
              disabled={cancellingRideId === currentActiveRide.id}
              className="py-2.5 px-3 bg-red-600/90 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 border border-red-500"
            >
              {cancellingRideId === currentActiveRide.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              <span>{isUrdu ? 'منسوخ' : 'Cancel'}</span>
            </button>

            {onStartCall && (currentActiveRide.driverPhone || ['accepted', 'arrived', 'ongoing'].includes(currentActiveRide.status)) && (
              <button 
                onClick={() => onStartCall(currentActiveRide.id, 'passenger')}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md border border-emerald-400"
              >
                <PhoneCall className="w-3.5 h-3.5 animate-pulse text-yellow-300" />
                <span>{isUrdu ? 'ڈائریکٹ کال' : 'Call Captain'}</span>
              </button>
            )}

            <button 
              onClick={() => setTrackingRide(currentActiveRide)}
              className="flex-1 py-2.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 font-bold shadow-lg shadow-yellow-400/20"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'لائیو نقشہ اور ٹریک' : 'Live Tracking'}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Action Card: Book a New Ride */}
      <motion.div 
        whileHover={!currentActiveRide ? { scale: 1.005 } : {}}
        whileTap={!currentActiveRide ? { scale: 0.995 } : {}}
        onClick={() => !currentActiveRide && setShowBookingModal(true)}
        className={`text-black p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden group border-2 space-y-2 sm:space-y-3 transition-all shrink-0 ${
          currentActiveRide 
            ? 'bg-gray-200 border-gray-300 cursor-not-allowed opacity-80' 
            : 'bg-yellow-400 border-black cursor-pointer'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 sm:py-1 rounded-lg shadow-sm ${
            currentActiveRide ? 'bg-gray-400 text-gray-200' : 'bg-black text-yellow-400'
          }`}>
            {isUrdu ? 'فوری بکنگ' : 'Instant Ride'}
          </span>
          <div className={`w-7 h-7 sm:w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
            currentActiveRide ? 'bg-gray-400 text-gray-200' : 'bg-black text-yellow-400'
          }`}>
            <Car className="w-3.5 h-3.5 sm:w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-xl font-bold uppercase tracking-tight text-black truncate">
              {isUrdu ? 'نئی سواری بک کریں' : 'Book a New Ride'}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-black/70 font-bold truncate">
              {currentActiveRide 
                ? (isUrdu ? 'سواری پہلے ہی جاری ہے' : 'Active ride in progress')
                : (isUrdu ? 'اپنی لوکیشن درج کریں' : 'Set location and get pickup')}
            </p>
          </div>

          <button 
            disabled={!!currentActiveRide}
            onClick={(e) => {
              e.stopPropagation();
              if (!currentActiveRide) setShowBookingModal(true);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[8px] sm:text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap shadow-md ${
              currentActiveRide 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-black text-yellow-400 hover:bg-neutral-900 cursor-pointer'
            }`}
          >
            <span>{isUrdu ? 'بک کریں' : 'Book Now'}</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>

        <div className={`flex items-center gap-2 p-2 rounded-xl shadow-inner border ${
          currentActiveRide ? 'bg-gray-300/50 border-gray-400/20' : 'bg-white/90 border-black/10'
        }`}>
          <MapPin className={`w-3 h-3 shrink-0 ${currentActiveRide ? 'text-gray-500' : 'text-emerald-600'}`} />
          <span className={`font-bold text-[10px] truncate ${currentActiveRide ? 'text-gray-500' : 'text-gray-800'}`}>
            {isUrdu ? 'آپ کہاں جانا چاہتے ہیں؟' : 'Where would you like to go?'}
          </span>
        </div>
      </motion.div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          onClick={() => setShowFareCalcModal(true)}
          className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:border-yellow-400 transition-all group"
        >
          <div className="w-9 h-9 bg-yellow-400/20 text-yellow-700 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-yellow-400 group-hover:text-black transition-colors">
            <Calculator className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-tight">
            {isUrdu ? 'کرایہ کیلکولیٹر' : 'Fare Calculator'}
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Estimate Route</p>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('carpooling')}
          className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:border-yellow-400 transition-all group"
        >
          <div className="w-9 h-9 bg-black text-yellow-400 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Car className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-tight">
            {isUrdu ? 'کار پولنگ' : 'Car Pooling'}
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Shared Commutes</p>
        </div>
      </div>

      {/* Direct Links to History & Control Room */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-yellow-400/20 text-yellow-700 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-800 dark:text-gray-200">
              {isUrdu ? 'مکمل ریکارڈ اور سواریاں' : 'Ride History & Status'}
            </p>
            <p className="text-[10px] text-gray-400 font-medium">
              {isUrdu ? 'کنٹرول روم اور کار پولنگ میں ریکارڈ دیکھیں' : 'View detailed logs in Control Room & Carpooling'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate && onNavigate('status')}
          className="px-3 py-2 bg-black text-yellow-400 hover:bg-gray-800 rounded-xl text-[10px] font-bold uppercase transition-all shadow"
        >
          {isUrdu ? 'کھولیں' : 'Open'}
        </button>
      </div>

      {/* BOOKING FORM MODAL (with explicit X button) */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[3000] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm sm:max-w-lg my-auto max-h-[95vh] overflow-y-auto rounded-3xl bg-white relative p-0.5 shadow-2xl"
            >
              <BookingForm 
                language={language}
                hasActiveRide={!!currentActiveRide}
                onClose={() => setShowBookingModal(false)}
                onSave={(data) => {
                  if (onBookRide) onBookRide(data);
                  setShowBookingModal(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FARE CALCULATOR MODAL (with explicit X button) */}
      <AnimatePresence>
        {showFareCalcModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-white overflow-hidden relative shadow-2xl"
            >
              <div className="p-2 flex justify-end bg-gray-50 border-b border-gray-100">
                <button 
                  onClick={() => setShowFareCalcModal(false)}
                  className="p-2 text-gray-500 hover:text-black rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FareCalculator onClose={() => setShowFareCalcModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RIDE TRACKING FULL SCREEN MODAL */}
      <AnimatePresence>
        {trackingRide && (
          <div className="fixed inset-0 z-50 bg-white">
            <RideTrackingView 
              ride={trackingRide}
              language={language}
              onBack={() => setTrackingRide(null)}
              onCancelRide={(rideId) => handleCancelClick(rideId)}
              onStartCall={onStartCall}
            />
          </div>
        )}
      </AnimatePresence>

      {/* PASSENGER RECEIPT MODAL */}
      <AnimatePresence>
        {showReceiptModal && currentActiveRide && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[4000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="bg-black p-6 text-center space-y-2 relative">
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => setShowReceiptModal(false)}
                    className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    ✕
                  </button>
                </div>
                <div className="w-14 h-14 bg-yellow-400 rounded-2xl mx-auto flex items-center justify-center shadow-xl rotate-3">
                  <Shield className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-widest text-yellow-400 pt-2">
                  {isUrdu ? 'سواری کی رسید' : 'Trip Receipt'}
                </h2>
                <p className="text-[10px] font-bold text-gray-500 font-mono">#{currentActiveRide.id.toUpperCase()}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[60vh] custom-scrollbar">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{isUrdu ? 'پک اپ' : 'Pickup'}</p>
                      <p className="text-sm font-bold text-black leading-tight">{currentActiveRide.pickupLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{isUrdu ? 'منزل' : 'Destination'}</p>
                      <p className="text-sm font-bold text-black leading-tight">{currentActiveRide.dropoffLocation}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span>{isUrdu ? 'کل کرایہ' : 'Total Fare'}</span>
                    <span className="text-black font-mono">Rs. {currentActiveRide.fare}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span>{isUrdu ? 'گاڑی' : 'Vehicle'}</span>
                    <span className="text-black uppercase">{currentActiveRide.vehicleType || 'Sedan'}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{isUrdu ? 'ادائیگی کا طریقہ' : 'Payment Method'}</p>
                    <p className="text-sm font-bold text-emerald-600">{isUrdu ? 'کیش آن ڈلیوری' : 'Cash on Delivery'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => setShowReceiptModal(false)}
                  className="w-full py-4 bg-black text-yellow-400 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  {isUrdu ? 'بند کریں' : 'Close Receipt'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* DRIVER FEEDBACK & RATING MODAL */}
      <AnimatePresence>
        {completedRideToRate && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[4500] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-neutral-900 border-2 border-yellow-400 w-full max-w-md rounded-[32px] overflow-hidden flex flex-col shadow-2xl my-auto text-black dark:text-white relative"
            >
              {/* Header / Banner */}
              <div className="bg-black p-6 text-center space-y-3 relative border-b-2 border-yellow-400">
                {/* Driver Avatar with Star Badge */}
                <div className="relative w-20 h-20 mx-auto">
                  <img 
                    src={completedRideToRate.driverSelfie || "https://images.unsplash.com/photo-1500648767791-0-dcc994a43e?w=150"} 
                    alt="Driver Profile" 
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-full border-4 border-yellow-400 object-cover shadow-xl"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black p-1.5 rounded-full shadow-lg border-2 border-black flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 fill-black text-black" />
                  </div>
                </div>

                <div>
                  <span className="bg-yellow-400 text-black px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1">
                    <span>🛡️</span>
                    <span>{isUrdu ? 'لازمی درجہ بندی • سفر مکمل ہوا' : 'Mandatory Rating • Ride Completed'}</span>
                  </span>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white mt-2">
                    {isUrdu ? 'کپتان کی سروس کو ریٹ کریں' : 'Rate Your Captain\'s Service'}
                  </h3>
                  <p className="text-xs font-bold text-yellow-400 mt-0.5">
                    {completedRideToRate.driverName || (isUrdu ? 'کپتان' : 'Captain')}
                  </p>
                </div>
              </div>

              {/* Body Content */}
              {ratingSubmittedSuccess ? (
                <div className="p-8 text-center space-y-4 my-auto">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center shadow-lg"
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </motion.div>
                  <h4 className="text-xl font-black uppercase tracking-tight text-emerald-600">
                    {isUrdu ? 'رائے جمع کر دی گئی ہے!' : 'Feedback Submitted!'}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold max-w-xs mx-auto">
                    {isUrdu ? 'آپ کی رائے سے ہماری سروس بہتر بنانے میں مدد ملتی ہے۔' : 'Thank you for helping us maintain high quality service on Pro Rider.'}
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
                  
                  {/* Trip details summary tag */}
                  <div className="bg-gray-50 dark:bg-neutral-800 p-3.5 rounded-2xl border border-gray-100 dark:border-neutral-700 flex items-center justify-between text-xs font-bold">
                    <div className="min-w-0 pr-2">
                      <p className="text-[9px] uppercase font-black text-gray-400">{isUrdu ? 'روٹ' : 'Trip Route'}</p>
                      <p className="truncate text-black dark:text-white font-bold">{completedRideToRate.pickupLocation} → {completedRideToRate.dropoffLocation}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] uppercase font-black text-gray-400">{isUrdu ? 'کرایہ' : 'Fare'}</p>
                      <p className="text-yellow-600 dark:text-yellow-400 font-black font-mono">Rs. {completedRideToRate.fare}</p>
                    </div>
                  </div>

                  {/* 1-5 Star Interactive Selector */}
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {isUrdu ? 'اسٹار کا انتخاب کریں (1 سے 5)' : 'Select Rating (1 - 5 Stars)'}
                    </p>
                    
                    <div className="flex items-center justify-center gap-2 py-2">
                      {[1, 2, 3, 4, 5].map((starNum) => {
                        const active = (hoveredStar !== null ? hoveredStar : ratingStars) >= starNum;
                        return (
                          <motion.button
                            key={starNum}
                            type="button"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onMouseEnter={() => setHoveredStar(starNum)}
                            onMouseLeave={() => setHoveredStar(null)}
                            onClick={() => setRatingStars(starNum)}
                            className="p-1 cursor-pointer focus:outline-none transition-all"
                          >
                            <Star 
                              className={`w-9 h-9 transition-colors ${
                                active 
                                  ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' 
                                  : 'fill-transparent text-gray-300 dark:text-neutral-700'
                              }`} 
                            />
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Star Label */}
                    <p className="text-xs font-black uppercase text-yellow-600 tracking-wider">
                      {ratingStars === 5 && (isUrdu ? '⭐ 5 - بہترین سروس!' : '⭐ 5 - Excellent Service!')}
                      {ratingStars === 4 && (isUrdu ? '⭐ 4 - بہت اچھا' : '⭐ 4 - Very Good')}
                      {ratingStars === 3 && (isUrdu ? '⭐ 3 - مناسب' : '⭐ 3 - Average')}
                      {ratingStars === 2 && (isUrdu ? '⭐ 2 - خراب' : '⭐ 2 - Below Expectations')}
                      {ratingStars === 1 && (isUrdu ? '⭐ 1 - انتہائی خراب' : '⭐ 1 - Poor Experience')}
                    </p>
                  </div>

                  {/* Quick Tag Badges */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {isUrdu ? 'کیا چیز اچھی رہی؟' : 'What went well? (Optional)'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'punctual', en: 'Punctual 🕒', ur: 'وقت کی پابندی 🕒' },
                        { id: 'clean', en: 'Clean Vehicle 🚗', ur: 'صاف ستھری گاڑی 🚗' },
                        { id: 'safe', en: 'Safe Driver 🛡️', ur: 'محفوظ ڈرائیونگ 🛡️' },
                        { id: 'polite', en: 'Polite & Helpful 😊', ur: 'اخلاق اور تعاون 😊' },
                      ].map((tag) => {
                        const isSelected = selectedQuickTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleToggleTag(tag.id)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all border ${
                              isSelected 
                                ? 'bg-black text-yellow-400 border-black dark:bg-yellow-400 dark:text-black dark:border-yellow-400 shadow-sm' 
                                : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:border-neutral-700 hover:border-yellow-400'
                            }`}
                          >
                            {isUrdu ? tag.ur : tag.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback Text Area */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-yellow-500" />
                      <span>{isUrdu ? 'اضافی تبصرہ (اختیاری)' : 'Additional Feedback (Optional)'}</span>
                    </p>
                    <textarea 
                      rows={2}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder={isUrdu ? 'اپنا تجربہ بیان کریں...' : 'Write your experience or comments...'}
                      className="w-full p-3 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-xs font-bold focus:border-yellow-400 outline-none transition-all text-black dark:text-white"
                    />
                  </div>

                  {/* Submit buttons */}
                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={handleSubmitRating}
                      disabled={isRatingSubmitting}
                      className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer border-2 border-black"
                    >
                      {isRatingSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="w-4 h-4" />
                      )}
                      <span>{isUrdu ? 'درجہ بندی جمع کریں' : 'Submit Mandatory Rating'}</span>
                    </button>
                  </div>

                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>



    </div>
  );
}
