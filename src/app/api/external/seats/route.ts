import { NextRequest } from 'next/server';
import { requireAuth, hasPermission, AuthenticatedRequest } from '@/middleware/auth';
import { supabase } from '@/lib/supabase';

// Mock seat data - in production, this would come from your database
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

async function handleGetSeats(request: AuthenticatedRequest) {
  // Check permissions
  if (!hasPermission(request.apiKey!, 'view_availability')) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'API key does not have permission to view seat availability'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Get query parameters
    const url = new URL(request.url);
    const showDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0]; // Default to today
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');

    // First, get the show for the specified date
    const { data: shows, error: showError } = await supabase
      .from('shows')
      .select('*')
      .eq('show_date', showDate)
      .eq('is_active', true)
      .single();

    if (showError || !shows) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: `No show found for date ${showDate}. Shows are automatically generated for today, tomorrow, and the day after.`
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Build the seats query
    let seatsQuery = supabase
      .from('seats')
      .select('*')
      .eq('show_id', shows.id);

    // Apply filters
    if (category) {
      seatsQuery = seatsQuery.eq('category', category);
    }
    
    if (status) {
      seatsQuery = seatsQuery.eq('status', status);
    }
    
    if (minPrice) {
      seatsQuery = seatsQuery.gte('price', parseFloat(minPrice));
    }
    
    if (maxPrice) {
      seatsQuery = seatsQuery.lte('price', parseFloat(maxPrice));
    }

    const { data: seats, error: seatsError } = await seatsQuery.order('number');

    if (seatsError) {
      throw seatsError;
    }

    // Get show statistics
    const { data: stats } = await supabase
      .from('current_show_availability')
      .select('*')
      .eq('show_id', shows.id)
      .single();

    // Return seat data with metadata
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          show: {
            id: shows.id,
            title: shows.title,
            description: shows.description,
            date: shows.show_date,
            time: shows.show_time,
            duration_minutes: shows.duration_minutes
          },
          seats: seats || [],
          statistics: {
            total: stats?.total_seats || 0,
            available: stats?.available_seats || 0,
            sold: stats?.sold_seats || 0,
            reserved: stats?.reserved_seats || 0,
            occupancy_percent: stats?.occupancy_percent || 0
          },
          categories: {
            premium: seats?.filter(s => s.category === 'premium').length || 0,
            standard: seats?.filter(s => s.category === 'standard').length || 0,
            economy: seats?.filter(s => s.category === 'economy').length || 0,
          },
          filters_applied: {
            date: showDate,
            category: category || 'all',
            status: status || 'all',
            price_range: minPrice || maxPrice ? `${minPrice || '0'}-${maxPrice || '∞'}` : 'all'
          }
        },
        timestamp: new Date().toISOString(),
        apiKey: request.apiKey?.substring(0, 20) + '...'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': '2.0',
          'X-Rate-Limit': '1000/hour',
          'X-Show-Date': showDate
        }
      }
    );

  } catch (error) {
    console.error('Seats API error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch seat data'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export const GET = requireAuth(handleGetSeats); 