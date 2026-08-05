import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Car, Star, CheckCircle, Shield, UserCheck, Clock, Send, MapPin, Award, CheckCircle2, ChevronRight, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ride, UserProfile, DriverProfile, Language } from '../types';
import DriverHistoryModal from './DriverHistoryModal';
import RideRatingModal from './RideRatingModal';

interface Props {
  user?: UserProfile;
  activeRides: Ride[];
  onAcceptRide?: (rideId: string, fare?: number) => void;
  onApproveRide?: (rideId: string) => void;
  onUpdateRideStatus?: (rideId: string, status: any, extra?: any) => void;
  onRateRide?: (rideId: string, rating: number, comment: string, role: 'driver' | 'passenger') => void;
  language?: Language;
  carpoolChatMessages: any[];
  setCarpoolChatMessages: React.Dispatch<React.SetStateAction<any[]>>;
  speakAnnouncement?: (en: string, ur: string) => void;
}

export default function CarpoolChatRoom({
  user,
  activeRides,
  onAcceptRide,
  onApproveRide,
  onUpdateRideStatus,
  onRateRide,
  language = 'en',
  carpoolChatMessages,
  setCarpoolChatMessages,
  speakAnnouncement
}: Props) {
  const isUrdu = language === 'ur';
  const isAdmin = user?.role === 'admin';
  const isDriver = user?.role === 'driver';

  const [chatInputText, setChatInputText] = useState('');
  const [selectedDriverForHistory, setSelectedDriverForHistory] = useState<any | null>(null);
  const [rideToRate, setRideToRate] = useState<Ride | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'requests' | 'booked'>('all');

  const carpoolRides = activeRides.filter(r => r.serviceType === 'carpool' || r.serviceType === 'sharing' || r.serviceType === 'city');

  const filteredRides = carpoolRides.filter(r => {
    if (activeTabFilter === 'requests') return r.status === 'pending' || r.status === 'driver_offered' || r.status === 'driver_pending_admin';
    if (activeTabFilter === 'booked') return r.status === 'accepted' || r.status === 'arrived' || r.status === 'ongoing' || r.status === 'completed';
    return true;
  });

  // Track previous rides to detect new ones
  const prevRidesRef = useRef<Ride[]>(activeRides);

  useEffect(() => {
    if (!isAdmin) return;

    const newRides = activeRides.filter(
      ride => !prevRidesRef.current.find(r => r.id === ride.id)
    );

    newRides.forEach(ride => {
      if (ride.serviceType === 'carpool' || ride.serviceType === 'monthly') {
        const notificationMsg = {
          id: 'admin-notif-' + Date.now() + '-' + ride.id,
          type: 'notification',
          text: isUrdu 
            ? `نئی ماہانہ کارپولنگ بکنگ موصول ہوئی: ${ride.pickupLocation} سے ${ride.dropoffLocation}` 
            : `NEW MONTHLY BOOKING: ${ride.pickupLocation} ➔ ${ride.dropoffLocation} (Waiting for Admin approval)`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        
        setCarpoolChatMessages(prev => {
          if (prev.some(m => m.id === notificationMsg.id)) return prev;
          return [notificationMsg, ...prev];
        });

        if (speakAnnouncement) {
          speakAnnouncement(
            "Admin, a new monthly carpool booking has been created and requires your review.",
            "ایڈمن، ایک نئی ماہانہ کارپولنگ بکنگ بنائی گئی ہے اور آپ کی منظوری کی منتظر ہے۔"
          );
        }
      }
    });

    prevRidesRef.current = activeRides;
  }, [activeRides, isAdmin, isUrdu, speakAnnouncement, setCarpoolChatMessages]);

  const handleSendMessage = () => {
    if (!chatInputText.trim()) return;

    const userMsg = {
      id: 'msg-user-' + Date.now(),
      sender: user?.name || (isDriver ? 'Captain Driver' : 'Passenger'),
      text: chatInputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDriver: isDriver,
      isAdmin: isAdmin
    };

    setCarpoolChatMessages(prev => [...prev, userMsg]);
    const textToSend = chatInputText;
    setChatInputText('');

    setTimeout(() => {
      if (isDriver) {
        setCarpoolChatMessages(prev => [
          ...prev,
          {
            id: 'msg-reply-' + Date.now(),
            sender: 'Passenger (Admin Hub)',
            text: isUrdu ? 'سلام! آپ کا ڈرائیور پروفائل دیکھ لیا گیا ہے۔ برائے مہربانی روٹ کا وقت کنفرم کریں۔' : 'Salam Captain! I saw your route details. Please confirm the pickup timing.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setCarpoolChatMessages(prev => [
          ...prev,
          {
            id: 'msg-reply-' + Date.now(),
            sender: isUrdu ? 'کپتان ڈرائیور (4.9 ★)' : 'Captain Driver (4.9 ★)',
            text: isUrdu ? 'جی وعلیکم السلام! میں آپ کے روٹ پر لائیو کارپولنگ سیٹ کے لیے دستیاب ہوں۔ درخواست ایڈمن کے پاس منظور ہو جائے گی۔' : 'Wa-Alaikum-Assalam! I am available on your route. Driver acceptance has been logged for Admin approval.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isDriver: true
          }
        ]);
      }
      if (speakAnnouncement) {
        speakAnnouncement("New message in carpooling room.", "کارپولنگ روم میں نیا پیغام آیا ہے۔");
      }
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden relative">
      {/* Top Banner Header */}
      <div className="bg-black text-white p-4 border-b border-yellow-400/30 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-black font-black text-lg shadow">
            💬
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-white tracking-wide flex items-center gap-1.5">
              <span>{isUrdu ? 'کارپولنگ اور لائیو سواری روم' : 'Carpooling & Live Rides Room'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[9px] text-yellow-400 font-bold uppercase tracking-wider">
              {isUrdu ? 'کپتان کی منظوری، ایڈمن کنفرمیشن اور ریٹنگز' : 'Driver Acceptances, Admin Approvals & Ratings'}
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${activeTabFilter === 'all' ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            {isUrdu ? 'تمام' : 'All'}
          </button>
          <button
            onClick={() => setActiveTabFilter('requests')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${activeTabFilter === 'requests' ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            {isUrdu ? 'درخواستیں' : 'Requests'}
          </button>
          <button
            onClick={() => setActiveTabFilter('booked')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${activeTabFilter === 'booked' ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            {isUrdu ? 'بک شدہ' : 'Booked'}
          </button>
        </div>
      </div>

      {/* Main Scrollable Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Carpooling Live Ride Requests Section */}
        {filteredRides.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center justify-between">
              <span>🚗 {isUrdu ? 'سرگرم کارپولنگ سواریاں اور درخواستیں' : 'Active Carpool Trips & Requests'}</span>
              <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[9px] font-black">
                {filteredRides.length} {isUrdu ? 'سواریاں' : 'Trips'}
              </span>
            </h4>

            {filteredRides.map((ride) => {
              const isPending = ride.status === 'pending' || ride.status === 'driver_offered';
              const isPendingAdmin = ride.status === 'driver_pending_admin';
              const isBooked = ride.status === 'accepted' || ride.status === 'arrived' || ride.status === 'ongoing' || ride.status === 'completed';

              return (
                <div
                  key={ride.id}
                  className={`p-4 rounded-3xl border-2 transition-all space-y-3 shadow-md ${
                    isBooked
                      ? 'bg-emerald-50/80 border-emerald-400'
                      : isPendingAdmin
                      ? 'bg-amber-50/80 border-amber-400'
                      : 'bg-white border-black'
                  }`}
                >
                  {/* Status Banner */}
                  <div className="flex items-center justify-between">
                    {isBooked ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-[9px] font-black uppercase tracking-wider shadow">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isUrdu ? 'دستخط شدہ اور بکڈ • Signed & Booked' : 'Signed & Booked'}</span>
                      </span>
                    ) : isPendingAdmin ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-black rounded-full text-[9px] font-black uppercase tracking-wider shadow animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isUrdu ? 'ڈرائیور نے قبول کیا • ایڈمن کی منظوری کا انتظار' : 'Accepted by Driver • Awaiting Admin Approval'}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-black text-yellow-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                        <span>⏳ {isUrdu ? 'منتظر کارپول درخواست' : 'Pending Carpool Request'}</span>
                      </span>
                    )}

                    <span className="text-xs font-black text-black bg-yellow-400/30 border border-yellow-400 px-2.5 py-0.5 rounded-lg">
                      Rs. {ride.fare?.toLocaleString()}
                    </span>
                  </div>

                  {/* Route & Timing Info */}
                  <div className="space-y-1.5 text-xs font-bold text-black border-b border-gray-200/80 pb-2">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>{isUrdu ? 'پک اپ:' : 'Pickup:'}</strong> {ride.pickupLocation}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                      <span><strong>{isUrdu ? 'ڈراپ آف:' : 'Dropoff:'}</strong> {ride.dropoffLocation}</span>
                    </p>
                    {ride.pickupTime && (
                      <p className="text-[10px] text-gray-600 font-bold flex items-center gap-2 pt-1">
                        <span>⏰ timing: {ride.pickupTime}</span>
                        <span>•</span>
                        <span>{ride.vehicleName || ride.vehicleType}</span>
                      </p>
                    )}
                  </div>

                  {/* Driver Profile Card if assigned or driver offers exist */}
                  {(ride.driverName || (ride.driverFareOffers && ride.driverFareOffers.length > 0)) && (
                    <div className="bg-white p-3 rounded-2xl border border-gray-200 space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 flex items-center justify-between">
                        <span>{isUrdu ? 'ڈرائیور کا ڈیٹا اور ریکارڈ' : 'Driver Profile & Stats'}</span>
                        <span className="text-amber-600 font-extrabold">⭐ {ride.driverRating || 4.9}</span>
                      </p>

                      <div className="flex items-center justify-between">
                        <div
                          onClick={() => {
                            setSelectedDriverForHistory({
                              name: ride.driverName || (isUrdu ? 'کپتان ڈرائیور' : 'Captain Driver'),
                              vehicleType: ride.vehicleType,
                              vehicleName: ride.driverVehicle || (isUrdu ? 'ٹویوٹا کرولا' : 'Toyota Corolla • ICT-786'),
                              phone: ride.driverPhone,
                              rating: ride.driverRating || 5.0,
                              completedTrips: (ride as any).completedTrips || 0,
                              totalEarnings: (ride as any).totalEarnings || 0,
                              selfieUrl: ride.driverSelfie || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                              route: `${ride.pickupLocation} ↔ ${ride.dropoffLocation}`
                            });
                          }}
                          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={ride.driverSelfie || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                            alt="Driver"
                            className="w-10 h-10 rounded-xl object-cover border-2 border-yellow-400"
                          />
                          <div>
                            <p className="text-xs font-black text-black uppercase flex items-center gap-1">
                              <span>{ride.driverName || (isUrdu ? 'کپتان ڈرائیور' : 'Captain Driver')}</span>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100" />
                            </p>
                            <p className="text-[9px] text-gray-500 font-bold">
                              {ride.driverVehicle || 'Toyota Corolla • ICT-786'}
                            </p>
                          </div>
                        </div>

                        {/* Button to view history */}
                        <button
                          onClick={() => {
                            setSelectedDriverForHistory({
                              name: ride.driverName || (isUrdu ? 'کپتان ڈرائیور' : 'Captain Driver'),
                              vehicleType: ride.vehicleType,
                              vehicleName: ride.driverVehicle || (isUrdu ? 'ٹویوٹا کرولا' : 'Toyota Corolla • ICT-786'),
                              phone: ride.driverPhone,
                              rating: ride.driverRating || 5.0,
                              completedTrips: (ride as any).completedTrips || 0,
                              totalEarnings: (ride as any).totalEarnings || 0,
                              selfieUrl: ride.driverSelfie || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                              route: `${ride.pickupLocation} ↔ ${ride.dropoffLocation}`
                            });
                          }}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-yellow-400 hover:text-black text-gray-700 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1 border border-gray-200"
                        >
                          <span>{isUrdu ? 'ہسٹری دیکھیں' : 'History & Stats'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Summary Badges: Trips & Earnings */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100 text-[9px]">
                        <div className="text-center bg-gray-50 p-1.5 rounded-lg border">
                          <span className="text-gray-400 block font-bold">{isUrdu ? 'سواریاں' : 'Trips'}</span>
                          <span className="font-black text-black">248 {isUrdu ? 'مکمل' : 'Done'}</span>
                        </div>
                        <div className="text-center bg-gray-50 p-1.5 rounded-lg border">
                          <span className="text-gray-400 block font-bold">{isUrdu ? 'کمائی' : 'Earned'}</span>
                          <span className="font-black text-emerald-700">Rs. 185K</span>
                        </div>
                        <div className="text-center bg-gray-50 p-1.5 rounded-lg border">
                          <span className="text-gray-400 block font-bold">{isUrdu ? 'ریٹنگ' : 'Rating'}</span>
                          <span className="font-black text-amber-600">4.9 ★</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* If Driver: Driver Acceptance Button */}
                    {isDriver && isPending && (
                      <button
                        onClick={() => {
                          if (onAcceptRide) onAcceptRide(ride.id, ride.fare);
                        }}
                        className="flex-1 py-2.5 bg-black hover:bg-neutral-800 text-yellow-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>{isUrdu ? 'قبول کریں (ایڈمن کے پاس جائے گا)' : 'Accept Ride (Sends to Admin)'}</span>
                      </button>
                    )}

                    {/* If Admin OR any user in Admin Mode: Admin Approval Button */}
                    {(isAdmin || isPendingAdmin || isPending) && (
                      <button
                        onClick={() => {
                          if (onApproveRide) {
                            onApproveRide(ride.id);
                          } else if (onUpdateRideStatus) {
                            onUpdateRideStatus(ride.id, 'accepted');
                          }
                        }}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isUrdu ? 'ایڈمن سے منظوری دیں (بک کریں)' : 'Admin Approve & Sign Ride'}</span>
                      </button>
                    )}

                    {/* Rating Button */}
                    <button
                      onClick={() => setRideToRate(ride)}
                      className="px-3 py-2.5 bg-yellow-400/20 hover:bg-yellow-400 text-yellow-800 hover:text-black rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 border border-yellow-400/40"
                    >
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-600" />
                      <span>{isUrdu ? 'ریٹنگ دیں' : 'Rate Trip'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Chat Messages Feed */}
        <div className="space-y-3 pt-2">
          <div className="p-3.5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-yellow-800 uppercase tracking-widest">
                {isUrdu ? 'اسلام آباد - راولپنڈی کارپولنگ چیٹ ہب' : 'Islamabad-Rawalpindi Commuter Hub'}
              </p>
              <h4 className="text-xs font-black text-black uppercase mt-0.5">
                {isUrdu ? 'ماہانہ پیکیجز اور سواری رابطہ لائیو چیٹ' : 'Monthly Subscriptions & Live Coordination'}
              </h4>
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          </div>

          {carpoolChatMessages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              {msg.type === 'notification' ? (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2 text-[10px]">
                  <p className="font-black text-amber-800 uppercase flex items-center gap-1.5">
                    <span>🔔</span>
                    <span>{msg.text}</span>
                  </p>
                  <p className="text-[8px] text-amber-600 font-bold text-right">{msg.time}</p>
                </div>
              ) : (
                <div className={`flex ${msg.sender?.includes(user?.name || 'Passenger') ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs shadow-sm ${
                      msg.sender?.includes(user?.name || 'Passenger')
                        ? 'bg-black text-yellow-400 rounded-tr-none'
                        : msg.isDriver
                        ? 'bg-amber-100 text-black border border-amber-300 rounded-tl-none'
                        : 'bg-white text-black border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-[9px] font-black uppercase tracking-wider text-yellow-600">
                        {msg.sender}
                      </p>
                      {msg.isDriver && (
                        <span className="bg-yellow-400 text-black text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                          Captain
                        </span>
                      )}
                    </div>
                    <p className="font-medium leading-relaxed">{msg.text}</p>
                    <p className="text-[7px] text-right text-gray-400 mt-1">{msg.time}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Message Input Box */}
      <div className="bg-white border-t border-gray-200 p-3 shrink-0 flex gap-2">
        <input
          type="text"
          value={chatInputText}
          onChange={(e) => setChatInputText(e.target.value)}
          placeholder={
            isUrdu ? 'کارپولنگ روم میں پیغام لکھیں...' : 'Type message to carpool room drivers & passengers...'
          }
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-yellow-400 focus:bg-white transition-all text-black"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
        />
        <button
          onClick={handleSendMessage}
          className="px-4 bg-black hover:bg-neutral-800 text-yellow-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 shadow"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isUrdu ? 'بھیجیں' : 'Send'}</span>
        </button>
      </div>

      {/* Driver History Modal */}
      <AnimatePresence>
        {selectedDriverForHistory && (
          <DriverHistoryModal
            driver={selectedDriverForHistory}
            onClose={() => setSelectedDriverForHistory(null)}
            language={language}
          />
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {rideToRate && (
          <RideRatingModal
            ride={rideToRate}
            userRole={user?.role || 'passenger'}
            onClose={() => setRideToRate(null)}
            onSubmitRating={(rideId, rating, comment, role) => {
              if (onRateRide) {
                onRateRide(rideId, rating, comment, role);
              }
              setRideToRate(null);
            }}
            language={language}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
