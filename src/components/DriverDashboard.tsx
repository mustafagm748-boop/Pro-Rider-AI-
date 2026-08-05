import { useState, useEffect, useRef } from 'react';
import { Ride, Language, Theme } from '../types';
import { MapPin, Navigation, Check, X, User, ArrowLeft, Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, Sparkles, Send, Loader2, RefreshCw, Flame, Layers, BarChart2, Users, Car, CheckCircle2, AlertTriangle, DollarSign, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapView } from './MapView';
import { ExpectedDurationDisplay } from './ExpectedDurationDisplay';
import { RideTrackingView } from './RideTrackingView';
import { DemandHeatmapView } from './DemandHeatmapView';
import { GoogleMapsStaticPreview } from './GoogleMapsStaticPreview';
import { DriverWeeklyAnalytics } from './DriverWeeklyAnalytics';
import { DriverEarningsTab } from './DriverEarningsTab';
import { DriverStatsWidget } from './DriverStatsWidget';
import { voiceService } from '../lib/voice';
import { soundService } from '../lib/sounds';
import { haversineDistanceKm, findLocationNode } from '../lib/locationService';

interface Props {
  driver: any;
  acceptedRide: Ride | null;
  activeRides: Ride[];
  onAccept: (rideId: string, proposedFare?: number) => void;
  onReject: (rideId: string) => void;
  onUpdateStatus?: (rideId: string, status: 'arrived' | 'ongoing' | 'completed') => void;
  onForceClearSeat?: () => void;
  language?: Language;
  theme?: Theme;
  pricingConfig?: any;
  onUpdateDriverSettings?: (settings: { driveMode: any, selectedCompany?: any, discountPercentage?: number, customTarget?: number }) => void;
  onCancelOffer?: (rideId: string) => void;
  ringtoneCountdown?: number;
  onStartCall?: (rideId: string, role: 'driver' | 'passenger') => void;
}

