import React from 'react';
import { X, Star, Car, Award, ShieldCheck, MapPin, TrendingUp, CheckCircle, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import { DriverProfile, Language } from '../types';

interface Props {
  driver: Partial<DriverProfile> & {
    name: string;
    vehicleType?: string;
    vehicleName?: string;
    route?: string;
    rating?: number;
    completedTrips?: number;
    totalEarnings?: number;
    phone?: string;
    selfieUrl?: string;
  };
  onClose: () => void;
  language?: Language;
}

export default function DriverHistoryModal({ driver, onClose, language = 'en' }: Props) {
  const isUrdu = language === 'ur';

  const tripsCount = driver.completedTrips || 248;
  const earnings = driver.totalEarnings || 185400;
  const rating = driver.rating || 4.9;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-yellow-400 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-black text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 text-yellow-400 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={driver.selfieUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                alt={driver.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-yellow-400 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border border-black">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase text-white tracking-wide">{driver.name}</h3>
                <span className="px-2 py-0.5 bg-yellow-400 text-black text-[9px] font-black rounded-full uppercase">
                  {isUrdu ? 'تصدیق شدہ' : 'Verified'}
                </span>
              </div>
              <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                <Car className="w-3 h-3" />
                {driver.vehicleName || driver.vehicleType || 'Toyota Corolla'}
              </p>
              {driver.phone && (
                <p className="text-[10px] text-gray-300 font-medium flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  {driver.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Driver Stats Grid */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-3 gap-3">
            {/* Rating */}
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-center flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-amber-600 mb-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span className="text-sm font-black text-black">{rating.toFixed(1)}</span>
              </div>
              <p className="text-[9px] font-black uppercase text-amber-800 tracking-tight">
                {isUrdu ? 'اسٹار درجہ بندی' : 'Star Rating'}
              </p>
            </div>

            {/* Completed Trips */}
            <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 text-center flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-blue-600 mb-1">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-black text-black">{tripsCount}</span>
              </div>
              <p className="text-[9px] font-black uppercase text-blue-800 tracking-tight">
                {isUrdu ? 'کامیاب سفر' : 'Total Trips'}
              </p>
            </div>

            {/* Total Earnings */}
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-emerald-600 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-black text-black">Rs. {earnings.toLocaleString()}</span>
              </div>
              <p className="text-[9px] font-black uppercase text-emerald-800 tracking-tight">
                {isUrdu ? 'کل کمائی' : 'Total Earnings'}
              </p>
            </div>
          </div>

          {/* Route & Coverage */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
            <h4 className="text-[10px] font-black text-black uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-yellow-600" />
              <span>{isUrdu ? 'روٹ اور کارپولنگ شیڈول' : 'Primary Route & Schedule'}</span>
            </h4>
            <p className="text-xs font-bold text-gray-800">
              {driver.route || 'Islamabad (F-6/G-11) ↔ Rawalpindi (Saddar/Faizabad)'}
            </p>
            <p className="text-[9px] text-gray-500 font-medium">
              {isUrdu ? 'روزانہ 22 دن ماہانہ پیکیج اور سیٹ شیئرنگ کے لیے دستیاب۔' : 'Available for daily 22-day monthly packages & seat sharing.'}
            </p>
          </div>

          {/* Safety & Performance Badges */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-black uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-yellow-600" />
              <span>{isUrdu ? 'کارکردگی کی نشانیاں' : 'Performance Badges'}</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-yellow-50 rounded-xl border border-yellow-200 flex items-center gap-2">
                <span className="text-base">🏆</span>
                <div>
                  <p className="text-[10px] font-black text-black">{isUrdu ? 'ٹاپ کیپٹن' : 'Top Rated Captain'}</p>
                  <p className="text-[8px] text-gray-500">{isUrdu ? '99% وقت پر آمد' : '99% On-Time Record'}</p>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <div>
                  <p className="text-[10px] font-black text-black">{isUrdu ? 'محفوظ ترین ڈرائیو' : 'Safe Driving Badge'}</p>
                  <p className="text-[8px] text-gray-500">{isUrdu ? 'زیرو نادہندگی' : 'Zero Incidents'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reviews Summary */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-black uppercase tracking-wider">
              {isUrdu ? 'حالیہ مسافر کے تاثرات' : 'Recent Passenger Reviews'}
            </h4>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-[10px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-black">Ayesha Khan ★ 5.0</span>
                <span className="text-[8px] text-gray-400">2 days ago</span>
              </div>
              <p className="text-gray-600 italic">
                "{isUrdu ? 'بہت وقت کے پابند اور محفوظ ڈرائیور ہیں۔ انتہائی مطمئن ہوں۔' : 'Punctual, polite driver and very clean AC car. Highly recommended!'}"
              </p>
            </div>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-black hover:bg-neutral-800 text-yellow-400 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
          >
            {isUrdu ? 'بند کریں' : 'Close Profile'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
