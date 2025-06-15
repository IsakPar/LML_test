import React from 'react';

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
  onHover?: (id: string) => void;
  onLeave?: () => void;
  isHovered?: boolean;
  willBeSelected?: boolean;
  seatCount?: number;
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
  onHover,
  onLeave,
  isHovered = false,
  willBeSelected = false,
  seatCount = 1,
}) => {
  const getSeatColor = () => {
    if (status === 'selected') return 'seat-selected';
    if (status === 'reserved') return 'seat-reserved';
    if (status === 'sold') return 'seat-sold';
    
    // Hover preview for multi-seat selection - color depends on seat count
    if (willBeSelected) {
      if (seatCount === 1) return 'seat-hover-preview-1';
      if (seatCount === 2) return 'seat-hover-preview-2';
      if (seatCount === 3) return 'seat-hover-preview-3';
      if (seatCount >= 4) return 'seat-hover-preview-4-plus';
      return 'seat-hover-preview';
    }
    
    // Available seats - color by category
    switch (category) {
      case 'premium':
        return 'seat-premium';
      case 'standard':
        return 'seat-standard';
      case 'economy':
        return 'seat-economy';
      default:
        return 'seat-economy';
    }
  };

  const isClickable = status === 'available' || status === 'selected';

  return (
    <g
      onClick={() => isClickable && onClick?.(id)}
      className={`${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
      onMouseEnter={() => isClickable && onHover?.(id)}
      onMouseLeave={() => isClickable && onLeave?.()}
    >
      {/* Seat shadow */}
      <rect
        x={x + 2}
        y={y + 2}
        width="32"
        height="32"
        rx="6"
        className="fill-black/20"
      />
      {/* Main seat */}
      <rect
        x={x}
        y={y}
        width="32"
        height="32"
        rx="6"
        className={`${getSeatColor()} stroke-white stroke-1`}
      />
      {/* Seat number */}
      <text
        x={x + 16}
        y={y + 22}
        textAnchor="middle"
        className="fill-white text-sm font-bold pointer-events-none drop-shadow-sm"
      >
        {number}
      </text>
      {/* Tooltip */}
      <title>
        {`🎭 Seat ${number} - Row ${row}\n💺 ${category.toUpperCase()} Section\n💰 $${price}\n📍 Status: ${status.toUpperCase()}`}
      </title>
    </g>
  );
}; 