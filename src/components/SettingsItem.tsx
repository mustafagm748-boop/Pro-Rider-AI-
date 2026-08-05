
import React from 'react';

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  value?: string;
  variant?: 'danger' | 'default';
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, label, onClick, value, variant }) => (
  <button 
    onClick={onClick} 
    className={`p-3 bg-white rounded-2xl border-2 border-gray-100 flex flex-col items-center justify-center gap-2 group transition-all hover:border-yellow-400 shadow-sm active:scale-[0.98] ${
      variant === 'danger' ? 'border-red-100' : ''
    }`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
      variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-black group-hover:bg-yellow-400 group-hover:text-black'
    }`}>
      {icon}
    </div>
    <span className="font-black text-[9px] uppercase tracking-tight text-black">{label}</span>
  </button>
);

export default SettingsItem;
