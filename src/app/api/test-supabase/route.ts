import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Only import and test Supabase at runtime, not during build
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      // During build time, return a placeholder response
      return NextResponse.json({
        message: 'Supabase connection test (build mode)',
        status: 'build-time',
        timestamp: new Date().toISOString()
      });
    }

    // Dynamic import to avoid build-time issues
    const { supabase } = await import('@/lib/supabase');
    
    console.log('Testing Supabase connection...');
    
    // Test basic connection by querying venues
    const { data: venues, error } = await supabase
      .from('Venue')
      .select('id, name')
      .limit(5);
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { 
          error: 'Supabase connection failed', 
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Supabase connection successful!',
      venueCount: venues?.length || 0,
      venues: venues || [],
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Connection test failed:', err);
    return NextResponse.json(
      { 
        error: 'Connection test failed', 
        details: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 