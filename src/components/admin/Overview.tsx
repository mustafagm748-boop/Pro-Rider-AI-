
import React from 'react';
import { Activity, ShieldCheck, ArrowRight } from 'lucide-react';
import { Ride } from '../../types';

interface OverviewProps {
  localRides: Ride[];
  setActiveSection: (section: any) => void;
  adminOptions: any[];
  userSearch?: string;
  pendingDriversCount?: number;
}

const Overview: React.FC<OverviewProps> = ({ localRides, setActiveSection, adminOptions, userSearch = '', pendingDriversCount = 2 }) => {
  const filteredOptions = adminOptions.filter(opt => {
    if (!userSearch) return true;
    const searchLower = userSearch.toLowerCase();
    return (
      (opt.title && opt.title.toLowerCase().includes(searchLower)) ||
      (opt.key && opt.key.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      {/* Quick Access Driver Document Verification Banner */}
      <div 
        onClick={() => setActiveSection('driver_verification')}
        className="bg-gradient-to-r from-indigo-900 via-purple-900 to-black p-5 rounded-3xl border border-indigo-500/30 text-white flex items-center justify-between cursor-pointer hover:border-yellow-400 shadow-xl transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-400 text-black rounded-2xl shadow">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase text-white flex items-center gap-2">
              Driver Verification & Uploaded Documents
              <span className="px-2 py-0.5 bg-yellow-400 text-black text-[9px] font-black rounded-md">
                {pendingDriversCount} Pending
              </span>
            </h4>
            <p className="text-[10px] text-indigo-200 font-bold">
              Review submitted CNIC, Driving Licenses & vehicle photos for approval
            </p>
          </div>
        </div>
        <button className="px-4 py-2 bg-yellow-400 text-black font-black text-xs uppercase rounded-xl flex items-center gap-1 shadow hover:bg-yellow-300">
          <span>Review Documents</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredOptions.map((opt) => (
          <button
            key={opt.key || opt.id}
            onClick={() => setActiveSection(opt.key || opt.id)}
            className="p-4 bg-white rounded-3xl border border-gray-200 hover:border-yellow-400 hover:shadow-xl transition-all group flex flex-col gap-3 text-left relative overflow-hidden active:scale-95 cursor-pointer"
          >
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-yellow-400/20 group-hover:border-yellow-400 transition-colors w-fit">
              {opt.icon}
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-tight text-gray-800 group-hover:text-black block leading-snug">
                {opt.title}
              </span>
              <span className="mt-1.5 inline-block px-2 py-0.5 bg-gray-100 group-hover:bg-black group-hover:text-yellow-400 text-gray-600 text-[9px] font-black uppercase rounded-full transition-colors">
                {opt.badge}
              </span>
            </div>
          </button>
        ))}
        {filteredOptions.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-dashed border-gray-300">
            <p className="text-xs font-bold text-gray-400 uppercase">No features found matching "{userSearch}"</p>
          </div>
        )}
      </div>

      <section className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Live Dispatch Stream ({localRides.length})
          </h3>
          <button 
            onClick={() => setActiveSection('live_rides')}
            className="text-[10px] font-black uppercase text-yellow-600 hover:underline"
          >
            View All Rides →
          </button>
        </div>
        <div className="space-y-2">
          {localRides.slice(0, 3).map(ride => (
            <div key={ride.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-[11px]">
              <div>
                <span className="font-black text-black">{ride.pickupLocation} ➔ {ride.dropoffLocation}</span>
                <p className="text-[9px] text-gray-400 font-bold uppercase">ID: {ride.id} | Fare: Rs. {ride.fare} | Mode: {ride.serviceType}</p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
                ride.status === 'ongoing' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {ride.status}
              </span>
            </div>
          ))}
          {localRides.length === 0 && (
            <p className="text-[10px] text-gray-400 text-center py-4 font-bold uppercase">No active rides currently</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Overview;
