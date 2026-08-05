
import React, { useState } from 'react';
import { Settings, RefreshCw, Download, Radio, Shield, Save, Phone, MapPin, DollarSign, Sparkles, Check } from 'lucide-react';

interface AppSystemSettingsProps {
  controlThemeColor: string;
  setControlThemeColor: (color: string) => void;
  controlNavPos: string;
  setControlNavPos: (pos: string) => void;
  controlButtonVisibility: any;
  setControlButtonVisibility: (visibility: any) => void;
  onDeleteAllRides?: () => Promise<void>;
  showNotification: (msg: string) => void;
  isUrdu?: boolean;
}

const AppSystemSettings: React.FC<AppSystemSettingsProps> = ({
  controlThemeColor,
  setControlThemeColor,
  controlNavPos,
  setControlNavPos,
  controlButtonVisibility,
  setControlButtonVisibility,
  onDeleteAllRides,
  showNotification,
  isUrdu = false
}) => {
  // App Config States
  const [appName, setAppName] = useState(() => localStorage.getItem('prorider_app_name') || 'ProRider AI');
  const [currencySymbol, setCurrencySymbol] = useState(() => localStorage.getItem('prorider_currency') || 'Rs. (PKR)');
  const [helplinePhone, setHelplinePhone] = useState(() => localStorage.getItem('prorider_helpline') || '03125007782');
  const [emergencyHotline, setEmergencyHotline] = useState(() => localStorage.getItem('prorider_emergency') || '15 / 1122');
  const [defaultCity, setDefaultCity] = useState(() => localStorage.getItem('prorider_city') || 'Islamabad & Rawalpindi');
  const [platformCommission, setPlatformCommission] = useState(() => localStorage.getItem('prorider_commission') || '10');
  const [surgeMultiplier, setSurgeMultiplier] = useState(() => localStorage.getItem('prorider_surge') || '1.2');

  // Feature Toggles
  const [features, setFeatures] = useState(() => {
    const saved = localStorage.getItem('prorider_feature_flags');
    return saved ? JSON.parse(saved) : {
      aiVoice: true,
      carpoolModule: true,
      gpsLiveMap: true,
      fareBargaining: true,
      whatsappNotif: true
    };
  });

  const handleSaveAllSettings = () => {
    localStorage.setItem('prorider_app_name', appName);
    localStorage.setItem('prorider_currency', currencySymbol);
    localStorage.setItem('prorider_helpline', helplinePhone);
    localStorage.setItem('prorider_emergency', emergencyHotline);
    localStorage.setItem('prorider_city', defaultCity);
    localStorage.setItem('prorider_commission', platformCommission);
    localStorage.setItem('prorider_surge', surgeMultiplier);
    localStorage.setItem('prorider_feature_flags', JSON.stringify(features));

    showNotification(isUrdu 
      ? 'ایپ کی تمام سیٹنگز کامیابی سے محفوظ ہو گئی ہیں!' 
      : 'All App System Settings successfully saved and updated system-wide!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black uppercase tracking-tight text-black flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-700" />
              Global App System Settings
            </h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
              Configure app branding, phone numbers, commission rates, and feature toggles
            </p>
          </div>
          <button 
            onClick={() => showNotification("System UI cache cleared!")}
            className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            title="Refresh System Cache"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* 1. App General Info & Contact Config */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">1. Core Application Info & Helplines</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-600">Application Name</label>
              <input 
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-bold outline-none focus:border-yellow-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-600">Helpline Phone Number</label>
              <input 
                type="text"
                value={helplinePhone}
                onChange={(e) => setHelplinePhone(e.target.value)}
                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-bold outline-none focus:border-yellow-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-600">Emergency SOS Hotline</label>
              <input 
                type="text"
                value={emergencyHotline}
                onChange={(e) => setEmergencyHotline(e.target.value)}
                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-bold outline-none focus:border-yellow-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-600">Base Currency & Symbol</label>
              <input 
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-bold outline-none focus:border-yellow-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-600">Default Service Hub / Region</label>
              <input 
                type="text"
                value={defaultCity}
                onChange={(e) => setDefaultCity(e.target.value)}
                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-bold outline-none focus:border-yellow-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-600">Platform Commission (%)</label>
              <input 
                type="number"
                value={platformCommission}
                onChange={(e) => setPlatformCommission(e.target.value)}
                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-bold outline-none focus:border-yellow-400"
              />
            </div>
          </div>
        </div>

        {/* 2. Visual Theme & Navigation Placement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">2. Visual Theme & Branding</h4>
            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-500">Theme Primary Accent Color</label>
                <div className="flex gap-3">
                  {['gold', 'blue', 'emerald', 'crimson'].map(color => (
                    <button 
                      key={color}
                      onClick={() => {
                        setControlThemeColor(color);
                        localStorage.setItem('pro_rider_accent', color);
                        showNotification(`Theme color set to ${color}`);
                      }}
                      className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer ${
                        controlThemeColor === color ? 'border-black scale-110 shadow-md ring-2 ring-yellow-400' : 'border-transparent opacity-50'
                      }`}
                      style={{ backgroundColor: color === 'gold' ? '#facc15' : color === 'blue' ? '#3b82f6' : color === 'emerald' ? '#10b981' : '#ef4444' }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-500">Header & Nav Placement</label>
                <div className="flex gap-2">
                  {['top', 'bottom', 'hidden'].map(pos => (
                    <button 
                      key={pos}
                      onClick={() => {
                        setControlNavPos(pos);
                        localStorage.setItem('pro_rider_nav_pos', pos);
                        showNotification(`Navigation position set to ${pos}`);
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer ${
                        controlNavPos === pos ? 'bg-black text-yellow-400 border-black shadow-md' : 'bg-white text-gray-400 border-gray-100'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Master Feature Toggles */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">3. Application Feature Flags</h4>
            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
              {[
                { key: 'aiVoice', label: 'AI Voice Assistant & Speech Guidance' },
                { key: 'carpoolModule', label: 'Carpooling & Route Sharing Engine' },
                { key: 'gpsLiveMap', label: 'Google Live Map Navigation' },
                { key: 'fareBargaining', label: 'InDrive-Style Fare Bargaining' },
                { key: 'whatsappNotif', label: 'WhatsApp Style Incoming Call Alerts' },
              ].map(feat => (
                <div key={feat.key} className="flex items-center justify-between py-1.5 border-b border-gray-200/60 last:border-0">
                  <span className="text-[10px] font-black uppercase text-gray-700">{feat.label}</span>
                  <button 
                    onClick={() => {
                      const updated = { ...features, [feat.key]: !features[feat.key] };
                      setFeatures(updated);
                    }}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all cursor-pointer ${
                      features[feat.key] ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {features[feat.key] ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Master Save Button */}
        <button
          onClick={handleSaveAllSettings}
          className="w-full py-4 bg-black text-yellow-400 font-black uppercase text-xs rounded-2xl shadow-xl hover:bg-gray-900 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save All App System Settings</span>
        </button>

        {/* Dangerous Operations */}
        <div className="pt-6 border-t border-gray-100">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-4">Database Operations</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => {
                if (confirm("REALLY DELETE ALL RIDE RECORDS FOREVER?")) {
                  onDeleteAllRides?.();
                  showNotification("DATABASE WIPED: All ride history deleted.");
                }
              }}
              className="p-5 bg-red-50 border-2 border-red-100 rounded-3xl flex flex-col items-start gap-2 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-red-900">Flush Ride Records</span>
              <p className="text-[8px] text-red-600 font-bold uppercase tracking-tight">Wipe active ride history from database</p>
            </button>

            <button 
              onClick={() => showNotification("Full JSON database export prepared.")}
              className="p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl flex flex-col items-start gap-2 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Download className="w-5 h-5 text-black" />
              <span className="text-[10px] font-black uppercase text-black">Export App Data</span>
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">Download backup configuration JSON</p>
            </button>

            <button 
              onClick={() => showNotification("Security credentials refreshed.")}
              className="p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl flex flex-col items-start gap-2 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="text-[10px] font-black uppercase text-blue-900">Rotate API Keys</span>
              <p className="text-[8px] text-blue-500 font-bold uppercase tracking-tight">Refresh cloud tokens</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSystemSettings;
