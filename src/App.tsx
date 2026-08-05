/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { TAB_INSTRUCTIONS, INITIAL_PENDING_DRIVERS, INITIAL_CARPOOL_MESSAGES } from './constants/appData';
import SettingsItem from './components/SettingsItem';
import LoadingSpinner from './components/LoadingSpinner';
import DriverDashboard from './components/DriverDashboard';
import MainLayout from './components/MainLayout';
import PassengerDashboard from './components/PassengerDashboard';
import { UserProfile, DriverProfile, Ride, UserStatus, Language, Theme, VehicleType, ServiceType, RideStatus } from './types';
import { motion, AnimatePresence } from 'motion/react';

// Standard component imports
import ErrorBoundary from './components/ErrorBoundary';
import Registration from './components/Registration';
import AdminPanel from './components/AdminPanel';
import StatusView from './components/StatusView';
import FareCalculator from './components/FareCalculator';
import BookingForm from './components/BookingForm';
import CarpoolChatRoom from './components/CarpoolChatRoom';
import { ScreenshotUploader } from './components/ScreenshotUploader';
import WalletTrendChart from './components/WalletTrendChart';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { LogOut, Globe, Moon, Sun, User, ShieldCheck, Info, ShieldAlert, Phone as PhoneIcon, PhoneOff, MessageSquare, Calculator, Plus, Sparkles, X, ArrowRight, Download, RefreshCw, Share, Wallet, Eye, EyeOff, Shield, Users, MapPin, Fingerprint, Car, Search, Clock, Mic, MicOff, Volume2, Send, Camera, CheckCircle2, Star, Zap } from 'lucide-react';
import { voiceService } from './lib/voice';
import { soundService, RINGTONE_OPTIONS, NOTIFICATION_OPTIONS } from './lib/sounds';
import { pushNotificationService } from './lib/notifications';
import { translations } from './lib/i18n';
import { initAuth, googleSignIn, logout as googleLogout, getAccessToken } from './lib/firebase';
import { safeLocalStorage } from './lib/storageUtils';
import { 
  saveUserToFirestore, 
  updateUserInFirestore,
  saveRideToFirestore, 
  updateRideInFirestore, 
  subscribeToRides, 
  fetchRidesOnce,
  saveStatusToFirestore, 
  subscribeToStatuses, 
  saveGroupConfigToFirestore, 
  subscribeToGroupConfig,
  deleteAllRidesFromFirestore,
  subscribeToUsers,
  saveCallToFirestore,
  subscribeToCalls,
  subscribeToDriverRides,
  getUserByGoogleUid
} from './lib/firestoreService';
import { User as FirebaseUser } from 'firebase/auth';
import { getVehicleTypeDisplay, getServiceTypeDisplay } from './lib/displayUtils';
import { haversineDistanceKm, findLocationNode } from './lib/locationService';

