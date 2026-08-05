import React, { useState } from 'react';
import { Users, Check, X, MapPin, Clock, Calendar, ShieldCheck, Car, UserCheck, Sparkles, Music, Shield, Sliders } from 'lucide-react';
import { Ride } from '../../types';

interface CarpoolApprovalProps {
  localRides: Ride[];
  onApproveRide?: (id: string, extraData?: any) => void;
  onCancelRide?: (id: string) => void;
  showNotification: (msg: string) => void;
  isUrdu?: boolean;
}

// Sample drivers for Admin manual assignment
const ADMIN_DRIVER_POOL = [
  { id: 'DRV-101', name: 'Tariq Mehmood', vehicle: 'Toyota Corolla 2023 (Golden)', rating: '4.9 ★', phone: '0300-5551234' },
  { id: 'DRV-102', name: 'Muhammad Ali', vehicle: 'Honda Civic 2022 (White)', rating: '4.8 ★', phone: '0312-9876543' },
  { id: 'DRV-103', name: 'Kamran Khan', vehicle: 'Suzuki Alto VXR 2024 (Silver)', rating: '4.95 ★', phone: '0333-1112233' },
];

export const CarpoolApproval: React.FC<CarpoolApprovalProps> = ({
  localRides,
  onApproveRide,
  onCancelRide,
  showNotification,
  isUrdu = false
}) => {
  // Filter carpool rides
  const carpoolRides = localRides.filter(r => r.serviceType === 'carpool' || r.status === 'admin_pending_carpool');

  // Selected manual drivers per carpool ID
  const [selectedDrivers, setSelectedDrivers] = useState<Record<string, string>>({});
  const [selectedVibe, setSelectedVibe] = useState<Record<string, string>>({});

  const handleAssignAndApprove = (rideId: string) => {
    const driverId = selectedDrivers[rideId] || ADMIN_DRIVER_POOL[0].id;
    const assignedDriver = ADMIN_DRIVER_POOL.find(d => d.id === driverId) || ADMIN_DRIVER_POOL[0];
    const vibe = selectedVibe[rideId] || '🎶 Executive Office Commute (Soft Music & AC)';

    if (onApproveRide) {
      onApproveRide(rideId, {
        driverName: assignedDriver.name,
        driverPhone: assignedDriver.phone,
        vehicleName: assignedDriver.vehicle,
        carpoolRightsStatus: 'approved',
        rideVibe: vibe,
      });
    }
    showNotification(
      isUrdu 
        ? `ایڈمن نے کیپٹن ${assignedDriver.name} کو کارپول ${rideId} کے لیے کامیابی سے تفویض کر دیا!` 
        : `Admin manually assigned Captain ${assignedDriver.name} to Carpool ${rideId}!`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-black text-white p-6 rounded-[32px] border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg border border-emerald-400/40">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                {isUrdu ? 'کار پولنگ اور روٹ شیئرنگ کنٹرول روم' : 'Ingenious Carpool & Route Control'}
              </h3>
              <span className="px-2 py-0.5 bg-yellow-400 text-black font-black text-[9px] uppercase rounded-full">
                Admin Exclusive
              </span>
            </div>
            <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider mt-0.5">
              {isUrdu 
                ? 'ہر کارپول کا فیصلہ صرف ایڈمن کی باضابطہ منظوری اور ڈرائیور تفویض کے بعد ہوگا' 
                : '100% Admin oversight: Personally review, assign captains, set fun vibes & grant monthly seat rights'}
            </p>
          </div>
        </div>
        <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-center">
          <span className="text-[9px] font-black uppercase text-emerald-300 block">Pending Admin Matches</span>
          <span className="text-xl font-black text-yellow-400">{carpoolRides.length} Requests</span>
        </div>
      </div>

      {/* Admin Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-amber-900 text-xs font-bold shadow-sm">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
          <span>
            {isUrdu
              ? 'محفوظ اور تفریحی سفر: کوئی بھی کارپول براہِ راست نجی ڈرائیور سے کنیکٹ نہیں ہوتا۔ ایڈمن کی تصدیق ہر درخواست کا لازمی حصہ ہے۔'
              : 'Safe & Ingenious Mobility: No automatic unmonitored matching. Every carpool seat request requires official Admin assignment for safety, fun, and route efficiency.'}
          </span>
        </div>
      </div>

      {carpoolRides.length === 0 ? (
        <div className="bg-white p-12 rounded-[32px] border border-gray-200 text-center space-y-3">
          <Car className="w-12 h-12 text-emerald-500 mx-auto opacity-80" />
          <h4 className="text-base font-black uppercase text-black">
            {isUrdu ? 'کوئی معلق کار پولنگ درخواست نہیں ہے' : 'No Pending Carpool Requests'}
          </h4>
          <p className="text-xs text-gray-500 font-bold max-w-sm mx-auto">
            {isUrdu ? 'جب مسافر کار پول کی درخواست دیں گے، ایڈمن جائزہ کے لیے وہ یہاں نظر آئیں گی۔' : 'Passengers requesting route sharing and carpool seats will appear here for strict Admin review & assignment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {carpoolRides.map(ride => (
            <div key={ride.id} className="bg-white p-5 rounded-[28px] border-2 border-emerald-100 shadow-md space-y-4 hover:border-emerald-400 transition-all">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-gray-400 block">Carpool Booking</span>
                    <span className="text-xs font-black text-black">{ride.id}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Monthly Share Fare</span>
                  <span className="text-sm font-black text-emerald-700">Rs. {ride.fare?.toLocaleString()}</span>
                </div>
              </div>

              {/* Route */}
              <div className="space-y-2 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100 text-xs font-bold">
                <div className="flex items-center gap-2 text-gray-900">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{ride.pickupLocation}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-900">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">{ride.dropoffLocation}</span>
                </div>
              </div>

              {/* MANUAL DRIVER ASSIGNMENT SELECTOR */}
              <div className="space-y-1.5 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {isUrdu ? 'ایڈمن مینوئل ڈرائیور کیپٹن کا انتخاب:' : 'Assign verified Captain (Admin Choice):'}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Admin Managed
                  </span>
                </label>
                <select
                  value={selectedDrivers[ride.id] || ADMIN_DRIVER_POOL[0].id}
                  onChange={(e) => setSelectedDrivers({ ...selectedDrivers, [ride.id]: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-gray-300 rounded-xl p-2 text-gray-900 focus:outline-none focus:border-emerald-500"
                >
                  {ADMIN_DRIVER_POOL.map(drv => (
                    <option key={drv.id} value={drv.id}>
                      {drv.name} ({drv.vehicle}) — {drv.rating}
                    </option>
                  ))}
                </select>
              </div>

              {/* FUN RIDE VIBE SELECTOR */}
              <div className="space-y-1.5 bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
                <label className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isUrdu ? 'سفر کا ماحول اور وائب منتخب کریں:' : 'Select Carpool Vibe & Experience:'}</span>
                </label>
                <select
                  value={selectedVibe[ride.id] || '🎶 Executive Office Commute (Soft Music & AC)'}
                  onChange={(e) => setSelectedVibe({ ...selectedVibe, [ride.id]: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-amber-300 rounded-xl p-2 text-gray-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="🎶 Executive Office Commute (Soft Music & AC)">🎶 Executive Office Commute (Soft Music & AC)</option>
                  <option value="⚡ Express Speed Lane (No Stops, Quiet Ride)">⚡ Express Speed Lane (No Stops, Quiet Ride)</option>
                  <option value="🤝 Student & Professional Network (Friendly Vibes)">🤝 Student & Professional Network (Friendly Vibes)</option>
                  <option value="🤫 Peaceful Silence & AC Relaxation">🤫 Peaceful Silence & AC Relaxation</option>
                </select>
              </div>

              {/* Details Badges */}
              <div className="flex flex-wrap items-center justify-between text-[10px] font-black uppercase text-gray-500 gap-2">
                <span className="bg-gray-100 px-2.5 py-1 rounded-lg">
                  Distance: {ride.distance || '12 km'}
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                  22-Day Rights Pending Admin
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleAssignAndApprove(ride.id)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isUrdu ? 'ڈرائیور تفویض کریں اور کارپول منظور کریں' : 'Assign Captain & Approve'}</span>
                </button>
                <button
                  onClick={() => {
                    if (onCancelRide) onCancelRide(ride.id);
                    showNotification(`Carpool request ${ride.id} rejected.`);
                  }}
                  className="px-3.5 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-black text-[11px] uppercase rounded-xl flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
