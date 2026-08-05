import React, { useState, useEffect } from 'react';
import { MapView } from './MapView';
import { Ride } from '../types';
import { Phone, MessageSquare, ArrowLeft, Clock, Star, Car, ShieldCheck, Map as MapIcon, Navigation, Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_KEY = (process.env.GOOGLE_MAPS_PLATFORM_KEY) || (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface RideTrackingViewProps {
  ride: Ride;
  onBack?: () => void;
  onCancelRide?: (rideId: string) => void;
  onCompleteRide?: (rideId: string) => void;
  onUpdateStatus?: (rideId: string, status: 'arrived' | 'ongoing' | 'completed') => void;
  language?: string;
  isDriver?: boolean;
  onStartCall?: (rideId: string, role: 'driver' | 'passenger') => void;
}

export const RideTrackingView: React.FC<RideTrackingViewProps> = ({
  ride,
  onBack,
  onCancelRide,
  onCompleteRide,
  onUpdateStatus,
  language = 'en',
  isDriver = false,
  onStartCall
}) => {
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string }>({ 
    distance: ride.distance || '3.5 km', 
    duration: 'Calculating...' 
  });
  const [isCalling, setIsCalling] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { 
      sender: 'driver', 
      text: language === 'ur' ? 'سلام! میں راستے میں ہوں اور جلد پہنچ رہا ہوں۔' : 'Hello! I am on my way and arriving shortly.', 
      time: 'Just now' 
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [showFullDetails, setShowFullDetails] = useState(false);

  const driverName = ride.driverName || 'Pro Driver';
  const driverSelfie = ride.driverSelfie;
  const driverVehicle = ride.driverVehicle || 'Premium Vehicle';
  const driverRating = ride.driverRating || 4.9;
  const isUrdu = language === 'ur';

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setMessages(prev => [...prev, { sender: isDriver ? 'driver' : 'passenger', text: inputMsg, time: 'Just now' }]);
    setInputMsg('');
    
    if (!isDriver) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          sender: 'driver', 
          text: isUrdu ? 'ٹھیک ہے، میں سمجھ گیا ہوں۔' : 'Understood, on my way!', 
          time: 'Just now' 
        }]);
      }, 1500);
    }
  };

