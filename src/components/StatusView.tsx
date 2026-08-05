import React, { useState } from 'react';
import { UserStatus, Language } from '../types';
import { Camera, Plus, MapPin, Clock, Users, ArrowLeft, Phone, Car, Calendar, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../lib/i18n';

interface Props {
  language: Language;
  onPostStatus: (status: Partial<UserStatus>) => void;
  statuses: UserStatus[];
  onBookFromStatus?: (status: UserStatus) => void;
  currentUserRole?: string;
  activeRides?: any[];
  userPhone?: string;
}

export default function StatusView({ language, onPostStatus, statuses, onBookFromStatus, currentUserRole, activeRides = [], userPhone }: Props) {
  const t = translations[language];
  const isUrdu = language === 'ur';
  const [activeTab, setActiveTab] = useState<'community' | 'my_rides'>('community');
  const [isCreating, setIsCreating] = useState(false);
  const [viewingStatus, setViewingStatus] = useState<UserStatus | null>(null);
  const [viewingRide, setViewingRide] = useState<any | null>(null);
  const [statusType, setStatusType] = useState<'text' | 'route'>('route');
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState({
    seats: 3,
    time: '08:00 AM',
    route: '',
    returnTime: '05:00 PM',
    schedule: 'MONDAY TO FRIDAY',
    pickupLocation: 'Faizabad Interchange',
    dropoffLocation: 'G-9 Markaz Islamabad',
    pickupTime: '08:00 AM',
    dropoffTime: '05:00 PM',
    carModel: 'Toyota Corolla AC Sedan'
  });
  const [mediaUrls, setMediaUrls] = useState({
    userPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    vehiclePhoto: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'
  });

  const handlePost = () => {
    if (statusType === 'text' && !content.trim()) return;
    if (statusType === 'route' && !metadata.pickupLocation.trim()) return;

    onPostStatus({
      type: statusType,
      text: content,
      content: content || `${metadata.pickupLocation} to ${metadata.dropoffLocation}`,
      userAvatar: mediaUrls.userPhoto || undefined,
      vehicleImageUrl: mediaUrls.vehiclePhoto || undefined,
      metadata: statusType === 'route' ? {
        ...metadata,
        route: `${metadata.pickupLocation} to ${metadata.dropoffLocation}`
      } : undefined,
      timestamp: Date.now()
    });
    setIsCreating(false);
    setContent('');
  };

  return (
    <div className={`h-full flex flex-col bg-white ${isUrdu ? 'rtl font-urdu' : ''}`}>
      {/* FULL DETAILS VIEW MODAL (STATUS) */}
      <AnimatePresence>
        {viewingStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl border border-yellow-400/30 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-black p-5 text-yellow-400 flex items-center justify-between border-b border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-yellow-400 overflow-hidden bg-gray-800">
                    {viewingStatus.userAvatar ? (
                      <img src={viewingStatus.userAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-yellow-400 font-black flex items-center justify-center h-full text-sm">
                        {viewingStatus.userName?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-wider text-sm text-white">
                      {viewingStatus.userName}
                    </h3>
                    <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">
                      {viewingStatus.userRole === 'driver' ? '🚗 Driver Route Status' : '👤 Passenger Request'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingStatus(null)}
                  className="p-2 hover:bg-white/10 rounded-full text-yellow-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-black">
                {/* Vehicle & User Photos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">
                      {isUrdu ? 'صارف کی تصویر' : 'USER PHOTO'}
                    </span>
                    <div className="h-32 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative">
                      {viewingStatus.userAvatar ? (
                        <img src={viewingStatus.userAvatar} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Camera className="w-6 h-6" />
                          <span className="text-[9px] font-bold mt-1">No Photo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">
                      {isUrdu ? 'گاڑی کی تصویر' : 'VEHICLE PHOTO'}
                    </span>
                    <div className="h-32 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative">
                      {viewingStatus.vehicleImageUrl ? (
                        <img src={viewingStatus.vehicleImageUrl} alt="Vehicle" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Car className="w-6 h-6" />
                          <span className="text-[9px] font-bold mt-1">No Vehicle Photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full Route Details Card */}
                <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-yellow-200 pb-2">
                    <span className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-yellow-600" />
                      SCHEDULE: <span className="text-black font-extrabold">{viewingStatus.metadata?.schedule || 'MONDAY TO FRIDAY'}</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-black text-yellow-400 rounded-full text-[9px] font-black uppercase">
                      {viewingStatus.metadata?.seats || 3} {isUrdu ? 'سیٹیں' : 'SEATS'}
                    </span>
                  </div>

                  {/* Vehicle Model Details */}
                  <div className="bg-white p-3 rounded-xl border border-yellow-200/80 flex items-center gap-3">
                    <div className="p-2 bg-black text-yellow-400 rounded-lg shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                        {viewingStatus.userRole === 'driver' ? (isUrdu ? 'ڈرائیور کی گاڑی' : 'DRIVER VEHICLE MODEL') : (isUrdu ? 'مطلوبہ گاڑی' : 'REQUIRED CAR TYPE')}
                      </span>
                      <p className="font-black text-sm text-black">
                        {viewingStatus.metadata?.carModel || viewingStatus.vehicleType || 'Sedan / Standard Car'}
                      </p>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-yellow-200/80 space-y-0.5">
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {isUrdu ? 'پک اپ مقام' : 'PICKUP LOCATION'}
                      </span>
                      <p className="font-extrabold text-xs text-black">
                        {viewingStatus.metadata?.pickupLocation || viewingStatus.metadata?.route?.split(' to ')[0] || 'Faizabad'}
                      </p>
                      <span className="text-[9px] font-bold text-gray-500 block pt-1">
                        ⏰ Pick-up Time: {viewingStatus.metadata?.pickupTime || viewingStatus.metadata?.time || '08:00 AM'}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-yellow-200/80 space-y-0.5">
                      <span className="text-[8px] font-black text-red-600 uppercase tracking-widest block flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {isUrdu ? 'ڈراپ آف مقام' : 'DROPOFF LOCATION'}
                      </span>
                      <p className="font-extrabold text-xs text-black">
                        {viewingStatus.metadata?.dropoffLocation || viewingStatus.metadata?.route?.split(' to ')[1] || 'G-9 Markaz'}
                      </p>
                      <span className="text-[9px] font-bold text-gray-500 block pt-1">
                        ⏰ Drop-off Time: {viewingStatus.metadata?.dropoffTime || viewingStatus.metadata?.returnTime || '05:00 PM'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Text */}
                {viewingStatus.text && (
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                      NOTES / DESCRIPTION
                    </span>
                    <p className="text-xs font-bold text-gray-800 leading-relaxed">
                      {viewingStatus.text}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                {onBookFromStatus && (
                  <button
                    onClick={() => {
                      const statusToBook = viewingStatus;
                      setViewingStatus(null);
                      onBookFromStatus(statusToBook);
                    }}
                    className="flex-1 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Car className="w-4 h-4" /> BOOK THIS CAR
                  </button>
                )}
                {viewingStatus.userPhone && (
                  <a
                    href={`tel:${viewingStatus.userPhone}`}
                    className="flex-1 py-3.5 bg-green-600 hover:bg-green-500 active:scale-95 transition-all text-white font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Phone className="w-4 h-4" /> CALL ({viewingStatus.userPhone})
                  </a>
                )}
                <button
                  onClick={() => setViewingStatus(null)}
                  className="px-5 py-3.5 bg-black hover:bg-neutral-900 text-yellow-400 font-black uppercase text-xs tracking-widest rounded-2xl cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL RIDE DETAILS MODAL (MY RIDES) */}
      <AnimatePresence>
        {viewingRide && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="bg-black p-6 text-center space-y-2 relative">
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => setViewingRide(null)}
                    className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    ✕
                  </button>
                </div>
                <div className="w-14 h-14 bg-yellow-400 rounded-2xl mx-auto flex items-center justify-center shadow-xl rotate-3">
                  <Car className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-yellow-400 pt-2">
                  {isUrdu ? 'سواری کی تفصیلات' : 'Trip Manifest'}
                </h2>
                <p className="text-[10px] font-bold text-gray-500 font-mono">#{viewingRide.id.toUpperCase()}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[60vh] custom-scrollbar">
                <div className="space-y-4 text-black">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isUrdu ? 'پک اپ' : 'Pickup'}</p>
                      <p className="text-sm font-bold text-black leading-tight">{viewingRide.pickupLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isUrdu ? 'منزل' : 'Destination'}</p>
                      <p className="text-sm font-bold text-black leading-tight">{viewingRide.dropoffLocation}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span>{isUrdu ? 'کل کرایہ' : 'Fare Amount'}</span>
                    <span className="text-black font-mono">Rs. {viewingRide.fare}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span>{isUrdu ? 'حالت' : 'Status'}</span>
                    <span className="text-yellow-600 uppercase font-black">{viewingRide.status}</span>
                  </div>
                  {viewingRide.driverName && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isUrdu ? 'ڈرائیور' : 'Assigned Driver'}</p>
                      <p className="text-sm font-black text-black">{viewingRide.driverName}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => setViewingRide(null)}
                  className="w-full py-4 bg-black text-yellow-400 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  {isUrdu ? 'واپس جائیں' : 'Back to List'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE STATUS FORM MODAL */}
      <AnimatePresence>
        {isCreating ? (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            <div className="bg-black p-6 flex items-center justify-between text-yellow-400 border-b border-yellow-500/20">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsCreating(false)} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
                <h2 className="font-black uppercase tracking-widest text-sm">
                  {isUrdu ? 'نیا روٹ اسٹیٹس کا اندراج' : 'New Route & Vehicle Status Form'}
                </h2>
              </div>
            </div>
            
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="flex gap-2">
                <button 
                  onClick={() => setStatusType('route')}
                  className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusType === 'route' ? 'bg-black text-yellow-400 shadow-lg' : 'bg-gray-100 text-gray-400'}`}
                >
                  {isUrdu ? 'روٹ اور گاڑی کا فارم' : 'Route & Vehicle Form'}
                </button>
                <button 
                  onClick={() => setStatusType('text')}
                  className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusType === 'text' ? 'bg-black text-yellow-400 shadow-lg' : 'bg-gray-100 text-gray-400'}`}
                >
                  {isUrdu ? 'عام پیغام' : 'Simple Message'}
                </button>
              </div>

              {statusType === 'text' ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={isUrdu ? "آپ کیا کہنا چاہتے ہیں؟" : "What's on your mind? (Road updates, ride availability, etc.)"}
                  className="w-full h-40 p-6 bg-gray-50 rounded-[32px] text-base font-bold outline-none border-2 border-transparent focus:border-yellow-400 transition-all resize-none"
                />
              ) : (
                <div className="space-y-6">
                  {/* Photo Input Links */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                        {isUrdu ? 'آپ کی تصویر (یو آر ایل)' : 'Your Photo URL'}
                      </label>
                      <div className="relative">
                        <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                        <input 
                          placeholder="https://..." 
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl text-[10px] font-bold border-none shadow-inner"
                          value={mediaUrls.userPhoto}
                          onChange={(e) => setMediaUrls({...mediaUrls, userPhoto: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                        {isUrdu ? 'گاڑی کی تصویر (یو آر ایل)' : 'Vehicle Photo URL'}
                      </label>
                      <div className="relative">
                        <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                        <input 
                          placeholder="https://..." 
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl text-[10px] font-bold border-none shadow-inner"
                          value={mediaUrls.vehiclePhoto}
                          onChange={(e) => setMediaUrls({...mediaUrls, vehiclePhoto: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-[32px] space-y-4 border border-gray-200">
                    {/* Car Selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                        {isUrdu ? 'ڈرائیور کی گاڑی / مطلوبہ گاڑی' : 'Driver Car / Required Passenger Car'}
                      </label>
                      <div className="relative">
                        <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                        <input 
                          placeholder={isUrdu ? "گاڑی کی تفصیل (مثلاً ٹویوٹا کرولا اے سی)" : "Vehicle Model (e.g. Toyota Corolla Sedan / Mini)"} 
                          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl text-sm font-bold border-none shadow-sm"
                          value={metadata.carModel}
                          onChange={(e) => setMetadata({...metadata, carModel: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Pickup & Dropoff Locations */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{isUrdu ? 'پک اپ مقام' : 'Pick-up Location'}</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                          <input 
                            placeholder="Pick-up Location" 
                            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-xs font-bold border-none shadow-sm"
                            value={metadata.pickupLocation}
                            onChange={(e) => setMetadata({...metadata, pickupLocation: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{isUrdu ? 'ڈراپ آف مقام' : 'Drop-off Location'}</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
                          <input 
                            placeholder="Drop-off Location" 
                            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-xs font-bold border-none shadow-sm"
                            value={metadata.dropoffLocation}
                            onChange={(e) => setMetadata({...metadata, dropoffLocation: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pickup Time & Dropoff Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{isUrdu ? 'پک اپ کا وقت' : 'Pick-up Time'}</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                          <input 
                            placeholder="08:00 AM"
                            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-xs font-bold border-none shadow-sm"
                            value={metadata.pickupTime}
                            onChange={(e) => setMetadata({...metadata, pickupTime: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{isUrdu ? 'ڈراپ آف کا وقت' : 'Drop-off Time'}</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                          <input 
                            placeholder="05:00 PM"
                            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-xs font-bold border-none shadow-sm"
                            value={metadata.dropoffTime}
                            onChange={(e) => setMetadata({...metadata, dropoffTime: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{isUrdu ? 'شیڈول (ہفتے کے دن)' : 'Schedule (Uppercase Days)'}</label>
                      <select 
                        className="w-full px-4 py-4 bg-white rounded-2xl text-sm font-black border-none shadow-sm appearance-none cursor-pointer"
                        value={metadata.schedule}
                        onChange={(e) => setMetadata({...metadata, schedule: e.target.value})}
                      >
                        <option value="MONDAY TO FRIDAY">MONDAY TO FRIDAY</option>
                        <option value="SATURDAY TO SUNDAY">SATURDAY TO SUNDAY</option>
                        <option value="MONDAY TO SUNDAY">MONDAY TO SUNDAY</option>
                      </select>
                    </div>

                    {/* Seats */}
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                      <input 
                        type="number" 
                        placeholder={isUrdu ? "دستیاب / مطلوبہ سیٹیں" : "Available / Required Seats"} 
                        className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl text-sm font-bold border-none shadow-sm"
                        value={metadata.seats}
                        onChange={(e) => setMetadata({...metadata, seats: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100">
              <button 
                onClick={handlePost}
                className="w-full py-5 bg-black text-yellow-400 rounded-[32px] font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-transform cursor-pointer"
              >
                {isUrdu ? 'اسٹیٹس شیئر کریں' : 'Share Status Update'}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* TOP HEADER */}
      <div className="p-5 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-black uppercase tracking-tighter">
              {isUrdu ? 'اسٹیٹس اور ریکارڈ' : 'Status & Records'}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {isUrdu ? 'ڈرائیورز فیڈ اور آپ کی سواریاں' : 'Driver Feeds & Your Personal Trip Records'}
            </p>
          </div>
          <button 
            onClick={() => setIsCreating(true)} 
            className="p-3 bg-black text-yellow-400 rounded-2xl shadow-md active:scale-90 transition-transform flex items-center justify-center cursor-pointer"
            title="Add Status"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'community' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {isUrdu ? 'کمیونٹی فیڈ' : 'Community Feed'}
          </button>
          <button 
            onClick={() => setActiveTab('my_rides')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'my_rides' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {isUrdu ? 'میری سواریاں' : 'My Personal Rides'}
          </button>
        </div>
      </div>

      {/* FEED CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'community' ? (
          <>
            {/* Create Status Trigger Banner */}
            <div 
              onClick={() => setIsCreating(true)}
              className="p-4 border-b border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-yellow-400 p-0.5 bg-black flex items-center justify-center">
                  <Camera className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-black font-black" />
                </div>
              </div>
              <div>
                <p className="font-black text-black text-sm uppercase tracking-tight">
                  {isUrdu ? 'نیا روٹ اسٹیٹس پوسٹ کریں' : 'Post New Route Status'}
                </p>
                <p className="text-[10px] text-gray-500 font-bold">
                  {isUrdu ? 'گاڑی اور روٹ کے اوقات منتخب کر کے شیئر کریں' : 'Specify vehicle photo, pickup/dropoff times & MONDAY TO FRIDAY schedule'}
                </p>
              </div>
            </div>

            {/* Status List */}
            <div className="p-4 bg-gray-50/50 min-h-full">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                {isUrdu ? 'حالیہ روٹ اسٹیٹس' : 'Active Route Updates'}
              </h3>
              
              {statuses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-400">
                    {isUrdu ? 'ابھی کوئی اسٹیٹس موجود نہیں ہے' : 'No status updates yet. Click above to post your route!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {statuses.map(status => (
                      <motion.div
                        key={status.id}
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -15, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="p-4 bg-white rounded-3xl border border-gray-200/80 shadow-sm flex flex-col gap-3"
                      >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full border-2 border-yellow-400 p-0.5 bg-black flex items-center justify-center shrink-0 overflow-hidden">
                            {status.userAvatar ? (
                              <img src={status.userAvatar} alt={status.userName} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <span className="text-yellow-400 font-black text-base">{status.userName?.[0] || 'U'}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-black text-sm tracking-tight">{status.userName}</p>
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                status.userRole === 'driver' ? 'bg-yellow-400 text-black' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {status.userRole === 'driver' ? '🚗 Driver' : '👤 Passenger'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[9px] text-gray-400 font-bold">
                                {new Date(status.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {(status.metadata?.carModel || status.vehicleType) && (
                                <span className="text-[9px] text-gray-700 font-extrabold flex items-center gap-1">
                                  • <Car className="w-3 h-3 text-yellow-600" /> {status.metadata?.carModel || status.vehicleType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {status.userPhone && (
                          <a 
                            href={`tel:${status.userPhone}`} 
                            className="p-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl transition-colors flex items-center gap-1.5 text-[10px] font-black"
                            title="Call User"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{status.userPhone}</span>
                          </a>
                        )}
                      </div>

                      {/* PROMINENT BUTTON ON THE CARD */}
                      <button
                        onClick={() => setViewingStatus(status)}
                        className="w-full p-4 bg-neutral-900 hover:bg-black active:scale-[0.99] transition-all text-white rounded-2xl border border-yellow-400/40 text-left shadow-md space-y-2 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            SCHEDULE: {status.metadata?.schedule || 'MONDAY TO FRIDAY'}
                          </span>
                          <span className="text-[9px] font-black text-white bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-400/30 flex items-center gap-1">
                            <Eye className="w-3 h-3 text-yellow-400 group-hover:animate-pulse" /> OPEN DETAILS
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-extrabold">
                          <div>
                            <span className="text-[8px] font-black text-emerald-400 uppercase block">PICK-UP:</span>
                            <p className="truncate text-white">{status.metadata?.pickupLocation || status.metadata?.route?.split(' to ')[0] || 'Faizabad'}</p>
                            <span className="text-[8px] text-gray-400">⏰ {status.metadata?.pickupTime || '08:00 AM'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black text-red-400 uppercase block">DROP-OFF:</span>
                            <p className="truncate text-white">{status.metadata?.dropoffLocation || status.metadata?.route?.split(' to ')[1] || 'G-9 Markaz'}</p>
                            <span className="text-[8px] text-gray-400">⏰ {status.metadata?.dropoffTime || '05:00 PM'}</span>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-gray-300">
                            🚗 Car: <span className="text-yellow-400 font-black">{status.metadata?.carModel || status.vehicleType || 'Standard Sedan'}</span>
                          </span>
                          <span className="font-black text-yellow-400 uppercase tracking-wider">
                            TAP TO VIEW ENTIRE FORM & PHOTOS →
                          </span>
                        </div>
                      </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-4 bg-gray-50 min-h-full space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
              {isUrdu ? 'آپ کی تمام سواریاں' : 'Your Personal Trip Manifests'}
            </h3>

            {activeRides.filter((r: any) => r.passengerPhone === userPhone || r.driverPhone === userPhone).length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[32px] border-2 border-dashed border-gray-200 p-8 space-y-3">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mx-auto">
                  <Car className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-black uppercase tracking-tight">
                    {isUrdu ? 'کوئی سواری نہیں ملی' : 'No Trip Records Found'}
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                    {isUrdu ? 'آپ کے نمبر پر کوئی فعال یا پرانی سواریاں موجود نہیں ہیں۔' : 'We couldn\'t find any active or past rides associated with your verified phone number.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {activeRides.filter((r: any) => r.passengerPhone === userPhone || r.driverPhone === userPhone).map((ride: any) => (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -15, scale: 0.98 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="bg-white rounded-[32px] p-5 border border-gray-200 shadow-sm space-y-4"
                    >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{ride.status}</span>
                      </div>
                      <span className="text-[10px] font-black text-black bg-yellow-400 px-3 py-1 rounded-full shadow-sm">
                        Rs. {ride.fare}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] shrink-0">📍</div>
                        <p className="text-xs font-bold text-gray-800 line-clamp-1">{ride.pickupLocation}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-[10px] shrink-0">🏁</div>
                        <p className="text-xs font-bold text-gray-800 line-clamp-1">{ride.dropoffLocation}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setViewingRide(ride)}
                      className="w-full py-3.5 bg-black text-yellow-400 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {isUrdu ? 'مکمل تفصیلات اور رسید دیکھیں' : 'View Full Receipt & Details'}
                    </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
