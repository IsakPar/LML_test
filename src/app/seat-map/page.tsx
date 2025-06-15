'use client';

import React, { useEffect } from 'react';
import { SeatMap } from '@/components/seat-map/SeatMap';
import { Seat } from '@/components/seat-map/Seat';
import { useSeatStore } from '@/store/seatStore';

export default function SeatMapPage() {
  const { seats, selectedSeats, setSeats, toggleSeat, bookSelectedSeats, resetAllBookings, getTotalPrice, clearSelection } = useSeatStore();

  useEffect(() => {
    // Mock seat data with different categories and prices
    const mockSeats = Array.from({ length: 100 }, (_, i) => {
      const seatNumber = i + 1;
      const row = Math.floor(i / 10) + 1;
      
      // Determine category based on row (front rows are premium)
      let category: 'premium' | 'standard' | 'economy';
      let price: number;
      
      if (row <= 3) {
        category = 'premium';
        price = 150;
      } else if (row <= 7) {
        category = 'standard';
        price = 100;
      } else {
        category = 'economy';
        price = 50;
      }

      // Randomly make some seats sold or reserved for demo
      let status: 'available' | 'sold' | 'reserved' = 'available';
      if (Math.random() < 0.1) status = 'sold';
      else if (Math.random() < 0.05) status = 'reserved';

      return {
        id: `seat-${seatNumber}`,
        number: `${seatNumber}`,
        row: `${row}`,
        section: 'A',
        category,
        price,
        status,
      };
    });
    setSeats(mockSeats);
  }, [setSeats]);

  const handleBooking = () => {
    if (selectedSeats.size > 0) {
      bookSelectedSeats();
      alert(`Successfully booked ${selectedSeats.size} seats for $${getTotalPrice()}!`);
    }
  };

  const handleResetBookings = () => {
    const soldSeatsCount = Object.values(seats).filter(seat => seat.status === 'sold').length;
    if (soldSeatsCount > 0) {
      resetAllBookings();
      alert(`Reset ${soldSeatsCount} booked seats back to available!`);
    } else {
      alert('No booked seats to reset.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Interactive Seat Map</h1>
      
      {/* Booking Panel */}
      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-semibold">
              Selected: {selectedSeats.size} seats
            </p>
            <p className="text-xl font-bold text-green-600">
              Total: ${getTotalPrice()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleResetBookings}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reset Bookings
            </button>
            <button
              onClick={clearSelection}
              disabled={selectedSeats.size === 0}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Selection
            </button>
            <button
              onClick={handleBooking}
              disabled={selectedSeats.size === 0}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Book Seats
            </button>
          </div>
        </div>
      </div>

      {/* Seat Map */}
      <div className="h-[600px] w-full">
        <SeatMap width={1000} height={600}>
          {Object.values(seats).map((seat) => (
            <Seat
              key={seat.id}
              {...seat}
              x={(parseInt(seat.number) - 1) % 10 * 40 + 50}
              y={Math.floor((parseInt(seat.number) - 1) / 10) * 40 + 50}
              status={selectedSeats.has(seat.id) ? 'selected' : seat.status}
              onClick={toggleSeat}
            />
          ))}
        </SeatMap>
      </div>

      {/* Legend */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Legend</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Seat Categories</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span>Premium - $150</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Standard - $100</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span>Economy - $50</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Seat Status</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Sold</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 