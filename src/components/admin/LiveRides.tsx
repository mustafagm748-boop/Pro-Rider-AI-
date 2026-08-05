
import React from 'react';
import { Map, Plus, Eye, Check, X, ShieldCheck } from 'lucide-react';
import { Ride } from '../../types';

interface LiveRidesProps {
  localRides: Ride[];
  rideFilter: string;
  setRideFilter: (filter: any) => void;
  filteredRides: Ride[];
  isUrdu: boolean;
  setShowDispatchModal: (show: boolean) => void;
  setViewingRouteRide: (ride: Ride) => void;
  onUpdateRideStatus?: (id: string, status: any, additionalData?: any) => void;
  onApproveRide?: (id: string) => void;
  onCompleteRide?: (id: string) => void;
  onCancelRide?: (id: string) => void;
  handleCompleteLocalRide: (id: string) => void;
  handleCancelLocalRide: (id: string) => void;
  showNotification: (msg: string) => void;
}

const LiveRides: React.FC<LiveRidesProps> = ({
  localRides,
  rideFilter,
  setRideFilter,
  filteredRides,
  isUrdu,
  setShowDispatchModal,
  setViewingRouteRide,
  onUpdateRideStatus,
  onApproveRide,
  onCompleteRide,
  onCancelRide,
  handleCompleteLocalRide,
  handleCancelLocalRide,
  showNotification
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-gray-200">
        <div>
          <h3 className="text-base font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Map className="w-5 h-5 text-emerald-500" />
            Live Ride Operations & Route Control
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase">Monitor active passenger trips, driver routes, and status overrides</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowDispatchModal(true)}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Dispatch Manual Ride
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'pending', 'in_status', 'driver_pending', 'ongoing', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setRideFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              rideFilter === f ? 'bg-black text-yellow-400' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f === 'in_status' ? (isUrdu ? 'اسٹیٹس بورڈ پر' : 'In Status Pool') : 
             f === 'driver_pending' ? (isUrdu ? 'ڈرائیور کی منظوری' : 'Driver Approvals') : 
             f === 'pending' ? (isUrdu ? 'نئی بکنگز' : 'New Bookings') : 
             f === 'ongoing' ? (isUrdu ? 'جاری سواریاں' : 'Active/Ongoing') : 
             f === 'completed' ? (isUrdu ? 'مکمل شدہ' : 'Completed') : f} ({
              localRides.filter(r => 
                f === 'all' ? true : 
                f === 'ongoing' ? (r.status === 'ongoing' || r.status === 'accepted' || r.status === 'arrived') : 
                f === 'completed' ? (r.status === 'completed' || r.status === 'cancelled') :
                f === 'driver_pending' ? r.status === 'driver_pending_admin' :
                r.status === f
              ).length
            })
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRides.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 space-y-2">
            <Map className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-xs font-black uppercase text-gray-400">No active rides matching filter</p>
          </div>
        ) : (
          filteredRides.map(ride => (
            <div key={ride.id} className="bg-white p-5 rounded-[28px] border border-gray-200 shadow-sm space-y-4 relative">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-[10px] font-black uppercase bg-black text-yellow-400 px-2.5 py-1 rounded-xl">
                  {ride.id}
                </span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  ride.status === 'ongoing' ? 'bg-emerald-100 text-emerald-700 animate-pulse' :
                  ride.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                  ride.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  ride.status === 'in_status' ? 'bg-teal-100 text-teal-800' :
                  ride.status === 'driver_pending_admin' ? 'bg-orange-100 text-orange-800 animate-pulse' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  ● {
                    ride.status === 'pending' ? 'Pending Approval' :
                    ride.status === 'in_status' ? 'On Status Board' :
                    ride.status === 'driver_pending_admin' ? 'Awaiting Driver Approval' :
                    ride.status
                  }
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-gray-900">
                  <span>📍 Pickup: {ride.pickupLocation}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-gray-900">
                  <span>🏁 Dropoff: {ride.dropoffLocation}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-100">
                  <span>Vehicle: {ride.vehicleType?.toUpperCase() || 'SEDAN'}</span>
                  <span className="text-sm font-black text-black">Rs. {ride.fare}</span>
                </div>

                {ride.serviceType === 'sharing' && (
                  <div className="p-3 bg-amber-50/70 rounded-2xl border-2 border-amber-200/50 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider">📦 Monthly Subscription Rights</span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                        ride.carpoolRightsStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        ride.carpoolRightsStatus === 'pending' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                        ride.carpoolRightsStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {ride.carpoolRightsStatus || 'none'}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-500 font-medium">Allows user to utilize shared and carpooling privileges for their 22-day model.</p>
                    {ride.carpoolRightsStatus === 'pending' && (
                      <button
                        onClick={() => {
                          if (onUpdateRideStatus) {
                            onUpdateRideStatus(ride.id, ride.status, { carpoolRightsStatus: 'approved' });
                          }
                          showNotification("Monthly Package Sharing & Carpooling Rights APPROVED!");
                        }}
                        className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-[9px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 transition-all shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Approve Sharing & Carpool Rights
                      </button>
                    )}
                  </div>
                )}
              </div>

              {(ride.status === 'driver_pending_admin' || ride.driverName || ride.driverPhone) && (
                <div className="p-3 bg-neutral-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-yellow-400">
                    <img 
                      referrerPolicy="no-referrer"
                      src={ride.driverSelfie || 'https://images.unsplash.com/photo-1500648767791-0dcc994a43e?w=150'} 
                      className="w-full h-full object-cover" 
                      alt="Driver Selfie"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-black uppercase text-yellow-600 tracking-wider">
                      {ride.status === 'driver_pending_admin' ? 'Driver Requesting Assignment' : 'Assigned Driver'}
                    </p>
                    <p className="text-[11px] font-black text-black uppercase truncate">{ride.driverName || 'Driver'}</p>
                    <p className="text-[9px] text-gray-500 font-bold truncate">{ride.driverVehicle || 'Pro Vehicle'}</p>
                    <p className="text-[9px] text-gray-400 truncate">📞 {ride.driverPhone || '03125007782'}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-2">
                {ride.serviceType === 'sharing' ? (
                  <>
                    {ride.status === 'pending' && (
                      <button
                        onClick={() => {
                          if (onUpdateRideStatus) {
                            onUpdateRideStatus(ride.id, 'accepted');
                          }
                          showNotification("Monthly Package Approved & Activated!");
                        }}
                        className="col-span-3 py-3 bg-black hover:bg-neutral-900 text-yellow-400 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        <Check className="w-4 h-4 text-yellow-400" /> Approve Monthly Package
                      </button>
                    )}
                    <button 
                      onClick={() => setViewingRouteRide(ride)}
                      className="py-2.5 bg-gray-100 hover:bg-gray-200 text-black font-black text-[9px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Track GPS
                    </button>
                    <button 
                      onClick={() => {
                        if (onCompleteRide) onCompleteRide(ride.id);
                        else handleCompleteLocalRide(ride.id);
                      }}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Complete
                    </button>
                    <button 
                      onClick={() => {
                        if (onCancelRide) onCancelRide(ride.id);
                        else handleCancelLocalRide(ride.id);
                      }}
                      className="py-2.5 bg-red-100 hover:bg-red-200 text-red-600 font-black text-[9px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </>
                ) : ride.status === 'pending' || ride.status === 'in_status' ? (
                  <div className="col-span-3 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        if (onApproveRide) {
                          onApproveRide(ride.id);
                        } else if (onUpdateRideStatus) {
                          onUpdateRideStatus(ride.id, 'accepted');
                        }
                        showNotification(isUrdu ? "سواری فوری منظور اور قبول کر لی گئی!" : "Ride Approved & Instantly Accepted!");
                      }}
                      className="w-full py-3 bg-black hover:bg-neutral-900 text-yellow-400 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer border border-yellow-400/30"
                    >
                      <Check className="w-4 h-4 text-yellow-400" /> {isUrdu ? 'فوری سواری منظور کریں (قبول کریں)' : 'Approve & Accept Ride'}
                    </button>
                    <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 px-1">
                      <span>⏱️ {isUrdu ? 'کپتانوں اور ایڈمن کے لیے دستیاب' : 'Available for Admin & All Captains'}</span>
                      <span className="text-emerald-600 font-extrabold uppercase">● {isUrdu ? 'لائیو' : 'Live Broadcast'}</span>
                    </div>
                  </div>
                ) : ride.status === 'driver_pending_admin' ? (
                  <>
                    <button
                      onClick={() => {
                        if (onUpdateRideStatus) {
                          onUpdateRideStatus(ride.id, 'accepted');
                          showNotification("Driver assignment approved! Ride is now live.");
                        }
                      }}
                      className="col-span-2 py-3 bg-black hover:bg-neutral-900 text-yellow-400 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <Check className="w-4 h-4 text-yellow-400" /> Approve Driver
                    </button>
                    <button
                      onClick={() => {
                        if (onUpdateRideStatus) {
                          onUpdateRideStatus(ride.id, 'in_status', { 
                            driverId: null, 
                            driverName: null, 
                            driverVehicle: null, 
                            driverPhone: null, 
                            driverSelfie: null 
                          });
                          showNotification("Driver rejected. Ride returned to status board.");
                        }
                      }}
                      className="py-3 bg-red-50 hover:bg-red-100 text-red-600 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1 transition-all border border-red-200"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setViewingRouteRide(ride)}
                      className="py-2.5 bg-gray-100 hover:bg-gray-200 text-black font-black text-[9px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Track GPS
                    </button>
                    <button 
                      onClick={() => {
                        if (onCompleteRide) onCompleteRide(ride.id);
                        else handleCompleteLocalRide(ride.id);
                      }}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Complete
                    </button>
                    <button 
                      onClick={() => {
                        if (onCancelRide) onCancelRide(ride.id);
                        else handleCancelLocalRide(ride.id);
                      }}
                      className="py-2.5 bg-red-100 hover:bg-red-200 text-red-600 font-black text-[9px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveRides;
