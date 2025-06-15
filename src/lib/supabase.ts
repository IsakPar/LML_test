import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema types
export interface Seat {
  id: string
  number: string
  row: string
  section: string
  category: 'premium' | 'standard' | 'economy'
  price: number
  status: 'available' | 'sold' | 'reserved'
  show_id?: string
  created_at?: string
  updated_at?: string
}

export interface Booking {
  id: string
  seat_ids: string[]
  customer_name: string
  customer_email: string
  customer_phone?: string
  total_price: number
  status: 'confirmed' | 'cancelled' | 'pending'
  booking_reference: string
  show_id?: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface ApiKey {
  id: string
  name: string
  key_hash: string
  permissions: string[]
  is_active: boolean
  last_used?: string
  created_at: string
  created_by?: string
}

// Database operations
export const seatOperations = {
  async getAll() {
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .order('number')
    
    if (error) throw error
    return data
  },

  async updateStatus(seatId: string, status: Seat['status']) {
    const { data, error } = await supabase
      .from('seats')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', seatId)
      .select()
    
    if (error) throw error
    return data
  },

  async bulkUpdateStatus(seatIds: string[], status: Seat['status']) {
    const { data, error } = await supabase
      .from('seats')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', seatIds)
      .select()
    
    if (error) throw error
    return data
  }
}

export const bookingOperations = {
  async create(booking: Omit<Booking, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        ...booking,
        created_at: new Date().toISOString()
      })
      .select()
    
    if (error) throw error
    return data[0]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async cancel(id: string, reason?: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  }
}

export const apiKeyOperations = {
  async getAll() {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async validateKey(keyHash: string) {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single()
    
    if (error) return null
    return data
  },

  async updateLastUsed(id: string) {
    const { error } = await supabase
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('id', id)
    
    if (error) console.error('Failed to update last_used:', error)
  }
}
