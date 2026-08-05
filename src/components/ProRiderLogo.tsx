import React, { useState } from 'react';
import { Car } from 'lucide-react';

interface ProRiderLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  onClick?: () => void;
}

export function ProRiderLogo({ className = '', size = 'md', showText = false, onClick }: ProRiderLogoProps) {
  const [isFailed, setIsFailed] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }[size];

  return (
    <div 
      onClick={onClick} 
      className={`flex items-center gap-3 ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${className}`}
    >
      <div className={`${sizeClasses} rounded-2xl bg-black border-2 border-yellow-400 flex items-center justify-center overflow-hidden shadow-xl shrink-0 relative group`}>
        {!isFailed ? (
          <img 
            src="/logo.jpg" 
            alt="Pro Rider Logo" 
            className="w-full h-full object-cover"
            onError={() => setIsFailed(true)}
          />
        ) : (
          <div className="w-full h-full bg-black flex flex-col items-center justify-center text-yellow-400 font-black p-1">
            <Car className="w-4 h-4 text-yellow-400" />
            <span className="text-[8px] tracking-tighter uppercase font-black text-white mt-0.5">PRO</span>
          </div>
        )}
        <div className="absolute inset-0 bg-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-black uppercase tracking-tight text-black dark:text-white">Pro Rider</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-600">Islamabad • Rawalpindi</span>
        </div>
      )}
    </div>
  );
}

