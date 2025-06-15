import React from 'react';

interface SeatMapProps {
  width: number;
  height: number;
  children?: React.ReactNode;
}

export const SeatMap: React.FC<SeatMapProps> = ({ width, height, children }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="max-w-full max-h-full"
      >
        {children}
      </svg>
    </div>
  );
}; 