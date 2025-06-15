import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://kwcrhvutdozzzwcwsduw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Y3JodnV0ZG96enp3Y3dzZHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzE2NzQsImV4cCI6MjA1MDA0NzY3NH0.Ej7VJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhk';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types for TypeScript
export interface ApiKey {
  id: string;
  keyHash: string;
  name: string;
  permissions: {
    read: boolean;
    book: boolean;
    admin: boolean;
  };
  rateLimit: number;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface ApiLog {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface Venue {
  id: string;
  name: string;
  description?: string;
  address?: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  venueId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  ticketPrice: number;
  availableSeats: number;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  eventId: string;
  customerName: string;
  customerEmail: string;
  seatNumbers: string[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
