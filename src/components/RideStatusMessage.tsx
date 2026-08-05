import React from 'react';

interface Props {
  message: string;
}

export const RideStatusMessage: React.FC<Props> = ({ message }) => {
  return (
    <div className="absolute top-20 left-6 right-6 bg-yellow-400 text-black p-4 rounded-2xl shadow-xl z-50 font-black uppercase tracking-wider text-center animate-pulse">
      {message}
    </div>
  );
};
