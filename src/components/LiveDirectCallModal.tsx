import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Shield, User, Car, CheckCircle2, Radio, MapPin, Navigation, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, UserProfile, Ride } from '../types';

interface LiveDirectCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
  activeRide?: Ride | null;
  language: Language;
}

export const LiveDirectCallModal: React.FC<LiveDirectCallModalProps> = ({
  isOpen,
  onClose,
  user,
  activeRide,
  language
}) => {
  const isUrdu = language === 'ur';
  const [callState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('connected');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const userRole = user?.role || 'passenger';

  // Call duration counter
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && callState === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isOpen, callState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Connected Target Data (Direct Internet Network Connection - No Admin/Support Routing)
  const targetName = userRole === 'driver' 
    ? (activeRide?.passengerName || (isUrdu ? 'مسافر' : 'Passenger'))
    : (activeRide?.driverName || (isUrdu ? 'سپورٹ سینٹر' : 'Support Center'));

  const targetPhone = userRole === 'driver' 
    ? (activeRide?.passengerPhone || '0300-0000000')
    : (activeRide?.driverPhone || '0300-5544321');

  const targetVehicle = userRole === 'driver'
    ? ((user as any)?.vehicle || `${activeRide?.vehicleType?.toUpperCase() || 'VEHICLE'} CONNECTED`)
    : (activeRide?.driverVehicle || (userRole === 'passenger' ? ((user as any)?.vehicle || 'Toyota Corolla • ICT-786') : 'Pro Rider Fleet'));

  const targetVehiclePlate = activeRide?.driverVehicleNumber || 'ICT-LEB-2024';

  const avatarUrl = userRole === 'driver'
    ? (user?.selfieUrl)
    : (activeRide?.driverSelfie || 'https://images.unsplash.com/photo-1500648767791-0dcc994a43e?w=150');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 text-white font-sans">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
            <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
            <span>{isUrdu ? 'ڈرائیور کے ساتھ لائیو انٹرنیٹ نیٹ ورک کال' : 'Direct Internet Network Call with Driver'}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Connected Info */}
        <div className="flex flex-col items-center justify-center text-center my-auto space-y-5 w-full max-w-sm">
          <div className="relative">
            <div className="w-28 h-28 bg-gradient-to-tr from-yellow-500 to-yellow-300 rounded-full flex items-center justify-center text-black shadow-2xl shadow-yellow-500/30 border-4 border-yellow-400 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={targetName} className="w-full h-full object-cover" />
              ) : userRole === 'driver' ? (
                <User className="w-14 h-14 text-black" />
              ) : userRole === 'admin' ? (
                <Shield className="w-14 h-14 text-black" />
              ) : (
                <Car className="w-14 h-14 text-black" />
              )}
            </div>

            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full border-2 border-yellow-400/60 animate-ping -z-10 scale-125" />
            <div className="absolute inset-0 rounded-full border border-yellow-400/30 animate-pulse -z-10 scale-150" />
          </div>

          <div className="space-y-1.5 text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight text-yellow-400">
              {targetName}
            </h2>
            <p className="text-xs text-gray-300 font-extrabold uppercase tracking-widest">
              {targetPhone}
            </p>

            {/* Vehicle & Plate details */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-xl text-xs font-bold text-yellow-300 mt-1">
              <Car className="w-3.5 h-3.5" />
              <span>{targetVehicle}</span>
              <span className="text-gray-400">|</span>
              <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded text-[10px] font-black">{targetVehiclePlate}</span>
            </div>
          </div>

          {/* Ride Route Context if active */}
          {activeRide && (
            <div className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl text-left space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{activeRide.pickupLocation}</span>
              </div>
              <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                <Navigation className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{activeRide.dropoffLocation}</span>
              </div>
              <div className="text-right font-black text-white text-xs pt-1 border-t border-white/10">
                Fare: Rs. {activeRide.fare}
              </div>
            </div>
          )}

          {/* Live Audio Waveform */}
          <div className="flex items-center gap-1.5 h-8">
            {[40, 75, 100, 60, 90, 45, 80, 95, 50, 85].map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: isMuted ? [4, 4] : [8, h / 2, 8] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.08 }}
                className={`w-1.5 rounded-full ${isMuted ? 'bg-gray-600' : 'bg-yellow-400'}`}
              />
            ))}
          </div>

          {/* Duration & Live Line Status */}
          <div className="bg-white/10 border border-white/20 px-5 py-2 rounded-2xl text-center space-y-0.5">
            <div className="text-xl font-mono font-black text-white tracking-widest">
              {formatTime(callDuration)}
            </div>
            <div className="text-[10px] font-black uppercase text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{isUrdu ? 'کپتان و مسافر لائیو کنکٹڈ ہیں' : 'Captain & Passenger Fully Connected'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Call Controls & Direct Phone Launcher */}
        <div className="w-full max-w-sm flex flex-col gap-3 mb-4">
          <a
            href={`tel:${targetPhone}`}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl border border-emerald-400 active:scale-95 transition-all"
          >
            <Phone className="w-4 h-4 fill-current" />
            <span>{isUrdu ? 'موبائل ڈائلر سے کال کریں' : 'Call via Mobile Phone Dialer'}</span>
          </a>

          <div className="bg-neutral-900/90 border border-white/10 p-3 rounded-3xl flex items-center justify-around shadow-2xl">
            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span className="text-[9px] font-black uppercase tracking-wider">
                {isMuted ? (isUrdu ? 'مائیک بند' : 'Muted') : (isUrdu ? 'مائیک آن' : 'Mute')}
              </span>
            </button>

            {/* End Call Button */}
            <button
              onClick={onClose}
              className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xl active:scale-95 transition-all flex items-center justify-center border-2 border-red-400"
              title={isUrdu ? 'کال ختم کریں' : 'End Call'}
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            {/* Speaker Button */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3.5 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                isSpeakerOn ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="text-[9px] font-black uppercase tracking-wider">
                {isSpeakerOn ? (isUrdu ? 'اسپیکر آن' : 'Speaker') : (isUrdu ? 'اسپیکر بند' : 'Normal')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
