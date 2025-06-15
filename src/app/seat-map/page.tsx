'use client';

import React, { useEffect } from 'react';
import { SeatMap } from '@/components/seat-map/SeatMap';
import { Seat } from '@/components/seat-map/Seat';
import { useSeatStore } from '@/store/seatStore';

export default function SeatMapPage() {
  const { seats, selectedSeats, seatCount, setSeats, setSeatCount, toggleSeat, bookSelectedSeats, resetAllBookings, getTotalPrice, clearSelection } = useSeatStore();
  const [hoveredSeat, setHoveredSeat] = React.useState<string | null>(null);
  const [previewSeats, setPreviewSeats] = React.useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [currentShow, setCurrentShow] = React.useState<any>(null);
  const [upcomingShows, setUpcomingShows] = React.useState<any[]>([]);

  // Load upcoming shows on component mount
  useEffect(() => {
    const loadUpcomingShows = async () => {
      try {
        // For now, create mock upcoming shows until we integrate with the API
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(today.getDate() + 2);

        const mockShows = [
          {
            id: 'show-today',
            title: 'The Phantom of the Opera',
            show_date: today.toISOString().split('T')[0],
            display_date: 'Today',
            show_time: '19:30:00',
            description: 'A haunting tale of love, obsession, and mystery beneath the Paris Opera House'
          },
          {
            id: 'show-tomorrow',
            title: 'Hamilton',
            show_date: tomorrow.toISOString().split('T')[0],
            display_date: 'Tomorrow',
            show_time: '19:30:00',
            description: 'The revolutionary musical about Alexander Hamilton and the founding of America'
          },
          {
            id: 'show-day-after',
            title: 'The Lion King',
            show_date: dayAfter.toISOString().split('T')[0],
            display_date: dayAfter.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
            show_time: '19:30:00',
            description: 'Disney\'s spectacular musical bringing the African savanna to life'
          }
        ];

        setUpcomingShows(mockShows);
        setCurrentShow(mockShows[0]);
      } catch (error) {
        console.error('Failed to load shows:', error);
      }
    };

    loadUpcomingShows();
  }, []);

  // Load seats when selected date changes
  useEffect(() => {
    const loadSeatsForDate = () => {
      // Mock seat data with different categories and prices
      const mockSeats = Array.from({ length: 100 }, (_, i) => {
        const seatNumber = i + 1;
        const row = Math.floor(i / 10) + 1;
        
        // Determine category based on row position (front=premium, middle=standard, back=economy)
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

        // Randomize occupancy based on selected date (different for each show)
        const dateHash = selectedDate.split('-').join('');
        const seatHash = (parseInt(dateHash) + seatNumber) % 100;
        let status: 'available' | 'sold' | 'reserved' = 'available';
        
        if (seatHash < 35) status = 'sold';      // ~35% sold
        else if (seatHash < 40) status = 'reserved'; // ~5% reserved
        // ~60% available

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
      clearSelection(); // Clear selection when changing dates
    };

    loadSeatsForDate();
  }, [selectedDate, setSeats, clearSelection]);

  const handleBooking = () => {
    if (selectedSeats.size > 0) {
      bookSelectedSeats();
      alert(`Successfully booked ${selectedSeats.size} seats for $${getTotalPrice()}!`);
    }
  };

  const handleSeatHover = (seatId: string) => {
    const seat = seats[seatId];
    if (!seat || seat.status === 'sold' || seat.status === 'reserved') {
      setHoveredSeat(null);
      setPreviewSeats(new Set());
      return;
    }

    setHoveredSeat(seatId);
    
    // Smart seat selection algorithm
    const startSeat = seats[seatId];
    const startRow = parseInt(startSeat.row);
    const startNumber = parseInt(startSeat.number);
    const seatsPerRow = 10;
    const rowStartSeat = (startRow - 1) * seatsPerRow + 1;
    const seatPositionInRow = ((startNumber - 1) % seatsPerRow) + 1; // 1-based position in row
    
    // Find the best contiguous group of available seats
    const findBestSeatGroup = (hoveredSeatPos: number, requiredSeats: number): string[] => {
      // Get all seats in the current row
      const rowSeats: { pos: number; id: string; available: boolean }[] = [];
      for (let i = 1; i <= seatsPerRow; i++) {
        const seatId = `seat-${rowStartSeat + i - 1}`;
        const seat = seats[seatId];
        rowSeats.push({
          pos: i,
          id: seatId,
          available: seat && seat.status === 'available'
        });
      }
      
      // Try different starting positions around the hovered seat
      const possibleGroups: string[][] = [];
      
      // Strategy 1: Start from hovered seat and go right
      let group = [];
      for (let i = hoveredSeatPos; i <= seatsPerRow && group.length < requiredSeats; i++) {
        const seat = rowSeats[i - 1];
        if (seat.available) {
          group.push(seat.id);
        } else {
          break;
        }
      }
      if (group.length === requiredSeats) {
        possibleGroups.push([...group]);
      }
      
      // Strategy 2: Start from hovered seat and go left
      group = [];
      for (let i = hoveredSeatPos; i >= 1 && group.length < requiredSeats; i--) {
        const seat = rowSeats[i - 1];
        if (seat.available) {
          group.unshift(seat.id); // Add to beginning to maintain left-to-right order
        } else {
          break;
        }
      }
      if (group.length === requiredSeats) {
        possibleGroups.push([...group]);
      }
      
      // Strategy 3: Center the group around the hovered seat
      const leftSeatsNeeded = Math.floor((requiredSeats - 1) / 2);
      const rightSeatsNeeded = requiredSeats - 1 - leftSeatsNeeded;
      
      let leftBound = hoveredSeatPos;
      let rightBound = hoveredSeatPos;
      let seatsCollected = 1; // Start with the hovered seat
      
      // Expand left and right alternately to center the group
      while (seatsCollected < requiredSeats) {
        let addedSeat = false;
        
        // Try to expand left first if we need more left seats
        if (leftBound > 1 && (seatsCollected - 1) < leftSeatsNeeded + rightSeatsNeeded) {
          const leftSeat = rowSeats[leftBound - 2]; // -2 because array is 0-indexed and we want the seat to the left
          if (leftSeat.available) {
            leftBound--;
            seatsCollected++;
            addedSeat = true;
          }
        }
        
        // Try to expand right if we still need seats
        if (rightBound < seatsPerRow && seatsCollected < requiredSeats) {
          const rightSeat = rowSeats[rightBound]; // rightBound is already the next position
          if (rightSeat.available) {
            rightBound++;
            seatsCollected++;
            addedSeat = true;
          }
        }
        
        // If we couldn't add any seats, break
        if (!addedSeat) break;
      }
      
      // If we got the required number of seats with centering strategy
      if (seatsCollected === requiredSeats) {
        group = [];
        for (let i = leftBound; i <= rightBound; i++) {
          group.push(rowSeats[i - 1].id);
        }
        possibleGroups.push(group);
      }
      
      // Strategy 4: Find any contiguous group that includes the hovered seat
      for (let startPos = Math.max(1, hoveredSeatPos - requiredSeats + 1); 
           startPos <= Math.min(seatsPerRow - requiredSeats + 1, hoveredSeatPos); 
           startPos++) {
        
        // Check if we can fit requiredSeats starting from startPos
        let canFit = true;
        group = [];
        
        for (let i = startPos; i < startPos + requiredSeats; i++) {
          const seat = rowSeats[i - 1];
          if (!seat.available) {
            canFit = false;
            break;
          }
          group.push(seat.id);
        }
        
        if (canFit && group.includes(seatId)) {
          possibleGroups.push([...group]);
        }
      }
      
      // Choose the best group (prefer the one that centers around hovered seat)
      if (possibleGroups.length === 0) return [];
      
      // Find the group that best centers the hovered seat
      let bestGroup = possibleGroups[0];
      let bestScore = Infinity;
      
      for (const group of possibleGroups) {
        const hoveredIndex = group.findIndex(id => id === seatId);
        const centerIndex = Math.floor((group.length - 1) / 2);
        const score = Math.abs(hoveredIndex - centerIndex);
        
        if (score < bestScore) {
          bestScore = score;
          bestGroup = group;
        }
      }
      
      return bestGroup;
    };
    
    const bestSeats = findBestSeatGroup(seatPositionInRow, seatCount);
    setPreviewSeats(new Set(bestSeats));
  };

  const handleSeatLeave = () => {
    setHoveredSeat(null);
    setPreviewSeats(new Set());
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
    <div className="container mx-auto p-4 space-y-6 custom-scrollbar">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">🎭 Theater Seat Selection</h1>
            <p className="text-indigo-100">Choose your seats and enjoy the show!</p>
          </div>
          <div className="ml-4">
            <a
              href="/admin"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium backdrop-blur-sm"
              title="Admin Panel"
            >
              🔐 Admin
            </a>
          </div>
        </div>
      </div>

      {/* Show Selection Tabs */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="text-xl font-semibold">🎭 Select Show Date</h2>
          <p className="text-blue-100 mt-1">Choose from upcoming performances</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {upcomingShows.map((show) => (
            <button
              key={show.id}
              onClick={() => {
                setSelectedDate(show.show_date);
                setCurrentShow(show);
              }}
              className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                selectedDate === show.show_date
                  ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={`text-sm font-medium px-2 py-1 rounded ${
                  selectedDate === show.show_date
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {show.display_date}
                </div>
                <div className="text-sm text-gray-500">
                  {show.show_time.substring(0, 5)}
                </div>
              </div>
              
              <h3 className={`font-bold text-lg mb-1 ${
                selectedDate === show.show_date ? 'text-blue-700' : 'text-gray-800'
              }`}>
                {show.title}
              </h3>
              
              <p className="text-sm text-gray-600 line-clamp-2">
                {show.description}
              </p>
              
              {selectedDate === show.show_date && (
                <div className="mt-3 flex items-center text-sm text-blue-600">
                  <span className="mr-1">🎫</span>
                  Currently viewing this show
                </div>
              )}
            </button>
          ))}
        </div>

        {currentShow && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-purple-800 text-lg">{currentShow.title}</h3>
                <p className="text-purple-600 text-sm">
                  {currentShow.display_date} at {currentShow.show_time.substring(0, 5)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-purple-600">
                  {Object.values(seats).filter(seat => seat.status === 'available').length} seats available
                </div>
                <div className="text-xs text-purple-500">
                  {Math.round((Object.values(seats).filter(seat => seat.status === 'sold').length / Object.values(seats).length) * 100)}% sold
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Seat Count Selector */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="text-xl font-semibold">🎫 Booking Options</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Seats
            </label>
            <select
              value={seatCount}
              onChange={(e) => setSeatCount(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} seat{num > 1 ? 's' : ''}</option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              🖱️ Hover over any seat to preview • Click to select {seatCount} adjacent seat{seatCount > 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-2">Selected Seats</p>
            <p className="text-3xl font-bold text-blue-600">
              {selectedSeats.size}
            </p>
            <p className="text-sm text-gray-500">
              {selectedSeats.size > 0 && Array.from(selectedSeats).map(seatId => {
                const seat = seats[seatId];
                return seat ? `Row ${seat.row}, Seat ${seat.number}` : '';
              }).join(', ')}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-2">Total Price</p>
            <p className="text-3xl font-bold text-green-600">
              ${getTotalPrice()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-6 justify-center">
          <button
            onClick={handleResetBookings}
            className="btn-danger"
          >
            🔄 Reset All Bookings
          </button>
          <button
            onClick={clearSelection}
            disabled={selectedSeats.size === 0}
            className="btn-secondary"
          >
            ❌ Clear Selection
          </button>
          <button
            onClick={handleBooking}
            disabled={selectedSeats.size === 0}
            className="btn-primary text-lg"
          >
            🎟️ Book {selectedSeats.size} Seat{selectedSeats.size !== 1 ? 's' : ''} - ${getTotalPrice()}
          </button>
        </div>
      </div>

      {/* Seat Map */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="text-xl font-semibold">🏛️ Theater Layout</h2>
          <p className="text-blue-100 mt-1">Select your preferred seats • Hover to preview multiple seats</p>
        </div>
        <div className="h-[600px] w-full p-4">
          <SeatMap width={1100} height={550}>
            {/* Theater curtains */}
            <defs>
              <linearGradient id="curtainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c2d12" />
                <stop offset="50%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7c2d12" />
              </linearGradient>
              <linearGradient id="stageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            
            {/* Left curtain */}
            <path d="M 40 25 Q 70 40 40 55 Q 70 70 40 85 Q 70 100 40 115 L 40 25 Z" fill="url(#curtainGradient)" />
            {/* Right curtain */}
            <path d="M 1060 25 Q 1030 40 1060 55 Q 1030 70 1060 85 Q 1030 100 1060 115 L 1060 25 Z" fill="url(#curtainGradient)" />
            
            {/* Stage - perfectly centered */}
            <rect x={300} y={25} width={400} height={40} rx={20} fill="url(#stageGradient)" stroke="#d97706" strokeWidth="2" />
            <text x={500} y={50} textAnchor="middle" className="fill-amber-900 text-xl font-bold">🎭 STAGE 🎭</text>
            
            {/* Stage lights */}
            {Array.from({length: 5}, (_, i) => (
              <circle key={`light-${i}`} cx={320 + i * 72} cy={15} r="6" className="fill-yellow-300 animate-pulse" />
            ))}
            
            {/* Row Labels - centered */}
            {Array.from({length: 10}, (_, i) => (
              <text key={`row-${i+1}`} x={230} y={120 + i * 35} textAnchor="middle" className="fill-slate-300 text-sm font-bold">
                {i+1}
              </text>
            ))}
            
            {/* Seats - perfectly centered rectangular grid */}
            {Object.values(seats).map((seat) => {
              const seatNum = parseInt(seat.number) - 1;
              const row = Math.floor(seatNum / 10);
              const seatInRow = seatNum % 10;
              
              // Perfect grid positioning - centered at x=500
              const gridStartX = 270; // Center the 10-seat grid
              const xPos = gridStartX + seatInRow * 46; // 40px seat + 6px gap
              const yPos = 105 + row * 35; // Consistent row spacing
              
              return (
                <Seat
                  key={seat.id}
                  {...seat}
                  x={xPos}
                  y={yPos}
                  status={selectedSeats.has(seat.id) ? 'selected' : seat.status}
                  onClick={toggleSeat}
                  onHover={handleSeatHover}
                  onLeave={handleSeatLeave}
                  isHovered={hoveredSeat === seat.id}
                  willBeSelected={previewSeats.has(seat.id)}
                  seatCount={seatCount}
                />
              );
            })}
            
            {/* Section divider lines - subtle visual separation */}
            <line x1={250} y1={195} x2={750} y2={195} stroke="#374151" strokeWidth="1" opacity="0.3" />
            <line x1={250} y1={335} x2={750} y2={335} stroke="#374151" strokeWidth="1" opacity="0.3" />
            
            {/* Section labels with color indicators - moved to the right side */}
            <rect x={760} y={125} width={16} height={16} rx="4" className="seat-premium" />
            <text x={780} y={140} textAnchor="start" className="fill-purple-300 text-lg font-bold">PREMIUM</text>
            <text x={780} y={160} textAnchor="start" className="fill-purple-200 text-sm">Rows 1-3 • $150</text>
            
            <rect x={760} y={245} width={16} height={16} rx="4" className="seat-standard" />
            <text x={780} y={260} textAnchor="start" className="fill-blue-300 text-lg font-bold">STANDARD</text>
            <text x={780} y={280} textAnchor="start" className="fill-blue-200 text-sm">Rows 4-7 • $100</text>
            
            <rect x={760} y={365} width={16} height={16} rx="4" className="seat-economy" />
            <text x={780} y={380} textAnchor="start" className="fill-emerald-300 text-lg font-bold">ECONOMY</text>
            <text x={780} y={400} textAnchor="start" className="fill-emerald-200 text-sm">Rows 8-10 • $50</text>
            
            {/* Additional status indicators */}
            <rect x={760} y={450} width={16} height={16} rx="4" fill="#eab308" stroke="#ca8a04" />
            <text x={780} y={465} textAnchor="start" className="fill-yellow-300 text-sm font-bold">RESERVED</text>
            
            <rect x={760} y={475} width={16} height={16} rx="4" fill="#991b1b" stroke="#7f1d1d" opacity="0.8" />
            <text x={780} y={490} textAnchor="start" className="fill-red-300 text-sm font-bold">SOLD</text>
            
            {/* Hover preview colors based on seat count */}
            <rect x={760} y={505} width={12} height={12} rx="3" fill="#10b981" stroke="#059669" />
            <rect x={775} y={505} width={12} height={12} rx="3" fill="#3b82f6" stroke="#2563eb" />
            <rect x={790} y={505} width={12} height={12} rx="3" fill="#8b5cf6" stroke="#7c3aed" />
            <rect x={805} y={505} width={12} height={12} rx="3" fill="#ec4899" stroke="#db2777" />
            <text x={780} y={530} textAnchor="start" className="fill-slate-300 text-xs">HOVER: 1-2-3-4+ seats</text>
            
            {/* Hover preview indicator */}
            {previewSeats.size > 0 && (
              <g>
                <rect x={400} y={470} width={200} height={25} rx={12} className="fill-green-500/90" />
                <text x={500} y={487} textAnchor="middle" className="fill-white text-sm font-bold">
                  Will select {previewSeats.size} seat{previewSeats.size > 1 ? 's' : ''}
                </text>
              </g>
            )}
            
            {/* Aisle indicators */}
            <text x={500} y={520} textAnchor="middle" className="fill-slate-400 text-xs">← MAIN AISLE →</text>
          </SeatMap>
        </div>
      </div>

      {/* Legend */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="text-xl font-semibold">📋 Legend</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-4 text-gray-800">💺 Seat Categories</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg"></div>
                <span className="font-bold text-purple-800">Premium Seats (Rows 1-3)</span>
                <span className="ml-auto text-purple-700 font-bold text-lg">$150</span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg"></div>
                <span className="font-bold text-blue-800">Standard Seats (Rows 4-7)</span>
                <span className="ml-auto text-blue-700 font-bold text-lg">$100</span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg shadow-lg"></div>
                <span className="font-bold text-emerald-800">Economy Seats (Rows 8-10)</span>
                <span className="ml-auto text-emerald-700 font-bold text-lg">$50</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-gray-800">🎯 Seat Status</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg animate-pulse"></div>
                <span className="font-bold text-green-800">Selected</span>
                <span className="ml-auto text-green-700 text-sm font-semibold">Ready to book</span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-100 rounded-xl border border-yellow-200">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-lg"></div>
                <span className="font-bold text-yellow-800">Reserved</span>
                <span className="ml-auto text-yellow-700 text-sm font-semibold">Temporarily held</span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg shadow-lg opacity-60"></div>
                <span className="font-bold text-red-800">Sold</span>
                <span className="ml-auto text-red-700 text-sm font-semibold">Unavailable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 