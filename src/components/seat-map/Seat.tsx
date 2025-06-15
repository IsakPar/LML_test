import React from 'react';
import { motion } from 'framer-motion';

export interface SeatProps {
  id: string;
  x: number;
  y: number;
  number: string;
  row: string;
  section: string;
  category: 'premium' | 'standard' | 'economy';
  price: number;
  status: 'available' | 'selected' | 'reserved' | 'sold';
  onClick?: (id: string) => void;
}

export const Seat: React.FC<SeatProps> = ({
  id,
  x,
  y,
  number,
  row,
  section,
  category,
  price,
  status,
  onClick,
}) => {
  const getSeatColor = () => {
    if (status === 'selected') return 'fill-green-500';
    if (status === 'reserved') return 'fill-yellow-500';
    if (status === 'sold') return 'fill-red-500';
    
    // Available seats - color by category
    switch (category) {
      case 'premium':
        return 'fill-purple-500 hover:fill-purple-600';
      case 'standard':
        return 'fill-blue-500 hover:fill-blue-600';
      case 'economy':
        return 'fill-gray-500 hover:fill-gray-600';
      default:
        return 'fill-gray-500';
    }
  };

  const isClickable = status === 'available' || status === 'selected';

  return (
    <motion.g
      onClick={() => isClickable && onClick?.(id)}
      className={isClickable ? "cursor-pointer" : "cursor-not-allowed"}
      whileHover={isClickable ? { scale: 1.1 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
    >
      <rect
        x={x}
        y={y}
        width="30"
        height="30"
        rx="4"
        className={`${getSeatColor()} transition-colors duration-200`}
      />
      <text
        x={x + 15}
        y={y + 20}
        textAnchor="middle"
        className="fill-white text-xs font-medium pointer-events-none"
      >
        {number}
      </text>
      <title>
        {`Seat ${number} - Row ${row} - Section ${section}\n${category.toUpperCase()} - $${price}\nStatus: ${status}`}
      </title>
    </motion.g>
  );
}; 