// Allow RideTrackingView to use built-in Street Map fallback when key is not set

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 text-black relative overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-30 sticky top-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-black hover:text-yellow-400 transition-all active:scale-90"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              {isUrdu ? 'لائیو ٹریکنگ' : 'Live Tracking'}
            </h1>
            <p className="text-[10px] font-bold text-gray-500 font-mono">ID: {ride.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-yellow-400 text-black rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm">
            {ride.status === 'accepted' ? (isUrdu ? 'ڈرائیور آ رہا ہے' : 'Arriving') : 
             ride.status === 'arrived' ? (isUrdu ? 'پہنچ گئے' : 'Arrived') :
             ride.status === 'ongoing' ? (isUrdu ? 'سفر جاری ہے' : 'On Trip') :
             (isUrdu ? 'سواری' : 'Ride')}
          </span>
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center font-bold text-sm shadow-sm"
              title="Close View"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Content: MapView */}
      <div className="flex-1 relative">
        <MapView 
          pickup={ride.pickupLocation} 
          destination={ride.dropoffLocation}
          pickupCoords={ride.pickupCoords}
          dropoffCoords={ride.dropoffCoords}
          className="w-full h-full absolute inset-0"
          driverCoords={ride.driverCoords}
          driverName={driverName}
          vehicleType={ride.vehicleType || 'Sedan'}
          onRouteInfo={setRouteInfo}
          showLiveVehicle={ride.status === 'ongoing' || ride.status === 'accepted'}
        />

        {/* Floating ETA & Distance Badge */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-4 bg-black/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-yellow-400/40 z-20 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-black">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
              {isUrdu ? 'تخمینہ وقت' : 'Est. Arrival'}
            </p>
            <p className="text-lg font-black uppercase tracking-tighter leading-none mt-0.5">{routeInfo.duration || '...'}</p>
            <p className="text-[10px] text-gray-300 font-bold mt-1 uppercase tracking-wider">{routeInfo.distance} • GPS ACTIVE</p>
          </div>
        </motion.div>

        {/* Action Controls Overlay (if driver) */}
        {isDriver && (
          <div className="absolute top-4 right-4 z-20 space-y-2">
            <button 
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ride.pickupLocation)}&destination=${encodeURIComponent(ride.dropoffLocation)}`, '_blank')}
              className="bg-white text-black p-3 rounded-2xl shadow-xl border border-gray-200 flex items-center gap-2 text-[10px] font-black uppercase hover:bg-gray-100 transition-colors"
            >
              <Navigation className="w-4 h-4 text-blue-600" /> Navigation
            </button>
          </div>
        )}
      </div>

      {/* Driver/Passenger Card & Action Controls Bottom Sheet */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-white border-t border-gray-200 rounded-t-[32px] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-6 z-30 space-y-6"
      >
        {/* User Details */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black text-xl shadow-lg border-2 border-black overflow-hidden">
                {isDriver ? (
                  <div className="bg-black text-yellow-400 w-full h-full flex items-center justify-center">
                    <User className="w-7 h-7" />
                  </div>
                ) : (
                  driverSelfie ? (
                    <img src={driverSelfie} alt="Driver" className="w-full h-full object-cover" />
                  ) : (
                    <Car className="w-7 h-7" />
                  )
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase text-black">
                  {isDriver ? (ride.passengerName || 'Passenger') : driverName}
                </h3>
                {!isDriver && (
                  <span className="flex items-center text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md">
                    <Star className="w-3 h-3 fill-current text-yellow-500 mr-1" /> {driverRating}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {isDriver ? (isUrdu ? 'منزل: ' : 'To: ') + ride.dropoffLocation : driverVehicle}
              </p>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isUrdu ? 'محفوظ رابطہ فعال' : 'Secure Encrypted Connection'}
              </p>
            </div>
          </div>

          {['accepted', 'arrived', 'ongoing'].includes(ride.status) && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (onStartCall) {
                    onStartCall(ride.id, isDriver ? 'driver' : 'passenger');
                  } else {
                    setIsCalling(true);
                    setTimeout(() => setIsCalling(false), 3000);
                  }
                }}
                className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all active:scale-90"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setChatOpen(!chatOpen)}
                className="w-12 h-12 rounded-2xl bg-black text-yellow-400 flex items-center justify-center shadow-lg hover:bg-gray-800 transition-all active:scale-90 relative"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">1</span>
              </button>
            </div>
          )}
        </div>

        {isCalling && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-center text-xs font-black animate-pulse flex items-center justify-center gap-2">
            <Phone className="w-4 h-4 animate-bounce" />
            {isUrdu ? 'رابطہ ہو رہا ہے...' : 'Establishing secure VoIP tunnel...'}
          </div>
        )}

        <AnimatePresence>
          {chatOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Secure Live Chat</span>
                <button onClick={() => setChatOpen(false)} className="text-[10px] font-black text-gray-400 hover:text-black uppercase">Close</button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === (isDriver ? 'driver' : 'passenger') ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-2xl text-[11px] font-bold max-w-[85%] shadow-sm ${m.sender === (isDriver ? 'driver' : 'passenger') ? 'bg-black text-yellow-400 rounded-tr-none' : 'bg-white border border-gray-200 text-black rounded-tl-none'}`}>
                      {m.text}
                      <p className="text-[8px] mt-1 opacity-50">{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="flex gap-2 pt-2">
                <input 
                  type="text" 
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder={isUrdu ? 'پیغام لکھیں...' : "Type message..."}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-yellow-400 font-bold shadow-inner"
                />
                <button type="submit" className="p-2.5 bg-yellow-400 text-black rounded-xl hover:bg-yellow-500 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Route Details Card */}
        <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 space-y-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-5">
            <MapIcon className="w-20 h-20" />
          </div>
          
          <div className="space-y-3 relative z-10">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center pt-1 shrink-0">
                <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                <div className="w-0.5 h-6 bg-gray-200 my-1" />
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isUrdu ? 'پک اپ' : 'Pickup Location'}</p>
                  <p className="text-xs font-black text-black leading-tight mt-0.5 truncate">{ride.pickupLocation}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isUrdu ? 'منزل' : 'Destination'}</p>
                  <p className="text-xs font-black text-black leading-tight mt-0.5 truncate">{ride.dropoffLocation}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isUrdu ? 'کل کرایہ' : 'Final Total Fare'}</p>
              <p className="text-xl font-black text-black font-mono italic">Rs. {ride.fare.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isUrdu ? 'گاڑی' : 'Vehicle Type'}</p>
              <p className="text-xs font-black text-black uppercase tracking-tighter">{ride.vehicleType || 'Sedan'}</p>
            </div>
          </div>

          <button 
            onClick={() => setShowFullDetails(true)}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all mt-2"
          >
            {isUrdu ? 'مکمل تفصیلات دیکھیں' : 'View Full Details & Receipt'}
          </button>
        </div>

        {/* Action Buttons for Lifecycle */}
        <div className="flex flex-col gap-3">
          {isDriver ? (
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={ride.status !== 'accepted'}
                onClick={() => onUpdateStatus?.(ride.id, 'arrived')}
                className={`py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-md ${
                  ride.status === 'arrived' 
                    ? 'bg-amber-500 text-white ring-4 ring-amber-500/20' 
                    : ride.status === 'accepted' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-400 opacity-50'
                }`}
              >
                Arrived
              </button>
              <button
                disabled={ride.status !== 'arrived'}
                onClick={() => onUpdateStatus?.(ride.id, 'ongoing')}
                className={`py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-md ${
                  ride.status === 'ongoing' 
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-600/20' 
                    : ride.status === 'arrived' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 opacity-50'
                }`}
              >
                Start
              </button>
              <button
                disabled={ride.status !== 'ongoing'}
                onClick={() => onCompleteRide?.(ride.id)}
                className={`py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-md ${
                  ride.status === 'ongoing' ? 'bg-black text-yellow-400 hover:bg-gray-800 shadow-xl' : 'bg-gray-100 text-gray-400 opacity-50'
                }`}
              >
                Finish
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => onCancelRide?.(ride.id)}
                className="flex-1 py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
              >
                {isUrdu ? 'منسوخ کریں' : 'Cancel Ride'}
              </button>
              {ride.status === 'ongoing' && (
                <button 
                  onClick={() => onCompleteRide?.(ride.id)}
                  className="flex-1 py-4 bg-black text-yellow-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-yellow-400/10"
                >
                  {isUrdu ? 'سفر مکمل' : 'Finish Trip'}
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* FULL DETAILS MODAL */}
      <AnimatePresence>
        {showFullDetails && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] overflow-hidden flex flex-col shadow-2xl border border-white/10"
            >
              {/* Receipt Header */}
              <div className="bg-black p-6 text-center space-y-2 relative">
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => setShowFullDetails(false)}
                    className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    ✕
                  </button>
                </div>
                <div className="w-16 h-16 bg-yellow-400 rounded-2xl mx-auto flex items-center justify-center shadow-xl rotate-3">
                  <ShieldCheck className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-yellow-400 pt-2">
                  {isUrdu ? 'سواری کی رسید' : 'Trip Receipt'}
                </h2>
                <p className="text-[10px] font-bold text-gray-400 font-mono">#{ride.id.toUpperCase()}</p>
              </div>

              {/* Receipt Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[60vh] custom-scrollbar">
                {/* Trip Route */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isUrdu ? 'پک اپ لوکیشن' : 'Pickup Point'}</p>
                      <p className="text-sm font-bold text-black leading-tight">{ride.pickupLocation}</p>
                    </div>
                  </div>
                  <div className="ml-4 w-0.5 h-6 bg-gray-100" />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isUrdu ? 'منزل' : 'Dropoff Point'}</p>
                      <p className="text-sm font-bold text-black leading-tight">{ride.dropoffLocation}</p>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Fare Summary */}
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-600">
                    <span>{isUrdu ? 'بنیادی کرایہ' : 'Base Fare'}</span>
                    <span className="font-mono">Rs. {(ride.fare * 0.8).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-600">
                    <span>{isUrdu ? 'ٹیکس اور فیس' : 'Taxes & Fees'}</span>
                    <span className="font-mono">Rs. {(ride.fare * 0.2).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isUrdu ? 'کل ادا شدہ کرایہ' : 'Total Amount'}</p>
                      <p className="text-2xl font-black text-black">Rs. {ride.fare.toLocaleString()}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">
                      {isUrdu ? 'کیش' : 'Cash Payment'}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isUrdu ? 'گاڑی کی قسم' : 'Vehicle'}</p>
                    <p className="text-xs font-black text-black uppercase">{ride.vehicleType || 'Sedan'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isUrdu ? 'تاریخ' : 'Date'}</p>
                    <p className="text-xs font-black text-black">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => setShowFullDetails(false)}
                  className="w-full py-4 bg-black text-yellow-400 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  {isUrdu ? 'بند کریں' : 'Close Receipt'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
