import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface SeatMapProps {
  width: number;
  height: number;
  children?: React.ReactNode;
}

export const SeatMap: React.FC<SeatMapProps> = ({ width, height, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(0.5, prev + delta), 3));
  };

  const handlePan = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      x.set(x.get() + e.movementX);
      y.set(y.get() + e.movementY);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100 rounded-lg">
      <div
        ref={containerRef}
        className="absolute inset-0"
        onMouseMove={handlePan}
        onWheel={(e) => handleZoom(e.deltaY * -0.001)}
      >
        <motion.svg
          width={width}
          height={height}
          style={{
            x,
            y,
            scale,
            originX: 0,
            originY: 0,
          }}
          className="absolute"
        >
          {children}
        </motion.svg>
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={() => handleZoom(0.1)}
          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
        >
          +
        </button>
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
        >
          -
        </button>
        <button
          onClick={() => {
            x.set(0);
            y.set(0);
            setScale(1);
          }}
          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}; 