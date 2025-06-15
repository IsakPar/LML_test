import { NextRequest } from 'next/server';
import { requireAuth, hasPermission, AuthenticatedRequest } from '@/middleware/auth';

interface CancelRequest {
  bookingId: string;
  reason?: string;
}

async function handleCancelBooking(request: AuthenticatedRequest) {
  // Check permissions
  if (!hasPermission(request.apiKey!, 'cancel_booking')) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'API key does not have permission to cancel bookings'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const body: CancelRequest = await request.json();
    
    // Validate required fields
    if (!body.bookingId) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'bookingId is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Mock booking lookup - in production, check against database
    // For demo purposes, we'll accept any booking ID that starts with 'BK'
    if (!body.bookingId.startsWith('BK')) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: 'Booking not found'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Mock cancellation - in production, update database
    const cancellation = {
      bookingId: body.bookingId,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      reason: body.reason || 'Cancelled via API',
      refundAmount: Math.floor(Math.random() * 500) + 100, // Mock refund amount
      refundStatus: 'pending',
      apiKey: request.apiKey?.substring(0, 20) + '...'
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: cancellation,
        message: `Booking ${body.bookingId} has been successfully cancelled`
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': '1.0'
        }
      }
    );

  } catch (error) {
    console.error('Cancellation error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to process cancellation'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export const DELETE = requireAuth(handleCancelBooking);
export const POST = requireAuth(handleCancelBooking); // Also support POST for flexibility 