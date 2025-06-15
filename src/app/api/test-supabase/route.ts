import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
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