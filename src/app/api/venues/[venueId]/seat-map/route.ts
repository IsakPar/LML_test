import { NextRequest, NextResponse } from 'next/server';
import { withCors } from '@/lib/middleware';
import { verifyToken, hasPermission, logApiUsage } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface Show {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  integrationCode?: string;
}

async function getSeatMap(
  request: NextRequest,
  context: { params: { venueId: string } }
) {
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

    // Check read permission
    if (!hasPermission(payload.permissions, 'read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { venueId } = context.params;

    // Get venue
    const { data: venue, error: venueError } = await supabase
      .from('Venue')
      .select('id, name, description')
      .eq('id', venueId)
      .single();

    if (venueError || !venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Get layouts for this venue
    const { data: layouts, error: layoutsError } = await supabase
      .from('Layout')
      .select('id, name, svgData')
      .eq('venueId', venueId);

    if (layoutsError) {
      return NextResponse.json(
        { error: 'Failed to fetch layouts' },
        { status: 500 }
      );
    }

    // Get seats for all layouts
    const layoutIds = layouts?.map(l => l.id) || [];
    let seats: any[] = [];
    let shows: Show[] = [];

    if (layoutIds.length > 0) {
      // Get seats
      const { data: seatsData, error: seatsError } = await supabase
        .from('Seat')
        .select('*')
        .in('layoutId', layoutIds);

      if (seatsError) {
        return NextResponse.json(
          { error: 'Failed to fetch seats' },
          { status: 500 }
        );
      }

      seats = seatsData || [];

      // Get shows for seats that have showId
      const showIds = [...new Set(seats.filter(s => s.showId).map(s => s.showId))];
      if (showIds.length > 0) {
        const { data: showsData, error: showsError } = await supabase
          .from('Show')
          .select('id, name, startTime, endTime, integrationCode')
          .in('id', showIds);

        if (!showsError) {
          shows = (showsData || []) as Show[];
        }
      }
    }

    // Transform data for API response
    const seatMap = {
      venue: {
        id: venue.id,
        name: venue.name,
        description: venue.description
      },
      layouts: (layouts || []).map(layout => ({
        id: layout.id,
        name: layout.name,
        svgData: layout.svgData,
        seats: seats
          .filter(seat => seat.layoutId === layout.id)
          .map(seat => {
            const show = shows.find(s => s.id === seat.showId);
            return {
              id: seat.id,
              number: seat.number,
              row: seat.row,
              section: seat.section,
              status: seat.status,
              show: show ? {
                id: show.id,
                name: show.name,
                startTime: show.startTime,
                endTime: show.endTime,
                integrationCode: show.integrationCode
              } : null,
              reservedUntil: seat.reservedUntil,
              isAvailable: seat.status === 'AVAILABLE' && (!seat.reservedUntil || new Date(seat.reservedUntil) < new Date())
            };
          })
      }))
    };

    // Log successful API usage
    const responseTime = Date.now() - startTime;
    await logApiUsage(
      apiKeyId,
      `/api/venues/${venueId}/seat-map`,
      'GET',
      200,
      responseTime,
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json(seatMap);

  } catch (error) {
    console.error('Seat map fetch error:', error);
    
    // Log failed API usage
    if (apiKeyId) {
      const responseTime = Date.now() - startTime;
      await logApiUsage(
        apiKeyId,
        `/api/venues/${context.params.venueId}/seat-map`,
        'GET',
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

// Create a wrapper that applies CORS
async function handleSeatMapRequest(request: NextRequest) {
  // Extract venueId from URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const venueIdIndex = pathParts.indexOf('venues') + 1;
  const venueId = pathParts[venueIdIndex];
  
  if (!venueId) {
    return NextResponse.json(
      { error: 'Venue ID is required' },
      { status: 400 }
    );
  }
  
  return getSeatMap(request, { params: { venueId } });
}

export const GET = withCors(handleSeatMapRequest); 