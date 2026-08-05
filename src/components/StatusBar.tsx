import React from 'react';

interface Props {
  status: string;
  isAdmin: boolean;
  onStatusChange?: (status: string) => void;
}

export default function StatusBar({ status, isAdmin, onStatusChange }: Props) {
  return (
    <div className="bg-yellow-400 px-3 py-1 text-black font-black text-[10px] uppercase text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-sm">
      <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
      {isAdmin ? (
        <input 
          type="text" 
          value={status} 
          onChange={(e) => onStatusChange?.(e.target.value)}
          className="bg-transparent text-center font-black outline-none border-b border-black/20"
        />
      ) : (
        <span>{status || 'System Operational'}</span>
      )}
    </div>
  );
}
