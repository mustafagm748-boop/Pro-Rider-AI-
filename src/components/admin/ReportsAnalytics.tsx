
import React from 'react';
import { BarChart3, Download } from 'lucide-react';

interface ReportsAnalyticsProps {
  showNotification: (msg: string) => void;
}

const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ showNotification }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-black uppercase tracking-tight text-black flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Performance Reports & Analytics
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase">Real-time revenue stream and operational statistics</p>
        </div>
        <button 
          onClick={() => showNotification("Downloading financial report CSV...")}
          className="px-3 py-2 bg-black text-yellow-400 rounded-xl font-black text-[9px] uppercase tracking-wider flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
          <span className="text-[9px] font-black uppercase text-gray-400">Total Gross Income</span>
          <p className="text-xl font-black text-black mt-1">Rs. 184,500</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
          <span className="text-[9px] font-black uppercase text-gray-400">Completed Trips</span>
          <p className="text-xl font-black text-black mt-1">412 Rides</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
          <span className="text-[9px] font-black uppercase text-gray-400">Platform Commission</span>
          <p className="text-xl font-black text-emerald-600 mt-1">Rs. 27,675</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
          <span className="text-[9px] font-black uppercase text-gray-400">Driver Retention</span>
          <p className="text-xl font-black text-blue-600 mt-1">96.4%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-200 space-y-4">
        <h4 className="text-xs font-black uppercase text-gray-900">Weekly Earnings Chart Simulation</h4>
        <div className="flex items-end gap-3 h-36 pt-4 border-b border-gray-200 pb-2">
          {[60, 85, 40, 95, 70, 110, 130].map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div 
                style={{ height: `${val}px` }} 
                className="w-full bg-black hover:bg-yellow-400 rounded-t-xl transition-all" 
                title={`Day ${idx + 1}: Rs. ${val * 100}`}
              />
              <span className="text-[8px] font-black uppercase text-gray-400">Day {idx + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
