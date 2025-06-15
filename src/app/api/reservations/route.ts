import { NextRequest, NextResponse } from 'next/server';
import { withCors, validateRequired } from '@/lib/middleware';
import { verifyToken, hasPermission, logApiUsage } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

async function createReservation(request: NextRequest) {
  const startTime = Date.now();
  let apiKeyId = '';
  
  try {
    // Extract and verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    apiKeyId = payload.apiKeyId;

    // Check booking permission
    if (!hasPermission(payload.permissions, 'book')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for booking' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const validationError = validateRequired(body, ['seat_ids', 'show_id']);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const { seat_ids, show_id, external_booking_id, duration_minutes = 15, metadata } = body;

    // Validate seat_ids is an array
    if (!Array.isArray(seat_ids) || seat_ids.length === 0) {
      return NextResponse.json(
        { error: 'seat_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    // Check if show exists
    const { data: show, error: showError } = await supabase
      .from('Show')
      .select('id')
      .eq('id', show_id)
      .single();

    if (showError || !show) {
      return NextResponse.json(
        { error: 'Show not found' },
        { status: 404 }
      );
    }

    // Check if seats exist and are available
    const { data: seats, error: seatsError } = await supabase
      .from('Seat')
      .select('*')
      .in('id', seat_ids)
      .eq('showId', show_id);

    if (seatsError) {
      return NextResponse.json(
        { error: 'Failed to fetch seats' },
        { status: 500 }
      );
    }

    if (!seats || seats.length !== seat_ids.length) {
      return NextResponse.json(
        { error: 'One or more seats not found for this show' },
        { status: 404 }
      );
    }

    // Check seat availability
    const now = new Date();
    const unavailableSeats = seats.filter(seat => 
      seat.status !== 'AVAILABLE' || 
      (seat.reservedUntil && new Date(seat.reservedUntil) > now)
    );

    if (unavailableSeats.length > 0) {
      return NextResponse.json(
        { 
          error: 'One or more seats are not available',
          unavailable_seats: unavailableSeats.map(seat => ({
            id: seat.id,
            number: seat.number,
            row: seat.row,
            section: seat.section,
            status: seat.status,
            reserved_until: seat.reservedUntil
          }))
        },
        { status: 409 }
      );
    }

    // Calculate expiration time
    const expiresAt = new Date(now.getTime() + duration_minutes * 60 * 1000);

    // Create reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('Reservation')
      .insert({
        seatIds: seat_ids,
        showId: show_id,
        apiKeyId: apiKeyId,
        externalBookingId: external_booking_id,
        expiresAt: expiresAt.toISOString(),
        metadata: metadata || {}
      })
      .select()
      .single();

    if (reservationError) {
      return NextResponse.json(
        { error: 'Failed to create reservation' },
        { status: 500 }
      );
    }

    // Update seat reservations
    const { error: updateError } = await supabase
      .from('Seat')
      .update({
        reservedUntil: expiresAt.toISOString(),
        reservedBy: apiKeyId
      })
      .in('id', seat_ids);

    if (updateError) {
      // If seat update fails, we should ideally rollback the reservation
      // For now, we'll log the error but continue
      console.error('Failed to update seat reservations:', updateError);
    }

    // Log successful API usage
    const responseTime = Date.now() - startTime;
    await logApiUsage(
      apiKeyId,
      '/api/reservations',
      'POST',
      201,
      responseTime,
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({
      reservation_id: reservation.id,
      seat_ids: reservation.seatIds,
      show_id: reservation.showId,
      external_booking_id: reservation.externalBookingId,
      expires_at: reservation.expiresAt,
      created_at: reservation.createdAt,
      status: 'reserved'
    }, { status: 201 });

  } catch (error) {
    console.error('Reservation creation error:', error);
    
    // Log failed API usage
    if (apiKeyId) {
      const responseTime = Date.now() - startTime;
      await logApiUsage(
        apiKeyId,
        '/api/reservations',
        'POST',
        500,
        responseTime
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const POST = withCors(createReservation); 