import React, { useState, useMemo } from 'react';
import { Car, Users, X, Search, CheckCircle2, ShieldCheck, Clock, UserX, Filter } from 'lucide-react';
import { DriverProfile } from '../../types';
import { updateUserInFirestore } from '../../lib/firestoreService';

interface DriverManagementProps {
  pendingDrivers: DriverProfile[];
  allDrivers?: DriverProfile[];
  isUrdu: boolean;
  setViewingDriver: (driver: DriverProfile) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onApproveVehicleChange?: (id: string, requestedVehicle: string) => void;
  onRejectVehicleChange?: (id: string) => void;
  getVehicleTypeDisplay: (vType?: string) => string;
}

type DriverStatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

const DriverManagement: React.FC<DriverManagementProps> = ({
  pendingDrivers,
  allDrivers = [],
  isUrdu,
  setViewingDriver,
  onApprove,
  onReject,
  onApproveVehicleChange,
  onRejectVehicleChange,
  getVehicleTypeDisplay
}) => {
  const [statusFilter, setStatusFilter] = useState<DriverStatusFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualQuery, setManualQuery] = useState('');
  const [manualStatusMessage, setManualStatusMessage] = useState('');

  // Combine pendingDrivers and allDrivers into a unique driver list by ID
  const combinedDrivers = useMemo(() => {
    const map = new Map<string, DriverProfile>();
    // First populate from pendingDrivers
    pendingDrivers.forEach(d => map.set(d.id, d));
    // Overwrite or append from allDrivers
    allDrivers.forEach(d => map.set(d.id, d));
    return Array.from(map.values());
  }, [pendingDrivers, allDrivers]);

  // Vehicle change requests
  const vehicleChangeRequests = useMemo(() => {
    return combinedDrivers.filter(d => d.pendingVehicleType);
  }, [combinedDrivers]);

  // Counts by status
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    combinedDrivers.forEach(d => {
      const st = (d.status || 'pending') as string;
      if (st === 'approved' || st === 'active') {
        approved++;
      } else if (st === 'rejected' || st === 'blocked') {
        rejected++;
      } else {
        pending++;
      }
    });

    return {
      pending,
      approved,
      rejected,
      all: combinedDrivers.length
    };
  }, [combinedDrivers]);

  // Filtered driver list based on active tab and search query
  const filteredDrivers = useMemo(() => {
    return combinedDrivers.filter(d => {
      const st = (d.status || 'pending') as string;
      let matchesTab = true;

      if (statusFilter === 'pending') {
        matchesTab = st === 'pending' || (!st && d.role === 'driver');
      } else if (statusFilter === 'approved') {
        matchesTab = st === 'approved' || st === 'active';
      } else if (statusFilter === 'rejected') {
        matchesTab = st === 'rejected' || st === 'blocked';
      } else if (statusFilter === 'all') {
        matchesTab = true;
      }

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.phone && d.phone.toLowerCase().includes(q)) ||
        (d.id && d.id.toLowerCase().includes(q)) ||
        (d.vehicleType && d.vehicleType.toLowerCase().includes(q));

      return matchesTab && matchesSearch;
    });
  }, [combinedDrivers, statusFilter, searchQuery]);

  const handleManualApprove = async () => {
    if (!manualQuery.trim()) return;
    const query = manualQuery.trim().toLowerCase();

    const matched = combinedDrivers.find(
      d => d.id.toLowerCase() === query || 
           d.phone?.toLowerCase().includes(query) || 
           d.name.toLowerCase().includes(query)
    );

    const targetId = matched ? matched.id : manualQuery.trim();

    try {
      await updateUserInFirestore(targetId, { status: 'approved', role: 'driver' });
      onApprove(targetId);
      setManualStatusMessage(`✓ Driver "${matched ? matched.name : targetId}" approved successfully!`);
      setManualQuery('');
      setTimeout(() => setManualStatusMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setManualStatusMessage('❌ Error approving driver. Please check ID/phone.');
    }
  };

  const handleDirectApprove = async (driverId: string) => {
    try {
      await updateUserInFirestore(driverId, { status: 'approved', role: 'driver' });
      onApprove(driverId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDirectReject = async (driverId: string, reason: string) => {
    try {
      await updateUserInFirestore(driverId, { status: 'rejected' });
      onReject(driverId, reason);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Car className="w-5 h-5 text-indigo-500" />
            {isUrdu ? 'ڈرائیور کا انتظام اور تصدیق' : 'Driver Fleet Management'}
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase">
            {isUrdu ? 'ڈرائیورز کی لسٹ دیکھیں، منظور یا مسترد کریں' : 'Filter, review, approve, and manage driver profiles across all statuses'}
          </p>
        </div>
        <span className="px-3 py-1 bg-yellow-400 text-black text-[10px] font-black uppercase rounded-xl shadow-sm">
          {counts.pending} {isUrdu ? 'زیر التوا' : 'Pending Approvals'}
        </span>
      </div>

      {/* Instant Direct Search & Instant Approval Box */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 p-5 rounded-[28px] border border-yellow-500/30 shadow-lg text-white space-y-3">
        <div className="flex items-center gap-2 text-yellow-400">
          <ShieldCheck className="w-5 h-5" />
          <h4 className="text-xs font-black uppercase tracking-wider">
            {isUrdu ? 'ڈائریکٹ ڈرائیور سرچ اور فوری منظوری' : 'Direct Driver Search & Instant Approval'}
          </h4>
        </div>
        <p className="text-[10px] text-gray-400">
          {isUrdu 
            ? 'کسی بھی ڈرائیور کا فون نمبر، نام یا آئی ڈی درج کر کے فوری منظوری دیں:' 
            : 'Enter any registered driver\'s Phone Number, Name, or User ID to approve them instantly:'}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
            <input 
              type="text"
              placeholder={isUrdu ? "ڈرائیور کا فون نمبر یا نام درج کریں..." : "Enter Driver Phone (e.g. 03001234567), Name, or User ID..."}
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs font-bold text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
            />
          </div>
          <button
            onClick={handleManualApprove}
            className="px-5 py-2.5 bg-yellow-400 text-black font-black text-[10px] uppercase tracking-wider rounded-xl shadow-md hover:bg-yellow-300 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" /> {isUrdu ? 'فوری منظور کریں' : 'Approve Driver'}
          </button>
        </div>
        {manualStatusMessage && (
          <p className={`text-[10px] font-bold ${manualStatusMessage.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
            {manualStatusMessage}
          </p>
        )}
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-md scale-105'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {isUrdu ? 'زیر التوا' : 'Pending'} ({counts.pending})
            </button>

            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-md scale-105'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isUrdu ? 'منظور شدہ' : 'Approved'} ({counts.approved})
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white shadow-md scale-105'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              {isUrdu ? 'مسترد شدہ' : 'Rejected'} ({counts.rejected})
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-black text-yellow-400 shadow-md scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {isUrdu ? 'تمام ڈرائیورز' : 'All Drivers'} ({counts.all})
            </button>
          </div>

          {/* Quick List Search Bar */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder={isUrdu ? "تلاش کریں..." : "Search driver list..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-black"
            />
          </div>
        </div>
      </div>

      {/* DRIVERS CARDS SECTION */}
      <section className="space-y-4">
        {filteredDrivers.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 space-y-2">
            <Users className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              {isUrdu 
                ? 'اس فلٹر میں کوئی ڈرائیور نہیں ملا' 
                : `No ${statusFilter === 'all' ? '' : statusFilter} drivers found matching your criteria`}
            </p>
          </div>
        ) : (
          filteredDrivers.map((driver, index) => {
            const currentStatus = (driver.status || 'pending') as string;
            const isApproved = currentStatus === 'approved' || currentStatus === 'active';
            const isRejected = currentStatus === 'rejected' || currentStatus === 'blocked';
            const isPending = !isApproved && !isRejected;

            return (
              <div 
                key={driver.id ? `${driver.id}-${index}` : `driver-${index}`} 
                className={`bg-white p-5 rounded-[28px] border-2 shadow-sm space-y-4 transition-all ${
                  isApproved 
                    ? 'border-emerald-500/20 hover:border-emerald-500/40' 
                    : isRejected 
                    ? 'border-red-500/20 hover:border-red-500/40' 
                    : 'border-amber-500/30 hover:border-amber-500/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden bg-black text-yellow-400 flex items-center justify-center font-black uppercase text-sm shrink-0 border border-gray-200 shadow-sm">
                      {driver.selfieUrl ? (
                        <img src={driver.selfieUrl} alt={driver.name} className="w-full h-full object-cover" />
                      ) : (
                        (driver.name || 'D').slice(0, 2)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black uppercase text-gray-900">{driver.name || 'Driver'}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                          isApproved 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : isRejected 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isApproved ? '✓ Approved' : isRejected ? '❌ Rejected' : '⏳ Pending'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                        Vehicle: <span className="text-black font-black">{driver.vehicleType || 'Bike'}</span> ({driver.vehicleNumber || 'Unregistered'}) | 📞 {driver.phone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    <button 
                      onClick={() => setViewingDriver(driver)}
                      className="px-3 py-2 bg-gray-100 text-black font-black text-[9px] uppercase rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      📄 Docs
                    </button>

                    {isPending && (
                      <>
                        <button 
                          onClick={() => handleDirectReject(driver.id, "Rejected by admin")}
                          className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                          title="Reject Driver"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDirectApprove(driver.id)}
                          className="px-4 py-2 bg-emerald-600 text-white font-black text-[9px] uppercase rounded-xl shadow-md hover:bg-emerald-700 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve Driver
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <button 
                        onClick={() => handleDirectReject(driver.id, "Status revoked by admin")}
                        className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-black text-[9px] uppercase rounded-xl transition-colors flex items-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" /> Revoke / Block
                      </button>
                    )}

                    {isRejected && (
                      <button 
                        onClick={() => handleDirectApprove(driver.id)}
                        className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-black text-[9px] uppercase rounded-xl shadow-md transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Re-Approve Driver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Pending Vehicle Change Requests Section */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200 flex items-center justify-between mt-6">
        <div>
          <h3 className="text-base font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-500" />
            {isUrdu ? 'گاڑی کی تبدیلی کی درخواستیں' : 'Vehicle Change Requests'}
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase">
            {isUrdu ? 'ڈرائیور گاڑی کی تبدیلی کے لیے ایڈمن کی منظوری کے منتظر ہیں' : 'Drivers requesting to change vehicle type (Requires Admin Approval)'}
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-400 text-black text-[10px] font-black uppercase rounded-xl">
          {vehicleChangeRequests.length} Requests
        </span>
      </div>

      <section className="space-y-4">
        {vehicleChangeRequests.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 space-y-2">
            <Car className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              {isUrdu ? 'کوئی نئی گاڑی کی تبدیلی کی درخواست باقی نہیں ہے' : 'No pending vehicle change requests'}
            </p>
          </div>
        ) : (
          vehicleChangeRequests.map(driver => (
            <div key={driver.id + '-veh-req'} className="bg-white p-5 rounded-[28px] border-2 border-amber-500/30 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div>
                  <p className="text-xs font-black uppercase text-black">{driver.name}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{driver.phone}</p>
                </div>
                <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[8px] font-black uppercase rounded-lg border border-amber-200">Pending Admin Action</span>
              </div>
              <div className="flex items-center gap-6 py-2">
                <div className="text-center flex-1">
                  <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Current Vehicle</p>
                  <p className="text-xs font-black text-gray-900 uppercase mt-1">{getVehicleTypeDisplay(driver.vehicleType)}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 rotate-90 shrink-0">➔</div>
                <div className="text-center flex-1">
                  <p className="text-[8px] font-black uppercase text-amber-600 tracking-widest">Requested Change</p>
                  <p className="text-sm font-black text-amber-600 uppercase mt-1">{getVehicleTypeDisplay(driver.pendingVehicleType)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => onRejectVehicleChange && onRejectVehicleChange(driver.id)}
                  className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all"
                >
                  Reject Request
                </button>
                <button 
                  onClick={() => onApproveVehicleChange && onApproveVehicleChange(driver.id, driver.pendingVehicleType!)}
                  className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                >
                  Approve Change
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default DriverManagement;