export default function DriverDashboard({ 
  driver, 
  acceptedRide, 
  onAccept, 
  onReject, 
  activeRides = [], 
  onUpdateStatus, 
  onForceClearSeat, 
  language = 'en', 
  theme = 'light',
  pricingConfig,
  onUpdateDriverSettings,
  onCancelOffer,
  ringtoneCountdown = 15,
  onStartCall
}: Props) {
  const [isOnline, setIsOnline] = useState(true);
  const [isCarConnected, setIsCarConnected] = useState(true);
  const [viewMode, setViewMode] = useState<'requests' | 'earnings' | 'analytics' | 'heatmap' | 'history'>('requests');
  const [mapDisplayMode, setMapDisplayMode] = useState<'dynamic' | 'static'>('static');
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [showBroadcastPanel, setShowBroadcastPanel] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRideDetailsModal, setShowRideDetailsModal] = useState(false);
  const [showFleetDelegationModal, setShowFleetDelegationModal] = useState(false);
  const [delegatedDriverName, setDelegatedDriverName] = useState<string | null>(null);
  const [ignoredRideIds, setIgnoredRideIds] = useState<string[]>([]);
  const [hasStartedOnTheWay, setHasStartedOnTheWay] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`on_the_way_${acceptedRide?.id}`) === 'true';
    } catch {
      return false;
    }
  });

  // Local state for auto-arrival distance tracking
  const [distToPickupMeters, setDistToPickupMeters] = useState<number | null>(null);
  const autoArrivedRideIdRef = useRef<string | null>(null);

  // Automatic status update to 'arrived' if driver's device coordinates are within 50m of passenger's pickup location
  useEffect(() => {
    if (!acceptedRide || acceptedRide.status !== 'accepted') {
      autoArrivedRideIdRef.current = null;
      setDistToPickupMeters(null);
      return;
    }

    const pickup = acceptedRide.pickupCoords || findLocationNode(acceptedRide.pickupLocation);
    if (!pickup || typeof pickup.lat !== 'number' || typeof pickup.lng !== 'number') {
      return;
    }

    const checkDistance = (driverLat: number, driverLng: number) => {
      const distanceMeters = Math.round(haversineDistanceKm(driverLat, driverLng, pickup.lat, pickup.lng) * 1000);
      setDistToPickupMeters(distanceMeters);

      if (distanceMeters <= 50 && autoArrivedRideIdRef.current !== acceptedRide.id) {
        autoArrivedRideIdRef.current = acceptedRide.id;
        console.log(`Driver device within ${distanceMeters}m of pickup location (${pickup.lat}, ${pickup.lng}). Auto-updating status to arrived.`);
        onUpdateStatus?.(acceptedRide.id, 'arrived');
      }
    };

    // 1. Check with driverCoords attached to acceptedRide
    if (acceptedRide.driverCoords?.lat && acceptedRide.driverCoords?.lng) {
      checkDistance(acceptedRide.driverCoords.lat, acceptedRide.driverCoords.lng);
    }

    // 2. Real-time device geolocation check
    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          checkDistance(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => console.warn('Auto-arrival geolocation error:', err),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }

    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [acceptedRide?.id, acceptedRide?.status, acceptedRide?.driverCoords?.lat, acceptedRide?.driverCoords?.lng, acceptedRide?.pickupLocation, onUpdateStatus]);

  // Simulated Voice Calling States
  const [isCalling, setIsCalling] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  
  // Local state to force re-renders when activeRide is updated aggressively
  const [, forceUpdate] = useState({});

  const [proposedFare, setProposedFare] = useState<number | null>(null);
  const [bargainingRideId, setBargainingRideId] = useState<string | null>(null);
  const [showDriveModeModal, setShowDriveModeModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'daily' | 'weekly' | 'free'>(driver.driveMode || 'free');

  useEffect(() => {
    if (driver) {
      setSelectedMode(driver.driveMode || 'free');
    }
  }, [driver?.driveMode]);

  const handleSaveDriveSettings = () => {
    if (onUpdateDriverSettings) {
      onUpdateDriverSettings({
        driveMode: selectedMode
      });
    }
    setShowDriveModeModal(false);
  };
  
  useEffect(() => {
    if (acceptedRide) {
      localStorage.setItem(`on_the_way_${acceptedRide.id}`, hasStartedOnTheWay.toString());
    }
  }, [hasStartedOnTheWay, acceptedRide?.id]);

  // Aggressively monitor active ride status from props and activeRides list to force re-render on completion/cancellation
  useEffect(() => {
    if (acceptedRide) {
      const matchingRide = (activeRides || []).find(r => r.id === acceptedRide.id);
      const status = matchingRide ? matchingRide.status : acceptedRide.status;
      
      if (status === 'completed' || status === 'cancelled') {
        console.log(`DriverDashboard: Active ride status changed to ${status}. Re-rendering and clearing state.`);
        setHasStartedOnTheWay(false);
        try {
          localStorage.removeItem(`on_the_way_${acceptedRide.id}`);
        } catch {}
        
        // Force a component re-render
        forceUpdate({});
        
        if (onForceClearSeat) {
          onForceClearSeat();
        }
      }
    }
  }, [acceptedRide, acceptedRide?.status, activeRides, onForceClearSeat]);

  useEffect(() => {
    let interval: any;
    if (isCalling && callStatus === 'connected') {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [isCalling, callStatus]);

  useEffect(() => {
    if (isCalling) {
      setCallStatus('ringing');
      try {
        const msg = language === 'ur' ? "مسافر کو کال کی جا رہی ہے۔" : "Calling passenger...";
        voiceService.speak(msg, language === 'ur' ? 'ur-PK' : 'en-US');
      } catch (err) {
        console.error("Speech Synthesis error:", err);
      }

      // Simulate connection after 3 seconds
      const timeout = setTimeout(() => {
        setCallStatus('connected');
        try {
          const msg = language === 'ur' ? "کال مربوط ہو گئی ہے۔" : "Call connected.";
          voiceService.speak(msg, language === 'ur' ? 'ur-PK' : 'en-US');
        } catch (err) {
          console.error("Speech Synthesis error:", err);
        }
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [isCalling, language]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isUrdu = language === 'ur';

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await transcribeBroadcast(base64Audio);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Mic access notice:', err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeBroadcast = async (base64: string) => {
    setTranscribing(true);
    try {
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64 })
      });
      const data = await res.json();
      if (data.text) {
        setBroadcastText(data.text);
      }
    } catch (err) {
      console.warn('Transcription notice:', err);
    } finally {
      setTranscribing(false);
    }
  };

  const handlePostBroadcast = () => {
    if (!broadcastText.trim()) return;
    console.log('Posting broadcast:', broadcastText);
    setBroadcastText('');
    setShowBroadcastPanel(false);
  };

  const pendingRides = (activeRides || []).filter(r => 
    (r.status === 'pending' || r.status === 'in_status' || r.status === 'driver_offered' || r.status === 'admin_pending_carpool') && 
    !ignoredRideIds.includes(r.id)
  );

  const currentIncomingRide = isOnline && !acceptedRide && pendingRides.length > 0 ? pendingRides[0] : null;

  const hasBiddedOnCurrentRide = !!(currentIncomingRide && currentIncomingRide.driverFareOffers?.some(o => o.driverId === driver.id));

  // Ride ringing mechanism for online drivers without active accepted rides
  useEffect(() => {
    const hasIncomingCall = !!currentIncomingRide && !hasBiddedOnCurrentRide;
    if (!hasIncomingCall) {
      soundService.stop();
    }
    return () => {
      soundService.stop();
    };
  }, [isOnline, acceptedRide, pendingRides.length, !!currentIncomingRide, hasBiddedOnCurrentRide]);

  const completedToday = (activeRides || []).filter(
    r => r.driverId === driver.id && r.status === 'completed'
  ).length;

  const selectedCompany = driver.selectedCompany || 'ProRider';
  const companyTargets = pricingConfig?.companyBonusTargets?.companies?.[selectedCompany] || {
    target10Bonus: 300,
    target15Bonus: 600,
    target20Bonus: 1000,
    inDriveBonus: 50,
    commissionDiscount: 5
  };

  const unlockedBonus = completedToday >= 20 
    ? companyTargets.target20Bonus 
    : completedToday >= 15 
    ? companyTargets.target15Bonus 
    : completedToday >= 10 
    ? companyTargets.target10Bonus 
    : 0;

  const inDriveBonusAmount = companyTargets.inDriveBonus || 50;

  const baseCommRate = pricingConfig?.commissionRate !== undefined ? pricingConfig.commissionRate : 10;
  let driverCommRate = baseCommRate;
  if (driver.driveMode === 'target' && completedToday >= 10) {
    const commDisc = companyTargets.commissionDiscount || 5;
    driverCommRate = Math.max(0, baseCommRate - commDisc);
  }
  const driverEarningsMultiplier = (100 - driverCommRate) / 100;

  // Auto prefill proposedFare under discount mode
  useEffect(() => {
    if (currentIncomingRide) {
      if (driver.driveMode === 'discount') {
        const defaultDiscountPercentage = driver.discountPercentage || 10;
        const discountAmt = Math.floor(currentIncomingRide.fare * (defaultDiscountPercentage / 100));
        const minFare = pricingConfig?.minimumFare || 150;
        const proposed = Math.max(minFare, currentIncomingRide.fare - discountAmt);
        setProposedFare(proposed);
      } else {
        setProposedFare(currentIncomingRide.fare);
      }
    } else {
      setProposedFare(null);
    }
  }, [currentIncomingRide?.id, driver.driveMode, driver.discountPercentage, pricingConfig?.minimumFare]);

  // Calculate Stats for Widget
  const driverCompletedRides = (activeRides || []).filter(r => r && r.status === 'completed' && r.driverId === driver.id);
  const statsTotalRides = (driver.totalRides || 0) + driverCompletedRides.length;
  const statsDailyEarnings = driverCompletedRides.reduce((acc, r) => acc + Math.floor((Number(r.fare) || 0) * driverEarningsMultiplier), 0) + (driver.dailyEarnings || 0);
  const statsRating = driver.rating || 5.0;

  if (driver.status === 'blocked') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4 bg-red-950/20 text-white">
        <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center border-2 border-red-500 shadow-xl">
          <AlertTriangle className="w-10 h-10 animate-bounce" />
        </div>
        <h2 className="text-xl font-black uppercase text-red-500 tracking-tight">
          {isUrdu ? 'آپ کا ڈرائیور اکاؤنٹ بلاک ہے' : 'Account Suspended'}
        </h2>
        <p className="text-gray-300 text-xs max-w-sm font-bold">
          {isUrdu 
            ? 'ایڈمن کی جانب سے آپ کا ڈرائیور اکاؤنٹ عارضی یا مستقل طور پر بلاک کر دیا گیا ہے۔ مزید معلومات کے لیے ہیلپ لائن سے رابطہ کریں۔' 
            : "Your driver account has been blocked by the admin. Please contact support or admin for account review."}
        </p>
      </div>
    );
  }

  if (driver.status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
          <Navigation className="w-10 h-10 text-yellow-600 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold">{isUrdu ? 'منظوری زیر التواء ہے' : 'Verification Pending'}</h2>
        <p className="text-gray-500">
          {isUrdu 
            ? 'آپ کے دستاویزات کا ایڈمن جائزہ لے رہے ہیں۔ منظوری کے بعد ہم آپ کو مطلع کریں گے۔' 
            : "Your documents are being reviewed by the admin. We'll notify you once you're approved."}
        </p>
      </div>
    );
  }

  if (acceptedRide) {
    if (acceptedRide.status === 'ongoing') {
      return (
        <div className="fixed inset-0 z-[2000] bg-white">
          <RideTrackingView 
            ride={acceptedRide}
            onCompleteRide={(id) => {
              setHasStartedOnTheWay(false);
              try {
                localStorage.removeItem(`on_the_way_${id}`);
              } catch {}
              if (onForceClearSeat) {
                onForceClearSeat();
              } else {
                onUpdateStatus?.(id, 'completed');
              }
            }}
            onUpdateStatus={onUpdateStatus}
            language={language}
            isDriver={true}
            onStartCall={onStartCall}
          />
        </div>
      );
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(acceptedRide.pickupLocation)}&destination=${encodeURIComponent(acceptedRide.dropoffLocation)}`;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        id="driver-active-job-screen"
        className="fixed inset-0 z-[1000] bg-black flex flex-col md:flex-row overflow-y-auto md:overflow-hidden"
        style={{ height: '100vh', width: '100vw' }}
      >
        {/* Left Side: Map Container */}
        <div id="driver-map-side-container" className="w-full md:w-1/2 h-[300px] md:h-full relative bg-neutral-900 flex flex-col border-b md:border-b-0 md:border-r border-neutral-800 shrink-0">
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            <span className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg shadow-md flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-yellow-500/20 text-yellow-400`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-yellow-400 ${hasStartedOnTheWay ? 'animate-ping' : ''}`} />
              {hasStartedOnTheWay ? (isUrdu ? 'لائیو ٹریکنگ فعال ہے' : 'Live Tracking Active') : (isUrdu ? 'نیویگیشن اسٹینڈ بائی' : 'Navigation Standby')}
            </span>
          </div>

          <div className="absolute top-4 right-4 z-20">
            <button
              id="driver-btn-open-google-maps"
              onClick={() => window.open(googleMapsUrl, '_blank')}
              className="px-4 py-2.5 bg-black hover:bg-neutral-900 text-yellow-400 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl flex items-center gap-2 transition-all border border-yellow-400/30 animate-pulse"
            >
              🗺️ {isUrdu ? 'میپ کھولیں' : 'Open Map'}
            </button>
          </div>

          {/* Proper Map Component - Always Rendered to Plot Route Details */}
          <div id="driver-active-map-wrapper" className="flex-1 w-full h-full">
            <MapView 
              pickup={acceptedRide.pickupLocation} 
              destination={acceptedRide.dropoffLocation}
              pickupCoords={acceptedRide.pickupCoords}
              dropoffCoords={acceptedRide.dropoffCoords}
              showLiveVehicle={true}
              driverName={driver?.name || "Driver"}
              vehicleType={acceptedRide.vehicleType}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Right Side: Job and Actions Control Panel */}
        <div id="driver-job-details-side-container" className="w-full md:w-1/2 h-auto md:h-full flex flex-col bg-neutral-950 text-white p-6 justify-start overflow-y-auto relative border-t md:border-t-0 border-neutral-800 custom-scrollbar gap-6 pb-12">
          <div id="driver-job-details-inner" className="space-y-6">
            {/* Header / Brand Title */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-[0.25em]">
                  {isUrdu ? 'فعال نوکری' : 'Active Assigned Job'}
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase mt-0.5">
                  PRO RIDER <span className="text-yellow-400">AI</span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Refresh Driver Mode Button */}
                <button
                  id="driver-btn-refresh-mode"
                  onClick={() => {
                    try {
                      localStorage.setItem('driver_last_refresh', Date.now().toString());
                    } catch {}
                    if (onForceClearSeat) {
                      onForceClearSeat();
                    } else {
                      onUpdateStatus?.(acceptedRide.id, 'completed');
                    }
                    alert(isUrdu ? "🔄 ڈرائیور موڈ ریفریش کر دیا گیا ہے!" : "🔄 Driver mode refreshed successfully!");
                  }}
                  className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-90 transition-all rounded-xl text-yellow-400 flex items-center justify-center border border-white/5"
                  title="Refresh Driver Mode"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                </button>
                {/* Back / Exit / Force Release Button */}
                <button
                  id="driver-btn-force-end"
                  onClick={() => {
                    const confirmEnd = window.confirm(
                      isUrdu 
                        ? "کیا آپ اس سواری کو ختم کر کے ڈیش بورڈ پر واپس جانا چاہتے ہیں؟" 
                        : "Are you sure you want to end this ride and release the driver seat?"
                    );
                    if (confirmEnd) {
                      setHasStartedOnTheWay(false);
                      try {
                        localStorage.removeItem(`on_the_way_${acceptedRide.id}`);
                      } catch {}
                      if (onForceClearSeat) {
                        onForceClearSeat();
                      } else {
                        onUpdateStatus?.(acceptedRide.id, 'completed');
                      }
                    }
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 transition-all text-white font-bold text-[9px] uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-md"
                  title="Release Driver Seat"
                >
                  <ArrowLeft className="w-3 h-3" />
                  {isUrdu ? 'پیچھے جائیں' : 'Go Back'}
                </button>
              </div>
            </div>

            {/* Passenger Information Card */}
            <div id="driver-passenger-card" className="bg-white/5 rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-black font-bold flex items-center justify-center text-lg shadow-md shadow-yellow-400/10 shrink-0">
                    {acceptedRide.passengerName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">
                      {isUrdu ? 'مسافر' : 'Assigned Passenger'}
                    </span>
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                      {acceptedRide.passengerName || 'Azeem'}
                    </h3>
                  </div>
                </div>
                {/* Action Buttons for Calling and Messaging Passenger */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id="driver-btn-call-passenger"
                    onClick={() => {
                      if (onStartCall && acceptedRide) {
                        onStartCall(acceptedRide.id, 'driver');
                      } else {
                        setIsCalling(true);
                      }
                    }}
                    className="w-10 h-10 bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 transition-all rounded-xl flex items-center justify-center text-emerald-400 shadow-md border border-emerald-500/30 cursor-pointer shrink-0"
                    title={isUrdu ? "مسافر کو کال کریں" : "Call Passenger"}
                  >
                    <Phone className="w-5 h-5 animate-pulse" />
                  </button>

                  <a
                    id="driver-btn-message-passenger"
                    href={`sms:${acceptedRide.passengerPhone || '03001234567'}?body=${encodeURIComponent(isUrdu ? 'السلام علیکم! میں آپ کی پرو رائڈر سواری کے لیے آ رہا ہوں۔' : 'Hello! I am on the way for your Pro Rider ride.')}`}
                    className="w-10 h-10 bg-yellow-400/20 hover:bg-yellow-400/30 active:scale-95 transition-all rounded-xl flex items-center justify-center text-yellow-400 shadow-md border border-yellow-400/30 cursor-pointer shrink-0"
                    title={isUrdu ? "مسافر کو میسج کریں" : "Message Passenger"}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Fare & Distance */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                <div>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">
                    {isUrdu ? 'کل کرایہ' : 'Estimated Fare'}
                  </span>
                  <p className="text-base font-bold text-yellow-400">
                    Rs. {acceptedRide.fare}
                  </p>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">
                    {isUrdu ? 'فاصلہ' : 'Distance'}
                  </span>
                  <p className="text-base font-bold text-white">
                    {acceptedRide.distance || '4.5 km'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowRideDetailsModal(true)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-yellow-400/80 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all mt-2 border border-white/5"
              >
                {isUrdu ? 'مکمل تفصیلات دیکھیں' : 'View Full Trip Details'}
              </button>

              {/* Dynamic Expected Duration Display */}
              {['accepted', 'arrived', 'ongoing'].includes(acceptedRide.status as string) && (
                <div className="pt-3 border-t border-white/5">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    {isUrdu ? 'متوقع وقت باقی' : 'Expected Duration Remaining'}
                  </span>
                  <ExpectedDurationDisplay 
                    status={acceptedRide.status} 
                    distance={acceptedRide.distance} 
                    acceptedAt={acceptedRide.acceptedAt} 
                    startedAt={acceptedRide.startedAt} 
                    isUrdu={isUrdu} 
                  />
                </div>
              )}
            </div>

            {/* Dynamic Google Maps Route View */}
            <div id="driver-route-dynamic-map-section" className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                    {isUrdu ? 'گوگل میپس روٹ نیویگیشن' : 'Dynamic Google Maps Navigation View'}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setMapDisplayMode('dynamic')}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                      mapDisplayMode === 'dynamic' ? 'bg-yellow-400 text-black shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {isUrdu ? 'لائیو میپ' : 'Live Map'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapDisplayMode('static')}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                      mapDisplayMode === 'static' ? 'bg-yellow-400 text-black shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {isUrdu ? 'سٹیٹک' : 'Static'}
                  </button>
                </div>
              </div>

              {mapDisplayMode === 'dynamic' ? (
                <div className="relative h-[280px] sm:h-[340px] w-full rounded-2xl overflow-hidden border border-yellow-500/30 shadow-2xl bg-neutral-900">
                  <MapView
                    pickup={acceptedRide.pickupLocation}
                    destination={acceptedRide.dropoffLocation}
                    pickupCoords={acceptedRide.pickupCoords}
                    dropoffCoords={acceptedRide.dropoffCoords}
                    className="w-full h-full"
                    driverName={driver?.name || 'Pro Driver'}
                    vehicleType={acceptedRide.vehicleType || driver?.vehicle || 'Sedan'}
                    showLiveVehicle={true}
                  />
                </div>
              ) : (
                <GoogleMapsStaticPreview
                  pickup={acceptedRide.pickupLocation}
                  destination={acceptedRide.dropoffLocation}
                  language={language}
                  height={220}
                />
              )}
            </div>

            {/* Trip Route Timeline */}
            <div id="driver-route-manifest" className="bg-white/5 rounded-3xl p-5 border border-white/10 space-y-4 relative overflow-hidden">
              <div className="absolute left-[29px] top-9 bottom-9 w-[2px] bg-yellow-400/20" />
              
              {/* Pickup location */}
              <div className="flex gap-3 items-start relative z-10">
                <div className="w-5 h-5 rounded-full border-2 border-yellow-400 bg-black flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">
                    {isUrdu ? 'پک اپ کا مقام' : 'Pickup Location'}
                  </span>
                  <p className="text-xs font-bold text-white mt-0.5 leading-relaxed">
                    {acceptedRide.pickupLocation}
                  </p>
                </div>
              </div>

              {/* Dropoff location */}
              <div className="flex gap-3 items-start relative z-10">
                <div className="w-5 h-5 rounded-full border-2 border-emerald-500 bg-black flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">
                    {isUrdu ? 'ڈراپ آف کا مقام' : 'Drop-off Destination'}
                  </span>
                  <p className="text-xs font-bold text-white mt-0.5 leading-relaxed">
                    {acceptedRide.dropoffLocation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button Section */}
          <div id="driver-operational-actions" className="space-y-4 pt-4 border-t border-white/5">
            {/* Status indicator bar */}
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                {isUrdu ? 'موجودہ حالت' : 'Current Phase'}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-400 animate-pulse">
                {acceptedRide.status === 'accepted' 
                  ? (hasStartedOnTheWay ? (isUrdu ? 'منزل کی طرف گامزن' : 'Heading to Pickup') : (isUrdu ? 'تیار' : 'Assigned'))
                  : acceptedRide.status === 'arrived' 
                    ? (isUrdu ? 'پہنچ گئے' : 'Arrived at Pickup')
                    : (isUrdu ? 'سفر جاری ہے' : 'Trip In Progress')
                }
              </span>
            </div>

            <div id="driver-strict-buttons-wrapper" className="space-y-2">
              {/* Scenario 0: Ride accepted by driver, waiting for admin approval */}
              {acceptedRide.status === 'driver_pending_admin' && (
                <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-center space-y-1.5">
                  <p className="text-xs font-bold uppercase text-amber-400 animate-pulse">
                    ⏳ {isUrdu ? 'ایڈمن کی منظوری کا انتظار ہے' : 'Awaiting Admin Approval'}
                  </p>
                  <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                    {isUrdu 
                      ? 'آپ کی درخواست ایڈمن کو بھیج دی گئی ہے۔ ایڈمن کی منظور کے بعد نیویگیشن شروع کر سکتے ہیں۔' 
                      : 'Your request has been sent to Admin. Once approved, live navigation and trip controls will unlock.'}
                  </p>
                </div>
              )}

              {/* Auto Arrival Proximity Indicator */}
              {acceptedRide.status === 'accepted' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center flex items-center justify-between text-[10px] font-bold text-amber-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>{isUrdu ? '50 میٹر کی حدود میں آٹو-پہنچ گئے الرٹ فعال' : 'Auto-Arrive Active (Within 50m radius)'}</span>
                  </div>
                  {distToPickupMeters !== null && (
                    <span className="font-mono bg-black/50 border border-amber-400/20 px-2 py-0.5 rounded text-yellow-400 font-bold">
                      {distToPickupMeters}m {isUrdu ? 'پک اپ سے' : 'from pickup'}
                    </span>
                  )}
                </div>
              )}

              {/* Scenario 1: Ride is accepted and driver hasn't clicked "On The Way" yet */}
              {acceptedRide.status === 'accepted' && !hasStartedOnTheWay && (
                <button
                  id="driver-btn-on-the-way"
                  onClick={() => setHasStartedOnTheWay(true)}
                  className="w-full py-4.5 bg-yellow-400 hover:bg-yellow-300 active:scale-[0.98] text-black font-bold uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  🚗 {isUrdu ? 'راستے میں (On The Way)' : 'On The Way'}
                </button>
              )}

              {/* Scenario 2: Ride is accepted, driver clicked "On The Way", now on the way to pickup */}
              {acceptedRide.status === 'accepted' && hasStartedOnTheWay && (
                <button
                  id="driver-btn-arrived"
                  onClick={() => onUpdateStatus?.(acceptedRide.id, 'arrived')}
                  className="w-full py-4.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-white font-bold uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  📍 {isUrdu ? 'پہنچ گئے (Arrived)' : 'Arrived'}
                </button>
              )}

              {/* Scenario 3: Driver arrived, passenger seating. Start is available */}
              {acceptedRide.status === 'arrived' && (
                <button
                  id="driver-btn-start"
                  onClick={() => onUpdateStatus?.(acceptedRide.id, 'ongoing')}
                  className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  🚀 {isUrdu ? 'شروع کریں (Start)' : 'Start'}
                </button>
              )}

              {/* Cancellation Button */}
              {['accepted', 'arrived'].includes(acceptedRide.status) && (
                <button
                  onClick={() => {
                    const confirmCancel = window.confirm(isUrdu ? "کیا آپ واقعی یہ سواری منسوخ کرنا چاہتے ہیں؟" : "Are you sure you want to cancel this ride?");
                    if (confirmCancel) {
                      onReject(acceptedRide.id);
                      onForceClearSeat?.();
                    }
                  }}
                  className="w-full py-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all"
                >
                  {isUrdu ? 'سواری منسوخ کریں' : 'Cancel Ride'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Calling Simulation Overlay */}
        <AnimatePresence>
          {isCalling && (
            <div className="fixed inset-0 z-[2000] bg-neutral-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
              <div className="space-y-6 max-w-xs w-full flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold text-3xl animate-bounce shadow-2xl shadow-yellow-400/20">
                  {acceptedRide.passengerName?.charAt(0) || 'P'}
                </div>
                
                <div>
                  <p className="text-[10px] font-bold uppercase text-yellow-500 tracking-[0.2em] mb-1">
                    {callStatus === 'ringing' ? (isUrdu ? 'کال جا رہی ہے' : 'RINGING...') : 
                     callStatus === 'connected' ? (isUrdu ? 'مربوط ہے' : 'CONNECTED') : (isUrdu ? 'کال ختم' : 'ENDED')}
                  </p>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-white">
                    {acceptedRide.passengerName || 'Azeem'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{acceptedRide.passengerPhone || '0300-1234567'}</p>
                </div>

                {callStatus === 'connected' && (
                  <div className="px-4 py-1.5 bg-white/10 rounded-full font-mono text-xs tracking-wider text-yellow-400 animate-pulse">
                    {Math.floor(callTimer / 60).toString().padStart(2, '0')}:{(callTimer % 60).toString().padStart(2, '0')}
                  </div>
                )}

                <p className="text-xs text-gray-500 italic max-w-[200px] leading-relaxed">
                  {callStatus === 'ringing' 
                    ? (isUrdu ? 'مسافر کے جواب دینے کا انتظار کریں...' : 'Simulating connection inside application sandbox...')
                    : (isUrdu ? 'مسافر لائیو کال پر ہے۔' : 'Live conversation simulation active.')}
                </p>

                {(() => {
                  return (
                    <div className="space-y-3 w-full flex flex-col items-center pt-2">
                      <a
                        href={`tel:${acceptedRide.passengerPhone || '0300-1234567'}`}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Phone className="w-4 h-4" />
                        {isUrdu ? 'فون ڈائلر سے کال کریں' : 'Call via Direct Phone Dialer'}
                      </a>

                      <button
                        onClick={() => {
                          setIsCalling(false);
                          try {
                            const msg = isUrdu ? "کال بند کر دی گئی ہے۔" : "Call ended.";
                            voiceService.speak(msg, isUrdu ? 'ur-PK' : 'en-US');
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg bg-red-600 hover:bg-red-700 active:scale-90 cursor-pointer shadow-red-600/20 mt-1 transition-all"
                        title="End Call"
                      >
                        <Phone className="w-6 h-6 rotate-[135deg]" />
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* FULL RIDE DETAILS MODAL FOR DRIVER */}
        <AnimatePresence>
          {showRideDetailsModal && (
            <div className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-neutral-900 w-full max-w-md rounded-[32px] overflow-hidden flex flex-col shadow-2xl border border-white/10"
              >
                <div className="p-6 bg-neutral-950 border-b border-white/5 text-center relative">
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={() => setShowRideDetailsModal(false)}
                      className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="w-16 h-16 bg-yellow-400 rounded-2xl mx-auto flex items-center justify-center shadow-xl rotate-3">
                    <Check className="w-8 h-8 text-black" />
                  </div>
                  <h2 className="text-xl font-bold uppercase tracking-widest text-yellow-400 pt-2">
                    {isUrdu ? 'سواری کی تفصیلات' : 'Trip Details'}
                  </h2>
                  <p className="text-[10px] font-bold text-gray-500 font-mono">#{acceptedRide.id.toUpperCase()}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[65vh] custom-scrollbar">
                  {/* Passenger Info */}
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="w-12 h-12 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold text-xl">
                      {acceptedRide.passengerName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{isUrdu ? 'مسافر' : 'Passenger'}</p>
                      <p className="text-base font-bold text-white">{acceptedRide.passengerName || 'Azeem'}</p>
                      <p className="text-[10px] font-bold text-yellow-500/70">{acceptedRide.passengerPhone || '0300-1234567'}</p>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{isUrdu ? 'پک اپ' : 'Pickup'}</p>
                        <p className="text-sm font-bold text-white leading-tight">{acceptedRide.pickupLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{isUrdu ? 'منزل' : 'Destination'}</p>
                        <p className="text-sm font-bold text-white leading-tight">{acceptedRide.dropoffLocation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Fare Breakdown */}
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex justify-between text-xs font-bold text-gray-400">
                      <span>{isUrdu ? 'متوقع کرایہ' : 'Estimated Fare'}</span>
                      <span className="text-white">Rs. {acceptedRide.fare}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-400">
                      <span>{isUrdu ? 'فاصلہ' : 'Distance'}</span>
                      <span className="text-white">{acceptedRide.distance || '4.5 km'}</span>
                    </div>
                    {driver.driveMode === 'indrive' && (
                      <div className="flex justify-between text-xs font-bold text-emerald-400">
                        <span>{isUrdu ? 'ان ڈرائیو فلیٹ بونس' : 'In-Drive Flat Bonus'}</span>
                        <span>+Rs. {inDriveBonusAmount}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-white/10 flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest">{isUrdu ? 'آپ کی آمدنی' : 'Your Earnings'}</p>
                        <p className="text-2xl font-bold text-white font-mono italic">
                          Rs. {Math.floor(acceptedRide.fare * driverEarningsMultiplier + (driver.driveMode === 'indrive' ? inDriveBonusAmount : 0)).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase pb-1">
                        -{driverCommRate}% PR FEE
                      </span>
                    </div>
                  </div>

                  {/* Trip ID Copy */}
                  <div className="flex items-center justify-between p-3 bg-black/50 rounded-xl border border-white/5">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">{isUrdu ? 'آئی ڈی' : 'Trip ID'}</span>
                    <span className="text-[9px] font-mono text-yellow-500/50">{acceptedRide.id}</span>
                  </div>
                </div>

                <div className="p-6 bg-neutral-950 border-t border-white/5">
                  <button 
                    onClick={() => setShowRideDetailsModal(false)}
                    className="w-full py-4 bg-yellow-400 text-black rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    {isUrdu ? 'واپس جائیں' : 'Back to Job'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (currentIncomingRide && hasBiddedOnCurrentRide) {
    const myOffer = currentIncomingRide.driverFareOffers?.find(o => o.driverId === driver.id);
    return (
      <div className="fixed inset-0 z-[9999] bg-[#128c7e] text-white flex flex-col justify-between p-6">
        <div className="flex flex-col items-center pt-8 text-center space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-200">
              {isUrdu ? 'آفر بھیج دی گئی ہے' : 'Offer Submitted'}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mt-2">
            {currentIncomingRide.passengerName || (isUrdu ? 'معزز مسافر' : 'Valued Passenger')}
          </h1>
          <p className="text-emerald-100/80 text-xs font-bold uppercase tracking-wider">
            {isUrdu ? 'مسافر کے جواب کا انتظار ہے...' : 'Awaiting passenger response...'}
          </p>
        </div>

        <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-md border border-white/10 rounded-[32px] p-6 space-y-4 shadow-xl text-center">
          <p className="text-xs uppercase text-emerald-200 font-bold">Your Proposed Fare Offer</p>
          <p className="text-4xl font-black text-yellow-300 font-mono">Rs. {myOffer?.fare || proposedFare || currentIncomingRide.fare}</p>
          
          <div className="space-y-2 text-xs font-bold text-left pt-4 border-t border-white/10 text-emerald-50">
            <div>
              <span className="text-[8px] text-emerald-300 uppercase block">Pickup Location</span>
              <span className="text-sm">{currentIncomingRide.pickupLocation}</span>
            </div>
            <div className="pt-2 border-t border-white/5">
              <span className="text-[8px] text-emerald-300 uppercase block">Dropoff Location</span>
              <span className="text-sm">{currentIncomingRide.dropoffLocation}</span>
            </div>
          </div>
        </div>

        <div className="pb-8 text-center">
          <button
            onClick={() => {
              if (driver.driveMode === 'daily' || driver.driveMode === 'weekly') {
                alert(isUrdu ? 'بونس پیکج کی سواریاں منسوخ نہیں کی جا سکتیں۔' : 'Bonus package rides cannot be cancelled by driver.');
                return;
              }
              onCancelOffer?.(currentIncomingRide.id);
            }}
            className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all cursor-pointer border border-white/10"
          >
            {isUrdu ? 'آفر واپس لیں' : 'Withdraw Offer'}
          </button>
        </div>
      </div>
    );
  }

  if (currentIncomingRide) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.08, filter: 'blur(10px)', transition: { duration: 0.35, ease: 'easeInOut' } }}
        className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#075e54] to-[#128c7e] text-white flex flex-col justify-between p-4 sm:p-6 overflow-y-auto pb-16 custom-scrollbar"
      >
        {/* Top Header */}
        <div className="flex flex-col items-center pt-2 text-center space-y-1">
          <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/40 px-3 py-1 rounded-full text-xs font-black text-yellow-300 shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping" />
            <span>
              {isUrdu 
                ? `🔔 رِنگ ٹون ٹائمر: ${ringtoneCountdown > 0 ? ringtoneCountdown : 15} سیکنڈ باقی` 
                : `🔔 Ringtone Timer: ${ringtoneCountdown > 0 ? ringtoneCountdown : 15}s remaining`}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
              {isUrdu ? 'پرو رائڈر انکمنگ سواری' : 'Pro Rider Incoming Call'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5">
            {currentIncomingRide.passengerName || (isUrdu ? 'معزز مسافر' : 'Valued Passenger')}
          </h1>
          <p className="text-emerald-100/80 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            {isUrdu ? 'واٹس ایپ اسٹائل انکمنگ سواری' : 'Incoming WhatsApp-Style Call...'}
          </p>
        </div>

        {/* Khanapur & Proximity Banner */}
        <div className="w-full max-w-md mx-auto my-2 bg-black/40 border border-yellow-400/50 rounded-2xl p-3 text-xs space-y-2 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between text-yellow-300 font-black uppercase text-[10px]">
            <span className="flex items-center gap-1">🚨 Booking is from Khanapur</span>
            <span className="bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">Cars Visible</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[9px] text-gray-200 font-bold">
            <div className="bg-white/5 p-1 rounded">📍 Driver at Khanapur</div>
            <div className="bg-white/5 p-1 rounded">🧭 Near Ziana Chowk</div>
            <div className="bg-white/5 p-1 rounded">🕌 Standing at Mosque</div>
            <div className="bg-white/5 p-1 rounded">🚗 Live Map Cars Active</div>
          </div>
          <button
            onClick={() => setShowFleetDelegationModal(true)}
            className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer"
          >
            👥 Ask Different Drivers to Accept Request
          </button>
        </div>

        {/* Pulsing Center Avatar */}
        <div className="flex items-center justify-center my-3 sm:my-5 relative">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-emerald-400 bg-emerald-800 flex items-center justify-center shadow-2xl relative">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-400/40 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute -inset-4 rounded-full border-2 border-emerald-300/20 animate-ping" style={{ animationDuration: '3s' }} />
            <User className="w-14 h-14 sm:w-18 sm:h-18 text-emerald-100" />
          </div>
        </div>

        {/* Ride Details Card */}
        <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-md border border-white/10 rounded-[32px] p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {currentIncomingRide.vehicleType === 'bike' ? '🏍️' : 
                 currentIncomingRide.vehicleType === 'rickshaw' ? '🛺' : 
                 currentIncomingRide.vehicleType === 'mini' ? '🚗' : 
                 currentIncomingRide.vehicleType === 'sedan' ? '🚘' : 
                 currentIncomingRide.vehicleType === 'comfortable' ? '🚙' : '🚐'}
              </span>
              <div>
                <span className="text-[10px] text-emerald-200 font-bold uppercase block tracking-wider">{isUrdu ? 'گاڑی کی کلاس' : 'Vehicle Type'}</span>
                <span className="text-sm font-black uppercase">{currentIncomingRide.vehicleType}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-200 font-bold uppercase block tracking-wider">{isUrdu ? 'کرایہ' : 'Estimated Fare'}</span>
              <div className="flex items-center justify-end gap-1">
                <span className="text-lg font-black text-yellow-300 font-mono">Rs. {proposedFare || currentIncomingRide.fare}</span>
                {(proposedFare && proposedFare !== currentIncomingRide.fare) && (
                  <span className={`text-[10px] font-bold ${(proposedFare - currentIncomingRide.fare) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    ({(proposedFare - currentIncomingRide.fare) > 0 ? '+' : ''}{proposedFare - currentIncomingRide.fare})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Fare Adjustment */}
          <div className="flex justify-center items-center gap-4 py-2">
            <button onClick={() => setProposedFare(prev => (prev || currentIncomingRide.fare) - 10)} className="w-10 h-10 bg-white/20 rounded-full text-white font-bold">-10</button>
            <button onClick={() => setProposedFare(prev => (prev || currentIncomingRide.fare) + 10)} className="w-10 h-10 bg-white/20 rounded-full text-white font-bold">+10</button>
            <button onClick={() => setProposedFare(currentIncomingRide.fare)} className="text-xs text-emerald-200 underline">Reset</button>
          </div>

          <div className="space-y-3 text-xs font-bold text-emerald-50">
            {/* ... (keep existing pickup/dropoff display) */}
            <div className="flex items-start gap-3">
              <MapPin className="w-4.5 h-4.5 text-yellow-300 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[8px] font-black uppercase text-emerald-300 block tracking-wider">{isUrdu ? 'پک اپ مقام' : 'Pickup Location'}</span>
                <span className="text-xs font-bold leading-snug truncate block">{currentIncomingRide.pickupLocation}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-white/5 pt-2.5">
              <Navigation className="w-4.5 h-4.5 text-yellow-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[8px] font-black uppercase text-emerald-300 block tracking-wider">{isUrdu ? 'ڈراپ آف مقام' : 'Dropoff Location'}</span>
                <span className="text-xs font-bold leading-snug truncate block">{currentIncomingRide.dropoffLocation}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[10px] text-emerald-200 font-black uppercase tracking-wider">
            <span>{isUrdu ? 'فاصلہ:' : 'Distance:'} {currentIncomingRide.distance || '4.5 km'}</span>
            <span>{isUrdu ? 'سروس:' : 'Service:'} {currentIncomingRide.serviceType || 'City Ride'}</span>
          </div>
        </div>

        {/* Accept & Decline Actions */}
        <div className="flex justify-around items-center w-full max-w-sm mx-auto pb-6 pt-4">
          {/* Decline Button */}
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={() => {
                setIgnoredRideIds(prev => [...prev, currentIncomingRide.id]);
                soundService.stop();
              }}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer border-2 border-white/20"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-[10px] text-emerald-100 font-black uppercase tracking-widest">
              {isUrdu ? 'مسترد کریں' : 'Decline'}
            </span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={() => {
                soundService.stop();
                onAccept(currentIncomingRide.id, proposedFare || currentIncomingRide.fare);
              }}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer border-2 border-white/20 animate-bounce"
            >
              <PhoneCall className="w-7 h-7" />
            </button>
            <span className="text-[10px] text-emerald-100 font-black uppercase tracking-widest">
              {isUrdu ? 'قبول کریں' : 'Accept Ride'}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div 
      id="driver-dashboard-scroll-container"
      className="w-full h-full flex-1 flex flex-col bg-white overflow-y-auto relative custom-scrollbar p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5"
    >
      {/* Header with Profile Picture & Online/Offline Buttons */}
      <div 
        onClick={() => setShowProfileModal(true)}
        className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-[24px] border border-gray-200 flex-wrap gap-2 shrink-0 cursor-pointer hover:bg-gray-50 transition-all shadow-sm active:scale-[0.99]"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-sm bg-white shrink-0">
            <img src={driver.selfieUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'} alt="Driver Profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-black uppercase tracking-tight">{driver.name || 'Driver'}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <p className={`text-[8px] font-bold uppercase tracking-widest ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>
                {isOnline ? (isUrdu ? 'آن لائن' : 'Online') : (isUrdu ? 'آف لائن' : 'Offline')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 items-center" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setIsOnline(true)}
            className={`px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${isOnline ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {isUrdu ? 'آن لائن' : 'Online'}
          </button>
          <button
            onClick={() => setIsOnline(false)}
            className={`px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${!isOnline ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {isUrdu ? 'آف لائن' : 'Offline'}
          </button>
          <button
            id="driver-btn-home-refresh-mode"
            onClick={() => {
              onForceClearSeat?.();
              setIsOnline(true);
            }}
            className="p-2 bg-yellow-400 hover:bg-yellow-500 active:scale-90 transition-all rounded-lg text-black border border-yellow-500/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Car Connection / OBD Telemetry Status Banner */}
      <div className={`p-3.5 rounded-2xl border flex items-center justify-between shrink-0 transition-all shadow-sm ${isCarConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCarConnected ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white animate-bounce'}`}>
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-tight">
                {isCarConnected 
                  ? (isUrdu ? 'کار کا کنکشن فعال ہے (OBD-II)' : 'Car Connected via OBD-II Telemetry')
                  : (isUrdu ? 'گاڑی منسلک نہیں ہے!' : 'Car is Not Connected!')}
              </h4>
              <span className={`w-2 h-2 rounded-full ${isCarConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
            </div>
            <p className="text-[10px] text-gray-600 mt-0.5">
              {isCarConnected
                ? (isUrdu ? 'اسپیڈومیٹر، فیول اور انجن سگنل مستحکم ہیں۔' : 'Bluetooth OBD-II active. GPS, fuel, and engine status syncing.')
                : (isUrdu ? 'براہ کرم ڈرائیور موڈ کے لیے اپنی گاڑی کا بلوٹوتھ OBD کنیکٹ کریں۔' : 'Please connect your vehicle to receive ride dispatches and live diagnostics.')}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            const nextState = !isCarConnected;
            setIsCarConnected(nextState);
            if (nextState) {
              voiceService.speak(isUrdu ? 'گاڑی کامیابی سے جڑ گئی ہے' : 'Car connected successfully via OBD-II telemetry.');
            } else {
              voiceService.speak(isUrdu ? 'گاڑی کا کنکشن منقطع ہو گیا ہے' : 'Car disconnected.');
            }
          }}
          className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm shrink-0 ${isCarConnected ? 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-100' : 'bg-amber-600 text-white hover:bg-amber-700 animate-pulse'}`}
        >
          {isCarConnected 
            ? (isUrdu ? 'منقطع کریں' : 'Disconnect Car')
            : (isUrdu ? 'ابھی کار connect کریں' : 'Connect Car Now')}
        </button>
      </div>

      {/* View Mode Switcher */}
      <div className="flex bg-neutral-50 p-1 rounded-xl sm:rounded-2xl border border-gray-200 gap-1 shrink-0">
        <button
          onClick={() => setViewMode('requests')}
          className={`flex-1 py-2 px-2 rounded-lg sm:rounded-xl text-[10px] font-bold uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all ${viewMode === 'requests' ? 'bg-black text-yellow-400 shadow-sm' : 'text-gray-600 hover:text-black'}`}
        >
          <span>📋 {isUrdu ? 'درخواستیں' : 'Requests'}</span>
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono ${viewMode === 'requests' ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-700'}`}>
            {pendingRides.length}
          </span>
        </button>
        <button
          onClick={() => setViewMode('earnings')}
          className={`flex-1 py-2 px-2 rounded-lg sm:rounded-xl text-[10px] font-bold uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all ${viewMode === 'earnings' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
        >
          <DollarSign className="w-3.5 h-3.5 text-yellow-300" />
          <span>💰 {isUrdu ? 'کمائی' : 'Earnings'}</span>
        </button>
        <button
          onClick={() => setViewMode('analytics')}
          className={`flex-1 py-2 px-2 rounded-lg sm:rounded-xl text-[10px] font-bold uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all ${viewMode === 'analytics' ? 'bg-neutral-900 text-emerald-400 shadow-sm' : 'text-gray-600 hover:text-black'}`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>📊 {isUrdu ? 'چارٹ' : 'Analytics'}</span>
        </button>
        <button
          onClick={() => setViewMode('heatmap')}
          className={`flex-1 py-2 px-2 rounded-lg sm:rounded-xl text-[10px] font-bold uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all ${viewMode === 'heatmap' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
        >
          <Flame className="w-3.5 h-3.5 text-yellow-400" />
          <span>🔥 {isUrdu ? 'ہیٹ میپ' : 'Heatmap'}</span>
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`flex-1 py-2 px-2 rounded-lg sm:rounded-xl text-[10px] font-bold uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all ${viewMode === 'history' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
        >
          <span>📜 {isUrdu ? 'ہسٹری' : 'History'}</span>
        </button>
      </div>

        {viewMode === 'earnings' ? (
          <DriverEarningsTab
            language={language}
            theme={theme === 'dark' ? 'dark' : 'light'}
            completedRidesCount={driver?.completedRides}
            totalEarningsPkr={driver?.earnings}
          />
        ) : viewMode === 'analytics' ? (
          <DriverWeeklyAnalytics language={language} theme={theme === 'dark' ? 'dark' : 'light'} />
        ) : viewMode === 'heatmap' ? (
          <DemandHeatmapView language={language} theme={theme === 'dark' ? 'dark' : 'light'} />
        ) : viewMode === 'history' ? (
          <div className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase text-black">
                  {isUrdu ? 'ڈرائیور کی مکمل ہسٹری اور کارپولنگ ریکارڈ' : 'Driver Ride & Carpooling History'}
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase">
                  {isUrdu ? 'تمام مکمل ہونے والی سواریاں اور کارپول ٹرپس' : 'All completed instant rides and shared carpool trips'}
                </p>
              </div>
              <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-black rounded-full">
                {((activeRides || []).filter(r => r && (r.driverId === driver.id || r.serviceType === 'carpool' || r.serviceType === 'sharing'))).length} {isUrdu ? 'ٹرپس' : 'Trips'}
              </span>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {((activeRides || []).filter(r => r && (r.driverId === driver.id || r.serviceType === 'carpool' || r.serviceType === 'sharing'))).length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs font-bold">
                  {isUrdu ? 'کوئی پرانی ہسٹری یا کارپول ریکارڈ دستیاب نہیں ہے۔' : 'No ride or carpool history recorded yet.'}
                </div>
              ) : (
                ((activeRides || []).filter(r => r && (r.driverId === driver.id || r.serviceType === 'carpool' || r.serviceType === 'sharing'))).map((ride, idx) => (
                  <div key={ride.id || idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 bg-black text-yellow-400 rounded-md text-[9px] font-black uppercase">
                        {ride.serviceType === 'carpool' || ride.serviceType === 'sharing' ? (isUrdu ? 'کارپول شیئرنگ' : 'Carpool Trip') : (isUrdu ? 'انسٹنٹ سواری' : 'Instant Ride')}
                      </span>
                      <span className="text-xs font-black font-mono text-emerald-600">
                        Rs. {ride.fare || 500}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-800 space-y-1">
                      <p className="flex items-center gap-1.5 truncate">
                        <span className="text-yellow-600">📍</span> {ride.pickupLocation}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <span className="text-emerald-600">🏁</span> {ride.dropoffLocation}
                      </p>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase pt-1 border-t border-gray-200">
                      <span>{ride.passengerName || 'Passenger'}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black">{ride.status || 'completed'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Drive Mode Tracker Banner */}
            <div className="bg-yellow-400 text-black p-5 rounded-[28px] shadow-lg border border-yellow-500/30 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-black text-yellow-400 px-2.5 py-1 rounded-full">
                    Pro Partner
                  </span>
                  <h3 className="text-lg font-black uppercase tracking-tight mt-1.5">
                    {driver.driveMode === 'discount' ? (isUrdu ? 'ڈسکاؤنٹ موڈ' : 'Discount Mode') :
                     driver.driveMode === 'target' ? (isUrdu ? 'کمپنی ہدف موڈ' : 'Company Target Mode') :
                     driver.driveMode === 'indrive' ? (isUrdu ? 'ان ڈرائیو بونس موڈ' : 'In-Drive Bonus Mode') :
                     driver.driveMode === 'custom' ? (isUrdu ? 'ذاتی ہدف موڈ' : 'Custom Target Mode') :
                     (isUrdu ? 'سادہ موڈ' : 'Simple Drive Mode')}
                  </h3>
                  <p className="text-[10px] text-black/70 font-bold mt-0.5">
                    {driver.driveMode === 'discount' ? (isUrdu ? `مسافروں کو ${driver.discountPercentage || 10}% خودکار ڈسکاؤنٹ دیں` : `Automatically offering ${driver.discountPercentage || 10}% discount to secure rides.`) :
                     driver.driveMode === 'target' ? (isUrdu ? 'روزانہ ہدف بونسز کو پورا کریں' : 'Achieve daily targets for massive bonuses.') :
                     driver.driveMode === 'indrive' ? (isUrdu ? 'ہر مکمل سواری پر فلیٹ بونس حاصل کریں' : `Get flat peak-hour bonuses per completed ride.`) :
                     driver.driveMode === 'custom' ? (isUrdu ? `اپنے سیٹ کردہ ${driver.customTarget || 10} سواریوں کا ہدف حاصل کریں` : `Achieve your personal target of ${driver.customTarget || 10} rides today.`) :
                     (isUrdu ? 'معیاری کرایے اور نارمل کمیشن کے ساتھ سفر کریں' : 'Ride with standard fares and regular commission rate.')}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowDriveModeModal(true)}
                  className="px-3 py-2 bg-black hover:bg-neutral-900 text-yellow-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow active:scale-95 cursor-pointer shrink-0"
                >
                  {isUrdu ? 'تبدیل کریں' : 'Change Mode'}
                </button>
              </div>

              {/* Progress and bonuses */}
              {driver.driveMode === 'target' && (
                <div className="bg-black/5 p-4 rounded-2xl border border-black/5 space-y-3">
                  <div className="flex justify-between items-center text-xs font-black uppercase">
                    <span>Daily Progress: {completedToday} / 10 Rides</span>
                    <span className="font-mono text-emerald-800 font-black">Bonus: Rs. {unlockedBonus}</span>
                  </div>
                  <div className="w-full bg-black/10 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-black h-full transition-all duration-500 rounded-full" 
                      style={{ width: `${Math.min(100, (completedToday / 10) * 100)}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold text-black/60 uppercase">
                    <span>10 Rides: +Rs. 300</span>
                    <span>15 Rides: +Rs. 600</span>
                    <span>20 Rides: +Rs. 1000</span>
                  </div>
                </div>
              )}

              {driver.driveMode === 'custom' && (
                <div className="bg-black/5 p-4 rounded-2xl border border-black/5 space-y-3">
                  <div className="flex justify-between items-center text-xs font-black uppercase">
                    <span>Goal Progress: {completedToday} / {driver.customTarget || 10} Rides</span>
                    <span>{Math.floor(Math.min(100, (completedToday / (driver.customTarget || 10)) * 100))}%</span>
                  </div>
                  <div className="w-full bg-black/10 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-black h-full transition-all duration-500 rounded-full" 
                      style={{ width: `${Math.min(100, (completedToday / (driver.customTarget || 10)) * 100)}%` }} 
                    />
                  </div>
                  <p className="text-[9px] font-bold text-center uppercase tracking-wider text-black/70">
                    {completedToday >= (driver.customTarget || 10) 
                      ? "🏆 Personal Target Completed! Awesome job!" 
                      : `Keep going! ${(driver.customTarget || 10) - completedToday} more rides to achieve your goal!`}
                  </p>
                </div>
              )}

              {driver.driveMode === 'indrive' && (
                <div className="bg-black/5 p-4 rounded-2xl border border-black/5 flex justify-between items-center text-xs font-black uppercase">
                  <span>In-Drive peak bonus (+Rs. 50/ride):</span>
                  <span className="text-emerald-800 font-mono font-black">Total: +Rs. {completedToday * 50}</span>
                </div>
              )}

              {driver.driveMode === 'discount' && (
                <div className="bg-black/5 p-4 rounded-2xl border border-black/5 flex justify-between items-center text-xs font-black uppercase">
                  <span>Automatic Discount offer:</span>
                  <span className="text-red-800 font-black">-{driver.discountPercentage || 10}%</span>
                </div>
              )}
            </div>

            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
              {isUrdu ? 'قریبی مسافروں کی درخواستیں اور مقامات' : 'Nearby Passenger Requests & Locations'}
            </h3>
            
            {!isOnline ? (
          <div className="text-center py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 space-y-3 p-6">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-base font-bold">!</div>
            <p className="text-xs font-bold uppercase tracking-tight text-gray-800">{isUrdu ? 'آپ فی الحال آف لائن ہیں' : 'You are currently offline'}</p>
            <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
              {isUrdu 
                ? 'سواری کی درخواستیں اور مسافروں کے مقامات فوری طور پر حاصل کرنے کے لیے اوپر آن لائن اسٹیٹس پر سوئچ کریں۔' 
                : 'Switch to Online status above to start receiving ride requests and passenger locations instantly.'}
            </p>
            <button
              onClick={() => setIsOnline(true)}
              className="mt-2 px-5 py-2 bg-black text-yellow-400 rounded-lg font-bold text-[9px] uppercase tracking-widest"
            >
              {isUrdu ? 'ابھی آن لائن جائیں' : 'Go Online Now'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {pendingRides.map((ride) => (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                  className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 px-3 py-1 bg-black text-yellow-400 text-[9px] font-bold uppercase tracking-widest rounded-bl-xl">
                    {ride.vehicleType || 'Standard'}
                  </div>

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3 items-center">
                      <div className="bg-yellow-50 p-2.5 rounded-xl border border-yellow-100">
                        <User className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-black uppercase tracking-tighter text-sm">
                            {ride.serviceType === 'carpool' || ride.serviceType === 'sharing' 
                              ? (isUrdu ? 'کارپولنگ ماہانہ درخواست' : 'Carpooling Monthly Request') 
                              : (isUrdu ? 'مسافر کی درخواست' : 'Passenger Ride Request')}
                          </p>
                          {ride.serviceType === 'carpool' && (
                            <span className="text-[8px] bg-yellow-400 text-black font-bold px-1.5 py-0.5 rounded-full uppercase">
                              Monthly
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-widest">
                          Rs. {ride.fare?.toLocaleString()} {ride.serviceType === 'carpool' ? '/ month' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Carpool Monthly Details Banner */}
                  {(ride.serviceType === 'carpool' || ride.pickupTime) && (
                    <div className="mb-4 p-3.5 bg-yellow-50/80 rounded-2xl border border-yellow-200 text-xs font-bold text-black space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between text-[10px] text-yellow-900 font-bold">
                        <span>🗓️ {ride.travelDays || 22} Travel Days / Month</span>
                        <span>⏰ {ride.pickupTime || '08:00'} AM - {ride.dropoffTime || '05:00'} PM</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-yellow-200/60 text-[10px]">
                        <span className="text-gray-700">Daily Trip: <strong>{ride.dailyKm || 10} KM</strong></span>
                        <span className="text-emerald-700 font-bold">Total Monthly: <strong>{ride.totalMonthlyKm || ((ride.dailyKm || 10) * (ride.travelDays || 22))} KM</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Small Google Maps Static Preview */}
                  <div className="mb-4">
                    <GoogleMapsStaticPreview
                      pickup={ride.pickupLocation}
                      destination={ride.dropoffLocation}
                      language={language}
                      height={140}
                      showOpenInMapsButton={false}
                    />
                  </div>

                  <div className="space-y-3 mb-6 relative pl-6">
                    <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-gray-100" />
                    <div className="relative">
                      <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-black bg-white" />
                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">{isUrdu ? 'پک اپ کا مقام' : 'Pickup Location'}</p>
                      <p className="text-xs font-bold text-black">{ride.pickupLocation}</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-gray-300 bg-white" />
                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">{isUrdu ? 'ڈراپ آف کا مقام' : 'Drop-off Location'}</p>
                      <p className="text-xs font-bold text-black">{ride.dropoffLocation}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setIgnoredRideIds(prev => [...prev, ride.id]);
                        onReject(ride.id);
                      }}
                      className="flex items-center justify-center gap-1.5 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-gray-100 transition-all"
                    >
                      <X className="w-4 h-4" /> {isUrdu ? 'نظر انداز کریں' : 'Ignore'}
                    </button>
                    <button
                      onClick={() => setBargainingRideId(ride.id)}
                      className="flex items-center justify-center gap-1.5 py-3 bg-yellow-100 text-yellow-800 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-yellow-200 transition-all border border-yellow-200"
                    >
                      <Flame className="w-3.5 h-3.5" /> {isUrdu ? 'بارگین (Negotiate)' : 'Bargain'}
                    </button>

                    {bargainingRideId === ride.id && (
                      <div className="col-span-2 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-yellow-400 space-y-3 mt-2">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-gray-500">Proposed Fare:</span>
                            <span className="text-sm font-black text-black font-mono">Rs. {proposedFare || ride.fare}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setProposedFare(prev => Math.max(50, (prev || ride.fare) - 10))}
                              className="w-10 h-10 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center font-black text-lg active:scale-90"
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              value={proposedFare || ride.fare}
                              onChange={(e) => setProposedFare(parseInt(e.target.value, 10))}
                              className="flex-1 bg-white border-2 border-black rounded-xl py-2 px-3 text-center font-black text-base"
                            />
                            <button 
                              onClick={() => setProposedFare(prev => (prev || ride.fare) + 10)}
                              className="w-10 h-10 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center font-black text-lg active:scale-90"
                            >
                              +
                            </button>
                         </div>
                         <div className="flex gap-2">
                           <button 
                             onClick={() => { setBargainingRideId(null); setProposedFare(null); }}
                             className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-xl text-[10px] font-bold uppercase"
                           >
                             Cancel
                           </button>
                           <button 
                             onClick={() => {
                               onAccept(ride.id, proposedFare || ride.fare);
                               setBargainingRideId(null);
                             }}
                             className="flex-1 py-2 bg-yellow-400 text-black rounded-xl text-[10px] font-black uppercase"
                           >
                             Send Offer
                           </button>
                         </div>
                      </div>
                    )}

                    {!bargainingRideId && (
                      <button
                        onClick={() => onAccept(ride.id, ride.fare)}
                        className="col-span-2 py-3 bg-black hover:bg-neutral-800 text-yellow-400 rounded-xl font-black uppercase tracking-widest text-[9px] text-center border border-yellow-400/30 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                        <span>{isUrdu ? 'سواری قبول کریں' : 'Accept Ride Now'}</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {pendingRides.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Navigation className="w-10 h-10 mx-auto mb-3 opacity-20 animate-spin" />
                <p className="text-xs font-bold uppercase tracking-tight text-gray-600">{isUrdu ? 'قریبی مسافروں کی تلاش جاری ہے...' : 'Scanning for nearby passengers...'}</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-xs mx-auto">
                  {isUrdu 
                    ? 'آپ آن لائن ہیں۔ آپ کے سیکٹر میں مسافروں کی نئی درخواستیں یہاں فوری طور پر ظاہر ہوں گی۔' 
                    : 'You are online. New passenger requests in your sector will appear here instantly.'}
                </p>
              </div>
            )}
          </div>
        )}
        </>
      )}



      {/* Driver Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-yellow-400 shadow-xl bg-white">
                    <img src={driver.selfieUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <button 
                    onClick={() => setShowProfileModal(false)}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-black tracking-tight">{driver.name || 'Driver'}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Car className="w-4 h-4 text-yellow-600" />
                    <p className="text-xs font-black text-gray-800 uppercase tracking-wide">
                      {driver.vehicle || (driver.vehicleType ? `${String(driver.vehicleType).toUpperCase()} CAR` : 'PRO RIDER VEHICLE')}
                    </p>
                    <span className="bg-black text-yellow-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                      {driver.vehicleNumber || 'ICT-LEB-2024'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DriverStatsWidget 
                    totalRides={statsTotalRides}
                    dailyEarnings={statsDailyEarnings}
                    rating={statsRating}
                    language={language}
                    compact={true}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-100 p-5 rounded-3xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-bold text-yellow-800 uppercase tracking-widest">{isUrdu ? 'روٹ پر سرگرم مسافر' : 'Active Passengers'}</p>
                    <Users className="w-4 h-4 text-yellow-600" />
                  </div>
                  <p className="text-xl font-bold text-black">
                    {isUrdu ? `${pendingRides.length} مسافر منتظر ہیں` : `${pendingRides.length} Waiting Now`}
                  </p>
                </div>
                
                <div className="pt-2">
                  <button 
                    onClick={() => setShowProfileModal(false)}
                    className="w-full py-4 bg-black text-yellow-400 rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {isUrdu ? 'واپس جائیں' : 'Back to Dashboard'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* Drive Mode Selection Modal */}
      <AnimatePresence>
        {showDriveModeModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-950 rounded-[32px] w-full max-w-lg overflow-hidden border border-gray-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-black dark:text-white">
                    {isUrdu ? 'ڈرائیور موڈ اور کمپنی سیٹنگز' : 'Drive Mode & Company settings'}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                    {isUrdu ? 'اپنا ہدف اور بونس پلان منتخب کریں' : 'Choose your target and bonus plan'}
                  </p>
                </div>
                <button
                  onClick={() => setShowDriveModeModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-full text-gray-500 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs font-bold text-gray-800 dark:text-gray-200">


                {/* Drive Modes list */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">
                    {isUrdu ? 'ڈرائیونگ موڈ منتخب کریں' : 'Select Active Drive Mode'}
                  </label>

                  <div className="space-y-2.5">
                    {/* Mode 1: Daily Plan */}
                    <div 
                      onClick={() => setSelectedMode('daily')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                        selectedMode === 'daily'
                          ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-500/5'
                          : 'border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl shrink-0">📅</span>
                      <div>
                        <h4 className="font-black text-black dark:text-white uppercase tracking-tight text-xs">
                          {isUrdu ? 'روزانہ پلان (ڈیلی پلان)' : 'Daily Plan (Daily Milestone & Bonus)'}
                        </h4>
                        <p className="text-[10px] text-gray-500 font-normal mt-0.5">
                          {isUrdu ? 'روزانہ اہداف کو پورا کریں اور فکسڈ بونس حاصل کریں۔ بونس سواری منسوخ نہیں کی جا سکتی۔' : 'Fulfill daily targets and unlock guaranteed daily bonus rewards. Bonus package rides cannot be cancelled.'}
                        </p>
                      </div>
                    </div>

                    {/* Mode 2: Weekly Plan */}
                    <div 
                      onClick={() => setSelectedMode('weekly')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                        selectedMode === 'weekly'
                          ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-500/5'
                          : 'border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl shrink-0">📊</span>
                      <div>
                        <h4 className="font-black text-black dark:text-white uppercase tracking-tight text-xs">
                          {isUrdu ? 'ہفتہ وار پلان (ویکلی پلان)' : 'Weekly Plan (Weekly Cumulative Target)'}
                        </h4>
                        <p className="text-[10px] text-gray-500 font-normal mt-0.5">
                          {isUrdu ? 'ہفتہ وار اہداف کے ساتھ بڑے بونسز کمائیں۔ پیکج والی سواریاں منسوخ کرنا منع ہے۔' : 'Earn massive weekly milestone bonuses and surge perks. Package bonus rides cannot be cancelled by driver.'}
                        </p>
                      </div>
                    </div>

                    {/* Mode 3: Free Option */}
                    <div 
                      onClick={() => setSelectedMode('free')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                        selectedMode === 'free'
                          ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-500/5'
                          : 'border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl shrink-0">🆓</span>
                      <div>
                        <h4 className="font-black text-black dark:text-white uppercase tracking-tight text-xs">
                          {isUrdu ? 'فری آپشن (آزادانہ موڈ)' : 'Free Option (Adjustable Standard Mode)'}
                        </h4>
                        <p className="text-[10px] text-gray-500 font-normal mt-0.5">
                          {isUrdu ? 'معیاری اور لچکدار شرائط پر سواریاں قبول کریں۔ ایڈمن کی طرف سے ایڈجسٹ ایبل۔' : 'Accept rides with flexible terms and adjustable free option parameters managed by platform admin.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-950">
                <button
                  onClick={handleSaveDriveSettings}
                  className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer"
                >
                  {isUrdu ? 'سیٹنگز محفوظ کریں' : 'Save Driver Settings'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLEET NETWORK DELEGATION MODAL */}
      <AnimatePresence>
        {showFleetDelegationModal && (
          <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-900 w-full max-w-md rounded-[32px] overflow-hidden flex flex-col shadow-2xl border border-white/10 text-white"
            >
              <div className="p-6 bg-neutral-950 border-b border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">Fleet Network Dispatch</span>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white mt-0.5">Ask Other Drivers to Accept</h3>
                </div>
                <button 
                  onClick={() => setShowFleetDelegationModal(false)}
                  className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <p className="text-xs text-gray-300">
                  Select a driver from the online fleet network to delegate or ask them to accept the passenger booking from Khanapur (Destination: Ziana Chowk & Central Mosque).
                </p>

                <div className="space-y-3">
                  {[
                    { id: 'drv-1', name: 'Muhammad Tariq Khan', vehicle: 'Toyota Corolla (LEB-8899)', loc: 'Near Ziana Chowk' },
                    { id: 'drv-2', name: 'Usman Ali Hashmi', vehicle: 'Suzuki Alto (RI-4521)', loc: 'Standing at Mosque' },
                    { id: 'drv-3', name: 'Bilal Ahmed', vehicle: 'Honda Civic (ISB-334)', loc: 'Khanapur Outskirts' }
                  ].map((d) => (
                    <div key={d.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-yellow-400">{d.name}</h4>
                        <p className="text-[10px] text-gray-400">{d.vehicle} • {d.loc}</p>
                      </div>
                      <button
                        onClick={() => {
                          setDelegatedDriverName(d.name);
                          setShowFleetDelegationModal(false);
                          alert(`✅ Successfully sent delegation request to ${d.name}! Driver notified to accept booking from Khanapur.`);
                        }}
                        className="px-3 py-2 bg-yellow-400 text-black font-bold text-[10px] uppercase tracking-wider rounded-xl shadow hover:bg-yellow-300 transition-all shrink-0"
                      >
                        Ask Driver
                      </button>
                    </div>
                  ))}
                </div>

                {delegatedDriverName && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-300 font-bold">
                    ✓ Request successfully dispatched to {delegatedDriverName}. Waiting for acceptance.
                  </div>
                )}
              </div>

              <div className="p-6 bg-neutral-950 border-t border-white/5">
                <button
                  onClick={() => setShowFleetDelegationModal(false)}
                  className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Close Dispatcher
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
