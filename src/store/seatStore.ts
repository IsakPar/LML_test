import { create } from 'zustand';

export interface Seat {
  id: string;
  number: string;
  row: string;
  section: string;
  category: 'premium' | 'standard' | 'economy';
  price: number;
  status: 'available' | 'selected' | 'reserved' | 'sold';
}

interface SeatStore {
  seats: Record<string, Seat>;
  selectedSeats: Set<string>;
  seatCount: number;
  setSeats: (seats: Seat[]) => void;
  setSeatCount: (count: number) => void;
  toggleSeat: (seatId: string) => void;
  selectAdjacentSeats: (startSeatId: string, count: number) => void;
  clearSelection: () => void;
  bookSelectedSeats: () => void;
  resetAllBookings: () => void;
  getTotalPrice: () => number;
}

export const useSeatStore = create<SeatStore>((set, get) => ({
  seats: {},
  selectedSeats: new Set(),
  seatCount: 1,
  setSeats: (seats) =>
    set({
      seats: seats.reduce((acc, seat) => ({ ...acc, [seat.id]: seat }), {}),
    }),
  setSeatCount: (count) => set({ seatCount: Math.max(1, Math.min(8, count)) }),
  toggleSeat: (seatId) => {
    const state = get();
    const seat = state.seats[seatId];
    if (!seat || seat.status === 'sold' || seat.status === 'reserved') {
      return; // Can't select sold or reserved seats
    }
    
    // Use selectAdjacentSeats with current seatCount
    state.selectAdjacentSeats(seatId, state.seatCount);
  },
  selectAdjacentSeats: (startSeatId, count) =>
    set((state) => {
      const startSeat = state.seats[startSeatId];
      if (!startSeat || startSeat.status === 'sold' || startSeat.status === 'reserved') {
        return state;
      }

      const newSelectedSeats = new Set<string>();
      const startRow = parseInt(startSeat.row);
      const startNumber = parseInt(startSeat.number);
      const seatsPerRow = 10; // Assuming 10 seats per row

      // Find adjacent seats in the same row
      for (let i = 0; i < count; i++) {
        const seatNumber = ((startNumber - 1) % seatsPerRow) + i + 1;
        if (seatNumber > seatsPerRow) break; // Don't go beyond row
        
        const seatId = `seat-${(startRow - 1) * seatsPerRow + seatNumber}`;
        const seat = state.seats[seatId];
        
        if (seat && seat.status === 'available') {
          newSelectedSeats.add(seatId);
        } else {
          break; // Stop if we hit an unavailable seat
        }
      }

      return { selectedSeats: newSelectedSeats };
    }),
  clearSelection: () => set({ selectedSeats: new Set() }),
  bookSelectedSeats: () =>
    set((state) => {
      const newSeats = { ...state.seats };
      state.selectedSeats.forEach((seatId) => {
        if (newSeats[seatId]) {
          newSeats[seatId] = { ...newSeats[seatId], status: 'sold' };
        }
      });
      return {
        seats: newSeats,
        selectedSeats: new Set(),
      };
    }),
  resetAllBookings: () =>
    set((state) => {
      const newSeats = { ...state.seats };
      Object.keys(newSeats).forEach((seatId) => {
        if (newSeats[seatId].status === 'sold') {
          newSeats[seatId] = { ...newSeats[seatId], status: 'available' };
        }
      });
      return {
        seats: newSeats,
        selectedSeats: new Set(),
      };
    }),
  getTotalPrice: () => {
    const { seats, selectedSeats } = get();
    return Array.from(selectedSeats).reduce((total, seatId) => {
      const seat = seats[seatId];
      return total + (seat ? seat.price : 0);
    }, 0);
  },
})); 