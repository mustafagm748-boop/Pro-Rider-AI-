
import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4 opacity-50">
    <RefreshCw className="w-8 h-8 text-yellow-600 animate-spin" />
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Component...</p>
  </div>
);

export default LoadingSpinner;
