import React, { useState, useEffect, useMemo } from 'react';
import { DriverProfile, Ride, UserProfile, VehicleType } from '../types';
import { ScreenshotUploader } from './ScreenshotUploader';
import { 
  Check, X, ShieldCheck, MapPin, Car, Users, Map as MapIcon, DollarSign, 
  BarChart3, Wallet, Bot, AlertTriangle, Settings, Shield, 
  ArrowLeft, Search, Plus, Eye, Lock, Unlock, Phone, FileText, 
  Activity, Radio, Sparkles, RefreshCw, Send, Download, Sliders, ChevronRight, LogOut, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { voiceService } from '../lib/voice';

import { getVehicleTypeDisplay, getServiceTypeDisplay } from '../lib/displayUtils';
import { saveGroupConfigToFirestore, subscribeToUsers, updateUserInFirestore, saveUserToFirestore } from '../lib/firestoreService';

// Modular Admin Components
import Overview from './admin/Overview';
import LiveRides from './admin/LiveRides';
import UserManagement from './admin/UserManagement';
import DriverManagement from './admin/DriverManagement';
import { DriverVerification } from './admin/DriverVerification';
import { CarpoolApproval } from './admin/CarpoolApproval';
import { MonthlyRidesAdmin } from './admin/MonthlyRidesAdmin';
import PricingControl from './admin/PricingControl';
import WalletAdmin from './admin/WalletAdmin';
import SafetyControl from './admin/SafetyControl';
import AIControl from './admin/AIControl';
import AppSystemSettings from './admin/AppSystemSettings';
import ReportsAnalytics from './admin/ReportsAnalytics';
import { AdminRoles } from './admin/AdminRoles';
import { ControlApplication } from './admin/ControlApplication';
import { AdminModals } from './admin/AdminModals';
import { CallFeedbacksAdmin } from './admin/CallFeedbacksAdmin';

interface AdminPanelProps {
  pendingDrivers: DriverProfile[];
  activeRides: Ride[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onApproveVehicleChange?: (id: string, requestedVehicle: string) => void;
  onRejectVehicleChange?: (id: string) => void;
  onApproveRide?: (id: string) => void;
  onCancelRide?: (id: string) => void;
  onCompleteRide?: (id: string) => void;
  onUpdateWallet?: (amount: number, reason: string) => void;
  onUpdateRideStatus?: (id: string, status: any, additionalData?: any) => void;
  onDeleteAllRides?: () => Promise<void>;
  walletBalance?: number;
  walletTransactions?: any[];
  globalStatus?: string;
  onStatusChange?: (status: string) => void;
  language?: string;
  vehicleFares?: any;
  onUpdateVehicleFares?: (fares: any) => void;
  pricingConfig?: any;
  onUpdatePricingConfig?: (config: any) => void;
  onLogout?: () => void;
}

type AdminSection = 
  | 'overview'
  | 'driver_verification'
  | 'carpooling'
  | 'monthly_rides'
  | 'live_rides'
  | 'users'
  | 'drivers'
  | 'pricing'
  | 'reports'
  | 'call_feedbacks'
  | 'wallet'
  | 'ai_control'
  | 'safety'
  | 'app_settings'
  | 'control_application'
  | 'admin_roles';

export default function AdminPanel({ 
  pendingDrivers, 
  activeRides: initialActiveRides, 
  onApprove, 
  onReject, 
  onApproveVehicleChange,
  onRejectVehicleChange,
  onApproveRide,
  onCancelRide,
  onCompleteRide,
  onUpdateWallet,
  onUpdateRideStatus,
  onDeleteAllRides,
  walletBalance = 2450,
  walletTransactions = [],
  globalStatus = 'System Operational',
  onStatusChange,
  language = 'en',
  vehicleFares: propVehicleFares,
  onUpdateVehicleFares,
  pricingConfig: propPricingConfig,
  onUpdatePricingConfig,
  onLogout
}: AdminPanelProps) {
  const isUrdu = language === 'ur';
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local managed state for live interactivity
  const [localRides, setLocalRides] = useState<Ride[]>(initialActiveRides || []);

  useEffect(() => {
    if (initialActiveRides) {
      setLocalRides(initialActiveRides);
    }
  }, [initialActiveRides]);

  const [localUsers, setLocalUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsub = subscribeToUsers((usersFromDb) => {
      setLocalUsers(usersFromDb.map(u => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        role: u.role,
        status: (u as any).status || 'active',
        balance: u.walletBalance || 0,
        trips: 0,
        selfieUrl: (u as DriverProfile).selfieUrl,
        vehicleType: (u as DriverProfile).vehicleType,
        idCardFrontUrl: (u as DriverProfile).idCardFrontUrl,
        idCardBackUrl: (u as DriverProfile).idCardBackUrl,
        licenseFrontUrl: (u as DriverProfile).licenseFrontUrl,
        licenseBackUrl: (u as DriverProfile).licenseBackUrl,
        vehicleFrontUrl: (u as DriverProfile).vehicleFrontUrl,
        vehicleBackUrl: (u as DriverProfile).vehicleBackUrl,
        vehicleBookFrontUrl: (u as DriverProfile).vehicleBookFrontUrl,
        vehicleBookBackUrl: (u as DriverProfile).vehicleBookBackUrl,
        cnicFront: (u as any).cnicFront, // Legacy support
        licenseFront: (u as any).licenseFront, // Legacy support
        vehiclePhoto: (u as any).vehiclePhoto // Legacy support
      })));
    });
    return () => unsub();
  }, []);

  const allDrivers: DriverProfile[] = useMemo(() => {
    const map = new Map<string, DriverProfile>();
    pendingDrivers.forEach(d => map.set(d.id, d));
    localUsers.forEach(u => {
      if ((u.role && u.role.toLowerCase() === 'driver') || u.vehicleType || u.licenseFrontUrl) {
        map.set(u.id, {
          id: u.id,
          name: u.name || 'Driver',
          phone: u.phone || '',
          role: 'driver',
          status: u.status || 'pending',
          vehicleType: u.vehicleType || 'Bike',
          vehicleNumber: u.vehicleNumber || '',
          selfieUrl: u.selfieUrl,
          idCardFrontUrl: u.idCardFrontUrl,
          idCardBackUrl: u.idCardBackUrl,
          licenseFrontUrl: u.licenseFrontUrl,
          licenseBackUrl: u.licenseBackUrl,
          vehicleFrontUrl: u.vehicleFrontUrl,
          vehicleBackUrl: u.vehicleBackUrl,
          vehicleBookFrontUrl: u.vehicleBookFrontUrl,
          vehicleBookBackUrl: u.vehicleBookBackUrl,
          pendingVehicleType: u.pendingVehicleType,
          rating: u.rating || 5.0,
          totalRides: u.totalRides || 0,
        } as unknown as DriverProfile);
      }
    });
    return Array.from(map.values());
  }, [pendingDrivers, localUsers]);

  const [adminSelectedPlan, setAdminSelectedPlan] = useState<'Daily Plan' | 'Weekly Plan' | 'Free Option'>('Daily Plan');
  const adminSelectedCompany = 'ProRider';

  const [pricingConfig, setPricingConfig] = useState({
    baseFare: 100,
    perKmRate: 40,
    minimumFare: 150,
    surgeMultiplier: 1.2,
    commissionRate: 10,
    nightSurcharge: 50,
    minCallDuration: 15,
    companyBonusTargets: {
      selectedCompany: 'ProRider',
      selectedPlan: 'Daily Plan' as 'Daily Plan' | 'Weekly Plan' | 'Free Option',
      companies: {
        'ProRider': { target10Bonus: 300, target15Bonus: 600, target20Bonus: 1000, inDriveBonus: 50, commissionDiscount: 5 },
        'Uber': { target10Bonus: 300, target15Bonus: 600, target20Bonus: 1000, inDriveBonus: 50, commissionDiscount: 5 },
        'Careem': { target10Bonus: 300, target15Bonus: 600, target20Bonus: 1000, inDriveBonus: 50, commissionDiscount: 5 },
        'InDrive': { target10Bonus: 300, target15Bonus: 600, target20Bonus: 1000, inDriveBonus: 50, commissionDiscount: 5 }
      },
      plans: {
        'Daily Plan': {
          milestoneBonus: 500,
          surgePerk: 1.5,
          adjustableBonus: 300,
          commissionDiscount: 5
        },
        'Weekly Plan': {
          milestoneBonus: 2500,
          surgePerk: 1.8,
          adjustableBonus: 1000,
          commissionDiscount: 8
        },
        'Free Option': {
          milestoneBonus: 0,
          surgePerk: 1.2,
          adjustableBonus: 150,
          commissionDiscount: 0
        }
      }
    }
  });

  const [vehicleFares, setVehicleFares] = useState(() => {
    const saved = localStorage.getItem('prorider_vehicle_fares');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
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
  });

  useEffect(() => {
    if (propVehicleFares) {
      setVehicleFares(prev => ({ ...prev, ...propVehicleFares }));
    }
  }, [propVehicleFares]);

  useEffect(() => {
    if (propPricingConfig) {
      setPricingConfig(prev => {
        const mergedCompanyBonusTargets = {
          ...prev.companyBonusTargets,
          ...(propPricingConfig.companyBonusTargets || {}),
          companies: {
            ...prev.companyBonusTargets.companies,
            ...(propPricingConfig.companyBonusTargets?.companies || {})
          }
        };
        return {
          ...prev,
          ...propPricingConfig,
          companyBonusTargets: mergedCompanyBonusTargets
        };
      });
    }
  }, [propPricingConfig]);

  const [aiSettings, setAiSettings] = useState({
    autoDispatch: true,
    smartSurge: true,
    speechSensitivity: 'high',
    languagePreference: 'ur',
    safetyMonitor: true
  });

  const [controlThemeColor, setControlThemeColor] = useState(() => localStorage.getItem('pro_rider_accent') || 'gold');
  const [controlNavPos, setControlNavPos] = useState(() => localStorage.getItem('pro_rider_nav_pos') || 'top');
  const [controlButtonVisibility, setControlButtonVisibility] = useState(() => {
    const saved = localStorage.getItem('pro_rider_btn_vis');
    return saved ? JSON.parse(saved) : { aiVoice: true, notifications: true, settings: true, logout: true };
  });

  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([
    { id: 'sos-1', user: 'Fatima Ahmed', phone: '03219988776', location: 'Near Zero Point, Islamabad', time: '10 mins ago', status: 'resolved' }
  ]);

  const [emergencyNumbersList, setEmergencyNumbersList] = useState<string[]>(['15 (Police)', '1122 (Rescue)', '03125007782 (ProRider Helpline)']);

  const [adminsList, setAdminsList] = useState<any[]>([
    { id: 'adm-1', name: 'Super Admin', email: 'admin@prorider.pk', role: 'Super Admin', status: 'Active' },
    { id: 'adm-2', name: 'Dispatch Manager', email: 'dispatch@prorider.pk', role: 'Dispatcher', status: 'Active' }
  ]);

  // Filters & Modal States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [rideFilter, setRideFilter] = useState<'all' | 'pending' | 'in_status' | 'driver_pending' | 'ongoing' | 'completed'>('all');

  useEffect(() => {
    if (initialActiveRides) {
      setLocalRides(initialActiveRides);
    }
  }, [initialActiveRides]);

  const [viewingDriver, setViewingDriver] = useState<DriverProfile | null>(null);
  const [viewingRouteRide, setViewingRouteRide] = useState<Ride | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showWalletAdjustModal, setShowWalletAdjustModal] = useState<any>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showAdminGuideModal, setShowAdminGuideModal] = useState(false);

  // Modal Inputs
  const [newUserForm, setNewUserForm] = useState({ name: '', phone: '', role: 'passenger', balance: 500 });
  const [newDispatchForm, setNewDispatchForm] = useState({ pickup: 'F-10 Markaz', dropoff: 'Giga Mall', fare: 650, vehicleType: 'sedan' });
  const [walletAdjustAmount, setWalletAdjustAmount] = useState<number>(500);
  const [walletAdjustReason, setWalletAdjustReason] = useState<string>('Bonus Credit');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', role: 'Dispatcher' });

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
    voiceService.speak(msg);
  };

  const handleCompleteLocalRide = (rideId: string) => {
    if (onCompleteRide) onCompleteRide(rideId);
    setLocalRides(prev => prev.map(r => r.id === rideId ? { ...r, status: 'completed' } : r));
    showNotification(isUrdu ? 'سواری مکمل قرار دے دی گئی ہے' : 'Ride marked as completed!');
  };

  const handleCancelLocalRide = (rideId: string) => {
    if (onCancelRide) onCancelRide(rideId);
    setLocalRides(prev => prev.filter(r => r.id !== rideId));
    showNotification(isUrdu ? 'سواری منسوخ کر دی گئی ہے' : 'Ride cancelled by admin.');
  };

  const handleToggleBlockUser = async (userId: string) => {
    const target = localUsers.find(u => u.id === userId);
    if (!target) return;
    const nextStatus = target.status === 'blocked' ? 'active' : 'blocked';
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
    showNotification(`User ${target.name} is now ${nextStatus}`);
    await updateUserInFirestore(userId, { status: nextStatus } as any);
  };

  const handleAdjustWalletSubmit = async () => {
    if (!showWalletAdjustModal) return;
    const targetUser = showWalletAdjustModal;
    const newBalance = (targetUser.balance || 0) + walletAdjustAmount;
    setLocalUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, balance: newBalance } : u));
    if (onUpdateWallet) onUpdateWallet(walletAdjustAmount, walletAdjustReason);
    showNotification(`Adjusted Rs. ${walletAdjustAmount} for ${targetUser.name}`);
    setShowWalletAdjustModal(null);
    await updateUserInFirestore(targetUser.id, { walletBalance: newBalance });
  };

  const handleCreateUser = async () => {
    if (!newUserForm.name || !newUserForm.phone) return;
    const newId = 'u-' + Date.now();
    const createdUser: UserProfile = {
      id: newId,
      name: newUserForm.name,
      phone: newUserForm.phone,
      country: 'Pakistan',
      role: newUserForm.role as any,
      status: 'approved' as any,
      walletBalance: Number(newUserForm.balance) || 0,
      createdAt: Date.now(),
      language: language as any,
      theme: 'light'
    };
    setLocalUsers([{ id: newId, name: createdUser.name, phone: createdUser.phone, role: createdUser.role, status: 'active', balance: createdUser.walletBalance, trips: 0 }, ...localUsers]);
    setShowAddUserModal(false);
    showNotification(`New user ${createdUser.name} registered successfully!`);
    await saveUserToFirestore(createdUser);
  };

  const handleCreateDispatchRide = () => {
    if (!newDispatchForm.pickup || !newDispatchForm.dropoff) return;
    const createdRide: Ride = {
      id: 'PR-' + Math.floor(1000 + Math.random() * 9000),
      passengerId: 'p-admin',
      pickupLocation: newDispatchForm.pickup,
      dropoffLocation: newDispatchForm.dropoff,
      fare: Number(newDispatchForm.fare) || 500,
      distance: '6.5 km',
      status: 'ongoing',
      vehicleType: newDispatchForm.vehicleType as any,
      serviceType: 'city',
      createdAt: Date.now()
    };
    setLocalRides([createdRide, ...localRides]);
    setShowDispatchModal(false);
    showNotification(`Live ride ${createdRide.id} dispatched!`);
  };

  const handleSavePricing = async () => {
    localStorage.setItem('prorider_vehicle_fares', JSON.stringify(vehicleFares));
    
    console.log("Saving pricingConfig:", pricingConfig);
    try {
      await saveGroupConfigToFirestore({
        vehicleFares,
        pricingConfig
      });
      if (onUpdateVehicleFares) onUpdateVehicleFares(vehicleFares);
      if (onUpdatePricingConfig) onUpdatePricingConfig(pricingConfig);
    } catch (err) {
      console.error("Failed to save global pricing config:", err);
    }

    showNotification(isUrdu 
      ? 'نئی قیمتیں محفوظ کر لی گئی ہیں اور تمام صارفین کو بھیج دی گئی ہیں' 
      : 'Pricing rules updated and applied globally system-wide!');
  };

  const handleBroadcastAlert = () => {
    if (!broadcastMsg) return;
    showNotification(isUrdu ? 'ہنگامی براڈکاسٹ بھیج دیا گیا ہے' : `Broadcast sent: "${broadcastMsg.slice(0, 30)}..."`);
    setShowBroadcastModal(false);
    setBroadcastMsg('');
  };

  const handleAddAdmin = () => {
    if (!newAdminForm.name || !newAdminForm.email) return;
    setAdminsList([...adminsList, {
      id: 'adm-' + Date.now(),
      name: newAdminForm.name,
      email: newAdminForm.email,
      role: newAdminForm.role,
      status: 'Active'
    }]);
    setShowAddAdminModal(false);
    showNotification(`Admin account created for ${newAdminForm.name}`);
  };

  const filteredUsers = localUsers.filter(u => {
    if (!u) return false;
    const matchesSearch = (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) || (u.phone || '').includes(userSearch);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredRides = localRides.filter(r => {
    if (rideFilter === 'all') return true;
    if (rideFilter === 'pending') return r.status === 'pending';
    if (rideFilter === 'in_status') return r.status === 'in_status';
    if (rideFilter === 'driver_pending') return r.status === 'driver_pending_admin';
    if (rideFilter === 'ongoing') return r.status === 'ongoing' || r.status === 'accepted' || r.status === 'arrived';
    if (rideFilter === 'completed') return r.status === 'completed' || r.status === 'cancelled';
    return true;
  });

  const adminOptions = [
    { key: 'driver_verification', icon: <ShieldCheck className="w-5 h-5 text-indigo-500" />, title: isUrdu ? 'ڈرائیور کی تصدیق اور دستاویزات' : 'Driver Verification & Docs', badge: `${pendingDrivers.length} Pending` },
    { key: 'carpooling', icon: <Users className="w-5 h-5 text-emerald-500" />, title: isUrdu ? 'کار پولنگ منظوری' : 'Carpooling Requests & Seats', badge: localRides.filter(r => r.serviceType === 'carpool' || r.status === 'admin_pending_carpool').length },
    { key: 'monthly_rides', icon: <FileText className="w-5 h-5 text-amber-500" />, title: isUrdu ? 'ماہانہ دفتر/کالج معاہدے' : 'Monthly Commutes & Subscriptions', badge: localRides.filter(r => r.travelDays || r.totalMonthlyKm || r.serviceType === 'monthly').length },
    { key: 'live_rides', icon: <MapIcon className="w-5 h-5 text-emerald-600" />, title: isUrdu ? 'لائیو رائیڈ مانیٹرنگ' : 'Live Ride Monitoring', badge: localRides.length },
    { key: 'users', icon: <Users className="w-5 h-5 text-blue-500" />, title: isUrdu ? 'صارف کا انتظام' : 'User Management', badge: localUsers.length },
    { key: 'drivers', icon: <Car className="w-5 h-5 text-indigo-600" />, title: isUrdu ? 'ڈرائیور کا انتظام' : 'Driver Fleet Management', badge: pendingDrivers.length },
    { key: 'pricing', icon: <DollarSign className="w-5 h-5 text-green-500" />, title: isUrdu ? 'کرایہ اور قیمتیں' : 'Fare & Pricing Control', badge: 'PKR Active' },
    { key: 'reports', icon: <BarChart3 className="w-5 h-5 text-purple-500" />, title: isUrdu ? 'رپورٹس اور تجزیات' : 'Reports & Analytics', badge: 'Live' },
    { key: 'call_feedbacks', icon: <Star className="w-5 h-5 text-yellow-500" />, title: isUrdu ? 'کال ریٹنگز اور فیڈ بیک' : 'Call Ratings & Quality', badge: 'New' },
    { key: 'wallet', icon: <Wallet className="w-5 h-5 text-yellow-500" />, title: isUrdu ? 'بٹوے اور ادائیگیاں' : 'Wallet & Payments', badge: `Rs. ${walletBalance}` },
    { key: 'ai_control', icon: <Bot className="w-5 h-5 text-cyan-500" />, title: isUrdu ? 'مصنوعی ذہانت کنٹرول' : 'AI Control (Assistant)', badge: aiSettings.autoDispatch ? 'ON' : 'OFF' },
    { key: 'safety', icon: <AlertTriangle className="w-5 h-5 text-red-500" />, title: isUrdu ? 'حفاظت اور مدد' : 'Safety & Support', badge: emergencyAlerts.length },
    { key: 'app_settings', icon: <Sliders className="w-5 h-5 text-yellow-600" />, title: isUrdu ? 'ماسٹر کنٹرول اور ایپ سیٹنگز' : 'Master App & System Controls', badge: globalStatus },
    { key: 'admin_roles', icon: <Shield className="w-5 h-5 text-orange-500" />, title: isUrdu ? 'ایڈمن رولز اور رسائی' : 'Admin Roles & Access', badge: adminsList.length },
  ];

  return (
    <div className={`h-full bg-gray-50 overflow-y-auto p-4 sm:p-6 space-y-6 pb-28 custom-scrollbar ${isUrdu ? 'font-urdu' : ''}`}>
      
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-black text-yellow-400 px-6 py-3 rounded-full shadow-2xl border border-yellow-400/40 text-xs font-black uppercase tracking-wider flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 animate-spin text-yellow-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Admin Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            {activeSection !== 'overview' && (
              <button 
                onClick={() => setActiveSection('overview')} 
                className="p-1.5 bg-gray-200 hover:bg-gray-300 text-black rounded-xl transition-colors shrink-0"
                title="Back to Overview"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-lg sm:text-2xl font-black text-black uppercase tracking-tighter truncate">
              {isUrdu ? 'ایڈمن کنٹرول ڈیش بورڈ' : 'ProRider Admin Dashboard'}
            </h2>
          </div>
          <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {isUrdu ? 'تمام سسٹمز آپریشنل ہیں' : `Status: ${globalStatus}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 min-w-[140px]">
            <input 
                type="text" 
                placeholder={isUrdu ? 'تلاش کریں...' : 'Search admin functions...'} 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white"
            />
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
          </div>
          {onDeleteAllRides && (
            <button
              onClick={async () => {
                if (window.confirm("⚠️ DANGER: This will permanently delete ALL rides from the system. Continue?")) {
                  await onDeleteAllRides();
                  showNotification("All system rides have been cleared.");
                }
              }}
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-md active:scale-95 shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Clear Rides</span>
            </button>
          )}
          <button 
            onClick={() => setShowAdminGuideModal(true)}
            className="px-2.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-md border border-black/10 active:scale-95 shrink-0"
            title="Admin Master AI Assistant & Operations Guide"
          >
            <Sparkles className="w-3.5 h-3.5 text-black fill-black" />
            <span>{isUrdu ? 'ایڈمن اے آئی' : 'Admin AI'}</span>
          </button>
          <button 
            onClick={() => setActiveSection('overview')}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 ${
              activeSection === 'overview' ? 'bg-black text-yellow-400 shadow-md' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          {onLogout && (
            <button
              onClick={() => {
                if (window.confirm(isUrdu ? 'کیا آپ تمام سسٹمز (ایڈمن، ڈرائیور، مسافر) سے لاگ آؤٹ کر کے صرف آن لائن ہوم دیکھنا چاہتے ہیں؟' : 'Log out of entire application (Admin, Driver & Passenger modes)?')) {
                  onLogout();
                }
              }}
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-md active:scale-95 shrink-0 cursor-pointer"
              title={isUrdu ? 'ایپ کے تمام سسٹمز سے لاگ آؤٹ کریں' : 'Log out of all application modes'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'لاگ آؤٹ' : 'Log Out'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 0: OVERVIEW / DASHBOARD */}
      {activeSection === 'overview' && (
        <Overview 
          localRides={localRides} 
          setActiveSection={setActiveSection} 
          adminOptions={adminOptions} 
          userSearch={userSearch}
          pendingDriversCount={pendingDrivers.length}
        />
      )}

      {/* SECTION: DRIVER VERIFICATION */}
      {activeSection === 'driver_verification' && (
        <DriverVerification
          pendingDrivers={pendingDrivers}
          onApprove={onApprove}
          onReject={onReject}
          isUrdu={isUrdu}
        />
      )}

      {/* SECTION: CARPOOLING REQUESTS & APPROVAL */}
      {activeSection === 'carpooling' && (
        <CarpoolApproval
          localRides={localRides}
          onApproveRide={onApproveRide}
          onCancelRide={onCancelRide}
          showNotification={showNotification}
          isUrdu={isUrdu}
        />
      )}

      {/* SECTION: MONTHLY RIDES & COMMUTES */}
      {activeSection === 'monthly_rides' && (
        <MonthlyRidesAdmin
          localRides={localRides}
          onApproveRide={onApproveRide}
          onCancelRide={onCancelRide}
          showNotification={showNotification}
          isUrdu={isUrdu}
        />
      )}

      {/* SECTION 1: LIVE RIDE MONITORING */}
      {activeSection === 'live_rides' && (
        <LiveRides
          localRides={localRides}
          rideFilter={rideFilter}
          setRideFilter={setRideFilter}
          filteredRides={filteredRides}
          isUrdu={isUrdu}
          setShowDispatchModal={setShowDispatchModal}
          setViewingRouteRide={setViewingRouteRide}
          onUpdateRideStatus={onUpdateRideStatus}
          onApproveRide={onApproveRide}
          onCompleteRide={onCompleteRide}
          onCancelRide={onCancelRide}
          handleCompleteLocalRide={handleCompleteLocalRide}
          handleCancelLocalRide={handleCancelLocalRide}
          showNotification={showNotification}
        />
      )}

      {/* SECTION 2: USER MANAGEMENT */}
      {activeSection === 'users' && (
        <UserManagement
          setShowAddUserModal={setShowAddUserModal}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          userRoleFilter={userRoleFilter}
          setUserRoleFilter={setUserRoleFilter}
          filteredUsers={filteredUsers}
          setShowWalletAdjustModal={setShowWalletAdjustModal}
          handleToggleBlockUser={handleToggleBlockUser}
          onApproveDriver={onApprove}
        />
      )}

      {/* SECTION 3: DRIVER MANAGEMENT */}
      {activeSection === 'drivers' && (
        <DriverManagement
          pendingDrivers={pendingDrivers}
          allDrivers={allDrivers}
          isUrdu={isUrdu}
          setViewingDriver={setViewingDriver}
          onApprove={onApprove}
          onReject={onReject}
          onApproveVehicleChange={onApproveVehicleChange}
          onRejectVehicleChange={onRejectVehicleChange}
          getVehicleTypeDisplay={getVehicleTypeDisplay}
        />
      )}

      {/* SECTION 4: FARE & PRICING CONTROL */}
      {activeSection === 'pricing' && (
        <PricingControl
          isUrdu={isUrdu}
          pricingConfig={pricingConfig}
          setPricingConfig={setPricingConfig}
          vehicleFares={vehicleFares}
          setVehicleFares={setVehicleFares}
          onUpdatePricingConfig={onUpdatePricingConfig}
          onUpdateVehicleFares={onUpdateVehicleFares}
          showNotification={showNotification}
        />
      )}

      {/* SECTION 5: REPORTS & ANALYTICS */}
      {activeSection === 'reports' && (
        <ReportsAnalytics showNotification={showNotification} />
      )}

      {/* SECTION: CALL RATINGS & FEEDBACKS */}
      {activeSection === 'call_feedbacks' && (
        <CallFeedbacksAdmin
          isUrdu={isUrdu}
          showNotification={showNotification}
        />
      )}

      {/* SECTION 6: WALLET & PAYMENTS */}
      {activeSection === 'wallet' && (
        <WalletAdmin
          walletBalance={walletBalance}
          walletTransactions={walletTransactions}
          showNotification={showNotification}
        />
      )}

      {/* SECTION 7: AI CONTROL */}
      {activeSection === 'ai_control' && (
        <AIControl
          aiSettings={aiSettings}
          setAiSettings={setAiSettings}
          showNotification={showNotification}
          language={language}
        />
      )}

      {/* SECTION 8: SAFETY & SUPPORT */}
      {activeSection === 'safety' && (
        <SafetyControl
          emergencyAlerts={emergencyAlerts}
          emergencyNumbersList={emergencyNumbersList}
        />
      )}

      {/* SECTION 9: APP SETTINGS & MASTER CONTROL */}
      {activeSection === 'app_settings' && (
        <div className="space-y-6">
          <ControlApplication
            isUrdu={isUrdu}
            controlThemeColor={controlThemeColor}
            setControlThemeColor={setControlThemeColor}
            controlNavPos={controlNavPos}
            setControlNavPos={setControlNavPos}
            controlButtonVisibility={controlButtonVisibility}
            setControlButtonVisibility={setControlButtonVisibility}
            globalStatus={globalStatus}
            onStatusChange={onStatusChange}
            showNotification={showNotification}
          />
          <AppSystemSettings
            controlThemeColor={controlThemeColor}
            setControlThemeColor={setControlThemeColor}
            controlNavPos={controlNavPos}
            setControlNavPos={setControlNavPos}
            controlButtonVisibility={controlButtonVisibility}
            setControlButtonVisibility={setControlButtonVisibility}
            onDeleteAllRides={onDeleteAllRides}
            showNotification={showNotification}
            isUrdu={isUrdu}
          />
        </div>
      )}

      {/* SECTION 10: ADMIN ROLES */}
      {activeSection === 'admin_roles' && (
        <AdminRoles
          adminsList={adminsList}
          setShowAddAdminModal={setShowAddAdminModal}
        />
      )}

      {/* MODALS */}
      <AdminModals
        viewingDriver={viewingDriver}
        setViewingDriver={setViewingDriver}
        onApprove={onApprove}
        viewingRouteRide={viewingRouteRide}
        setViewingRouteRide={setViewingRouteRide}
        showAddUserModal={showAddUserModal}
        setShowAddUserModal={setShowAddUserModal}
        newUserForm={newUserForm}
        setNewUserForm={setNewUserForm}
        handleCreateUser={handleCreateUser}
        showWalletAdjustModal={showWalletAdjustModal}
        setShowWalletAdjustModal={setShowWalletAdjustModal}
        walletAdjustAmount={walletAdjustAmount}
        setWalletAdjustAmount={setWalletAdjustAmount}
        walletAdjustReason={walletAdjustReason}
        setWalletAdjustReason={setWalletAdjustReason}
        handleAdjustWalletSubmit={handleAdjustWalletSubmit}
        showDispatchModal={showDispatchModal}
        setShowDispatchModal={setShowDispatchModal}
        newDispatchForm={newDispatchForm}
        setNewDispatchForm={setNewDispatchForm}
        handleCreateDispatchRide={handleCreateDispatchRide}
        showBroadcastModal={showBroadcastModal}
        setShowBroadcastModal={setShowBroadcastModal}
        broadcastMsg={broadcastMsg}
        setBroadcastMsg={setBroadcastMsg}
        handleBroadcastAlert={handleBroadcastAlert}
        showAddAdminModal={showAddAdminModal}
        setShowAddAdminModal={setShowAddAdminModal}
        newAdminForm={newAdminForm}
        setNewAdminForm={setNewAdminForm}
        handleAddAdmin={handleAddAdmin}
        showAdminGuideModal={showAdminGuideModal}
        setShowAdminGuideModal={setShowAdminGuideModal}
        language={language}
      />

    </div>
  );
}
