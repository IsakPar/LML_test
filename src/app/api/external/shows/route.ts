import { NextRequest } from 'next/server';
import { requireAuth, hasPermission, AuthenticatedRequest } from '@/middleware/auth';
import { supabase } from '@/lib/supabase';

async function handleGetShows(request: AuthenticatedRequest) {
  // Check permissions
  if (!hasPermission(request.apiKey!, 'view_availability')) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'API key does not have permission to view show information'
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
    const days = parseInt(url.searchParams.get('days') || '3'); // Default to 3 days
    const includeStats = url.searchParams.get('include_stats') === 'true';

    // Get upcoming shows
    const { data: shows, error: showsError } = await supabase
      .from('upcoming_shows')
      .select('*')
      .limit(days);

    if (showsError) {
      throw showsError;
    }

    // If stats are requested, get availability for each show
    let showsWithStats = shows || [];
    
    if (includeStats && shows) {
      const { data: stats, error: statsError } = await supabase
        .from('current_show_availability')
        .select('*')
        .in('show_id', shows.map(s => s.id));

      if (!statsError && stats) {
        showsWithStats = shows.map(show => {
          const showStats = stats.find(s => s.show_id === show.id);
          return {
            ...show,
            availability: showStats ? {
              total_seats: showStats.total_seats,
              available_seats: showStats.available_seats,
              sold_seats: showStats.sold_seats,
              reserved_seats: showStats.reserved_seats,
              occupancy_percent: showStats.occupancy_percent
            } : null
          };
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          shows: showsWithStats,
          period: {
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            days_requested: days
          },
          metadata: {
            total_shows: showsWithStats.length,
            includes_availability_stats: includeStats
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
          'X-Rate-Limit': '1000/hour'
        }
      }
    );

  } catch (error) {
    console.error('Shows API error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch show data'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export const GET = requireAuth(handleGetShows); 