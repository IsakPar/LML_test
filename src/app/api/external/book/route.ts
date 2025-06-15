import { NextRequest } from 'next/server';
import { requireAuth, hasPermission, AuthenticatedRequest } from '@/middleware/auth';

interface BookingRequest {
  seatIds: string[];
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  showId?: string;
  notes?: string;
}

async function handleBookSeats(request: AuthenticatedRequest) {
  // Check permissions
  if (!hasPermission(request.apiKey!, 'book_seats')) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'API key does not have permission to book seats'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const body: BookingRequest = await request.json();
    
    // Validate required fields
    if (!body.seatIds || !Array.isArray(body.seatIds) || body.seatIds.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'seatIds array is required and must not be empty'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!body.customerInfo || !body.customerInfo.name || !body.customerInfo.email) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'customerInfo with name and email is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.customerInfo.email)) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid email format'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Mock seat validation - in production, check against database
    const mockSeats = Array.from({ length: 100 }, (_, i) => {
      const seatNumber = i + 1;
      const row = Math.floor(i / 10) + 1;
      
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

      return {
        id: `seat-${seatNumber}`,
        number: `${seatNumber}`,
        row: `${row}`,
        section: 'A',
        category,
        price,
        status: 'available' as const,
      };
    });

    // Check if all requested seats exist and are available
    const requestedSeats = body.seatIds.map(seatId => {
      const seat = mockSeats.find(s => s.id === seatId);
      if (!seat) {
        throw new Error(`Seat ${seatId} not found`);
      }
      // In production, check if seat is actually available in database
      return seat;
    });

    // Calculate total price
    const totalPrice = requestedSeats.reduce((sum, seat) => sum + seat.price, 0);

    // Generate booking confirmation
    const bookingId = `BK${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // In production, save booking to database here
    const booking = {
      id: bookingId,
      seatIds: body.seatIds,
      seats: requestedSeats.map(seat => ({
        id: seat.id,
        number: seat.number,
        row: seat.row,
        section: seat.section,
        category: seat.category,
        price: seat.price
      })),
      customerInfo: body.customerInfo,
      totalPrice,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
      showId: body.showId || 'default-show',
      notes: body.notes,
      apiKey: request.apiKey?.substring(0, 20) + '...'
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: booking,
        message: `Successfully booked ${body.seatIds.length} seat(s) for ${body.customerInfo.name}`
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': '1.0'
        }
      }
    );

  } catch (error) {
    console.error('Booking error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to process booking'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export const POST = requireAuth(handleBookSeats); 