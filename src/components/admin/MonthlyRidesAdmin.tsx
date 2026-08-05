import React, { useState } from 'react';
import { Calendar, Clock, Check, X, MapPin, DollarSign, User, ShieldCheck } from 'lucide-react';
import { Ride } from '../../types';

interface MonthlyRidesAdminProps {
  localRides: Ride[];
  onApproveRide?: (id: string) => void;
  onCancelRide?: (id: string) => void;
  showNotification: (msg: string) => void;
  isUrdu?: boolean;
}

export const MonthlyRidesAdmin: React.FC<MonthlyRidesAdminProps> = ({
  localRides,
  onApproveRide,
  onCancelRide,
  showNotification,
  isUrdu = false
}) => {
  // Filter monthly commute rides
  const monthlyRides = localRides.filter(r => r.travelDays || r.totalMonthlyKm || r.serviceType === 'monthly');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-yellow-600 via-amber-700 to-black text-white p-6 rounded-[32px] border border-yellow-400/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-400 text-black rounded-2xl shadow-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-yellow-300">
              {isUrdu ? 'ماہانہ سبسکرپشن اور دفتر/کالج سواری کا انتظام' : 'Monthly Commute & Subscription Management'}
            </h3>
            <p className="text-[10px] text-amber-200 font-bold uppercase tracking-wider">
              {isUrdu ? 'روزانہ کی دفتر، اسکول اور کالج سواریوں کی منظوری دیں' : 'Manage fixed daily office/college pick and drop contracts, monthly KM budgets & schedules'}
            </p>
          </div>
        </div>
        <div className="px-4 py-2 bg-yellow-400/20 border border-yellow-400/30 rounded-2xl text-center">
          <span className="text-[9px] font-black uppercase text-amber-300 block">Monthly Contracts</span>
          <span className="text-xl font-black text-yellow-400">{monthlyRides.length} Active</span>
        </div>
      </div>

      {monthlyRides.length === 0 ? (
        <div className="bg-white p-12 rounded-[32px] border border-gray-200 text-center space-y-3">
          <Calendar className="w-12 h-12 text-yellow-500 mx-auto opacity-80" />
          <h4 className="text-base font-black uppercase text-black">
            {isUrdu ? 'کوئی ماہانہ سواری کی درخواست نہیں ہے' : 'No Monthly Commute Contracts Pending'}
          </h4>
          <p className="text-xs text-gray-500 font-bold max-w-sm mx-auto">
            {isUrdu ? 'جب مسافر ماہانہ پیکج بک کریں گے، تو ان کے معاہدے یہاں آئیں گے۔' : 'Monthly office/college commute requests submitted by passengers will be listed here for approval.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {monthlyRides.map(m => (
            <div key={m.id} className="bg-white p-5 rounded-[28px] border border-gray-200 shadow-sm space-y-4 hover:border-yellow-400 transition-all">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-100 text-yellow-800 rounded-xl">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-gray-400 block">Subscription ID</span>
                    <span className="text-xs font-black text-black">{m.id}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Monthly PKR Fare</span>
                  <span className="text-sm font-black text-yellow-600">Rs. {m.fare?.toLocaleString()}</span>
                </div>
              </div>

              {/* Route */}
              <div className="space-y-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs font-bold">
                <div className="flex items-center gap-2 text-gray-800">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{m.pickupLocation}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-800">
                  <MapPin className="w-4 h-4 text-yellow-600 shrink-0" />
                  <span className="truncate">{m.dropoffLocation}</span>
                </div>
              </div>

              {/* Schedule and KM Details */}
              <div className="grid grid-cols-3 gap-2 bg-yellow-50/50 p-3 rounded-2xl border border-yellow-100 text-[10px] font-black uppercase text-gray-700">
                <div>
                  <span className="text-[8px] text-gray-400 block">Travel Days</span>
                  <span>{m.travelDays || 22} Days/mo</span>
                </div>
                <div>
                  <span className="text-[8px] text-gray-400 block">Daily KM</span>
                  <span>{m.dailyKm || 30} KM</span>
                </div>
                <div>
                  <span className="text-[8px] text-gray-400 block">Monthly KM</span>
                  <span>{m.totalMonthlyKm || 660} KM</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    if (onApproveRide) onApproveRide(m.id);
                    showNotification(`Monthly contract ${m.id} approved!`);
                  }}
                  className="flex-1 py-2.5 bg-black hover:bg-gray-900 text-yellow-400 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Monthly Contract</span>
                </button>
                <button
                  onClick={() => {
                    if (onCancelRide) onCancelRide(m.id);
                    showNotification(`Monthly contract ${m.id} cancelled.`);
                  }}
                  className="px-3 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
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