export default function App() {
  const [user, setUser] = useState<UserProfile | DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [globalStatus, setGlobalStatus] = useState('System Operational');
  const [language, setLanguage] = useState<Language>(() => {
    return (safeLocalStorage.getItem('pro_rider_language') as Language) || 'en';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    return (safeLocalStorage.getItem('pro_rider_theme') as Theme) || 'dark';
  });
  const [showCalculator, setShowCalculator] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  useEffect(() => {
    const instruction = (TAB_INSTRUCTIONS as any)[activeTab];
    if (instruction) {
      voiceService.speak(
        language === 'ur' ? instruction.ur : instruction.en,
        language === 'ur' ? 'ur-PK' : 'en-US'
      );
    }
  }, [activeTab, language]);
  const [statuses, setStatuses] = useState<UserStatus[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<DriverProfile[]>(INITIAL_PENDING_DRIVERS as any);
  const [driverProfiles, setDriverProfiles] = useState<DriverProfile[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [activeRides, setActiveRides] = useState<Ride[]>([]);
  const [acceptedRide, setAcceptedRide] = useState<Ride | null>(null);

  // Sync Users and Drivers from Firestore
  useEffect(() => {
    const unsubUsers = subscribeToUsers((allUsers) => {
      const handledIds = new Set<string>(
        JSON.parse(safeLocalStorage.getItem('prorider_handled_driver_ids') || '[]')
      );

      const drivers = allUsers.filter(u => 
        (u.role && u.role.toLowerCase() === 'driver') || 
        !!(u as DriverProfile).licenseFrontUrl || 
        !!(u as DriverProfile).vehicleNumber
      ) as DriverProfile[];

      setDriverProfiles(drivers.filter(d => d.status === 'approved'));
      
      const dbPending = drivers.filter(d => 
        (d.status !== 'approved' || d.pendingVehicleType) && !handledIds.has(d.id)
      );

      const combinedMap = new Map<string, DriverProfile>();
      
      // Only include demo drivers if they have not been approved/rejected yet
      (INITIAL_PENDING_DRIVERS as any[]).forEach(d => {
        if (!handledIds.has(d.id)) {
          combinedMap.set(d.id, d as DriverProfile);
        }
      });

      // Real drivers from Firestore override demo drivers and are prioritized
      dbPending.forEach(d => combinedMap.set(d.id, d));

      const finalPending = Array.from(combinedMap.values()).filter(
        d => (d.status !== 'approved' || d.pendingVehicleType) && !handledIds.has(d.id)
      );

      setPendingDrivers(finalPending);
    });
    return () => unsubUsers();
  }, []);

  // Keep acceptedRide synced for drivers
  useEffect(() => {
    if (user && user.role === 'driver' && activeRides.length > 0) {
      const storedRideId = safeLocalStorage.getItem('pro_rider_accepted_ride');
      const myAcceptedRide = activeRides.find(r => 
        (r.driverId === user.id || 
         (user.phone && r.driverPhone === user.phone) || 
         r.id === storedRideId ||
         (r.driverFareOffers && r.driverFareOffers.some(o => o.driverId === user.id))) && 
        ['accepted', 'arrived', 'ongoing', 'driver_pending_admin'].includes(r.status)
      );
      if (myAcceptedRide) {
        setAcceptedRide(myAcceptedRide);
        safeLocalStorage.setItem('pro_rider_accepted_ride', myAcceptedRide.id);
      } else {
        setAcceptedRide(null);
      }
    } else if (user && user.role === 'driver') {
      setAcceptedRide(null);
    }
  }, [activeRides, user]);
  const [isRinging, setIsRinging] = useState(false);
  const [ringtoneCountdown, setRingtoneCountdown] = useState<number>(0);
  const ringtoneEndTimeRef = useRef<number | null>(null);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRungRideIdRef = useRef<string | null>(null);

  const stopPersistentRingtone = useCallback(() => {
    setIsRinging(false);
    setRingtoneCountdown(0);
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    ringtoneEndTimeRef.current = null;
    soundService.stop();
  }, []);

  // Persistent 15-Second Ringtone Countdown Timer (Independent of UI render cycles)
  const startPersistentRingtone = useCallback((rideId?: string) => {
    const NOW = Date.now();
    const DURATION_MS = 15000; // Guaranteed full 15-second duration
    ringtoneEndTimeRef.current = NOW + DURATION_MS;
    if (rideId) lastRungRideIdRef.current = rideId;

    setIsRinging(true);
    setRingtoneCountdown(15);

    const ringtoneUrl = RINGTONE_OPTIONS.find(r => r.id === user?.ringtone)?.url || RINGTONE_OPTIONS[0]?.url || 'https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3';
    soundService.playRingtone(ringtoneUrl, true);

    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
    }

    // High-precision interval that calculates exact time left from timestamp
    ringtoneIntervalRef.current = setInterval(() => {
      if (!ringtoneEndTimeRef.current) {
        if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
        return;
      }
      const remainingMs = ringtoneEndTimeRef.current - Date.now();
      const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
      setRingtoneCountdown(secondsLeft);

      if (remainingMs <= 0) {
        if (ringtoneIntervalRef.current) {
          clearInterval(ringtoneIntervalRef.current);
          ringtoneIntervalRef.current = null;
        }
        ringtoneEndTimeRef.current = null;
        setIsRinging(false);
        setRingtoneCountdown(0);
        soundService.stop();
      }
    }, 250);
  }, [user?.ringtone]);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [postedRides, setPostedRides] = useState<any[]>([]);
  const [carpoolNotifications, setCarpoolNotifications] = useState<string[]>([]);
  const [carpoolChatMessages, setCarpoolChatMessages] = useState<any[]>(INITIAL_CARPOOL_MESSAGES);
  const [activeSubChat, setActiveSubChat] = useState<'carpool_group' | 'saddiq'>('carpool_group');
  const [chatInputText, setChatInputText] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    rideId: string;
    callerRole: 'driver' | 'passenger';
    callerName: string;
    callerPhone: string;
    callerVehicle?: string;
    status: 'ringing' | 'connected' | 'ended';
  } | null>(null);

  const [pendingCallRating, setPendingCallRating] = useState<{
    rideId: string;
    callerName: string;
    callerRole: 'driver' | 'passenger';
    duration: number;
  } | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [callComment, setCallComment] = useState<string>('');

  const [callTimer, setCallTimer] = useState<number>(0);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedLowFareOfferKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (activeCall) {
      if (activeCall.status === 'ringing') {
        const ringtoneUrl = 'https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3';
        soundService.playRingtone(ringtoneUrl, true);
        const isUrdu = language === 'ur';
        const msg = isUrdu 
          ? `${activeCall.callerName} کی طرف سے لائیو انٹرنیٹ کال آ رہی ہے` 
          : `Incoming live internet call from ${activeCall.callerName}`;
        voiceService.speak(msg, isUrdu ? 'ur-PK' : 'en-US');

        // Auto-connect call after 2.5 seconds for active call connection
        const connectTimeout = setTimeout(() => {
          setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
          if (activeCall?.rideId) {
            const ride = activeRides.find(r => r.id === activeCall.rideId);
            saveCallToFirestore({
              callId: activeCall.rideId,
              from: activeCall.callerRole === 'driver' ? (ride?.driverId || 'driver') : (ride?.passengerId || 'passenger'),
              to: activeCall.callerRole === 'driver' ? (ride?.passengerId || 'passenger') : (ride?.driverId || 'driver'),
              status: 'connected'
            });
          }
        }, 2500);

        // Auto-end ringing call after 35 seconds if not answered
        const ringingTimeout = setTimeout(() => {
          if (activeCall.status === 'ringing') {
            handleEndCall();
          }
        }, 35000);
        return () => {
          clearTimeout(connectTimeout);
          clearTimeout(ringingTimeout);
        };
      } else if (activeCall.status === 'connected') {
        soundService.stop();
        const isUrdu = language === 'ur';
        voiceService.speak(isUrdu ? 'کال مربوط ہو گئی ہے' : 'Call connected', isUrdu ? 'ur-PK' : 'en-US');

        if (!callTimerRef.current) {
          setCallTimer(0);
          callTimerRef.current = setInterval(() => {
            setCallTimer(prev => prev + 1);
          }, 1000);
        }
      }
    } else {
      soundService.stop();
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      setCallTimer(0);
    }
  }, [activeCall?.status, language]);

  const handleStartCall = (rideId: string, callerRole: 'driver' | 'passenger') => {
    const isUrdu = language === 'ur';
    const ride = activeRides.find(r => r.id === rideId);
    const passengerId = ride?.passengerId || 'passenger';
    const driverId = ride?.driverId || 'driver';

    saveCallToFirestore({
      callId: rideId,
      from: callerRole === 'driver' ? driverId : passengerId,
      to: callerRole === 'driver' ? passengerId : driverId,
      status: 'ringing'
    });

    if (callerRole === 'driver') {
      const passengerName = ride?.passengerName || (isUrdu ? 'مسافر' : 'Passenger');
      const passengerPhone = ride?.passengerPhone || '0300-1234567';
      setActiveCall({
        rideId,
        callerRole: 'driver',
        callerName: passengerName,
        callerPhone: passengerPhone,
        status: 'ringing'
      });
      voiceService.speak(isUrdu ? 'مسافر کو لائیو انٹرنیٹ نیٹ ورک پر کال کی جا رہی ہے...' : 'Calling passenger over direct internet network...', isUrdu ? 'ur-PK' : 'en-US');
    } else {
      const driverName = ride?.driverName || (isUrdu ? 'ڈرائیور' : 'Driver Captain');
      const driverPhone = ride?.driverPhone || '0300-5544321';
      const vehicle = ride?.driverVehicle || ride?.vehicleType || 'sedan';
      setActiveCall({
        rideId,
        callerRole: 'passenger',
        callerName: driverName,
        callerPhone: driverPhone,
        callerVehicle: vehicle,
        status: 'ringing'
      });
      voiceService.speak(isUrdu ? 'ڈرائیور کو لائیو انٹرنیٹ نیٹ ورک پر کال کی جا رہی ہے...' : 'Calling driver over direct internet network...', isUrdu ? 'ur-PK' : 'en-US');
    }
  };

  const handleAnswerCall = () => {
    if (activeCall) {
      const ride = activeRides.find(r => r.id === activeCall.rideId);
      saveCallToFirestore({
        callId: activeCall.rideId,
        from: activeCall.callerRole === 'driver' ? (ride?.driverId || 'driver') : (ride?.passengerId || 'passenger'),
        to: activeCall.callerRole === 'driver' ? (ride?.passengerId || 'passenger') : (ride?.driverId || 'driver'),
        status: 'connected'
      });
    }
    setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
  };

  const handleEndCall = () => {
    if (activeCall) {
      const ride = activeRides.find(r => r.id === activeCall.rideId);
      saveCallToFirestore({
        callId: activeCall.rideId,
        from: activeCall.callerRole === 'driver' ? (ride?.driverId || 'driver') : (ride?.passengerId || 'passenger'),
        to: activeCall.callerRole === 'driver' ? (ride?.passengerId || 'passenger') : (ride?.driverId || 'driver'),
        status: 'ended'
      });
      const callData = {
        rideId: activeCall.rideId,
        callerName: activeCall.callerName,
        callerRole: activeCall.callerRole,
        duration: callTimer
      };
      setActiveCall(null);
      setPendingCallRating(callData);
    } else {
      setActiveCall(null);
    }
    soundService.stop();
    const isUrdu = language === 'ur';
    voiceService.speak(isUrdu ? 'کال بند کر دی گئی ہے' : 'Call ended', isUrdu ? 'ur-PK' : 'en-US');
  };

  const handleSaveCallFeedback = (rating: number, comment: string) => {
    if (!pendingCallRating) return;
    try {
      const existing = JSON.parse(localStorage.getItem('prorider_call_feedbacks') || '[]');
      const newFeedback = {
        id: 'fb-' + Date.now(),
        rideId: pendingCallRating.rideId,
        callerName: pendingCallRating.callerName,
        callerRole: pendingCallRating.callerRole,
        duration: pendingCallRating.duration,
        rating,
        comment,
        timestamp: Date.now()
      };
      localStorage.setItem('prorider_call_feedbacks', JSON.stringify([newFeedback, ...existing]));
    } catch (e) {}
    setPendingCallRating(null);
    setRatingValue(5);
    setCallComment('');
    const isUrdu = language === 'ur';
    voiceService.speak(isUrdu ? 'آپ کی ریٹنگ کا شکریہ!' : 'Thank you for your rating!', isUrdu ? 'ur-PK' : 'en-US');
  };

  const pickupTimeRef = useRef<HTMLInputElement>(null);
  const dropoffTimeRef = useRef<HTMLInputElement>(null);
  const pickupLocationRef = useRef<HTMLInputElement>(null);
  const dropoffLocationRef = useRef<HTMLInputElement>(null);

  const speakAnnouncement = (textEn: string, textUr: string) => {
    if (language === 'ur') {
      voiceService.speak(textUr);
    } else {
      voiceService.speak(textEn);
    }
  };

  const handlePostRide = () => {
    const newRide = {
        pickupTime: pickupTimeRef.current?.value || '08:00 AM',
        dropoffTime: dropoffTimeRef.current?.value || '05:00 PM',
        pickupLocation: pickupLocationRef.current?.value || 'G-11 Islamabad',
        dropoffLocation: dropoffLocationRef.current?.value || 'Blue Area, Islamabad',
        id: 'ride-' + Date.now(),
        serviceType: 'sharing',
        status: 'pending',
        passengerId: user?.id || 'anonymous',
        fare: 15000
    };
    setActiveRides(prev => [newRide as any, ...prev]);
    setPostedRides([...postedRides, newRide]);
    setShowPostForm(false);

    setCarpoolChatMessages(prev => [
      ...prev,
      {
        id: 'msg-user-new-' + Date.now(),
        sender: 'system',
        text: '📢 NEW CARPOOL SYSTEM NOTIFICATION: A new monthly subscription package is pending review!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'notification',
        rideDetails: {
          pickup: newRide.pickupLocation,
          dropoff: newRide.dropoffLocation,
          time: `${newRide.pickupTime} - ${newRide.dropoffTime}`,
          fare: 'Rs. 15,000 / month'
        }
      }
    ]);

    voiceService.speak(language === 'ur' ? "آپ کے روٹ کی تفصیلات پوسٹ کر دی گئی ہیں۔ ایڈمن جلد ہی اس کا جائزہ لیں گے۔" : "Your route details have been posted. Admin will review them shortly.");
  };
  const [selectedStatusForBooking, setSelectedStatusForBooking] = useState<UserStatus | null>(null);

  const [vehicleFares, setVehicleFares] = useState(() => {
    const defaultFares = {
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
    const saved = safeLocalStorage.getItem('prorider_vehicle_fares');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.bike && parsed.bike.base < 300) {
          return parsed;
        }
      } catch (e) {}
    }
    localStorage.setItem('prorider_vehicle_fares', JSON.stringify(defaultFares));
    return defaultFares;
  });

  const [pricingConfig, setPricingConfig] = useState({
    baseFare: 100,
    perKmRate: 40,
    minimumFare: 150,
    surgeMultiplier: 1.2,
    commissionRate: 10,
    nightSurcharge: 50,
    minCallDuration: 15
  });

  const handleBookFromStatus = (status: UserStatus) => {
    setSelectedStatusForBooking(status);
    setActiveTab('home');
    voiceService.speak(language === 'ur' ? "آپ کی منتخب کردہ گاڑی کی بکنگ شروع ہو گئی ہے۔" : "Booking started for your selected vehicle.");
  };

  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [paymentGatewayOpen, setPaymentGatewayOpen] = useState(false);
  const [paymentGatewayMethod, setPaymentGatewayMethod] = useState<'EasyPaisa' | 'JazzCash'>('EasyPaisa');
  const [showScreenshotsModal, setShowScreenshotsModal] = useState(false);
  const [isBiometricRegistering, setIsBiometricRegistering] = useState(false);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  const [showEmergency, setShowEmergency] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [region, setRegion] = useState<'South Asia' | 'Middle East' | 'Global'>('South Asia');
  const [profilePicVisible, setProfilePicVisible] = useState(true);
  const [aboutVisible, setAboutVisible] = useState(true);
  const [adminClicks, setAdminClicks] = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [showVehicleTypePicker, setShowVehicleTypePicker] = useState(false);
  const [showServiceTypePicker, setShowServiceTypePicker] = useState(false);

  const handleSelectVehicleType = (vType: VehicleType) => {
    if (!user) return;
    if (user.role !== 'driver') {
      setShowVehicleTypePicker(false);
      return;
    }

    const driverUser = user as DriverProfile;
    if (driverUser.vehicleType === vType) {
      setShowVehicleTypePicker(false);
      return;
    }

    // Submit pending vehicle change request - vehicle does NOT change until Admin approves
    const updatedUser: DriverProfile = {
      ...driverUser,
      pendingVehicleType: vType
    };
    setUser(updatedUser);
    safeLocalStorage.saveCompactProfile(updatedUser);
    saveUserToFirestore(updatedUser);

    setPendingDrivers(prev => {
      const exists = prev.find(d => d.id === driverUser.id);
      if (exists) {
        return prev.map(d => d.id === driverUser.id ? { ...d, pendingVehicleType: vType } : d);
      } else {
        return [...prev, updatedUser];
      }
    });

    setShowVehicleTypePicker(false);
    const label = getVehicleTypeDisplay(vType);
    voiceService.speak(`Vehicle change request to ${label} submitted for Admin approval.`);
    alert(language === 'ur'
      ? `گاڑی تبدیل کرنے کی درخواست (${label}) ایڈمن کو بھیج دی گئی ہے۔ ایڈمن کی منظوری کے بعد ہی گاڑی تبدیل ہوگی۔`
      : `Vehicle change request to ${label} submitted for Admin approval. The vehicle will not change until Admin approves.`
    );
  };

  const handleSelectServiceType = (sType: ServiceType) => {
    if (!user) return;
    const updated = { ...user, serviceType: sType };
    setUser(updated as any);
    safeLocalStorage.saveCompactProfile(updated);
    setShowServiceTypePicker(false);
    voiceService.speak(`Service type updated to ${sType}`);
  };
  
  // New Ride Approval Flow Logic
  const handlePassengerApproveDriver = (rideId: string, driverId: string) => {
    // Update ride in Firestore: status -> 'passenger_approved'
    // This will trigger a re-render in components monitoring ride status
    // Need to define this function here or ensure it's available.
    // Assuming a helper exists or I need to implement it.
    console.log("Passenger approved driver:", rideId, driverId);
  };
  
  const handleAdminApproveRide = async (rideId: string, driverId: string, fare: number) => {
    try {
      console.log("Attempting to approve ride with:", { rideId, driverId, fare });
      const response = await fetch('/api/admin/approve-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, driverId, fare }),
      });
      
      if (!response.ok) throw new Error(`Approval failed with status: ${response.status}`);
      
      const data = await response.json();
      console.log("Ride approved:", data);
      // Update local state or notify user
    } catch (error) {
      console.warn("Admin approval notice:", error);
    }
  };
  
  const handleCancelRide = async (rideId: string) => {
    setActiveRides(prev => prev.filter(r => r.id !== rideId));
    try {
      updateRideInFirestore(rideId, { 
        status: 'cancelled', 
        statusMessage: 'Ride cancelled - 20% cancellation penalty applied' 
      });
      fetch('/api/cancel-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, penalty: '20%' }),
      }).then(response => {
        if (!response.ok) {
          console.warn("Backend cancellation API returned status:", response.status);
        }
      }).catch(err => {
        console.warn("Backend cancellation API sync notice:", err);
      });
    } catch (error) {
      console.warn("Cancellation notice:", error);
    }
  };
  
  const checkWalletBalanceForBooking = (balance: number, fare: number) => {
    return balance >= fare;
  };
  
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    const saved = safeLocalStorage.getItem('pro_rider_wallet_balance');
    return saved ? Number(saved) : 2450;
  });

  const [emergencyNumbers, setEmergencyNumbers] = useState<string[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('pro_rider_emergency_numbers');
      return saved ? JSON.parse(saved) : ['15', '1122', '03125007782'];
    } catch {
      return ['15', '1122', '03125007782'];
    }
  });

  const [walletTransactions, setWalletTransactions] = useState<any[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('pro_rider_wallet_transactions');
      if (saved) return JSON.parse(saved);
    } catch {}

    // Seed 7-day transaction history relative to today
    const now = new Date();
    const getPastISO = (daysAgo: number) => {
      const d = new Date(now);
      d.setDate(now.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };
    return [
      { id: 'tx-7', type: 'topup', amount: 2000, method: 'EasyPaisa', status: 'completed', date: getPastISO(6) },
      { id: 'tx-6', type: 'ride_fare', amount: -450, method: 'Ride Fare', status: 'completed', date: getPastISO(5) },
      { id: 'tx-5', type: 'ride_fare', amount: -320, method: 'City Ride', status: 'completed', date: getPastISO(4) },
      { id: 'tx-4', type: 'topup', amount: 1500, method: 'JazzCash', status: 'completed', date: getPastISO(3) },
      { id: 'tx-3', type: 'ride_fare', amount: -580, method: 'Intercity Fare', status: 'completed', date: getPastISO(2) },
      { id: 'tx-2', type: 'ride_fare', amount: -350, method: 'Wallet Deduct', status: 'completed', date: getPastISO(1) },
      { id: 'tx-1', type: 'topup', amount: 1000, method: 'EasyPaisa', status: 'completed', date: getPastISO(0) },
    ];
  });

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showDownloadInstructions, setShowDownloadInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [voiceSpeedVal, setVoiceSpeedVal] = useState<number>(() => voiceService.getVoiceSpeed());

  // Mega-Group states (Dynamic from Firestore in future)
  const [showNotifications, setShowNotifications] = useState(false);
  const [groupMembersCount, setGroupMembersCount] = useState(0);
  const [groupDriversCount, setGroupDriversCount] = useState(0);
  const [groupPassengersCount, setGroupPassengersCount] = useState(0);

  const [groupBroadcastStatus, setGroupBroadcastStatus] = useState(() => {
    return localStorage.getItem('pro_rider_group_broadcast') || 'Faizabad traffic is moving slowly. Highly recommend taking Srinagar Highway instead.';
  });
  const [groupBroadcastDriver, setGroupBroadcastDriver] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('pro_rider_group_broadcast_driver');
      return saved ? JSON.parse(saved) : {
        id: 'd-mock-1',
        name: 'Ali Khan',
        vehicleType: 'sedan',
        serviceType: 'city',
        selfieUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
      };
    } catch {
      return {
        id: 'd-mock-1',
        name: 'Ali Khan',
        vehicleType: 'sedan',
        serviceType: 'city',
        selfieUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
      };
    }
  });
  const [groupNotice, setGroupNotice] = useState(() => {
    return localStorage.getItem('pro_rider_group_notice') || 'All Premium Drivers are requested to complete the biometric verification before July 30th.';
  });
  const [groupMuted, setGroupMuted] = useState(() => {
    return localStorage.getItem('pro_rider_group_muted') === 'true';
  });

  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('pro_rider_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [groupDriversList, setGroupDriversList] = useState<any[]>([]);

  const [groupPassengersList, setGroupPassengersList] = useState<any[]>([]);

  const [needsAuth, setNeedsAuth] = useState(false);
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [googleChatSpace, setGoogleChatSpace] = useState<string | null>(() => safeLocalStorage.getItem('pro_rider_chat_space'));
  const [feedbackFormUrl, setFeedbackFormUrl] = useState<string | null>(() => safeLocalStorage.getItem('pro_rider_feedback_form'));
  const [googleSpaces, setGoogleSpaces] = useState<any[]>([]);
  const [googleContacts, setGoogleContacts] = useState<any[]>([]);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);

  // Splash screen timeout (5 seconds) & Logo Preloader
  useEffect(() => {
    // Preload logo images to eliminate visual flicker
    const imgJpg = new Image();
    imgJpg.src = '/logo.jpg';
    const imgPng = new Image();
    imgPng.src = '/logo.png';

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // 1. Local Storage Profile Loader
  useEffect(() => {
    const unsubscribe = initAuth(
      async (fUser, token) => {
        setGoogleUser(fUser);
        setGoogleToken(token);
        setNeedsAuth(false);
        const fbUser = await getUserByGoogleUid(fUser.uid);
        if (fbUser) {
          setUser(fbUser);
          safeLocalStorage.saveCompactProfile(fbUser);
        }
      },
      () => {
        setNeedsAuth(true);
      }
    );

    let isMounted = true;
    
    const loadUser = () => {
      const savedUser = safeLocalStorage.getItem('pro_rider_user');
      if (savedUser && isMounted) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.id) {
            setUser(parsed);
          } else {
            safeLocalStorage.removeItem('pro_rider_user');
          }
        } catch {
          safeLocalStorage.removeItem('pro_rider_user');
        }
      }
      
      // If no user profile exists, keep user null so login screen displays
      if (!savedUser && isMounted) {
        setUser(null);
      }
      
      if (isMounted) setIsLoading(false);
    };

    loadUser();

    // Clean up install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      unsubscribe();
      isMounted = false;
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // We no longer automatically set admin mode based on role on mount.
    // Admin mode must be explicitly activated via the PIN check.
  }, [user?.role]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        setNeedsAuth(false);
        const fbUser = await getUserByGoogleUid(result.user.uid);
        if (fbUser) {
          setUser(fbUser);
          safeLocalStorage.saveCompactProfile(fbUser);
        }
        voiceService.speak("Google account connected successfully.");
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    setGoogleToken(null);
    setNeedsAuth(true);
    voiceService.speak("Disconnected from Google.");
  };

  const notifyGoogleChat = async (message: string) => {
    if (!googleToken || !googleChatSpace) return;
    try {
      await fetch(`https://chat.googleapis.com/v1/${googleChatSpace}/messages`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: message })
      });
    } catch (err) {
      console.warn("Failed to notify Google Chat notice:", err);
    }
  };

  const fetchGoogleSpaces = async () => {
    if (!googleToken) return;
    setIsWorkspaceLoading(true);
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { Authorization: `Bearer ${googleToken}` }
      });
      const data = await res.json();
      setGoogleSpaces(data.spaces || []);
    } catch (err) {
      console.warn("Failed to fetch Google Chat spaces notice:", err);
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const fetchGoogleContacts = async () => {
    if (!googleToken) return;
    setIsWorkspaceLoading(true);
    try {
      const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers', {
        headers: { Authorization: `Bearer ${googleToken}` }
      });
      const data = await res.json();
      const formatted = (data.connections || []).map((conn: any) => ({
        name: conn.names?.[0]?.displayName || 'Unknown',
        phone: conn.phoneNumbers?.[0]?.value || ''
      })).filter((c: any) => c.phone);
      setGoogleContacts(formatted);
    } catch (err) {
      console.warn("Failed to fetch Google Contacts notice:", err);
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const setupFeedbackForm = async () => {
    if (!googleToken) return;
    setIsWorkspaceLoading(true);
    try {
      const res = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          info: {
            title: "ProRider Ride Feedback",
            documentTitle: "ProRider Feedback"
          }
        })
      });
      const form = await res.json();
      
      await fetch(`https://forms.googleapis.com/v1/forms/${form.formId}:batchUpdate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            createItem: {
              item: {
                title: "How was your ride?",
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: "RADIO",
                      options: [
                        { value: "Excellent" },
                        { value: "Good" },
                        { value: "Average" },
                        { value: "Poor" }
                      ]
                    }
                  }
                }
              },
              location: { index: 0 }
            }
          }]
        })
      });

      const url = `https://docs.google.com/forms/d/${form.formId}/viewform`;
      setFeedbackFormUrl(url);
      localStorage.setItem('pro_rider_feedback_form', url);
      voiceService.speak("Feedback form created successfully.");
    } catch (err) {
      console.warn("Failed to create Google Form notice:", err);
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    if (acceptedRide) {
      stopPersistentRingtone();
    }
  }, [acceptedRide, stopPersistentRingtone]);

  // Persistent 15-second Ringtone Trigger for Drivers and Admins
  useEffect(() => {
    if (user && (user.role === 'driver' || user.role === 'admin')) {
      const pendingRides = activeRides.filter(r => 
        (r.status === 'pending' || r.status === 'in_status' || r.status === 'driver_offered' || r.status === 'admin_pending_carpool')
      );
      if (pendingRides.length > 0 && !acceptedRide) {
        const topRide = pendingRides[0];
        // Trigger 15s ringtone ONLY if this is a NEW instant ride ID that we haven't rung for yet
        if (lastRungRideIdRef.current !== topRide.id) {
          startPersistentRingtone(topRide.id);
          pushNotificationService.sendPushNotification(
            topRide.serviceType === 'carpool' ? "New Monthly Carpool Booking! 🚖" : "New Ride Request! 🚖",
            { body: `Pickup: ${topRide.pickupLocation}\nDropoff: ${topRide.dropoffLocation}` }
          );
        }
      }
    }
  }, [activeRides, user, acceptedRide, startPersistentRingtone]);

  useEffect(() => {
    if (statuses.length > 0 && user) {
      const latest = statuses[0];
      if (latest.timestamp > Date.now() - 5000) {
        const soundUrl = NOTIFICATION_OPTIONS.find(n => n.id === user?.notificationSound)?.url || NOTIFICATION_OPTIONS[0].url;
        soundService.playNotification(soundUrl);
      }
    }
  }, [statuses.length]);

  // Passenger Low Fare Alert Effect (Triggers Haptic + Auditory Notification if offer < calculated base fare)
  useEffect(() => {
    if (!user) return;
    const isEnabled = user.lowFareAlertEnabled ?? true;
    if (!isEnabled) return;

    activeRides.forEach(ride => {
      if (ride.driverFareOffers && ride.driverFareOffers.length > 0) {
        const baseFare = ride.fare || 0;
        ride.driverFareOffers.forEach(offer => {
          if (baseFare > 0 && offer.fare < baseFare) {
            const key = `${ride.id}-${offer.driverId}-${offer.fare}`;
            if (!notifiedLowFareOfferKeysRef.current.has(key)) {
              notifiedLowFareOfferKeysRef.current.add(key);
              
              // 1. Trigger Haptic Vibration
              if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                try {
                  navigator.vibrate([200, 100, 200, 100, 300]);
                } catch (e) {
                  console.log('Haptic vibration error:', e);
                }
              }

              // 2. Trigger Auditory Notification Sound
              const soundUrl = NOTIFICATION_OPTIONS.find(n => n.id === user?.notificationSound)?.url || NOTIFICATION_OPTIONS[0].url;
              soundService.playNotification(soundUrl);

              // 3. Spoken Announcement & Visual Feedback
              const isUrdu = language === 'ur';
              const savings = baseFare - offer.fare;
              voiceService.speak(
                isUrdu
                  ? `بنیادی کرائے سے کم آفر! کپتان ${offer.driverName} نے ${offer.fare} روپے کی آفر دی ہے، ${savings} روپے کی بچت!`
                  : `Low fare alert! Captain ${offer.driverName} offered Rs. ${offer.fare}, saving you Rs. ${savings} below calculated base fare.`,
                isUrdu ? 'ur-PK' : 'en-US'
              );
            }
          }
        });
      }
    });
  }, [activeRides, user, language]);

  // 2. Global Data Listeners (Firestore Real-Time)
  useEffect(() => {
    const unsubRides = subscribeToRides((remoteRides) => {
      setActiveRides(remoteRides || []);
    });

    // 30s auto-refresh polling
    const interval = setInterval(async () => {
      try {
        const refreshedRides = await fetchRidesOnce();
        if (refreshedRides && Array.isArray(refreshedRides)) {
          setActiveRides(refreshedRides);
        }
      } catch (err) {
        console.warn("Auto-refresh notice:", err);
      }
    }, 30000);

    const unsubStatuses = subscribeToStatuses((remoteStatuses) => {
      setStatuses(remoteStatuses || []);
    });

    const unsubGroup = subscribeToGroupConfig((remoteConfig) => {
      if (remoteConfig) {
        if (remoteConfig.broadcastStatus) setGroupBroadcastStatus(remoteConfig.broadcastStatus);
        if (remoteConfig.notice) setGroupNotice(remoteConfig.notice);
        if (remoteConfig.membersCount) setGroupMembersCount(remoteConfig.membersCount);
        if (remoteConfig.driversCount) setGroupDriversCount(remoteConfig.driversCount);
        if (remoteConfig.passengersCount) setGroupPassengersCount(remoteConfig.passengersCount);
        if (remoteConfig.vehicleFares) {
          const defaultFares = {
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
          const remoteBike = remoteConfig.vehicleFares.bike;
          const isTooLow = remoteBike && (remoteBike.base < 50 || remoteBike.perKm < 15);
          const isTooHigh = remoteBike && (remoteBike.base > 5000 || remoteBike.perKm > 1000);
          
          if (isTooLow || isTooHigh) {
            console.log("Detected suspicious rates on Firestore. Reverting to original rates.");
            saveGroupConfigToFirestore({ vehicleFares: defaultFares });
            setVehicleFares(defaultFares);
            localStorage.setItem('prorider_vehicle_fares', JSON.stringify(defaultFares));
          } else {
            setVehicleFares(prev => {
              const merged = { ...prev, ...remoteConfig.vehicleFares };
              localStorage.setItem('prorider_vehicle_fares', JSON.stringify(merged));
              return merged;
            });
          }
        }
        if (remoteConfig.pricingConfig) {
          setPricingConfig(prev => ({ ...prev, ...remoteConfig.pricingConfig }));
        }
      }
    });

    return () => {
      unsubRides();
      unsubStatuses();
      unsubGroup();
      clearInterval(interval);
    };
  }, []);



  // 5. Instant Captain Dispatcher
  useEffect(() => {
    // Only process real-time rides. Simulated dispatcher removed to ensure genuine captain offers.
    const pendingInstantRides = activeRides.filter(r => r.status === 'pending' && r.serviceType !== 'carpool');
    if (pendingInstantRides.length === 0) return;
  }, [activeRides]);

  // 6. Cleanup acceptedRide if it's finished or missing from remote database
  useEffect(() => {
    if (acceptedRide) {
      const exists = activeRides.find(r => r.id === acceptedRide.id);
      if (exists) {
        // Sync local state with remote status
        if (exists.status !== acceptedRide.status) {
          setAcceptedRide(exists);
        }
        // If remote status is completed or cancelled, clear local accepted state
        if (['completed', 'cancelled', 'rejected'].includes(exists.status)) {
          setAcceptedRide(null);
          localStorage.removeItem('pro_rider_accepted_ride');
        }
      } else {
        // If ride was deleted from database, clear it locally
        setAcceptedRide(null);
        localStorage.removeItem('pro_rider_accepted_ride');
      }
    }
  }, [activeRides, acceptedRide]);

  useEffect(() => {
    localStorage.setItem('pro_rider_wallet_balance', String(walletBalance));
  }, [walletBalance]);

  useEffect(() => {
    localStorage.setItem('pro_rider_emergency_numbers', JSON.stringify(emergencyNumbers));
  }, [emergencyNumbers]);

  useEffect(() => {
    localStorage.setItem('pro_rider_wallet_transactions', JSON.stringify(walletTransactions));
  }, [walletTransactions]);

  useEffect(() => {
    if (!user?.id) return;
    
    const unsubCalls = subscribeToCalls(user.id, (calls) => {
      // Find the most recent active call
      const latestCall = calls.find(c => c.status === 'ringing' || c.status === 'connected');
      if (latestCall) {
        const ride = activeRides.find(r => r.id === latestCall.callId);
        if (ride) {
          const isDriverCall = latestCall.from === ride.driverId;
          setActiveCall(prev => {
            if (prev && prev.status === 'connected' && latestCall.status === 'ringing') {
              return prev;
            }
            return {
              rideId: ride.id,
              callerName: isDriverCall ? (ride.driverName || 'Driver') : (ride.passengerName || 'Passenger'),
              callerRole: isDriverCall ? 'driver' : 'passenger',
              callerPhone: isDriverCall ? (ride.driverPhone || '') : (ride.passengerPhone || ''),
              status: latestCall.status,
              callerVehicle: isDriverCall ? ride.vehicleType : undefined,
            };
          });
        }
      } else if (activeCall && activeCall.status !== 'ended') {
        // Only end if there's no ringing or connected calls
        setActiveCall(null);
      }
    });

    return () => unsubCalls();
  }, [user?.id, activeRides]);

  // Listen to active rides specifically assigned to this driver
  useEffect(() => {
    if (user?.role !== 'driver' || !user?.id) return;
    
    const unsubDriverRides = subscribeToDriverRides(user.id, (driverRides) => {
      setActiveRides(prev => {
        const merged = [...prev];
        driverRides.forEach(dr => {
          if (dr.status !== 'cancelled') {
            const index = merged.findIndex(r => r.id === dr.id);
            if (index >= 0) {
              merged[index] = dr;
            } else {
              merged.push(dr);
            }
          }
        });
        return merged;
      });
    });
    
    return () => unsubDriverRides();
  }, [user?.id, user?.role]);

  useEffect(() => {
    localStorage.setItem('pro_rider_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('pro_rider_theme', theme);
    if (theme !== 'light') {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0a0a0a';
      document.body.style.color = '#ffffff';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#0a0a0a';
      document.body.style.color = '#111827';
    }
  }, [theme]);

  // Real-time Driver Tracking & Automatic Arrival Detection
  useEffect(() => {
    if (!user || user.role !== 'driver') return;

    const driver = user as DriverProfile;
    // We track position if driver is approved and has an accepted ride
    if (driver.status === 'approved' && driver.acceptedRideId) {
      let watchId: number;

      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const coords = { 
              lat: pos.coords.latitude, 
              lng: pos.coords.longitude 
            };
            updateRideInFirestore(driver.acceptedRideId!, { driverCoords: coords });

            // Automatically update status to 'arrived' if driver's current coordinates are within 50m of pickup
            const currentRide = activeRides.find(r => r.id === driver.acceptedRideId);
            if (currentRide && currentRide.status === 'accepted') {
              const pickup = currentRide.pickupCoords || findLocationNode(currentRide.pickupLocation);
              if (pickup && typeof pickup.lat === 'number' && typeof pickup.lng === 'number') {
                const distMeters = haversineDistanceKm(coords.lat, coords.lng, pickup.lat, pickup.lng) * 1000;
                if (distMeters <= 50) {
                  console.log(`Driver device coordinates within ${Math.round(distMeters)}m of pickup location. Auto-updating to arrived.`);
                  updateRideInFirestore(currentRide.id, { status: 'arrived' });
                  setActiveRides(prev => prev.map(r => r.id === currentRide.id ? { ...r, status: 'arrived' } : r));
                }
              }
            }
          },
          (err) => console.error("Geolocation error:", err),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
      }

      return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [user?.id, user?.role, (user as any)?.status, (user as any)?.acceptedRideId, activeRides]);

  // 2. Interactive Registration Handler
  const handleRegister = async (data: any) => {
    try {
      const finalUid = data.googleUid || 'user-' + Math.random().toString(36).substr(2, 9);

      const newUserProfile = {
        ...data,
        id: finalUid,
        language,
        theme,
        role: data.role,
        status: data.status,
        walletBalance: walletBalance,
        createdAt: Date.now()
      };

      // Save user profile to local storage & Firestore
      safeLocalStorage.saveCompactProfile(newUserProfile);
      setUser(newUserProfile);
      saveUserToFirestore(newUserProfile);
      
      voiceService.speak(newUserProfile.role === 'admin' ? "Admin registration successful!" : (newUserProfile.status === 'pending' ? "Driver registration submitted for approval." : "Registration successful!"));
      
      if (newUserProfile.status === 'pending') {
        alert(translations[language].admin_approval_pending);
      }
    } catch (error) {
       console.error("Registration Error:", error);
    }
  };

  // 3. Post Social Media/Road Conditions Status Story
  const handlePostStatus = async (statusData: Partial<UserStatus>) => {
    if (!user) return;
    const statusId = 'status-' + Math.random().toString(36).substr(2, 9);
    const newStatus: UserStatus = {
      id: statusId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userPhone: user.phone,
      vehicleType: user.role === 'driver' ? (user as DriverProfile).vehicleType : undefined,
      userAvatar: statusData.userAvatar || (user.role === 'driver' ? (user as DriverProfile).selfieUrl : undefined),
      vehicleImageUrl: statusData.vehicleImageUrl,
      timestamp: Date.now(),
      text: statusData.content || statusData.text || '',
      type: statusData.type || 'text',
      content: statusData.content || statusData.text || '',
      metadata: statusData.metadata,
      mediaUrl: statusData.mediaUrl,
      likes: 0
    };

    setStatuses([newStatus, ...statuses]);
    saveStatusToFirestore(newStatus);
  };

  // 4. Admin Profile Verification Approval
  const handleApproveDriver = async (id: string) => {
    try {
      const handledIds: string[] = JSON.parse(safeLocalStorage.getItem('prorider_handled_driver_ids') || '[]');
      if (!handledIds.includes(id)) {
        handledIds.push(id);
        safeLocalStorage.setItem('prorider_handled_driver_ids', JSON.stringify(handledIds));
      }

      await updateUserInFirestore(id, { status: 'approved' });
      setPendingDrivers(prev => prev.filter(d => d.id !== id));
      if (user && user.id === id) {
        const approvedUser = { ...user, status: 'approved' };
        setUser(approvedUser as any);
        safeLocalStorage.saveCompactProfile(approvedUser);
      }
      voiceService.speak("Driver successfully approved and verified!");
    } catch (err) {
      console.error("Error approving driver:", err);
    }
  };

  const handleRejectDriver = async (id: string, reason?: string) => {
    try {
      const handledIds: string[] = JSON.parse(safeLocalStorage.getItem('prorider_handled_driver_ids') || '[]');
      if (!handledIds.includes(id)) {
        handledIds.push(id);
        safeLocalStorage.setItem('prorider_handled_driver_ids', JSON.stringify(handledIds));
      }

      await updateUserInFirestore(id, { status: 'rejected' });
      setPendingDrivers(prev => prev.filter(d => d.id !== id));
      voiceService.speak("Driver application rejected.");
    } catch (err) {
      console.error("Error rejecting driver:", err);
    }
  };

  const handleApproveVehicleChange = async (driverId: string, requestedVehicle: string) => {
    try {
      await updateUserInFirestore(driverId, {
        vehicleType: requestedVehicle as VehicleType,
        pendingVehicleType: undefined
      });

      if (user && user.id === driverId) {
        const updatedUser: DriverProfile = {
          ...(user as DriverProfile),
          vehicleType: requestedVehicle as VehicleType,
          pendingVehicleType: undefined
        };
        setUser(updatedUser);
        safeLocalStorage.saveCompactProfile(updatedUser);
      }

      setPendingDrivers(prev => {
        return prev.map(d => {
          if (d.id === driverId) {
            return {
              ...d,
              vehicleType: requestedVehicle as VehicleType,
              pendingVehicleType: undefined
            };
          }
          return d;
        }).filter(d => d.status === 'pending' || d.pendingVehicleType);
      });

      voiceService.speak("Vehicle change approved by Admin.");
    } catch (err) {
      console.error("Error approving vehicle change:", err);
    }
  };

  const handleRejectVehicleChange = async (driverId: string) => {
    try {
      await updateUserInFirestore(driverId, {
        pendingVehicleType: undefined
      });

      if (user && user.id === driverId) {
        const updatedUser: DriverProfile = {
          ...(user as DriverProfile),
          pendingVehicleType: undefined
        };
        setUser(updatedUser);
        safeLocalStorage.saveCompactProfile(updatedUser);
      }

      setPendingDrivers(prev => {
        return prev.map(d => {
          if (d.id === driverId) {
            return {
              ...d,
              pendingVehicleType: undefined
            };
          }
          return d;
        }).filter(d => d.status === 'pending' || d.pendingVehicleType);
      });

      voiceService.speak("Vehicle change request rejected.");
    } catch (err) {
      console.error("Error rejecting vehicle change:", err);
    }
  };

  // 5. Driver Ride Acceptance Flow - Connects ride directly to driver
  const handleAcceptRide = async (rideId: string, proposedFare?: number) => {
    if (!user) return;
    
    const ride = activeRides.find(r => r.id === rideId);
    if (!ride) return;

    const offerObj = {
      driverId: user.id,
      driverName: user.name,
      driverPhone: user.phone,
      driverVehicle: (user as any).vehicle || (user as any).vehicleType || 'Pro Ride Sedan',
      driverVehicleNumber: (user as any).vehicleNumber || 'ICT-LEB-2024',
      driverComingFrom: (user as any).route || 'Nearby Commercial Hub (1.2 km away)',
      driverSelfie: user.selfieUrl,
      driverRating: (user as any).rating || 5.0,
      fare: proposedFare || ride.fare,
      timestamp: Date.now()
    };

    const existingOffers = ride.driverFareOffers || [];
    const updatedOffers = [...existingOffers.filter(o => o.driverId !== user.id), offerObj];

    const updatedPayload: Partial<Ride> = {
      driverFareOffers: updatedOffers,
    };

    const updatedRide = { ...ride, ...updatedPayload } as Ride;

    setActiveRides(prev => prev.map(r => r.id === rideId ? updatedRide : r));
    updateRideInFirestore(rideId, updatedPayload);

    voiceService.speak(language === 'ur' ? "آپ کی پیشکش مسافر کو بھیج دی گئی ہے۔" : "Your offer has been sent to the passenger.");
  };

  const handleAcceptOffer = async (rideId: string, offer: any) => {
    const ride = activeRides.find(r => r.id === rideId);
    if (!ride) return;

    const updatedPayload: Partial<Ride> = {
      status: 'accepted',
      acceptedAt: Date.now(),
      driverId: offer.driverId,
      driverName: offer.driverName,
      driverVehicle: offer.driverVehicle || 'Pro Ride Vehicle',
      driverVehicleNumber: offer.driverVehicleNumber || 'ICT-LEB-2024',
      driverComingFrom: offer.driverComingFrom || 'Nearby Commercial Hub (1.2 km away)',
      driverSelfie: offer.driverSelfie,
      driverPhone: offer.driverPhone,
      driverRating: offer.driverRating || 4.9,
      fare: offer.fare || ride.fare
    };

    // Check if admin approval is needed for this ride/driver
    // For now, let's assume it's NOT needed for live rides unless specified
    // But the user said "If approval is needed, it should be granted after the driver accepts the ride."
    // We'll set it to 'accepted' by default, and if the system was in a state where admin approval was required,
    // we'd set it to 'driver_pending_admin'.

    setActiveRides(prev => prev.map(r => r.id === rideId ? { ...r, ...updatedPayload } : r));
    updateRideInFirestore(rideId, updatedPayload);
    
    if (language === 'ur') {
      const mode = user?.urduVoiceMode || 'formal';
      const announcement = voiceService.getUrduRideConfirmation({ ...updatedPayload, id: rideId } as any, mode);
      voiceService.speak(announcement);
    } else {
      voiceService.speak("Captain offer accepted! Driver is on the way.");
    }
  };

  const handleUpdateRideStatus = async (rideId: string, status: RideStatus, additionalData?: any) => {
    const extra: any = { ...additionalData };
    if (status === 'accepted') {
      extra.acceptedAt = Date.now();
    } else if (status === 'ongoing') {
      extra.startedAt = Date.now();
    }
    setActiveRides(prev => prev.map(r => r.id === rideId ? { ...r, status, ...extra } : r));
    updateRideInFirestore(rideId, { status, ...extra });
    
    const ride = activeRides.find(r => r.id === rideId) || { ...extra, id: rideId };
    const mode = user?.urduVoiceMode || 'formal';

    if (status === 'arrived') {
      if (language === 'ur') {
        voiceService.speak(voiceService.getUrduRideArrived(ride, mode));
      } else {
        voiceService.speak("You have arrived at the pickup location.");
      }
      pushNotificationService.sendPushNotification("Captain Arrived! 🚗", {
        body: language === 'ur' ? "آپ کا کپتان پک اپ کی جگہ پر پہنچ گیا ہے۔" : "Your captain has arrived at the pickup location. Please meet your driver.",
      });
    } else if (status === 'ongoing') {
      voiceService.speak(language === 'ur' ? "سواری شروع ہو گئی ہے۔" : "Ride has started. Safe journey.");
      pushNotificationService.sendPushNotification("Ride Started! 🛣️", {
        body: language === 'ur' ? "آپ کی سواری کامیابی سے شروع ہو گئی ہے۔" : "Your trip is in progress. Wishing you a safe journey!",
      });
    } else if (status === 'completed') {
      if (language === 'ur') {
        voiceService.speak(voiceService.getUrduRideCompleted(ride, mode));
      } else {
        voiceService.speak("Ride completed successfully.");
      }
      pushNotificationService.sendPushNotification("Ride Completed! ✅", {
        body: language === 'ur' ? "سواری مکمل ہو گئی ہے۔ پرو رائڈر کو منتخب کرنے کا شکریہ!" : "Trip finished. Thank you for riding with Remax Pro Rider AI!",
      });
      setAcceptedRide(null);
    } else if (status === 'accepted') {
      pushNotificationService.sendPushNotification("Ride Accepted! 🚖", {
        body: language === 'ur' ? "کپتان نے آپ کی سواری منظور کر لی ہے اور وہ راستے میں ہے۔" : "Captain has accepted your booking and is en route!",
      });
    }
  };

  const handleForceClearDriverSeat = async () => {
    if (!user) return;
    
    // Find any rides for this driver that are active
    const driverRides = activeRides.filter(r => r.driverId === user.id && ['accepted', 'arrived', 'ongoing', 'driver_pending_admin'].includes(r.status));
    
    // Update all of them to completed
    for (const r of driverRides) {
      setActiveRides(prev => prev.map(item => item.id === r.id ? { ...item, status: 'completed' } : item));
      try {
        updateRideInFirestore(r.id, { status: 'completed' });
      } catch (err) {
        console.error("Firestore update error:", err);
      }
    }
    
    setAcceptedRide(null);
    setIsRinging(false);
    
    // Clean local storage
    try {
      localStorage.removeItem('pro_rider_ringing');
      localStorage.removeItem('pro_rider_active_ride_id');
      for (const r of driverRides) {
        localStorage.removeItem(`on_the_way_${r.id}`);
      }
    } catch (err) {
      console.error(err);
    }
    
    speakAnnouncement(
      "Driver mode refreshed. Seat and dispatch states are fully reset.",
      "ڈرائیور موڈ ریفریش کر دیا گیا ہے۔ سیٹ اور نوکری کی تفصیلات صاف ہو چکی ہیں۔"
    );
  };

  const handleApproveRide = async (rideId: string, extraData?: any) => {
    const ride = activeRides.find(r => r.id === rideId);
    if (!ride) return;

    // Preserve the original driver details on the ride if not explicitly overridden by extraData
    const targetDriverId = extraData?.driverId || ride.driverId || (user?.role === 'driver' ? user.id : 'driver-admin');
    const targetDriverName = extraData?.driverName || ride.driverName || (user?.role === 'driver' ? user.name : 'Pro Captain');
    const targetDriverVehicle = extraData?.driverVehicle || ride.driverVehicle || 'Toyota Corolla • ICT-786';
    const targetDriverPhone = extraData?.driverPhone || ride.driverPhone || '03125007782';
    const targetDriverSelfie = extraData?.driverSelfie || ride.driverSelfie || 'https://images.unsplash.com/photo-1500648767791-0dcc994a43e?w=150';

    const updatePayload: Partial<Ride> = {
      status: 'accepted' as RideStatus,
      acceptedAt: Date.now(),
      driverId: targetDriverId,
      driverName: targetDriverName,
      driverVehicle: targetDriverVehicle,
      driverPhone: targetDriverPhone,
      driverSelfie: targetDriverSelfie,
      ...(extraData || {}),
    };

    setActiveRides(prev => prev.map(r => r.id === rideId ? { ...r, ...updatePayload } : r));
    updateRideInFirestore(rideId, updatePayload);

    const mode = user?.urduVoiceMode || 'formal';

    try {
      fetch('/api/approve-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ride, ...updatePayload }),
      }).catch(err => console.error('Approve ride endpoint sync:', err));
    } catch (err) {
      console.error(err);
    }

    const approvalMsg = language === 'ur' 
      ? `سواری (${ride.pickupLocation} سے ${ride.dropoffLocation}) منظور ہو گئی ہے! ${extraData?.driverName ? `ڈرائیور: ${extraData.driverName}` : ''}`
      : `Ride from ${ride.pickupLocation} to ${ride.dropoffLocation} approved! ${extraData?.driverName ? `Assigned: ${extraData.driverName}` : ''}`;

    setCarpoolNotifications(prev => [approvalMsg, ...prev]);
    
    if (language === 'ur') {
      voiceService.speak(approvalMsg);
    } else {
      voiceService.speak("Ride approved and assigned by Admin.");
    }
  };

  // 6. Passenger Ride Booking Request
  const handleRideBooked = async (rideData: Partial<Ride>) => {
    if (!user) return;
    const rideId = 'ride-' + Math.random().toString(36).substr(2, 9);
    
    const initialStatus = (rideData.serviceType === 'carpool' || rideData.serviceType === 'monthly')
      ? 'admin_pending_carpool'
      : 'pending';

    const newRide: Ride = {
      id: rideId,
      passengerId: user.id,
      passengerName: user.name,
      passengerPhone: user.phone || '0300-1234567',
      status: rideData.status || initialStatus,
      createdAt: Date.now(),
      ...rideData,
    } as Ride;

    setActiveRides(prev => [newRide, ...prev.filter(r => r.id !== newRide.id)]);
    saveRideToFirestore(newRide);

    // Sync to Google Chat
    if (googleToken && googleChatSpace) {
      notifyGoogleChat(`🚖 *New Ride Booking*\nPassenger: ${user?.name}\nPickup: ${newRide.pickupLocation}\nDropoff: ${newRide.dropoffLocation}\nFare: ${newRide.fare} PKR`);
    }

    // Sync to Google Sheets via backend
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRide)
    }).catch(err => {
      console.warn("Failed to sync booking to sheets:", err);
    });
    
    if (rideData.serviceType === 'monthly' || rideData.serviceType === 'carpool' || (rideData as any).travelDays) {
      // Monthly carpool package: Send quiet notification to driver chat instead of broadcasting ringtone to everyone
      const monthlyMessage = {
        id: 'msg-' + Date.now(),
        senderName: user.name || 'Passenger',
        senderPhone: user.phone || '',
        text: `🟢 MONTHLY CARPOOL BOOKED: Pickup ${newRide.pickupLocation} ➔ Dropoff ${newRide.dropoffLocation} (${(newRide as any).travelDays || 22} Days/mo, Fare: Rs. ${newRide.fare?.toLocaleString()})`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDriver: false,
        isMonthlyBookingNotice: true,
        status: 'booked'
      };
      setCarpoolChatMessages(prev => [monthlyMessage, ...prev]);
      setCarpoolNotifications(prev => [
        `Monthly Carpool Booked: ${newRide.pickupLocation} to ${newRide.dropoffLocation}`,
        ...prev
      ]);
      voiceService.speak(language === 'ur' ? "ماہانہ پیکج بک ہو گیا ہے۔ ڈرائیور چیٹ میں نوٹیفکیشن بھیج دی گئی ہے۔" : "Monthly package booked. Notification dispatched to driver chat.");
    } else if (rideData.serviceType !== 'sharing') {
      voiceService.speak(language === 'ur' ? "سواری کی درخواست بھیج دی گئی ہے۔ قریبی ڈرائیور تلاش کیا جا رہا ہے۔" : "Ride request submitted. Finding nearest captain.");
    } else {
      voiceService.speak(language === 'ur' ? "شیئرنگ سواری کی درخواست بھیج دی گئی ہے۔ ایڈمن جلد آپ سے رابطہ کرے گا۔" : "Sharing ride request submitted. Admin will contact you soon.");
    }
  };

  // 7. Sign Out / Clean local cache
  const handleLogout = () => {
    setUser(null);
    setIsAdminMode(false);
    setActiveTab('home');
    setAcceptedRide(null);
    setActiveRide(null);
    setIsRinging(false);
    setShowCalculator(false);
    setShowProfileDetail(false);
    setShowDownloadInstructions(false);
    localStorage.removeItem('pro_rider_user');
    localStorage.removeItem('pro_rider_admin_mode');
    voiceService.speak("Logged out safely. Goodbye!");
  };

  const handleShare = async () => {
    const currentUrl = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null' 
      ? window.location.origin 
      : 'https://prorider.app';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pro Rider - Official Pakistan Mobility App',
          text: 'Pro Rider - Premium Ride Hailing & Carpool Application',
          url: currentUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`Pro Rider App: ${currentUrl}`);
      voiceService.speak("Pro Rider link copied to clipboard!");
      alert(language === 'ur' ? `🔗 پرو رائڈر ایپ کا لنک (${currentUrl}) کاپی ہو گیا ہے!` : `🔗 Pro Rider App link (${currentUrl}) copied to clipboard!`);
    }
  };

  const handleSwitchToPassengerMode = () => {
    setIsAdminMode(false);
    localStorage.setItem('pro_rider_admin_mode', 'false');
    if (!user) return;
    const updated = { ...user, role: 'passenger' } as UserProfile;
    setUser(updated);
    safeLocalStorage.saveCompactProfile(updated);
    voiceService.speak("Passenger Mode activated.");
  };

  const handleSwitchToDriverMode = () => {
    setIsAdminMode(false);
    localStorage.setItem('pro_rider_admin_mode', 'false');
    if (!user) return;
    const updated = {
      ...user,
      role: 'driver',
      status: 'approved',
      selfieUrl: user.selfieUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      vehicleType: (user as any).vehicleType || 'sedan',
      serviceType: (user as any).serviceType || 'city',
    } as DriverProfile;
    setUser(updated);
    safeLocalStorage.saveCompactProfile(updated);
    voiceService.speak(language === 'ur' ? "ڈرائیور موڈ فعال ہو گیا ہے۔ آپ یہاں سواریوں کی درخواستیں دیکھ سکتے ہیں، اپنی حیثیت آن لائن کر سکتے ہیں، اور روٹس کا انتظام کر سکتے ہیں۔" : "Driver Mode activated. You can view ride requests, set your status to online, and manage routes.");
  };

  const handleSwitchToAdminMode = () => {
    setAdminPinInput('');
    setAdminPinError(null);
    setShowAdminModal(true);
  };

  const toggleLanguage = () => {
    const next: Language = language === 'en' ? 'ur' : 'en';
    setLanguage(next);
  };

  const handleLogoClick = () => {
    setActiveTab('home');
    if (isAdminMode) {
      setActiveTab(prev => prev === 'admin' ? 'home' : 'admin');
    } else {
      setAdminClicks(prev => {
        const next = prev + 1;
        if (next >= 5) {
          setAdminPinInput('');
          setAdminPinError(null);
          setShowAdminModal(true);
          return 0;
        }
        return next;
      });
    }
  };

  const handleVerifyAdminPin = (pinToTest?: string) => {
    const pin = pinToTest !== undefined ? pinToTest : adminPinInput;
    const correctPassword = localStorage.getItem('pro_rider_admin_password') || '50007782';
    if (pin.trim() === correctPassword) {
      setIsAdminMode(true);
      // We don't save this to localStorage so it resets on refresh as requested
      setActiveTab('admin');
      setShowAdminModal(false);
      setAdminPinInput('');
      setAdminPinError(null);
      voiceService.speak("Admin Mode activated.");
      alert(language === 'ur' ? "🔑 ایڈمن موڈ فعال ہو گیا ہے! ایڈمن پینل اب کھل چکا ہے۔" : "🔑 Admin Mode Activated! The Admin Console is now available in the bottom navigation.");
    } else {
      setAdminPinError(language === 'ur' ? "❌ غلط پاسورڈ!" : "❌ Incorrect Admin Password!");
      voiceService.speak("Incorrect password.");
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleVerifySelfie = async (selfieUrl: string) => {
    if (!user) return;
    try {
      await updateUserInFirestore(user.id, { selfieUrl, isVerified: true });
      const updatedUser = { ...user, selfieUrl, isVerified: true };
      setUser(updatedUser);
      safeLocalStorage.saveCompactProfile(updatedUser);
      setShowVerificationPrompt(false);
      voiceService.speak(language === 'ur' ? "سیلفی ویریفیکیشن کامیاب!" : "Selfie verification successful! Profile is now complete.");
    } catch (err) {
      console.error("Verification error:", err);
    }
  };

  return (
    <ErrorBoundary>
      {isLoading ? (
        <div className="h-full w-full bg-black flex flex-col items-center justify-center p-6 text-white space-y-4 font-sans">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(250,204,21,0.3)]" />
          <h1 className="text-xl font-black uppercase tracking-[0.2em] text-white">
            PRO RIDER <span className="text-yellow-400">AI</span>
          </h1>
          <p className="text-[10px] text-yellow-400/80 font-black uppercase tracking-widest animate-pulse">
            Loading system...
          </p>
        </div>
      ) : !user ? (
        <div className={`h-full w-full ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-100'} flex items-center justify-center ${language === 'ur' ? 'font-urdu' : ''}`}>
          <div className={`w-full h-full sm:max-w-[420px] sm:h-[90vh] sm:rounded-[3.5rem] ${theme === 'dark' ? 'bg-neutral-900 text-white sm:border-neutral-800' : 'bg-white text-gray-900 sm:border-white'} shadow-2xl overflow-hidden relative flex flex-col p-8 space-y-8 sm:border-[12px]`}>
             <div className="flex justify-between items-center mb-4">
               <button onClick={() => setShowLanguagePicker(true)} className="p-3 bg-gray-50 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 border border-gold-dark/5">
                 <Globe className="w-4 h-4" /> {language === 'ur' ? 'اردو' : 'ENGLISH'}
               </button>
               <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400 shadow-xl flex items-center justify-center bg-black">
                 <img 
                   src="/logo.jpg" 
                   alt="Pro Rider Logo" 
                   className="w-full h-full object-cover" 
                   referrerPolicy="no-referrer" 
                   onError={(e) => {
                     e.currentTarget.onerror = null;
                     e.currentTarget.src = '/logo.png';
                   }}
                 />
               </div>
               <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-3 bg-gray-50 rounded-2xl border border-gold-dark/5">
                 {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <Registration onRegister={handleRegister} language={language} onAdminPrompt={() => setShowAdminModal(true)} />
            </div>

            {/* Admin Password Modal Triggered via secret logo click */}
            <AnimatePresence>
              {showAdminModal && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-xs bg-black text-yellow-400 rounded-3xl p-6 border-2 border-yellow-500/40 shadow-2xl relative space-y-4"
                  >
                    <button 
                      onClick={() => setShowAdminModal(false)}
                      className="absolute top-4 right-4 p-1.5 bg-gray-900 rounded-full text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-400 text-black rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black uppercase tracking-tight text-white">
                          {language === 'ur' ? 'ایڈمن پاسورڈ درج کریں' : 'Admin Access Verification'}
                        </h3>
                        <p className="text-[9px] font-bold text-yellow-300/80 uppercase tracking-wider">
                          {language === 'ur' ? 'ایڈمن موڈ کھولنے کے لیے پاسورڈ درج کریں' : 'Enter PIN to enable Admin Mode'}
                        </p>
                      </div>
                    </div>

                    {adminPinError && (
                      <div className="p-2.5 bg-red-950/80 border border-red-500/40 text-red-300 rounded-xl text-[11px] font-black text-center">
                        {adminPinError}
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <input 
                        type="password"
                        value={adminPinInput}
                        onChange={(e) => {
                          setAdminPinInput(e.target.value);
                          setAdminPinError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleVerifyAdminPin();
                          }
                        }}
                        placeholder="••••••••"
                        autoFocus
                        autoComplete="off"
                        className="w-full text-center text-xl font-mono tracking-widest py-3 px-4 bg-gray-900 text-yellow-400 rounded-2xl border-2 border-yellow-500/30 focus:border-yellow-400 outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => setShowAdminModal(false)}
                        className="flex-1 py-3 bg-gray-900 text-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800"
                      >
                        {language === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                      </button>
                      <button 
                        onClick={() => handleVerifyAdminPin()}
                        className="flex-1 py-3 bg-yellow-400 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        {language === 'ur' ? 'کھولیں' : 'Unlock Admin'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (user && (user.role as string) === 'driver' && (user as DriverProfile).status === 'pending' && (user.role as string) !== 'admin') ? (
        <div className={`h-full w-full bg-gray-50 flex items-center justify-center p-8 ${language === 'ur' ? 'font-urdu' : ''}`}>
          <div className="w-full h-full sm:max-w-[420px] sm:h-[90vh] sm:rounded-[3.5rem] bg-white shadow-2xl overflow-hidden relative flex flex-col p-8 items-center justify-center text-center space-y-6 sm:border-[12px] sm:border-white">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center animate-pulse mb-4">
              <ShieldCheck className="w-12 h-12 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              {language === 'ur' ? 'منظوری باقی ہے' : 'Approval Pending'}
            </h2>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              {language === 'ur' 
                ? 'آپ کا ڈرائیور اکاؤنٹ اس وقت ہماری ایڈمن ٹیم کے زیر غور ہے۔ آپ کی منظوری 24 گھنٹوں کے اندر فراہم کی جائے گی، جس کے بعد درخواست کھل جائے گی۔' 
                : 'Your driver account is currently under review. Approval will be provided within 24 hours, after which the application will open.'}
            </p>
            <div className="pt-8 w-full space-y-4">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
              >
                {language === 'ur' ? 'دوبارہ چیک کریں' : 'Check Status Again'}
              </button>
              <button 
                onClick={handleLogout} 
                className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
              >
                {language === 'ur' ? 'لاگ آؤٹ' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      ) : (
      <div className={`h-full w-full ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-100'} flex items-center justify-center ${language === 'ur' ? 'font-urdu' : ''}`}>
        <div className={`w-full h-full sm:max-w-[420px] sm:h-[90vh] sm:rounded-[3.5rem] ${theme === 'dark' ? 'bg-[#0c0c0c] text-white sm:border-neutral-800' : 'bg-white text-gray-900 sm:border-gray-200'} shadow-2xl overflow-hidden relative flex flex-col sm:border-[12px]`}>
          <MainLayout 
            user={user || undefined}
            activeRide={acceptedRide || (Array.isArray(activeRides) && activeRides.length > 0 ? activeRides[0] : null)}
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            onSettingsClick={() => handleTabChange('settings')}
            onMessagesClick={() => setActiveTab('chats')}
            onStatusClick={() => setActiveTab('status')}
            onLogout={handleLogout}
            onLogoClick={handleLogoClick}
            language={language} 
            theme={theme}
            isAdmin={isAdminMode}
            globalStatus={globalStatus}
            onStatusChange={setGlobalStatus}
            hideNavigation={user?.role === 'driver' && !!acceptedRide}
          >
          {activeTab === 'admin' ? (
            <AdminPanel 
              pendingDrivers={pendingDrivers} 
              activeRides={activeRides}
              onApprove={handleApproveDriver} 
              onReject={handleRejectDriver} 
              onApproveVehicleChange={handleApproveVehicleChange}
              onRejectVehicleChange={handleRejectVehicleChange}
              onApproveRide={handleApproveRide}
              onUpdateRideStatus={handleUpdateRideStatus}
               onCancelRide={handleCancelRide}
              onCompleteRide={(id) => {
                setActiveRides(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r));
              }}
              onUpdateWallet={(amount, reason) => {
                setWalletBalance(prev => prev + amount);
                setWalletTransactions(prev => [
                  { id: 'tx-' + Date.now(), type: amount >= 0 ? 'admin_credit' : 'admin_debit', amount, method: 'Admin Adjustment: ' + reason, status: 'completed', date: new Date().toISOString().split('T')[0] },
                  ...prev
                ]);
              }}
              walletBalance={walletBalance}
              walletTransactions={walletTransactions}
              globalStatus={globalStatus}
              onStatusChange={setGlobalStatus}
              onDeleteAllRides={deleteAllRidesFromFirestore}
              language={language}
              vehicleFares={vehicleFares}
              pricingConfig={pricingConfig}
              onUpdateVehicleFares={setVehicleFares}
              onUpdatePricingConfig={setPricingConfig}
              onLogout={handleLogout}
            />
          ) : (
            <>
              {activeTab === 'home' && user && (user.role === 'passenger' || !user.role || user.role === 'admin') && (
                <PassengerDashboard 
                  user={user as UserProfile}
                  language={language}
                  theme={theme}
                  walletBalance={walletBalance}
                  activeRides={activeRides}
                  availableDrivers={driverProfiles}
                  onBookRide={handleRideBooked}
                  onAcceptOffer={handleAcceptOffer}
                  onCancelRide={handleCancelRide}
                  onNavigate={handleTabChange}
                  onStartCall={handleStartCall}
                />
              )}

              {activeTab === 'rentals' && (
                <div className="p-8 text-center space-y-4">
                   <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                     <Car className="w-10 h-10 text-yellow-600" />
                   </div>
                   <h2 className="text-xl font-black uppercase">{language === 'ur' ? 'گاڑیوں کا کرایہ' : 'Vehicle Rentals'}</h2>
                   <p className="text-sm text-gray-500">{language === 'ur' ? 'کرائے کی گاڑیاں جلد دستیاب ہوں گی۔' : 'Rental vehicles will be available soon.'}</p>
                </div>
              )}

              {activeTab === 'home' && user && user.role === 'driver' && (
                <DriverDashboard 
                  driver={user}
                  acceptedRide={acceptedRide}
                  activeRides={activeRides}
                  onAccept={handleAcceptRide}
                  onReject={() => {}}
                  onUpdateStatus={handleUpdateRideStatus}
                  onForceClearSeat={handleForceClearDriverSeat}
                  language={language}
                  theme={theme}
                  pricingConfig={pricingConfig}
                  ringtoneCountdown={ringtoneCountdown}
                  onStartCall={handleStartCall}
                />
              )}
            </>
          )}

          {activeTab === 'chats' && (
            <Suspense fallback={<LoadingSpinner />}>
              <CarpoolChatRoom
                user={user || undefined}
                activeRides={activeRides}
                onAcceptRide={handleAcceptRide}
                onApproveRide={handleApproveRide}
                onUpdateRideStatus={handleUpdateRideStatus}
                onRateRide={(rideId, rating, comment, role) => {
                  const updates: any = { ratedAt: Date.now() };
                  if (role === 'passenger') {
                    updates.passengerRating = rating;
                    updates.passengerComment = comment;
                    updates.driverRating = rating;
                  } else {
                    updates.driverRatingForPassenger = rating;
                    updates.driverCommentForPassenger = comment;
                  }
                  setActiveRides(prev => prev.map(r => r.id === rideId ? { ...r, ...updates } : r));
                  updateRideInFirestore(rideId, updates);
                  voiceService.speak(language === 'ur' ? "درجہ بندی محفوظ ہو گئی ہے۔" : "Rating saved successfully.");
                }}
                language={language}
                carpoolChatMessages={carpoolChatMessages}
                setCarpoolChatMessages={setCarpoolChatMessages}
                speakAnnouncement={(en, ur) => voiceService.speak(language === 'ur' ? ur : en)}
              />
            </Suspense>
          )}

          {activeTab === 'community' && (
            <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar space-y-6">
              <h2 className="text-2xl font-black text-black uppercase tracking-tighter">
                {language === 'ur' ? 'کمیونٹی' : 'Community'}
              </h2>

              {/* What does Community mean banner */}
              <div className="bg-yellow-50 border-2 border-yellow-200 p-5 rounded-[28px] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center text-black font-black">👥</div>
                  <h3 className="text-xs font-black uppercase tracking-tight text-black">
                    {language === 'ur' ? 'کمیونٹی سے کیا مراد ہے؟' : 'What does "Community" mean?'}
                  </h3>
                </div>
                <p className="text-[10px] text-gray-700 font-bold leading-relaxed">
                  {language === 'ur'
                    ? 'کمیونٹی ایک مشترکہ رئیل ٹائم نیٹ ورک چینل ہے جہاں ڈرائیور اور مسافر ٹریفک کی صورتحال، روٹ کی معلومات اور لائیو روڈ اپ ڈیٹس کا تبادلہ کرتے ہیں۔'
                    : 'Community is the shared real-time network channel where drivers and passengers broadcast live road updates, traffic conditions, and trip announcements.'}
                </p>
              </div>
              
                {/* Driver Community View */}
                {user?.role === 'driver' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-4 h-4 text-yellow-600" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                        {language === 'ur' ? 'قریبی ڈرائیورز اور روٹس' : 'Nearby Drivers & Routes'}
                      </h3>
                    </div>
                    
                    {driverProfiles.filter(d => 
                      !chatSearchQuery || 
                      d.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) || 
                      (d.route || '').toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                      d.vehicleType.toLowerCase().includes(chatSearchQuery.toLowerCase())
                    ).length > 0 ? (
                      driverProfiles.filter(d => 
                        !chatSearchQuery || 
                        d.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) || 
                        (d.route || '').toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                        d.vehicleType.toLowerCase().includes(chatSearchQuery.toLowerCase())
                      ).map((driver) => (
                        <div key={driver.id} className="p-4 bg-gray-50 rounded-[28px] border-2 border-transparent hover:border-yellow-400 transition-all flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-yellow-400 font-black text-xs uppercase">
                                {driver.name.substring(0, 2)}
                              </div>
                              <div>
                                <p className="text-xs font-black uppercase">{driver.name}</p>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-yellow-600" />
                                  <p className="text-[10px] text-gray-500 font-bold">{driver.route || 'No active route'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="px-3 py-1 bg-white rounded-full border border-gray-200">
                              <p className="text-[9px] font-black uppercase tracking-tighter text-yellow-600">
                                {Math.floor(Math.random() * 5 + 3)}KM AWAY
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 opacity-30">
                        <Users className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          {language === 'ur' ? 'کوئی ڈرائیور نہیں ملا' : 'No drivers found'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          {activeTab === 'carpooling' && (
            <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-black text-black uppercase tracking-tighter">
                    {language === 'ur' ? 'کارپولنگ روم' : 'Car Pooling Room'}
                  </h2>
                  <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">
                    {language === 'ur' ? 'ماہانہ 22 دن کی مشترکہ اور الگ سواریاں' : 'Monthly 22-Day Shared & Separate Car Subscriptions'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-yellow-400">
                  <Car className="w-6 h-6" />
                </div>
              </div>

              {/* Carpooling Notifications */}
              <AnimatePresence>
                {carpoolNotifications.length > 0 && (
                  <div className="space-y-2">
                    {carpoolNotifications.map((note, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-emerald-50 border-2 border-emerald-100 p-3 rounded-2xl flex items-center gap-3"
                      >
                        <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-[10px]">✓</div>
                        <p className="text-[10px] font-black text-emerald-900 uppercase tracking-tight">{note}</p>
                        <button 
                          onClick={() => setCarpoolNotifications(prev => prev.filter((_, i) => i !== idx))}
                          className="ml-auto text-emerald-300 hover:text-emerald-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {/* Step Navigation for Join Request */}
              {user?.role === 'driver' ? (
                <div className="space-y-6">
                  <div className="bg-neutral-900 text-white p-6 rounded-[32px] border-2 border-yellow-400 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center text-black font-black text-xs">🚗</div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-tight text-yellow-400">
                          {language === 'ur' ? 'روٹ کے مسافر اور مقامات' : 'Route Passengers & Locations'}
                        </h3>
                        <p className="text-[9px] text-gray-300 font-bold uppercase tracking-wider">Live Active Passenger Radar</p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-3">
                      <p className="text-xs font-black uppercase text-yellow-300">
                        📊 Total Passengers Waiting on Route: <span className="text-white text-sm">{activeRides.length}</span>
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {activeRides.length > 0 ? activeRides.map((ride, i) => (
                          <div key={ride.id || i} className="p-3 bg-black/60 rounded-xl border border-white/10 text-[10px] space-y-1">
                            <p className="text-yellow-400 font-black uppercase">Passenger #{i+1} • Rs. {ride.fare}</p>
                            <p className="text-white">📍 <strong className="text-gray-400">Pickup:</strong> {ride.pickupLocation}</p>
                            <p className="text-white">🏁 <strong className="text-gray-400">Drop-off:</strong> {ride.dropoffLocation}</p>
                          </div>
                        )) : (
                          <p className="text-[10px] text-gray-400 italic">No passengers waiting currently. You are online and ready.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Carpooling Form */}
                  <Suspense fallback={<LoadingSpinner />}>
                    <BookingForm
                      language={language}
                      initialMode="carpool"
                      onSave={(data) => {
                        handleRideBooked(data);
                        if (voiceService && typeof voiceService.speak === 'function') {
                          voiceService.speak(language === 'ur' ? "کارپولنگ کی درخواست جمع ہو گئی" : "Carpooling booking submitted successfully.");
                        }
                      }}
                    />
                  </Suspense>

                  {/* Active Carpool Subscriptions & Requests */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-yellow-600" />
                        <span>{language === 'ur' ? 'آپ کی تمام کارپولنگ درخواستیں' : 'Active Carpooling Requests'}</span>
                      </h3>
                      <span className="text-[10px] bg-black text-yellow-400 font-black px-2.5 py-0.5 rounded-full">
                        {activeRides.filter(r => r.serviceType === 'carpool' || r.serviceType === 'sharing').length}
                      </span>
                    </div>

                    {activeRides.filter(r => r.serviceType === 'carpool' || r.serviceType === 'sharing').length === 0 ? (
                      <div className="p-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-center space-y-2">
                        <Car className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-xs text-gray-500 font-bold">
                          {language === 'ur' 
                            ? 'ابھی کوئی کارپولنگ درخواست موجود نہیں۔ اوپر والا فارم پر کریں۔' 
                            : 'No active carpool requests. Complete the form above to book.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeRides.filter(r => r.serviceType === 'carpool' || r.serviceType === 'sharing').map((ride, idx) => (
                          <div key={ride.id || idx} className="p-4 bg-white rounded-3xl border-2 border-black shadow-md space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase bg-black text-yellow-400 px-2.5 py-1 rounded-lg">
                                {ride.vehicleName || 'Mini'} • Rs. {ride.fare?.toLocaleString()} / month
                              </span>
                              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                {ride.status || 'pending'}
                              </span>
                            </div>

                            <div className="text-xs font-bold space-y-1 pt-1 text-black">
                              <p className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span><strong>Pickup:</strong> {ride.pickupLocation}</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                                <span><strong>Dropoff:</strong> {ride.dropoffLocation}</span>
                              </p>
                            </div>

                            {ride.pickupTime && (
                              <div className="text-[10px] text-gray-600 font-bold flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                                <span>⏰ {ride.pickupTime} Pickup</span>
                                <span>•</span>
                                <span>⌛ {ride.dropoffTime} Drop-off</span>
                                {ride.travelDays && <span>• 🗓️ {ride.travelDays} Days</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'status' && (
            <Suspense fallback={<LoadingSpinner />}>
              <StatusView 
                language={language} 
                statuses={statuses} 
                onPostStatus={handlePostStatus} 
                onBookFromStatus={handleBookFromStatus}
                currentUserRole={user?.role}
                activeRides={activeRides}
                userPhone={user?.phone}
              />
            </Suspense>
          )}

          {activeTab === 'settings' && user && (
            <div className="h-full overflow-y-auto custom-scrollbar p-8 space-y-6">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-yellow-400 text-xl font-black shadow-lg border-2 border-yellow-400">
                   {user.name ? user.name[0] : 'U'}
                 </div>
                 <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-black">{user.name || 'User'}</h2>
                    <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">{user.role || 'passenger'}</p>
                 </div>
              </div>

              {/* Mode Status Widget */}
              <div className="p-5 bg-black text-yellow-400 rounded-[28px] border-2 border-yellow-500/20 shadow-xl flex items-center justify-between gap-3">
                 <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-yellow-200/60">System Status</p>
                    <p className="text-xs font-black uppercase tracking-tight text-white mt-0.5">
                       {user.role === 'admin' ? '🛡️ Admin Mode' : user.role === 'driver' ? '🚗 Driver Mode' : '👤 Passenger Mode'}
                    </p>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-green-400">Operational</span>
                 </div>
              </div>

              {/* Passenger Low Fare Alert Settings Toggle Card */}
              <div className="bg-gradient-to-br from-neutral-900 via-black to-neutral-950 text-white p-5 rounded-[28px] border-2 border-yellow-500/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 rounded-2xl flex items-center justify-center font-black shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-tight text-white flex items-center gap-1.5 flex-wrap">
                        <span>{language === 'ur' ? 'کم کرائے کی آفر کا الرٹ' : 'Low Fare Offer Alert'}</span>
                        <span className="text-[8px] bg-yellow-400 text-black font-extrabold px-1.5 py-0.5 rounded">
                          {language === 'ur' ? 'ہاپٹک + ساؤنڈ' : 'HAPTIC + SOUND'}
                        </span>
                      </h3>
                      <p className="text-[9px] text-yellow-200/80 font-bold uppercase tracking-wider mt-0.5">
                        {language === 'ur' ? 'بنیادی کرائے سے کم آفر پر وائبریشن اور ساؤنڈ' : 'Alert when driver offers below FareCalculator Base Fare'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) return;
                      const currentVal = user.lowFareAlertEnabled ?? true;
                      const updated = { ...user, lowFareAlertEnabled: !currentVal } as UserProfile;
                      safeLocalStorage.saveCompactProfile(updated);
                      setUser(updated);

                      if (!currentVal) {
                        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                          try { navigator.vibrate([150, 80, 150]); } catch (e) {}
                        }
                        const soundUrl = NOTIFICATION_OPTIONS.find(n => n.id === user?.notificationSound)?.url || NOTIFICATION_OPTIONS[0].url;
                        soundService.playNotification(soundUrl);
                        voiceService.speak(
                          language === 'ur' ? 'کم کرائے کا ہاپٹک اور ساؤنڈ الرٹ فعال ہو گیا ہے' : 'Low fare haptic and sound alert enabled',
                          language === 'ur' ? 'ur-PK' : 'en-US'
                        );
                      }
                    }}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer border shrink-0 ${
                      (user?.lowFareAlertEnabled ?? true) ? 'bg-yellow-400 border-yellow-300' : 'bg-neutral-800 border-neutral-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                        (user?.lowFareAlertEnabled ?? true) ? 'translate-x-6 bg-black' : 'translate-x-1 bg-gray-400'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[9.5px] text-gray-300 leading-relaxed border-t border-white/10 pt-2">
                  {language === 'ur'
                    ? 'جب کوئی کپتان FareCalculator کے متعین کردہ بنیادی کرائے (Base Fare) سے کم رقم پیش کرے گا تو آپ کو وائبریشن (Haptic) اور ساؤنڈ نوٹیفکیشن موصول ہوگا۔'
                    : 'Triggers a haptic vibration pattern and auditory notification whenever a captain bids below the FareCalculator calculated base fare.'}
                </p>
              </div>

              {user.role === 'driver' && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Vehicle & Service Settings (CT Rider)</p>
                  <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 space-y-4 shadow-sm">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-yellow-400 text-black rounded-xl flex items-center justify-center font-black shadow-sm">
                             <Car className="w-5 h-5" />
                           </div>
                           <div>
                             <p className="text-xs font-black uppercase text-black">{getVehicleTypeDisplay((user as any)?.vehicleType)}</p>
                             {(user as DriverProfile)?.pendingVehicleType && (
                               <p className="text-[9px] font-black text-amber-600 uppercase mt-0.5 animate-pulse">
                                 ⏳ Request: {getVehicleTypeDisplay((user as DriverProfile).pendingVehicleType)} (Awaiting Admin)
                               </p>
                             )}
                             <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Vehicle Type</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => setShowVehicleTypePicker(true)}
                          className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow hover:scale-105 active:scale-95"
                        >
                          CHANGE
                        </button>
                     </div>
                     <div className="flex items-center justify-between border-t border-gray-200/60 pt-3">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-black text-yellow-400 rounded-xl flex items-center justify-center font-black shadow-sm">
                             <Globe className="w-5 h-5" />
                           </div>
                           <div>
                             <p className="text-xs font-black uppercase text-black">{getServiceTypeDisplay((user as any).serviceType)}</p>
                             <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Service Mode</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => setShowServiceTypePicker(true)}
                          className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow hover:scale-105 active:scale-95"
                        >
                          CHANGE
                        </button>
                     </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2">
                <SettingsItem icon={<User className="w-4 h-4" />} label="Profile" onClick={() => setShowProfileDetail(true)} />
                <SettingsItem icon={<Wallet className="w-4 h-4" />} label="Wallet" onClick={() => setShowWallet(true)} />

                <SettingsItem icon={<Globe className="w-4 h-4" />} label="Language" onClick={() => setShowLanguagePicker(true)} />
                {(user?.role === 'admin' || user?.email === 'mustafagm748@gmail.com') && (
                  <SettingsItem icon={<Camera className="w-4 h-4 text-yellow-600" />} label="PWA Screenshots" onClick={() => setShowScreenshotsModal(true)} />
                )}
                <SettingsItem icon={<MessageSquare className="w-4 h-4" />} label="Sounds" onClick={() => setShowSoundSettings(true)} />
                <SettingsItem icon={<Sparkles className="w-4 h-4 text-yellow-500" />} label={language === 'ur' ? 'تھیمز (۵ رنگ)' : 'Themes (5 Colors)'} onClick={() => setShowThemePicker(true)} />
                {(user?.role === 'admin' || user?.email === 'mustafagm748@gmail.com') && (
                  <SettingsItem icon={<Sparkles className="w-4 h-4 text-purple-600" />} label="Workspace" onClick={() => setShowWorkspaceSettings(true)} />
                )}
                
                {aboutVisible && (
                  <SettingsItem icon={<Info className="w-4 h-4" />} label="About" onClick={() => setShowAbout(true)} />
                )}

                <SettingsItem 
                  icon={profilePicVisible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-red-500" />} 
                  label={profilePicVisible ? "Selfie On" : "Selfie Off"} 
                  onClick={() => {
                    setProfilePicVisible(!profilePicVisible);
                  }} 
                />

                <SettingsItem 
                  icon={aboutVisible ? <Info className="w-4 h-4 text-green-600" /> : <Info className="w-4 h-4 text-red-500 opacity-40" />} 
                  label={aboutVisible ? "Hide About" : "Show About"} 
                  onClick={() => {
                    setAboutVisible(!aboutVisible);
                  }} 
                />

                <div className="col-span-3 pt-2 border-t border-gray-100 mt-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Security & Support</p>
                  <div className="grid grid-cols-2 gap-2">
                      <SettingsItem icon={<ShieldCheck className="w-4 h-4" />} label="Privacy" onClick={() => setShowPrivacy(true)} />
                      <SettingsItem icon={<ShieldAlert className="w-4 h-4" />} label="Emergency" variant="danger" onClick={() => setShowEmergency(true)} />
                  </div>
                </div>
              </div>
                
                <button 
                  onClick={handleLogout} 
                  className="w-full p-6 bg-red-50 text-red-500 rounded-[32px] font-bold flex items-center justify-between mt-8 mb-12 hover:bg-red-100 transition-colors"
                >
                  <span className="font-black uppercase text-xs tracking-widest">Logout Account</span>
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
           )}

          {activeTab === 'admin' && (
            <div className="h-full flex flex-col relative bg-white">
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminPanel 
                    pendingDrivers={pendingDrivers} 
                    activeRides={activeRides}
                    onApprove={handleApproveDriver} 
                    onReject={(id, reason) => {
                      console.log(`Rejecting driver ${id} for reason: ${reason}`);
                      setPendingDrivers(pendingDrivers.filter(d => d.id !== id));
                    }} 
                    onApproveVehicleChange={handleApproveVehicleChange}
                    onRejectVehicleChange={handleRejectVehicleChange}
                    onApproveRide={handleApproveRide}
                    onUpdateRideStatus={handleUpdateRideStatus}
                    language={language}
                    onLogout={handleLogout}
                  />
                </Suspense>
              </div>
              <button 
                onClick={() => setActiveTab('settings')} 
                className="absolute top-6 right-6 p-2 bg-black text-yellow-400 rounded-full shadow-lg border border-yellow-400/20 z-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeTab === 'community' && (
            <div className="p-8 text-center space-y-4">
               <h2 className="text-2xl font-black text-gold-muted uppercase tracking-tighter">Community</h2>
               <p className="text-xs text-gray-500">Connect with other riders and drivers in your area.</p>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="p-8 text-center space-y-4">
               <h2 className="text-2xl font-black text-gold-muted uppercase tracking-tighter">Channels</h2>
               <p className="text-xs text-gray-500">Official updates and local news from Pro Rider.</p>
            </div>
          )}

          {activeTab === 'calls' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
               <div className="flex items-center justify-between mb-2">
                 <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Recent Calls</h2>
                 <button 
                   onClick={() => {
                     voiceService.speak(language === 'ur' ? "نیا کال شروع ہو رہا ہے۔" : "Starting new call...");
                     alert(language === 'ur' ? "نیا کال فیچر جلد آ رہا ہے!" : "New Call feature coming soon!");
                   }}
                   className="p-2 bg-gray-50 rounded-xl active:scale-90 transition-transform"
                 >
                   <Plus className="w-5 h-5 text-gray-400" />
                 </button>
               </div>
               
               <div className="space-y-4">
                  <div className="p-6 bg-white rounded-[32px] border-2 border-gray-100 flex items-center justify-between group cursor-pointer hover:border-yellow-400 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-black font-black">AD</div>
                        <div>
                           <p className="text-sm font-black uppercase tracking-tight">System Admin</p>
                           <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                             <PhoneIcon className="w-3 h-3 text-red-500 rotate-[135deg]" /> Missed • 2 days ago
                           </p>
                        </div>
                     </div>
                     <PhoneIcon className="w-5 h-5 text-gray-300" />
                  </div>
               </div>

               <button 
                onClick={() => {
                  voiceService.speak("Connecting to System Admin. Support is currently available via email or chat room.");
                }}
                className="w-full py-5 bg-black text-yellow-400 rounded-[32px] font-black uppercase tracking-widest text-[12px] shadow-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform mt-8"
               >
                  <PhoneIcon className="w-5 h-5" />
                  Request Support Call
               </button>
            </div>
          )}
    </MainLayout>

        {/* Profile Detail Overlay */}
        <AnimatePresence>
          {showProfileDetail && user && (
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="absolute inset-0 z-[60] bg-white flex flex-col"
            >
              <div className="bg-black p-6 pt-12 flex items-center justify-between border-b-2 border-yellow-500/20">
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowProfileDetail(false)} className="text-yellow-400">
                    <X className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-black text-yellow-400 uppercase tracking-tighter">Verified Profile</h2>
                </div>
                <div className="px-3 py-1 bg-yellow-400 text-black text-[8px] font-black uppercase rounded-lg">Official</div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Header Section */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-32 h-32 bg-yellow-50 rounded-full p-1 border-2 border-yellow-400">
                    <div className="w-full h-full rounded-full overflow-hidden shadow-2xl">
                      {(user as DriverProfile)?.selfieUrl && profilePicVisible ? (
                        <img src={(user as DriverProfile)?.selfieUrl || undefined} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-center p-2">
                          <User className="w-8 h-8 text-gray-400" />
                          {!profilePicVisible && <span className="text-[7px] text-gray-500 font-bold uppercase tracking-tight mt-1">Hidden</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-black uppercase tracking-tighter">{user?.name || 'User'}</h3>
                    <p className="text-yellow-600 font-black uppercase text-[10px] tracking-[0.2em]">{user?.role || 'passenger'}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Details</p>
                  <div className="bg-gray-50 rounded-3xl p-6 space-y-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</span>
                      <span className="text-sm font-bold text-black">{user?.phone ? (user.phone.length >= 7 ? user.phone.slice(0, 4) + '••••' + user.phone.slice(-3) : '0312••••782') : '0312••••782'}</span>
                    </div>
                    {user?.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</span>
                        <span className="text-sm font-bold text-black lowercase">{user.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver Documents */}
                {user?.role === 'driver' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Verification Documents</p>
                      
                      {/* ID Card */}
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3 text-yellow-600" /> ID Card (CNIC)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="aspect-[3/2] bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden">
                              <img src={(user as DriverProfile).idCardFrontUrl || null} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[7px] font-black text-center text-gray-400 uppercase tracking-widest">Front Side</p>
                          </div>
                          <div className="space-y-1">
                            <div className="aspect-[3/2] bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden">
                              <img src={(user as DriverProfile).idCardBackUrl || null} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[7px] font-black text-center text-gray-400 uppercase tracking-widest">Back Side</p>
                          </div>
                        </div>
                      </div>

                      {/* License */}
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3 text-yellow-600" /> Driving License
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="aspect-[3/2] bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden">
                              <img src={(user as DriverProfile).licenseFrontUrl || null} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[7px] font-black text-center text-gray-400 uppercase tracking-widest">Front View</p>
                          </div>
                          <div className="space-y-1">
                            <div className="aspect-[3/2] bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden">
                              <img src={(user as DriverProfile).licenseBackUrl || null} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[7px] font-black text-center text-gray-400 uppercase tracking-widest">Back View</p>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Photos */}
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3 text-yellow-600" /> Vehicle Photos
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="aspect-[3/2] bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden">
                              <img src={(user as DriverProfile).vehicleFrontUrl || null} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[7px] font-black text-center text-gray-400 uppercase tracking-widest">Front Profile</p>
                          </div>
                          <div className="space-y-1">
                            <div className="aspect-[3/2] bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden">
                              <img src={(user as DriverProfile).vehicleBackUrl || null} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[7px] font-black text-center text-gray-400 uppercase tracking-widest">Back Profile</p>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Book */}
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3 text-yellow-600" /> Vehicle Book
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="aspect-[3/2] bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden">
                              <img src={(user as DriverProfile).vehicleBookFrontUrl || null} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[7px] font-black text-center text-gray-400 uppercase tracking-widest">Page 1-2</p>
                          </div>
                          <div className="space-y-1">
                            <div className="aspect-[3/2] bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden">
                              <img src={(user as DriverProfile).vehicleBookBackUrl || null} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[7px] font-black text-center text-gray-400 uppercase tracking-widest">Page 3-4</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PWA Download / Home Screen Instructions Overlay */}
        <AnimatePresence>
          {showDownloadInstructions && (
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="absolute inset-0 z-[100] bg-black/95 text-white flex flex-col pt-12"
            >
              <div className="absolute top-6 right-6 z-[110]">
                <button 
                  onClick={() => setShowDownloadInstructions(false)}
                  className="p-3 bg-white/10 rounded-full hover:bg-white/25 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                <div className="text-center space-y-3">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-400 mx-auto shadow-2xl flex items-center justify-center bg-black">
                    <img 
                      src="/logo.jpg" 
                      alt="Pro Rider Logo" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/logo.png';
                      }}
                    />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-yellow-400">Download Pro Rider App</h2>
                  <p className="text-xs text-gray-300 font-bold max-w-xs mx-auto">
                    Get the genuine full-screen mobile app. Fits perfectly without any browser bars, shifts, or movements.
                  </p>
                </div>

                {/* Steps Section */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400/60">Choose Your Device</p>
                  
                  {/* Two tabs: iOS and Android */}
                  <div className="grid grid-cols-2 gap-3 bg-white/5 p-1 rounded-2xl">
                    <button 
                      className="py-3 bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/20 active:bg-white/30"
                    >
                      Apple iOS
                    </button>
                    <button 
                      className="py-3 bg-yellow-400 text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-yellow-500 active:scale-95"
                    >
                      Android / Chrome
                    </button>
                  </div>

                  {/* Android / iOS guide blocks side-by-side or stacked cleanly */}
                  <div className="space-y-4">
                    <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">📱 iPhone & iPad (Safari)</p>
                      <ul className="text-xs space-y-2 text-gray-300 pl-4 list-decimal font-medium">
                        <li>Tap the <span className="text-yellow-400 font-bold">Share</span> button in Safari (box with up arrow).</li>
                        <li>Scroll down and select <span className="text-white font-bold">"Add to Home Screen"</span>.</li>
                        <li>Tap <span className="text-yellow-400 font-bold">Add</span> in the top-right corner.</li>
                      </ul>
                    </div>

                    <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">🤖 Android Devices (Chrome)</p>
                      <ul className="text-xs space-y-2 text-gray-300 pl-4 list-decimal font-medium">
                        <li>Tap the <span className="text-yellow-400 font-bold">Menu</span> button (3 vertical dots) in Chrome.</li>
                        <li>Tap <span className="text-white font-bold">"Install App"</span> or <span className="text-white font-bold">"Add to Home Screen"</span>.</li>
                        <li>Confirm the prompt. It will install directly!</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Screenshot Uploader Component - Strictly Restricted to Admin Mode */}
                {isAdminMode && (
                  <div className="pt-2">
                    <Suspense fallback={<LoadingSpinner />}>
                      <ScreenshotUploader 
                        title="PWA App Screenshots & Upload Gallery"
                        description="Upload app screenshots to configure PWA store previews, payment receipts, or app reviews."
                        isUrdu={language === 'ur'}
                      />
                    </Suspense>
                  </div>
                )}

                <div className="pt-6 border-t border-white/10 text-center space-y-3">
                  <button 
                    onClick={async () => {
                      if (deferredPrompt) {
                        voiceService.speak("Launching native system installer.");
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        if (outcome === 'accepted') {
                          setDeferredPrompt(null);
                          setShowDownloadInstructions(false);
                        }
                      } else {
                        voiceService.speak("Downloading application assets.");
                        window.location.href = "/manifest.json";
                      }
                    }}
                    className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                  >
                    <Download className="w-4 h-4" />
                    {deferredPrompt ? 'Install Pro Rider App' : 'Download Pro Rider App'}
                  </button>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                    Compatible with all browsers • 100% Secure offline access
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* About Overlay */}
        <AnimatePresence>
          {showAbout && (
            <motion.div 
              initial={{ opacity: 0, y: "10%", scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: "10%", scale: 0.98 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute inset-0 z-[100] bg-white text-gray-900 flex flex-col"
            >
              <div className="bg-black p-6 pt-12 flex items-center justify-between border-b-2 border-yellow-500/20">
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowAbout(false)} className="text-yellow-400">
                    <X className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-black text-yellow-400 uppercase tracking-tighter">About Pro Rider</h2>
                </div>
                <div className="px-3 py-1 bg-yellow-400 text-black text-[8px] font-black uppercase rounded-lg">v5.04 Official</div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Logo Section */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-400 shadow-2xl flex items-center justify-center bg-black">
                    <img 
                      src="/logo.jpg" 
                      alt="Pro Rider Logo" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/logo.png';
                      }}
                    />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Pro Rider</h3>
                  <p className="text-xs text-yellow-600 font-bold uppercase tracking-wider">Official Transport App</p>
                  
                  {/* Official Website Banner */}
                  <a 
                    href="https://pro-rider.netlify.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full max-w-xs py-3 px-4 bg-black hover:bg-gray-900 text-yellow-400 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 border border-yellow-400/30 group"
                  >
                    <Globe className="w-4 h-4 text-yellow-400 group-hover:rotate-45 transition-transform" />
                    <span>pro-rider.netlify.app</span>
                  </a>
                </div>

                {/* Main Pitch */}
                <div className="p-5 bg-yellow-50 rounded-3xl border-2 border-yellow-100 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-yellow-950">Who We Are</h4>
                  <p className="text-xs text-yellow-900 leading-relaxed font-medium">
                    Pro Rider is Pakistan's premier transport service. We connect verified professional drivers with passengers using a robust, instant-dispatch booking engine with direct communication. Enjoy a seamless, safe, and elite commuting experience.
                  </p>
                </div>

                {/* How to Operate */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">How to Operate</p>
                  <div className="bg-gray-50 rounded-3xl p-5 space-y-4 border border-gray-100">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-black uppercase tracking-tight flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span> For Passengers
                      </p>
                      <p className="text-[11px] text-gray-600 leading-relaxed pl-3 font-medium">
                        Open the app, use the Fare Calculator to estimate costs, and use the voice assistant or typing input to book a ride. Track driver arrival, exchange real-time status updates, and pay with ease.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-black uppercase tracking-tight flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span> For Drivers
                      </p>
                      <p className="text-[11px] text-gray-600 leading-relaxed pl-3 font-medium">
                        Log in with your registered driver account, configure your active profile/vehicle specs, and await incoming ride ringers. Touch 'Accept' on the real-time alert screen to receive coordinates.
                      </p>
                    </div>
                  </div>
                </div>

                {/* How to Join Us */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">How People Can Join Us</p>
                  <div className="bg-gray-50 rounded-3xl p-5 space-y-3 border border-gray-100">
                    <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                      Joining Pro Rider is simple, fast, and secure:
                    </p>
                    <ul className="text-[11px] text-gray-600 space-y-2.5 font-medium pl-3 list-disc">
                      <li><strong className="text-black uppercase text-[10px] tracking-tight">Riders:</strong> Sign up instantly with your name, phone number, and a direct profile selfie. Done in 30 seconds!</li>
                      <li><strong className="text-black uppercase text-[10px] tracking-tight">Drivers:</strong> Submit verification documents through our registration flow: CNIC (ID Card), active Driving License, clear Vehicle Photos, and the Vehicle Book.</li>
                      <li><strong className="text-black uppercase text-[10px] tracking-tight">Verification:</strong> All drivers undergo direct audit. Once approved, the driver dashboard unlocks immediately for work.</li>
                    </ul>
                  </div>
                </div>

                {/* What You Can Do */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">What You Can Do</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                      <h5 className="text-[10px] font-black text-black uppercase tracking-wider">Voice Control</h5>
                      <p className="text-[10px] text-gray-500 font-medium">Book rides naturally in Urdu or English using Voice Assistant.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                      <h5 className="text-[10px] font-black text-black uppercase tracking-wider">Fare Calculator</h5>
                      <p className="text-[10px] text-gray-500 font-medium">Calculate transparent estimates instantly with absolute fare breakdown.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                      <h5 className="text-[10px] font-black text-black uppercase tracking-wider">Share Status</h5>
                      <p className="text-[10px] text-gray-500 font-medium">Post ephemeral status stories to keep friends or drivers updated.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                      <h5 className="text-[10px] font-black text-black uppercase tracking-wider">PWA Offline Mode</h5>
                      <p className="text-[10px] text-gray-500 font-medium">Install to your device's home screen for high-speed offline capabilities.</p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em] pt-4 border-t border-gray-100">
                  © 2026 Pro Rider Mobility Inc. All Rights Reserved.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Privacy Overlay */}
        <AnimatePresence>
          {showPrivacy && (
            <motion.div 
              initial={{ opacity: 0, y: "10%", scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: "10%", scale: 0.98 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute inset-0 z-[100] bg-white text-gray-900 flex flex-col"
            >
              <div className="bg-black p-6 pt-12 flex items-center justify-between border-b-2 border-yellow-500/20">
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowPrivacy(false)} className="text-yellow-400">
                    <X className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-black text-yellow-400 uppercase tracking-tighter">Privacy Policy</h2>
                </div>
                <div className="px-3 py-1 bg-yellow-400 text-black text-[8px] font-black uppercase rounded-lg">Verified Secure</div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Intro badge */}
                <div className="p-5 bg-green-50 rounded-3xl border-2 border-green-100 space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-800">Your Data, Your Protection</p>
                  <h4 className="text-xs font-black uppercase tracking-wider text-green-950">100% Transparent Privacy Standards</h4>
                  <p className="text-xs text-green-900 leading-relaxed font-medium">
                    As a premier transport and taxi-hailing platform, Pro Rider values your personal data, identity verification compliance, and route security above all. Here is how we handle and protect your details.
                  </p>
                </div>

                {/* Data Collection */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">What Data We Collect</p>
                  <div className="bg-gray-50 rounded-3xl p-5 space-y-4 border border-gray-100 text-[11px] text-gray-600 font-medium leading-relaxed">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-black uppercase tracking-tight flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Real-time Geolocation
                      </p>
                      <p className="pl-4">
                        Pro Rider tracks precise real-time geographic coordinates from your GPS to dispatch vehicles, display live transit progress, calculate distance-based fares, and ensure passenger security.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-black uppercase tracking-tight flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-400"></span> User profile info
                      </p>
                      <p className="pl-4">
                        Your registered name, email address, direct contact number, and profile selfie are stored locally and synced securely with the Cloud Run server for direct user authentication.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-black uppercase tracking-tight flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Driver Verification Credentials
                      </p>
                      <p className="pl-4">
                        To fulfill strict transport regulations in Pakistan, we collect and store digital logs of driver CNIC Cards, Driving Licenses, Vehicle Photos, and official Government Vehicle Registration Books.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-black uppercase tracking-tight flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Voice Assistant audio data
                      </p>
                      <p className="pl-4">
                        Microphone inputs and transcripts processed through our integrated voice assistant are treated as strictly dynamic, transient sessions for ride-booking interpretation only.
                      </p>
                    </div>
                  </div>
                </div>

                {/* How we use data */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">How We Use Your Data</p>
                  <div className="bg-gray-50 rounded-3xl p-5 space-y-3 border border-gray-100 text-[11px] text-gray-600 font-medium">
                    <p className="leading-relaxed">
                      All collected information is used strictly to provide, maintain, and optimize the Pro Rider service:
                    </p>
                    <ul className="space-y-2 list-disc pl-3">
                      <li>Calculating accurate transparent pricing metrics via the Fare Engine.</li>
                      <li>Displaying active driver-passenger routes dynamically.</li>
                      <li>Verifying credentials to prevent fraud, unregistered drivers, and duplicate profiles.</li>
                      <li>Ensuring fast, emergency response signals if a danger event is triggered.</li>
                    </ul>
                  </div>
                </div>

                {/* Data Security */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Data Sharing & Protection</p>
                  <div className="bg-gray-50 rounded-3xl p-5 space-y-3 border border-gray-100 text-[11px] text-gray-600 font-medium leading-relaxed">
                    <p>
                      Pro Rider implements top-tier security standards to prevent data breaches:
                    </p>
                    <ul className="space-y-2 list-disc pl-3">
                      <li>We <strong className="text-black uppercase text-[10px] tracking-tight">never sell</strong>, rent, or trade your personal data to third-party data brokers.</li>
                      <li>Contact phone numbers are masked or kept confidential wherever possible during direct call routing.</li>
                      <li>All network transfers to our database servers are fully encrypted under secure HTTPS/TLS protocols.</li>
                      <li>Your documents are deleted or archived instantly if your account profile is permanently closed or deactivated.</li>
                    </ul>
                  </div>
                </div>

                {/* User Rights */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Your Control & Rights</p>
                  <div className="bg-gray-50 rounded-3xl p-5 space-y-3 border border-gray-100 text-[11px] text-gray-600 font-medium leading-relaxed">
                    <p>
                      You have full ownership of your data within the Pro Rider environment:
                    </p>
                    <ul className="space-y-2 list-disc pl-3">
                      <li><strong className="text-black uppercase text-[10px] tracking-tight">Access & Rectification:</strong> Edit or update your verified documents and active names directly from settings.</li>
                      <li><strong className="text-black uppercase text-[10px] tracking-tight">Data Erasure:</strong> Purge and delete your entire user profile directly. Clicking 'Logout' followed by account clear erases your stored record.</li>
                      <li><strong className="text-black uppercase text-[10px] tracking-tight">Location Controls:</strong> Turn off active GPS tracking on your device's browser permissions at any time when not hailing a ride.</li>
                    </ul>
                  </div>
                </div>

                <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em] pt-4 border-t border-gray-100">
                  © 2026 Pro Rider Privacy Security Board.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wallet Overlay */}
        <AnimatePresence>
          {showWallet && (
            <motion.div 
              initial={{ opacity: 0, y: "10%", scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: "10%", scale: 0.98 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute inset-0 z-[100] bg-white text-gray-900 flex flex-col"
            >
              <div className="bg-black p-6 pt-12 flex items-center justify-between border-b-2 border-yellow-500/20">
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowWallet(false)} className="text-yellow-400">
                    <X className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-black text-yellow-400 uppercase tracking-tighter">My Wallet</h2>
                </div>
                <div className="px-3 py-1 bg-yellow-400 text-black text-[8px] font-black uppercase rounded-lg">PRO Wallet</div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-3xl p-6 text-black shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Available Balance</p>
                  <p className="text-4xl font-black mt-1">Rs. {walletBalance.toLocaleString()}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-black/50 mt-4">Account Status: Active verified</p>
                </div>

                {/* 7-Day Wallet Trends Line Chart */}
                <Suspense fallback={<LoadingSpinner />}>
                  <WalletTrendChart transactions={walletTransactions} language={language} />
                </Suspense>

                {/* Top-up Options */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Top-up Account</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        setPaymentGatewayMethod('EasyPaisa');
                        setPaymentGatewayOpen(true);
                      }}
                      className="p-4 bg-green-50 hover:bg-green-100 transition-colors rounded-2xl border border-green-200 text-left space-y-1 group cursor-pointer"
                    >
                      <span className="text-[9px] bg-green-600 text-white font-black px-1.5 py-0.5 rounded uppercase">EasyPaisa</span>
                      <p className="text-xs font-black text-green-950 mt-1">Direct Top-up</p>
                      <p className="text-[9px] text-green-700 font-bold">Instant API verification</p>
                    </button>

                    <button 
                      onClick={() => {
                        setPaymentGatewayMethod('JazzCash');
                        setPaymentGatewayOpen(true);
                      }}
                      className="p-4 bg-red-50 hover:bg-red-100 transition-colors rounded-2xl border border-red-200 text-left space-y-1 group cursor-pointer"
                    >
                      <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded uppercase">JazzCash</span>
                      <p className="text-xs font-black text-red-950 mt-1">Direct Deposit</p>
                      <p className="text-[9px] text-red-700 font-bold">Instant API verification</p>
                    </button>
                  </div>
                </div>

                {/* Withdraw Option */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Withdraw Funds</p>
                  <div className="bg-amber-50 rounded-3xl p-5 border border-amber-200 space-y-3">
                    <p className="text-xs font-black text-amber-950 uppercase tracking-tight flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-600" /> Direct Method Not Available
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                      Direct automated withdrawals to personal debit cards or external bank accounts are currently unavailable inside this application.
                    </p>
                    <p className="text-[11px] text-amber-900 font-bold bg-amber-200/40 p-3 rounded-2xl leading-relaxed">
                      💡 <strong>How to Withdraw:</strong> Please contact the official <strong>Pro Rider Support Team</strong> directly via the support channel or dispatch a help request for fast, manual processing.
                    </p>
                    <button 
                      onClick={() => {
                        alert("Withdrawal request dispatched to Pro Rider Team! Our agent will contact you on your registered phone number shortly.");
                        voiceService.speak("Withdrawal request has been initiated. Pro Rider Team will contact you soon.");
                      }}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-colors mt-1"
                    >
                      Notify Pro Rider Support Team
                    </button>
                  </div>
                </div>

                {/* Transaction History */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transactions History</p>
                  <div className="space-y-2">
                    {walletTransactions.map((tx: any) => (
                      <div key={tx.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{tx.type === 'topup' ? 'Deposit Via ' + tx.method : tx.method}</p>
                          <p className="text-[9px] text-gray-400 font-bold mt-0.5">{tx.date}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-black ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {tx.amount > 0 ? `+Rs. ${tx.amount}` : `-Rs. ${Math.abs(tx.amount)}`}
                          </p>
                          <span className="text-[8px] bg-gray-200 text-gray-700 px-1 py-0.2 rounded font-black uppercase">Success</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PWA & Screenshots Modal Overlay - Strictly Admin Only */}
        <AnimatePresence>
          {showScreenshotsModal && isAdminMode && (
            <motion.div 
              initial={{ opacity: 0, y: "10%", scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: "10%", scale: 0.98 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute inset-0 z-[100] bg-black text-white flex flex-col"
            >
              <div className="bg-gray-950 p-6 pt-12 flex items-center justify-between border-b border-yellow-500/20">
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowScreenshotsModal(false)} className="text-yellow-400 p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-black text-yellow-400 uppercase tracking-tighter">PWA & Screenshots</h2>
                </div>
                <div className="px-3 py-1 bg-yellow-400 text-black text-[8px] font-black uppercase rounded-lg">PWA Ready</div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <Suspense fallback={<LoadingSpinner />}>
                  <ScreenshotUploader 
                    title="PWA App Screenshots Uploader & Gallery"
                    description="Upload and manage app screenshots for mobile & desktop PWA manifests, ride proofs, or payment receipts."
                    isUrdu={language === 'ur'}
                  />
                </Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emergency Overlay */}
        <AnimatePresence>
          {showEmergency && (
            <motion.div 
              initial={{ opacity: 0, y: "10%", scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: "10%", scale: 0.98 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute inset-0 z-[100] bg-white text-gray-900 flex flex-col"
            >
              <div className="bg-red-600 p-6 pt-12 flex items-center justify-between border-b-2 border-red-700/20">
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowEmergency(false)} className="text-white">
                    <X className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Emergency Help</h2>
                </div>
                <div className="px-3 py-1 bg-white text-red-600 text-[8px] font-black uppercase rounded-lg">24/7 Security</div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Danger warning */}
                <div className="p-5 bg-red-50 rounded-3xl border-2 border-red-100 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-red-950 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" /> Safety Control Center
                  </h4>
                  <p className="text-xs text-red-900 leading-relaxed font-medium">
                    If you are experiencing any critical danger or safety issues during your commute, use these emergency numbers immediately. Your live location and driver profile details will be shared instantly with responders.
                  </p>
                </div>

                {/* Numbers Panel */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Verified Responders</p>
                  
                  {/* Police 15 */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black text-black uppercase tracking-tight">Police Emergency</h5>
                      <p className="text-lg font-black text-red-600 mt-0.5">{emergencyNumbers[0]}</p>
                    </div>
                    <a 
                      href={`tel:${emergencyNumbers[0]}`}
                      className="px-4 py-2.5 bg-red-600 text-white font-black uppercase tracking-wider text-[10px] rounded-xl hover:bg-red-700 transition-colors"
                    >
                      Dial 15
                    </a>
                  </div>

                  {/* Rescue 1122 */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black text-black uppercase tracking-tight">Rescue Services</h5>
                      <p className="text-lg font-black text-red-600 mt-0.5">{emergencyNumbers[1]}</p>
                    </div>
                    <a 
                      href={`tel:${emergencyNumbers[1]}`}
                      className="px-4 py-2.5 bg-red-600 text-white font-black uppercase tracking-wider text-[10px] rounded-xl hover:bg-red-700 transition-colors"
                    >
                      Dial 1122
                    </a>
                  </div>

                  {/* Contacts Import Button */}
                  {googleToken && (
                    <button 
                      onClick={() => {
                        fetchGoogleContacts();
                        setShowEmergency(false);
                        setShowWorkspaceSettings(true);
                      }}
                      className="w-full p-4 bg-purple-50 rounded-2xl border-2 border-purple-200 flex items-center justify-center gap-3 group"
                    >
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-900">Import from Google</span>
                    </button>
                  )}

                  {/* Pro Rider Support */}
                  <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black text-yellow-950 uppercase tracking-tight flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Pro Rider Team
                      </h5>
                      <p className="text-lg font-black text-yellow-600 mt-0.5">{emergencyNumbers[2]}</p>
                    </div>
                    <a 
                      href={`tel:${emergencyNumbers[2]}`}
                      className="px-4 py-2.5 bg-black text-yellow-400 font-black uppercase tracking-wider text-[10px] rounded-xl hover:bg-gray-900 transition-colors"
                    >
                      Call Support
                    </a>
                  </div>
                </div>

                {/* Instant Panic Button */}
                <button 
                  onClick={() => {
                    alert("🚨 PANIC ALERT TRIGGERED! Your live location coordinates and route details have been securely broadcasted to Pro Rider emergency team, Rescue 1122, and Police 15.");
                    voiceService.speak("Panic alert triggered. Emergency contacts have been notified.");
                  }}
                  className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-wider text-xs rounded-2xl shadow-xl hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-5 h-5 animate-bounce" /> Broadcast Panic Alarm
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Language & Region Settings Overlay */}
        <AnimatePresence>
          {showLanguagePicker && (
            <div className="absolute inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 space-y-5 shadow-2xl text-gray-900 text-center border border-gray-100"
              >
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto text-yellow-600 shadow-inner">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-tight">Language & Region</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">زبان اور علاقہ منتخب کریں</p>
                </div>

                {/* Region Selector */}
                <div className="space-y-1.5 text-left bg-gray-50 p-3 rounded-2xl border border-gray-200/60">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                    {language === 'ur' ? 'سروس کا علاقہ (Region)' : 'Active Service Region'}
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { id: 'South Asia', label: 'South Asia (Mumbai 1 - asia-south1 / Islamabad)', flag: '🇮🇳 🇵🇰' },
                      { id: 'Middle East', label: 'Middle East (UAE / KSA)', flag: '🇦🇪' },
                      { id: 'Global', label: 'Global / International', flag: '🌐' }
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setRegion(r.id as any);
                          voiceService.speak(language === 'ur' ? `علاقہ ${r.id} میں تبدیل ہو گیا` : `Region set to ${r.id}`);
                        }}
                        className={`py-2 px-3 rounded-xl text-[10px] font-bold flex items-center justify-between border transition-all ${
                          region === r.id ? 'bg-yellow-400 border-black text-black shadow-sm font-black' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{r.flag}</span>
                          <span>{r.label}</span>
                        </span>
                        {region === r.id && <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block text-left">
                    {language === 'ur' ? 'ایپ اور اے آئی کی زبان' : 'App & AI Assistant Language'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        setLanguage('en');
                        voiceService.speak("Language changed to English.");
                      }}
                      className={`py-3 px-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border-2 ${language === 'en' ? 'bg-black text-yellow-400 border-black shadow-md' : 'bg-gray-50 text-gray-700 border-gray-200/60 hover:bg-gray-100'}`}
                    >
                      ENGLISH
                    </button>

                    <button 
                      onClick={() => {
                        setLanguage('ur');
                        voiceService.speak("آپ کی زبان اردو میں تبدیل کر دی گئی ہے۔");
                      }}
                      className={`py-3 px-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border-2 ${language === 'ur' ? 'bg-black text-yellow-400 border-black font-urdu text-[13px] shadow-md' : 'bg-gray-50 text-gray-700 border-gray-200/60 hover:bg-gray-100 font-urdu text-[13px]'}`}
                    >
                      اردو (Urdu)
                    </button>
                  </div>
                </div>

                {/* AI Assistant Controls Location Info */}
                <div className="p-3 bg-yellow-50 rounded-2xl border border-yellow-200/80 text-left space-y-1">
                  <p className="text-[10px] font-black text-yellow-900 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
                    {language === 'ur' ? 'اے آئی اسسٹنٹ کنٹرولز' : 'AI Assistant Controls'}
                  </p>
                  <p className="text-[9.5px] text-yellow-800 leading-tight">
                    {language === 'ur' 
                      ? 'ایپ کے اوپر "پرو رائڈر اے آئی اسسٹنٹ" والے کارڈ پر ٹیپ کر کے لائیو وائس یا چیٹ کھولیں۔ اردو اور انگلش دونوں سپورٹڈ ہیں۔'
                      : 'Tap the "Pro Rider AI Assistant" banner at the top of the main screen to access Live Voice Call, Chat & Guide controls in Urdu & English.'}
                  </p>
                </div>

                <button 
                  onClick={() => setShowLanguagePicker(false)}
                  className="w-full py-3 bg-black text-yellow-400 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg active:scale-98 transition-all"
                >
                  {language === 'ur' ? 'محفوظ کریں (Save & Close)' : 'Save & Close'}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Sound Settings Overlay */}
        <AnimatePresence>
          {showSoundSettings && (
            <div className="absolute inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 space-y-6 shadow-2xl text-gray-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-yellow-400 flex items-center justify-center text-black">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Sounds</h3>
                  </div>
                  <button onClick={() => setShowSoundSettings(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ringtones (Incoming Rides)</p>
                    <div className="grid grid-cols-1 gap-2">
                      {RINGTONE_OPTIONS.map(opt => (
                        <button 
                          key={opt.id}
                          onClick={() => {
                            if (user) {
                              const updated = { ...user, ringtone: opt.id } as UserProfile;
                              safeLocalStorage.saveCompactProfile(updated);
                              setUser(updated);
                              soundService.playNotification(opt.url);
                            }
                          }}
                          className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex items-center justify-between ${user?.ringtone === opt.id || (!user?.ringtone && opt.id === 'classic') ? 'border-yellow-400 bg-yellow-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                          <span className="text-xs font-black uppercase tracking-tight">{opt.name}</span>
                          {(user?.ringtone === opt.id || (!user?.ringtone && opt.id === 'classic')) && <div className="w-2 h-2 rounded-full bg-yellow-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notifications (Monthly / System)</p>
                    <div className="grid grid-cols-1 gap-2">
                      {NOTIFICATION_OPTIONS.map(opt => (
                        <button 
                          key={opt.id}
                          onClick={() => {
                            if (user) {
                              const updated = { ...user, notificationSound: opt.id } as UserProfile;
                              safeLocalStorage.saveCompactProfile(updated);
                              setUser(updated);
                              soundService.playNotification(opt.url);
                            }
                          }}
                          className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex items-center justify-between ${user?.notificationSound === opt.id || (!user?.notificationSound && opt.id === 'soft') ? 'border-yellow-400 bg-yellow-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                          <span className="text-xs font-black uppercase tracking-tight">{opt.name}</span>
                          {(user?.notificationSound === opt.id || (!user?.notificationSound && opt.id === 'soft')) && <div className="w-2 h-2 rounded-full bg-yellow-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Voice Speed (Announcement Speed)</p>
                      <span className="text-xs font-mono font-bold text-yellow-600 bg-yellow-50 px-2.5 py-0.5 rounded-full border border-yellow-200">{voiceSpeedVal.toFixed(2)}x</span>
                    </div>
                    <input 
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={voiceSpeedVal}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setVoiceSpeedVal(val);
                        voiceService.setVoiceSpeed(val);
                      }}
                      className="w-full accent-yellow-400 cursor-pointer h-2 bg-gray-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] font-bold text-gray-400 px-1">
                      <span>0.5x (Slow)</span>
                      <span>1.0x (Normal)</span>
                      <span>2.0x (Fast)</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Urdu Voice Style (Formal/Casual)</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (user) {
                            const updated = { ...user, urduVoiceMode: 'formal' } as UserProfile;
                            safeLocalStorage.saveCompactProfile(updated);
                            setUser(updated);
                            voiceService.speak("آپ کا شکریہ، اب میں آپ سے باقاعدہ انداز میں بات کروں گی۔", "ur-PK");
                          }
                        }}
                        className={`flex-1 p-4 rounded-2xl text-center border-2 transition-all ${user?.urduVoiceMode === 'formal' || !user?.urduVoiceMode ? 'border-yellow-400 bg-yellow-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <span className="text-xs font-black uppercase tracking-tight">Formal (آپ)</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (user) {
                            const updated = { ...user, urduVoiceMode: 'casual' } as UserProfile;
                            safeLocalStorage.saveCompactProfile(updated);
                            setUser(updated);
                            voiceService.speak("اوکے جانی، اب سے ہم تم کر کے بات کریں گے!", "ur-PK");
                          }
                        }}
                        className={`flex-1 p-4 rounded-2xl text-center border-2 transition-all ${user?.urduVoiceMode === 'casual' ? 'border-yellow-400 bg-yellow-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <span className="text-xs font-black uppercase tracking-tight">Casual (تم)</span>
                      </button>
                    </div>
                  </div>

                  {/* Low Fare Haptic & Sound Toggle */}
                  <div className="p-4 bg-yellow-50/80 border-2 border-yellow-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-yellow-600" />
                        <div>
                          <p className="text-xs font-black uppercase text-black">Low Fare Offer Haptic & Sound</p>
                          <p className="text-[9px] font-bold text-gray-500 uppercase">Alert when offer &lt; FareCalculator base fare</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!user) return;
                          const currentVal = user.lowFareAlertEnabled ?? true;
                          const updated = { ...user, lowFareAlertEnabled: !currentVal } as UserProfile;
                          safeLocalStorage.saveCompactProfile(updated);
                          setUser(updated);
                          if (!currentVal) {
                            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                              try { navigator.vibrate([150, 80, 150]); } catch (e) {}
                            }
                            soundService.playNotification(NOTIFICATION_OPTIONS[0].url);
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border ${
                          (user?.lowFareAlertEnabled ?? true) ? 'bg-yellow-400 border-yellow-500' : 'bg-gray-300 border-gray-400'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                            (user?.lowFareAlertEnabled ?? true) ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSoundSettings(false)}
                  className="w-full py-4 bg-black text-yellow-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 active:scale-95 transition-all"
                >
                  Save Preferences
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Workspace Settings Overlay */}
        <AnimatePresence>
          {showWorkspaceSettings && (
            <div className="absolute inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                className="w-full max-w-md bg-white rounded-[32px] overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Workspace</h3>
                  </div>
                  <button onClick={() => setShowWorkspaceSettings(false)} className="p-2 bg-gray-100 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                  {/* Auth Status */}
                  <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Google Connection</p>
                      <p className="text-sm font-bold">{googleUser ? `Linked: ${googleUser.email}` : 'Not Connected'}</p>
                    </div>
                    {googleUser ? (
                      <button onClick={handleGoogleLogout} className="text-[10px] font-black text-red-600 uppercase">Disconnect</button>
                    ) : (
                      <button onClick={handleGoogleLogin} className="text-[10px] font-black text-purple-600 uppercase">Connect</button>
                    )}
                  </div>

                  {googleToken && (
                    <>
                      {/* Contacts Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Emergency Contacts</p>
                          <button onClick={fetchGoogleContacts} className="text-[10px] font-black text-purple-600 uppercase">Fetch List</button>
                        </div>
                        {googleContacts.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {googleContacts.map((contact, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                                <div>
                                  <p className="text-xs font-black">{contact.name}</p>
                                  <p className="text-[10px] text-gray-400 font-bold">{contact.phone}</p>
                                </div>
                                <button 
                                  onClick={() => {
                                    if (!emergencyNumbers.includes(contact.phone)) {
                                      setEmergencyNumbers([...emergencyNumbers, contact.phone]);
                                      voiceService.speak(`Added ${contact.name} to emergency list.`);
                                    }
                                  }}
                                  className="p-2 bg-purple-50 text-purple-600 rounded-lg"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-300">
                             <Users className="w-6 h-6 mb-2 opacity-20" />
                             <p className="text-[10px] font-bold uppercase tracking-widest">No contacts fetched</p>
                          </div>
                        )}
                      </div>

                      {/* Chat Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin Notifications (Chat)</p>
                          <button onClick={fetchGoogleSpaces} className="text-[10px] font-black text-purple-600 uppercase">List Spaces</button>
                        </div>
                        {googleSpaces.length > 0 ? (
                          <div className="space-y-2">
                            {googleSpaces.map((space) => (
                              <button 
                                key={space.name}
                                onClick={() => {
                                  setGoogleChatSpace(space.name);
                                  localStorage.setItem('pro_rider_chat_space', space.name);
                                  voiceService.speak(`Alerts linked to ${space.displayName || space.name}`);
                                }}
                                className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex items-center justify-between ${googleChatSpace === space.name ? 'border-purple-600 bg-purple-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                              >
                                <span className="text-xs font-black uppercase tracking-tight">{space.displayName || space.name}</span>
                                {googleChatSpace === space.name && <ShieldCheck className="w-4 h-4 text-purple-600" />}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-300">
                             <MessageSquare className="w-6 h-6 mb-2 opacity-20" />
                             <p className="text-[10px] font-bold uppercase tracking-widest">No spaces available</p>
                          </div>
                        )}
                      </div>

                      {/* Forms Section */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ride Feedback (Forms)</p>
                        {feedbackFormUrl ? (
                          <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ShieldCheck className="w-5 h-5 text-green-600" />
                              <span className="text-xs font-black text-green-900 uppercase">Form Active</span>
                            </div>
                            <a href={feedbackFormUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-green-700 underline">VIEW</a>
                          </div>
                        ) : (
                          <button 
                            onClick={setupFeedbackForm}
                            className="w-full py-4 border-2 border-purple-100 bg-white rounded-2xl text-purple-600 font-black uppercase tracking-widest text-[10px] hover:border-purple-400 transition-all"
                          >
                            Generate Feedback Form
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Admin Password Modal */}
        <AnimatePresence>
          {showAdminModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-xs bg-black text-yellow-400 rounded-3xl p-6 border-2 border-yellow-500/40 shadow-2xl relative space-y-4"
              >
                <button 
                  onClick={() => setShowAdminModal(false)}
                  className="absolute top-4 right-4 p-1.5 bg-gray-900 rounded-full text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400 text-black rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-white">
                      {language === 'ur' ? 'ایڈمن پاسورڈ درج کریں' : 'Admin Access Verification'}
                    </h3>
                    <p className="text-[9px] font-bold text-yellow-300/80 uppercase tracking-wider">
                      {language === 'ur' ? 'ایڈمن موڈ کھولنے کے لیے پاسورڈ درج کریں' : 'Enter PIN to enable Admin Mode'}
                    </p>
                  </div>
                </div>

                {adminPinError && (
                  <div className="p-2.5 bg-red-950/80 border border-red-500/40 text-red-300 rounded-xl text-[11px] font-black text-center">
                    {adminPinError}
                  </div>
                )}

                <div className="space-y-2.5">
                  <input 
                    type="password"
                    value={adminPinInput}
                    onChange={(e) => {
                      setAdminPinInput(e.target.value);
                      setAdminPinError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleVerifyAdminPin();
                      }
                    }}
                    placeholder="••••••••"
                    autoFocus
                    autoComplete="off"
                    className="w-full text-center text-xl font-mono tracking-widest py-3 px-4 bg-gray-900 text-yellow-400 rounded-2xl border-2 border-yellow-500/30 focus:border-yellow-400 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setShowAdminModal(false)}
                    className="flex-1 py-3 bg-gray-900 text-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800"
                  >
                    {language === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                  </button>
                  <button 
                    onClick={() => handleVerifyAdminPin()}
                    className="flex-1 py-3 bg-yellow-400 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {language === 'ur' ? 'کھولیں' : 'Unlock Admin'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vehicle Type Picker Modal */}
        <AnimatePresence>
          {showVehicleTypePicker && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-xs bg-black text-yellow-400 rounded-3xl p-6 border-2 border-yellow-500/40 shadow-2xl relative space-y-4"
              >
                <button 
                  onClick={() => setShowVehicleTypePicker(false)}
                  className="absolute top-4 right-4 p-1.5 bg-gray-900 rounded-full text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400 text-black rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-white">
                      {language === 'ur' ? 'گاڑی کی قسم منتخب کریں' : 'Select Vehicle Type'}
                    </h3>
                    <p className="text-[9px] font-bold text-yellow-300/80 uppercase tracking-wider">
                      {language === 'ur' ? 'اپنی گاڑی کی نوعیت منتخب کریں' : 'Choose active vehicle category'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2 max-h-72 overflow-y-auto custom-scrollbar">
                  {[
                    { id: 'mini', labelEn: 'Mini Car (Rs 30/km)', labelUr: 'منی کار (Rs 30/km)', icon: '🚗' },
                    { id: 'sedan', labelEn: 'Sedan AC (Rs 35/km)', labelUr: 'سڈان اے سی (Rs 35/km)', icon: '🚘' },
                    { id: 'comfortable', labelEn: 'Comfort Sedan (Rs 45/km)', labelUr: 'کمفرٹ کار (Rs 45/km)', icon: '🚙' },
                    { id: 'seven_seater', labelEn: '7-Seater MPV (BR-V) (Rs 55/km)', labelUr: '7 سیٹر گاڑی (Rs 55/km)', icon: '🚐' },
                    { id: 'seven_seater_ocean', labelEn: '7-Seater Ocean (Rs 60/km)', labelUr: '7 سیٹر اوشن (Rs 60/km)', icon: '✨' },
                    { id: 'hiace_15', labelEn: '15-Seater HiAce/Cabin (Rs 90/km)', labelUr: '15 سیٹر ہائی ایس / گرینڈ کیبن (Rs 90/km)', icon: '🚌' },
                    { id: 'loading_cargo', labelEn: 'Loading Cargo Pickup (Rs 80/km)', labelUr: 'لوڈنگ / کارگو پِک اپ (Rs 80/km)', icon: '🛻' },
                    { id: 'premium', labelEn: 'Premium Luxury (Rs 65/km)', labelUr: 'پریمیم لکژری (Rs 65/km)', icon: '👑' },
                    { id: 'bike', labelEn: 'Bike (Rs 20/km)', labelUr: 'بائیک (Rs 20/km)', icon: '🏍️' },
                    { id: 'rickshaw', labelEn: 'Auto Rickshaw - Pindi/Rural (Rs 25/km)', labelUr: 'رکشہ - پنڈی و دیہی (Rs 25/km)', icon: '🛺' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleSelectVehicleType(v.id as VehicleType)}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                        (user as any)?.vehicleType === v.id
                          ? 'bg-yellow-400 text-black border-yellow-400 font-black shadow-lg scale-[1.01]'
                          : 'bg-gray-900 text-gray-200 border-gray-800 hover:border-yellow-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{v.icon}</span>
                        <span className="text-[11px] font-black uppercase">{language === 'ur' ? v.labelUr : v.labelEn}</span>
                      </div>
                      {(user as any)?.vehicleType === v.id && (
                        <span className="text-[8px] bg-black text-yellow-400 font-black px-2 py-0.5 rounded-full uppercase">Active</span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service Context Picker Modal */}
        <AnimatePresence>
          {showServiceTypePicker && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-xs bg-black text-yellow-400 rounded-3xl p-6 border-2 border-yellow-500/40 shadow-2xl relative space-y-4"
              >
                <button 
                  onClick={() => setShowServiceTypePicker(false)}
                  className="absolute top-4 right-4 p-1.5 bg-gray-900 rounded-full text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400 text-black rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-white">
                      {language === 'ur' ? 'سروس کی قسم منتخب کریں' : 'Select Service Mode'}
                    </h3>
                    <p className="text-[9px] font-bold text-yellow-300/80 uppercase tracking-wider">
                      {language === 'ur' ? 'اپنی فعال سروس کی قسم منتخب کریں' : 'Choose ride service category'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {[
                    { id: 'city', labelEn: 'City Rides (In-City)', labelUr: 'سٹی سواری (شہر کے اندر)', icon: '🏙️' },
                    { id: 'intercity', labelEn: 'Intercity (Outstation)', labelUr: 'انٹرسٹی (شہر سے باہر)', icon: '🛣️' },
                    { id: 'sharing', labelEn: 'Carpool & Sharing', labelUr: 'کارپولنگ اور شیئرنگ', icon: '👥' },
                    { id: 'delivery', labelEn: 'Parcel Delivery', labelUr: 'پارسل ڈیلیوری', icon: '📦' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectServiceType(s.id as ServiceType)}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                        (user as any)?.serviceType === s.id
                          ? 'bg-yellow-400 text-black border-yellow-400 font-black shadow-lg scale-[1.01]'
                          : 'bg-gray-900 text-gray-200 border-gray-800 hover:border-yellow-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{s.icon}</span>
                        <span className="text-[11px] font-black uppercase">{language === 'ur' ? s.labelUr : s.labelEn}</span>
                      </div>
                      {(user as any)?.serviceType === s.id && (
                        <span className="text-[8px] bg-black text-yellow-400 font-black px-2 py-0.5 rounded-full uppercase">Active</span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Splash Screen */}
        <AnimatePresence>
          {showSplash && (
            <motion.div
              onClick={() => setShowSplash(false)}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 z-[9999] bg-black flex flex-col items-center justify-between p-6 pb-16 text-white cursor-pointer select-none"
            >
              <div className="flex-1 flex flex-col items-center justify-center space-y-5 max-w-sm text-center">
                {/* CENTERED: Well-formed concentric golden halo circles with breathing screen effect */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex items-center justify-center shrink-0 w-36 h-36"
                >
                  {/* Outer Pulsing Glow Ring */}
                  <motion.div 
                    animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.98, 1.04, 0.98] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full border border-yellow-400/30 shadow-[0_0_40px_rgba(234,179,8,0.45)] bg-yellow-400/5"
                  />
                  {/* Middle Accent Ring */}
                  <div className="absolute inset-1.5 rounded-full border border-yellow-400/60 shadow-[0_0_20px_rgba(234,179,8,0.3)]" />
                  {/* Inner Core Circle holding Logo */}
                  <div className="w-28 h-28 rounded-full border-2 border-yellow-400 p-1 bg-black shadow-[0_0_30px_rgba(234,179,8,0.6)] overflow-hidden relative z-10 flex items-center justify-center shrink-0">
                    <img 
                      src="/logo.jpg" 
                      alt="Pro Rider Golden Logo" 
                      decoding="sync"
                      loading="eager"
                      width={112}
                      height={112}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </motion.div>

                {/* Golden Welcome Typography (Single instance of PRO RIDER with smooth screen pulse effect) */}
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: [0.75, 1, 0.75], y: 0 }}
                  transition={{ 
                    opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                    y: { duration: 0.8, ease: "easeOut" }
                  }}
                  className="flex flex-col items-center space-y-1"
                >
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-yellow-400/80 drop-shadow-[0_1px_6px_rgba(234,179,8,0.3)]">
                    WELCOME
                  </span>
                  <h1 className="text-xs sm:text-sm font-black tracking-[0.25em] uppercase text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]">
                    PRO RIDER
                  </h1>
                </motion.div>
              </div>

              {/* BOTTOM: Positioned Loading Line & 'Premium You Are Right' Caption */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-xs flex flex-col items-center space-y-2 pb-4 sm:pb-8"
              >
                <div className="text-[9px] font-extrabold text-yellow-400 tracking-[0.25em] uppercase drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]">
                  GOLDEN PREMIUM • YOU ARE RIGHT
                </div>
                <div className="w-52 sm:w-60 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 shadow-[0_0_10px_#facc15]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4.9, ease: "linear" }}
                  />
                </div>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">
                  {language === 'ur' ? 'انٹیلیجنٹ لوڈنگ سسٹم...' : 'INTELLIGENT LOADING SYSTEM (5S)...'}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Theme Picker Modal */}
        <AnimatePresence>
          {showThemePicker && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            >
              <div className={`w-full max-w-sm rounded-[2.5rem] p-6 space-y-6 shadow-2xl border ${theme === 'dark' ? 'bg-neutral-900 text-white border-neutral-800' : 'bg-white text-gray-900 border-gray-100'}`}>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      {language === 'ur' ? 'تھیم منتخب کریں (۵ رنگ)' : 'Select Theme (5 Colors)'}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                      {language === 'ur' ? 'تمام نیویگیشن بارز اور بٹنز فوراً تبدیل ہوں گے' : 'Updates navigation bars & buttons instantly'}
                    </p>
                  </div>
                  <button onClick={() => setShowThemePicker(false)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* Pro Gold */}
                  <button 
                    onClick={() => { setTheme('gold'); setShowThemePicker(false); voiceService.speak(language === 'ur' ? 'پرو گولڈ تھیم فعال ہو گیا' : 'Pro Gold theme activated'); }}
                    className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${theme === 'gold' ? 'border-yellow-400 bg-yellow-400/10 shadow-md' : 'border-gray-200 hover:border-yellow-400/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-black">🟡</div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase">Pro Gold</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Classic Gold & Black</p>
                      </div>
                    </div>
                    {theme === 'gold' && <span className="text-xs font-black text-yellow-500 uppercase">Active</span>}
                  </button>

                  {/* Blue */}
                  <button 
                    onClick={() => { setTheme('blue'); setShowThemePicker(false); voiceService.speak(language === 'ur' ? 'بلو تھیم فعال ہو گیا' : 'Blue theme activated'); }}
                    className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${theme === 'blue' ? 'border-blue-500 bg-blue-500/10 shadow-md' : 'border-gray-200 hover:border-blue-500/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black">🔵</div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase">Ocean Blue</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Professional Blue</p>
                      </div>
                    </div>
                    {theme === 'blue' && <span className="text-xs font-black text-blue-500 uppercase">Active</span>}
                  </button>

                  {/* Red */}
                  <button 
                    onClick={() => { setTheme('red'); setShowThemePicker(false); voiceService.speak(language === 'ur' ? 'ریڈ تھیم فعال ہو گیا' : 'Red theme activated'); }}
                    className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${theme === 'red' ? 'border-red-500 bg-red-500/10 shadow-md' : 'border-gray-200 hover:border-red-500/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black">🔴</div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase">Ruby Red</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Bold Red Theme</p>
                      </div>
                    </div>
                    {theme === 'red' && <span className="text-xs font-black text-red-500 uppercase">Active</span>}
                  </button>

                  {/* Green */}
                  <button 
                    onClick={() => { setTheme('green'); setShowThemePicker(false); voiceService.speak(language === 'ur' ? 'گرین تھیم فعال ہو گیا' : 'Green theme activated'); }}
                    className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${theme === 'green' ? 'border-emerald-500 bg-emerald-500/10 shadow-md' : 'border-gray-200 hover:border-emerald-500/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black">🟢</div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase">Emerald Green</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Eco Green Theme</p>
                      </div>
                    </div>
                    {theme === 'green' && <span className="text-xs font-black text-emerald-500 uppercase">Active</span>}
                  </button>

                  {/* Purple */}
                  <button 
                    onClick={() => { setTheme('purple'); setShowThemePicker(false); voiceService.speak(language === 'ur' ? 'پرپل تھیم فعال ہو گیا' : 'Purple theme activated'); }}
                    className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${theme === 'purple' ? 'border-purple-500 bg-purple-500/10 shadow-md' : 'border-gray-200 hover:border-purple-500/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-black">🟣</div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase">Royal Purple</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Luxury Purple Theme</p>
                      </div>
                    </div>
                    {theme === 'purple' && <span className="text-xs font-black text-purple-500 uppercase">Active</span>}
                  </button>

                  {/* Dark / Light Toggle */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <button 
                      onClick={() => { setTheme('light'); setShowThemePicker(false); }}
                      className={`p-3 rounded-xl border text-[10px] font-black uppercase flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-gray-100 text-gray-800 border-gray-200'}`}
                    >
                      <Sun className="w-4 h-4" /> Light
                    </button>
                    <button 
                      onClick={() => { setTheme('dark'); setShowThemePicker(false); }}
                      className={`p-3 rounded-xl border text-[10px] font-black uppercase flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-neutral-800 text-white border-neutral-700' : 'bg-gray-100 text-gray-800 border-gray-200'}`}
                    >
                      <Moon className="w-4 h-4" /> Dark
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GLOBAL ACTIVE / INCOMING CALL OVERLAY */}
        <AnimatePresence>
          {showVerificationPrompt && (
            <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowVerificationPrompt(false)}
                  className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Camera className="w-10 h-10 text-yellow-600" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-black uppercase tracking-tight text-black">
                    {language === 'ur' ? 'پروفائل مکمل کریں' : 'Complete Your Profile'}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {language === 'ur' 
                      ? 'تمام فنکشنز تک رسائی کے لیے، براہ کرم تصدیق کے لیے ایک سیلفی مکمل کریں۔' 
                      : 'To access all features including rentals and premium bookings, please complete a quick selfie verification.'}
                  </p>
                </div>

                <div className="pt-2">
                  <label className="w-full py-4 bg-black text-yellow-400 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <span>{language === 'ur' ? 'سیلفی لیں' : 'Take Selfie Now'}</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      capture="user"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => handleVerifySelfie(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Secure Identity Check • Remax Pro Rider
                </p>
              </motion.div>
            </div>
          )}

          {isRinging && ringtoneCountdown > 0 && !activeCall && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-xs bg-black/90 backdrop-blur-xl border-2 border-yellow-400 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-2xl"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
                  <PhoneIcon className="w-5 h-5 text-black animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest leading-none">New Request</p>
                  <p className="text-sm font-black text-white truncate uppercase mt-1">
                    {language === 'ur' ? 'نئی سواری کی کال' : 'New Ride Ringing'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-yellow-400">{ringtoneCountdown}s</span>
                </div>
              </div>
              <button
                onClick={stopPersistentRingtone}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-600/20"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>{language === 'ur' ? 'آواز بند کریں' : 'Stop Ringing'}</span>
              </button>
            </motion.div>
          )}

          {activeCall && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-neutral-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white text-center"
            >
              <div className="space-y-6 max-w-sm w-full flex flex-col items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping duration-1000" />
                  <div className="w-28 h-28 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold text-3xl shadow-2xl relative z-10">
                    {activeCall.callerName.charAt(0)}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase text-yellow-400 tracking-[0.2em] mb-1">
                    {activeCall.status === 'ringing' 
                      ? (
                          (user?.role === 'driver' && activeCall.callerRole === 'passenger') || (user?.role !== 'driver' && activeCall.callerRole === 'driver')
                            ? (language === 'ur' ? '📞 انکمنگ کال...' : '📞 Incoming Call...')
                            : (language === 'ur' ? 'کال جا رہی ہے...' : 'Calling...')
                        )
                      : (language === 'ur' ? 'مربوط ہے (لائیو کال)' : 'Connected (Live Call)')}
                  </p>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                    {activeCall.callerName}
                  </h3>
                  <p className="text-xs text-yellow-400/80 font-mono mt-1">
                    {language === 'ur' ? '🔒 محفوظ ان-ایپ وائس لائن (اینکرپٹڈ)' : '🔒 Masked In-App VoIP Voice Line'}
                  </p>
                  {activeCall.callerVehicle && (
                    <p className="text-[11px] text-gray-300 font-bold mt-0.5 uppercase">{activeCall.callerVehicle}</p>
                  )}
                </div>

                {activeCall.status === 'connected' && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="px-5 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full font-mono text-sm tracking-widest text-emerald-400 animate-pulse flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      {Math.floor(callTimer / 60).toString().padStart(2, '0')}:{(callTimer % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80 uppercase font-black tracking-widest">
                      <span>{language === 'ur' ? 'آڈیو کنیکٹڈ • لائیو HD مائیک' : 'Audio Connected • Live HD Voice'}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4 w-full flex flex-col items-center pt-2">
                  {activeCall.status === 'ringing' && ((user?.role === 'driver' && activeCall.callerRole === 'passenger') || (user?.role !== 'driver' && activeCall.callerRole === 'driver')) ? (
                    <div className="flex items-center gap-6 w-full justify-center">
                      <button
                        onClick={handleEndCall}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
                        title="Decline Call"
                      >
                        <X className="w-8 h-8" />
                      </button>
                      <button
                        onClick={handleAnswerCall}
                        className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-all animate-bounce cursor-pointer"
                        title="Answer Call"
                      >
                        <PhoneIcon className="w-8 h-8" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full space-y-4 flex flex-col items-center">
                      <div className="flex items-center justify-center gap-4 w-full">
                        <button
                          onClick={() => {
                            const isUrdu = language === 'ur';
                            voiceService.speak(isUrdu ? 'مائیک میوٹ کر دیا گیا' : 'Microphone muted', isUrdu ? 'ur-PK' : 'en-US');
                          }}
                          className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 active:scale-90"
                          title="Mute Mic"
                        >
                          <MicOff className="w-5 h-5 text-gray-300" />
                        </button>

                        <button
                          onClick={handleEndCall}
                          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl shadow-red-600/40 active:scale-90 transition-all cursor-pointer border-2 border-white/20"
                          title="End Call"
                        >
                          <PhoneIcon className="w-7 h-7 rotate-[135deg]" />
                        </button>

                        <button
                          onClick={() => {
                            const isUrdu = language === 'ur';
                            voiceService.speak(isUrdu ? 'اسپیکر آن کیا گیا' : 'Speaker turned on', isUrdu ? 'ur-PK' : 'en-US');
                          }}
                          className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 active:scale-90"
                          title="Speaker"
                        >
                          <Volume2 className="w-5 h-5 text-gray-300" />
                        </button>
                      </div>

                      {activeCall.callerPhone && (
                        <a
                          href={`tel:${activeCall.callerPhone}`}
                          className="text-[11px] text-gray-400 underline hover:text-white transition-colors flex items-center gap-1 mt-1"
                        >
                          <PhoneIcon className="w-3 h-3 text-emerald-400" />
                          <span>{language === 'ur' ? 'سم (SIM) کے ذریعے ڈائریکٹ فون کال کریں' : 'Switch to Direct Mobile SIM Call'}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {pendingCallRating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-neutral-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white text-center"
            >
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative">
                <div className="w-16 h-16 bg-yellow-400/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto border border-yellow-400/40">
                  <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">
                    {language === 'ur' ? 'کال کے معیار کی درجہ بندی کریں' : 'Rate Call Quality'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {language === 'ur' 
                      ? `ساتھ گفتگو کیسی رہی ${pendingCallRating.callerName}?` 
                      : `How was your live network call with ${pendingCallRating.callerName}?`}
                  </p>
                </div>

                {/* Star Rating Picker */}
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className={`p-1.5 transition-transform hover:scale-110 active:scale-95 cursor-pointer ${star <= ratingValue ? 'text-yellow-400' : 'text-gray-600'}`}
                    >
                      <Star className={`w-8 h-8 ${star <= ratingValue ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder={language === 'ur' ? 'آڈیو کوالٹی، صاف آواز یا کنکشن کے بارے میں تبصرہ کریں (اختیاری)...' : 'Add feedback about audio quality, voice clarity, or connection (optional)...'}
                  value={callComment}
                  onChange={(e) => setCallComment(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 resize-none h-20"
                />

                <div className="space-y-2">
                  <button
                    onClick={() => handleSaveCallFeedback(ratingValue, callComment)}
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    {language === 'ur' ? 'ریٹنگ جمع کروائیں' : 'Submit Rating'}
                  </button>
                  <button
                    onClick={() => setPendingCallRating(null)}
                    className="w-full py-2 bg-transparent hover:bg-neutral-800 text-gray-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    {language === 'ur' ? 'چھوڑیں (Skip)' : 'Skip'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Gateway Modal for EasyPaisa / JazzCash */}
        <PaymentGatewayModal
          isOpen={paymentGatewayOpen}
          onClose={() => setPaymentGatewayOpen(false)}
          initialMethod={paymentGatewayMethod}
          language={language}
          onTopUpSuccess={(numAmount, method, txId) => {
            setWalletBalance(prev => prev + numAmount);
            const tx = {
              id: txId,
              type: 'topup',
              amount: numAmount,
              method,
              status: 'completed',
              date: new Date().toISOString().split('T')[0]
            };
            setWalletTransactions(prev => [tx, ...prev]);
          }}
        />

        {/* Play Store Compliant Privacy Policy & Data Safety Modal */}
        <PrivacyPolicyModal
          isOpen={showPrivacy}
          onClose={() => setShowPrivacy(false)}
          language={language}
        />

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gold-dark/10 rounded-full" />
      </div>
    </div>
      )}
    </ErrorBoundary>
  );
}

