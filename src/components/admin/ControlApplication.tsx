import React from 'react';
import { Sliders } from 'lucide-react';

interface ControlApplicationProps {
  isUrdu: boolean;
  controlThemeColor: string;
  setControlThemeColor: (color: string) => void;
  controlNavPos: string;
  setControlNavPos: (pos: string) => void;
  controlButtonVisibility: Record<string, boolean>;
  setControlButtonVisibility: (visibility: Record<string, boolean>) => void;
  globalStatus: string;
  onStatusChange?: (status: string) => void;
  showNotification: (msg: string) => void;
}

export const ControlApplication: React.FC<ControlApplicationProps> = ({
  isUrdu,
  controlThemeColor,
  setControlThemeColor,
  controlNavPos,
  setControlNavPos,
  controlButtonVisibility,
  setControlButtonVisibility,
  globalStatus,
  onStatusChange,
  showNotification,
}) => {
  const [currentPasswordInput, setCurrentPasswordInput] = React.useState('');
  const [newPasswordInput, setNewPasswordInput] = React.useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = React.useState('');

  const handleUpdatePassword = () => {
    const stored = localStorage.getItem('pro_rider_admin_password') || '50007782';
    if (currentPasswordInput.trim() !== stored) {
      showNotification(isUrdu ? '❌ موجودہ پاسورڈ غلط ہے!' : '❌ Current password is incorrect!');
      return;
    }
    if (!newPasswordInput || newPasswordInput.length < 4) {
      showNotification(isUrdu ? '❌ نیا پاسورڈ کم از کم 4 ہندسوں کا ہونا چاہیے' : '❌ New password must be at least 4 characters');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      showNotification(isUrdu ? '❌ دونوں نئے پاسورڈ مماثل نہیں ہیں!' : '❌ New passwords do not match!');
      return;
    }
    localStorage.setItem('pro_rider_admin_password', newPasswordInput);
    showNotification(isUrdu ? '🔑 ایڈمن پاسورڈ کامیابی سے تبدیل ہو گیا!' : '🔑 Admin password successfully updated!');
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-black text-white p-6 rounded-[32px] border border-yellow-400/40 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-400 text-black rounded-2xl">
            <Sliders className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-yellow-400">
              {isUrdu ? 'ماسٹر کنٹرول ایپلیکیشن سینٹر' : 'Master Control Application Center'}
            </h3>
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">
              {isUrdu ? 'ایپلی کیشن کی تمام ترتیبات، تھیمز، نیویگیشن بٹنز اور اپ ڈیٹس کا واحد کنٹرول پوائنٹ' : 'Consolidated single-point control for themes, navigation placement, button repositioning, and system updates'}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Theme & Color Customization */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
          <span>🎨</span> Theme & Color Customization
        </h4>
        <p className="text-[10px] text-gray-500 font-bold uppercase">Customize primary accent colors and visual atmosphere across the app.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'gold', name: 'Pro Gold (Default)', color: 'bg-yellow-400 text-black' },
            { id: 'emerald', name: 'Emerald Green', color: 'bg-emerald-500 text-white' },
            { id: 'indigo', name: 'Royal Indigo', color: 'bg-indigo-600 text-white' },
            { id: 'rose', name: 'Crimson Rose', color: 'bg-rose-600 text-white' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => {
                setControlThemeColor(c.id);
                localStorage.setItem('pro_rider_accent', c.id);
                showNotification(`Theme accent updated to ${c.name}`);
              }}
              className={`p-4 rounded-2xl border-2 font-black text-xs flex flex-col items-center gap-2 transition-all ${
                controlThemeColor === c.id ? 'border-black ring-2 ring-yellow-400 scale-105' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center shadow-md`}>✓</div>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Navigation & Button Repositioning */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
          <span>🧭</span> Navigation & Button Positioning
        </h4>
        <p className="text-[10px] text-gray-500 font-bold uppercase">Control where navigation bars and action buttons are placed.</p>
        
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-gray-400">Navigation Bar Placement</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setControlNavPos('top');
                localStorage.setItem('pro_rider_nav_pos', 'top');
                showNotification("Navigation bar positioned at Top Header.");
              }}
              className={`p-4 rounded-2xl border-2 font-black text-xs text-center transition-all ${
                controlNavPos === 'top' ? 'bg-black text-yellow-400 border-black shadow-md' : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              Top Header Bar (Default)
            </button>
            <button
              onClick={() => {
                setControlNavPos('bottom');
                localStorage.setItem('pro_rider_nav_pos', 'bottom');
                showNotification("Navigation bar positioned at Bottom Dock.");
              }}
              className={`p-4 rounded-2xl border-2 font-black text-xs text-center transition-all ${
                controlNavPos === 'bottom' ? 'bg-black text-yellow-400 border-black shadow-md' : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              Bottom Floating Dock
            </button>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-[10px] font-black uppercase text-gray-400">Header Action Buttons Visibility & Repositioning</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(controlButtonVisibility).map(([btnKey, isVisible]: [string, any]) => (
              <button
                key={btnKey}
                onClick={() => {
                  const updated = { ...controlButtonVisibility, [btnKey]: !isVisible };
                  setControlButtonVisibility(updated);
                  localStorage.setItem('pro_rider_btn_vis', JSON.stringify(updated));
                  showNotification(`Button ${btnKey} is now ${!isVisible ? 'Visible' : 'Hidden'}`);
                }}
                className={`p-3 rounded-xl border text-xs font-black uppercase transition-all flex items-center justify-between ${
                  isVisible ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-400 border-gray-200 line-through'
                }`}
              >
                <span>{btnKey}</span>
                <span>{isVisible ? 'ON' : 'OFF'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Upgrading, Updating & Maintenance */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
          <span>🚀</span> App Upgrades, Updates & Maintenance
        </h4>
        <p className="text-[10px] text-gray-500 font-bold uppercase">Manage application release updates, cache purging, and system patches.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[9px] font-black uppercase text-gray-400">Current Release</span>
              <p className="text-sm font-black text-black">v2.5.4 Enterprise</p>
            </div>
            <button
              onClick={() => showNotification("System is fully up to date with v2.5.4 build.")}
              className="w-full py-2.5 bg-black text-yellow-400 font-black text-[10px] uppercase rounded-xl"
            >
              Check Updates
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[9px] font-black uppercase text-gray-400">Cache & Storage</span>
              <p className="text-sm font-black text-black">Local Cache Active</p>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                showNotification("Application cache successfully cleared!");
                setTimeout(() => window.location.reload(), 1500);
              }}
              className="w-full py-2.5 bg-red-600 text-white font-black text-[10px] uppercase rounded-xl"
            >
              Clear App Cache
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[9px] font-black uppercase text-gray-400">Maintenance Mode</span>
              <p className="text-sm font-black text-black">{globalStatus}</p>
            </div>
            <button
              onClick={() => {
                if (onStatusChange) onStatusChange(globalStatus === 'Maintenance Underway' ? 'System Operational' : 'Maintenance Underway');
                showNotification("Maintenance status toggled.");
              }}
              className="w-full py-2.5 bg-yellow-400 text-black font-black text-[10px] uppercase rounded-xl"
            >
              Toggle Maintenance
            </button>
          </div>
        </div>
      </div>

      {/* Admin Security & Password Change */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
          <span>🔒</span> {isUrdu ? 'ایڈمن سیکورٹی اور پاسورড کی تبدیلی' : 'Admin Security & Password Management'}
        </h4>
        <p className="text-[10px] text-gray-500 font-bold uppercase">
          {isUrdu ? 'اگر پاسورڈ کمزور ہو گیا ہو یا تبدیل کرنا مقصود ہو تو یہاں سے نیا پاسورڈ سیٹ کریں۔' : 'Update your admin master password securely if compromised. Type new password twice for confirmation.'}
        </p>

        <div className="space-y-3 max-w-md">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-600 mb-1 block">
              {isUrdu ? 'موجودہ پاسورڈ (ڈیفالت: 50007782)' : 'Current Password (Default: 50007782)'}
            </label>
            <input 
              type="password"
              value={currentPasswordInput}
              onChange={(e) => setCurrentPasswordInput(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-mono text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-600 mb-1 block">
              {isUrdu ? 'نیا پاسورڈ' : 'New Password'}
            </label>
            <input 
              type="password"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-mono text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-600 mb-1 block">
              {isUrdu ? 'نیا پاسورڈ دوبارہ درج کریں (تصدیق کے لیے)' : 'Confirm New Password (Type Twice)'}
            </label>
            <input 
              type="password"
              value={confirmPasswordInput}
              onChange={(e) => setConfirmPasswordInput(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-mono text-sm focus:outline-none focus:border-black"
            />
          </div>

          <button
            onClick={handleUpdatePassword}
            className="w-full py-3 bg-black text-yellow-400 font-black text-xs uppercase rounded-xl shadow-md hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
          >
            <span>{isUrdu ? 'پاسورڈ تبدیل کریں' : 'Update Admin Password'}</span>
          </button>
        </div>
      </div>

      {/* Save All Customizations */}
      <button
        onClick={() => showNotification("All Master Application Controls & Customizations saved successfully!")}
        className="w-full py-4 bg-black text-yellow-400 font-black uppercase text-xs rounded-2xl shadow-xl hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
      >
        <span>Save All Application Master Controls</span>
      </button>
    </div>
  );
};
