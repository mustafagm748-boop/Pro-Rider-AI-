
import React from 'react';
import { ShieldAlert, AlertTriangle, MapPin, Phone, ShieldCheck, RefreshCw } from 'lucide-react';

interface SafetyControlProps {
  emergencyAlerts: any[];
  emergencyNumbersList?: string[];
}

const SafetyControl: React.FC<SafetyControlProps> = ({ emergencyAlerts = [], emergencyNumbersList = [] }) => {
  return (
    <div className="space-y-6">
      <div className="bg-red-50 p-6 rounded-[32px] border-2 border-red-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-red-500 rounded-[24px] flex items-center justify-center text-white shadow-lg animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-red-900 uppercase tracking-tighter">Emergency Response Center</h3>
            <p className="text-[10px] text-red-700 font-bold uppercase">Real-time SOS monitoring and rapid safety intervention</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-white rounded-2xl border border-red-200 flex flex-col items-center">
          <span className="text-[8px] font-black uppercase text-red-500">Live SOS Alerts</span>
          <span className="text-sm font-black text-red-600">{emergencyAlerts.filter(a => a.status !== 'resolved').length} Active</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          Active SOS Signal Stream
        </h4>
        <div className="space-y-4">
          {emergencyAlerts.map(alert => (
            <div key={alert.id} className={`p-5 rounded-[28px] border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
              alert.status === 'resolved' ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-red-50 border-red-200 shadow-md'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                  alert.status === 'resolved' ? 'bg-gray-200 text-gray-500' : 'bg-red-500 text-white'
                }`}>
                  SOS
                </div>
                <div>
                  <p className="text-sm font-black text-black uppercase tracking-tight">{alert.user}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {alert.location}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold">{alert.time} • 📞 {alert.phone}</p>
                </div>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" /> Call User
                </button>
                {alert.status !== 'resolved' ? (
                  <button className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-200">
                    Dispatch Police
                  </button>
                ) : (
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase border border-emerald-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Resolved
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-yellow-50 p-6 rounded-[32px] border-2 border-yellow-100 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-yellow-800">Safety Protocol Settings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-yellow-200 space-y-2">
            <p className="text-[10px] font-black uppercase text-yellow-800 tracking-wider">SOS Notification Level</p>
            <select className="w-full bg-gray-50 border-none rounded-lg text-xs font-bold p-2">
              <option>Critical (Push + SMS + Call)</option>
              <option>Standard (Push + SMS)</option>
              <option>Minimal (Push only)</option>
            </select>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-yellow-200 space-y-2">
            <p className="text-[10px] font-black uppercase text-yellow-800 tracking-wider">Automated Police Dispatch</p>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-gray-500">Enable AI-based dispatch triggers</span>
              <div className="w-10 h-5 bg-gray-200 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyControl;
