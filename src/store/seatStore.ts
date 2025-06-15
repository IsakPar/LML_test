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
  setSeats: (seats: Seat[]) => void;
  toggleSeat: (seatId: string) => void;
  clearSelection: () => void;
  bookSelectedSeats: () => void;
  resetAllBookings: () => void;
  getTotalPrice: () => number;
}

export const useSeatStore = create<SeatStore>((set, get) => ({
  seats: {},
  selectedSeats: new Set(),
  setSeats: (seats) =>
    set({
      seats: seats.reduce((acc, seat) => ({ ...acc, [seat.id]: seat }), {}),
    }),
  toggleSeat: (seatId) =>
    set((state) => {
      const seat = state.seats[seatId];
      if (!seat || seat.status === 'sold' || seat.status === 'reserved') {
        return state; // Can't select sold or reserved seats
      }

      const newSelectedSeats = new Set(state.selectedSeats);
      if (newSelectedSeats.has(seatId)) {
        newSelectedSeats.delete(seatId);
      } else {
        newSelectedSeats.add(seatId);
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