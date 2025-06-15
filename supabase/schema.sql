-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Seats table
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(10) NOT NULL,
  row VARCHAR(10) NOT NULL,
  section VARCHAR(10) NOT NULL DEFAULT 'A',
  category VARCHAR(20) NOT NULL CHECK (category IN ('premium', 'standard', 'economy')),
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  show_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seat_ids UUID[] NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'pending')),
  booking_reference VARCHAR(50) NOT NULL UNIQUE,
  show_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- Shows table (optional for future use)
CREATE TABLE shows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  show_date DATE NOT NULL,
  show_time TIME NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_seats_category ON seats(category);
CREATE INDEX idx_seats_row ON seats(row);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- Insert sample seats (10x10 grid = 100 seats)
INSERT INTO seats (number, row, section, category, price, status) 
SELECT 
  ((row_num - 1) * 10 + seat_num)::VARCHAR as number,
  row_num::VARCHAR as row,
  'A' as section,
  CASE 
    WHEN row_num <= 3 THEN 'premium'
    WHEN row_num <= 7 THEN 'standard'
    ELSE 'economy'
  END as category,
  CASE 
    WHEN row_num <= 3 THEN 150.00
    WHEN row_num <= 7 THEN 100.00
    ELSE 50.00
  END as price,
  CASE 
    WHEN random() < 0.1 THEN 'sold'
    WHEN random() < 0.05 THEN 'reserved'
    ELSE 'available'
  END as status
FROM 
  generate_series(1, 10) as row_num,
  generate_series(1, 10) as seat_num;

-- Insert sample API keys (hashed versions of the keys from admin panel)
INSERT INTO api_keys (name, key_hash, permissions, is_active) VALUES
('External Booking System', 'vbs_live_sk_1a2b3c4d5e6f7g8h9i0j', ARRAY['book_seats', 'view_availability', 'cancel_booking'], true),
('Mobile App Integration', 'vbs_live_sk_9z8y7x6w5v4u3t2s1r0q', ARRAY['book_seats', 'view_availability'], true),
('Partner Website', 'vbs_test_sk_p9o8i7u6y5t4r3e2w1q0', ARRAY['view_availability'], false);

-- Create RLS (Row Level Security) policies
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Allow public read access to seats
CREATE POLICY "Allow public read access to seats" ON seats
  FOR SELECT USING (true);

-- Allow public insert/update for bookings (API will handle validation)
CREATE POLICY "Allow public booking operations" ON bookings
  FOR ALL USING (true);

-- Restrict API keys to authenticated users only
CREATE POLICY "Restrict API keys access" ON api_keys
  FOR ALL USING (auth.role() = 'authenticated');

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_seats_updated_at BEFORE UPDATE ON seats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON shows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 