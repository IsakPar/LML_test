-- =====================================================
-- COMPLETE VENUE BOOKING SYSTEM SCHEMA WITH AUTO SHOWS
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Shows table with automatic generation
CREATE TABLE shows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  show_date DATE NOT NULL,
  show_time TIME NOT NULL DEFAULT '19:30:00', -- 7:30 PM default
  duration_minutes INTEGER DEFAULT 120,
  base_price_premium DECIMAL(10,2) DEFAULT 150.00,
  base_price_standard DECIMAL(10,2) DEFAULT 100.00,
  base_price_economy DECIMAL(10,2) DEFAULT 50.00,
  target_occupancy_percent INTEGER DEFAULT 40, -- 30-50% randomized
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate show names on consecutive days
  CONSTRAINT unique_show_date UNIQUE (show_date)
);

-- Seats table (linked to shows)
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  number VARCHAR(10) NOT NULL,
  row VARCHAR(10) NOT NULL,
  section VARCHAR(10) NOT NULL DEFAULT 'A',
  category VARCHAR(20) NOT NULL CHECK (category IN ('premium', 'standard', 'economy')),
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Composite unique constraint
  CONSTRAINT unique_seat_per_show UNIQUE (show_id, number, row, section)
);

-- Bookings table (date-specific)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  seat_ids UUID[] NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'pending')),
  booking_reference VARCHAR(50) NOT NULL UNIQUE,
  booking_source VARCHAR(50) DEFAULT 'website', -- website, api, mobile, etc.
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
  usage_count INTEGER DEFAULT 0,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- Show templates for rotation
CREATE TABLE show_templates (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  duration_minutes INTEGER DEFAULT 120,
  is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_shows_date ON shows(show_date);
CREATE INDEX idx_shows_active ON shows(is_active);
CREATE INDEX idx_seats_show_id ON seats(show_id);
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_seats_category ON seats(category);
CREATE INDEX idx_bookings_show_id ON bookings(show_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- =====================================================
-- SHOW TEMPLATES DATA
-- =====================================================

INSERT INTO show_templates (title, description, duration_minutes) VALUES
('The Phantom of the Opera', 'A haunting tale of love, obsession, and mystery beneath the Paris Opera House', 150),
('Hamilton', 'The revolutionary musical about Alexander Hamilton and the founding of America', 165),
('The Lion King', 'Disney''s spectacular musical bringing the African savanna to life', 140),
('Wicked', 'The untold story of the witches of Oz, before Dorothy arrived', 145),
('Chicago', 'A dazzling musical about fame, fortune, and murder in the jazz age', 135),
('Les Misérables', 'The epic tale of love, sacrifice, and redemption in revolutionary France', 180);

-- =====================================================
-- FUNCTIONS FOR AUTOMATIC SHOW GENERATION
-- =====================================================

-- Function to get next show title (avoiding consecutive repeats)
CREATE OR REPLACE FUNCTION get_next_show_title(target_date DATE)
RETURNS TEXT AS $$
DECLARE
  last_show_title TEXT;
  available_titles TEXT[];
  selected_title TEXT;
BEGIN
  -- Get the last show title
  SELECT title INTO last_show_title 
  FROM shows 
  WHERE show_date = target_date - INTERVAL '1 day';
  
  -- Get all available titles except the last one
  SELECT ARRAY(
    SELECT title 
    FROM show_templates 
    WHERE is_active = true 
    AND (last_show_title IS NULL OR title != last_show_title)
  ) INTO available_titles;
  
  -- Select random title from available options
  IF array_length(available_titles, 1) > 0 THEN
    selected_title := available_titles[1 + floor(random() * array_length(available_titles, 1))];
  ELSE
    -- Fallback if no templates available
    selected_title := 'Evening Performance';
  END IF;
  
  RETURN selected_title;
END;
$$ LANGUAGE plpgsql;

-- Function to generate seats for a show with randomized occupancy
CREATE OR REPLACE FUNCTION generate_seats_for_show(
  p_show_id UUID,
  p_target_occupancy INTEGER DEFAULT 40
)
RETURNS VOID AS $$
DECLARE
  total_seats INTEGER := 100;
  seats_to_book INTEGER;
  seat_record RECORD;
  random_seats UUID[];
BEGIN
  -- Calculate number of seats to pre-book (30-50% occupancy)
  seats_to_book := floor(total_seats * (p_target_occupancy + random() * 20 - 10) / 100);
  
  -- Insert all seats as available first
  INSERT INTO seats (show_id, number, row, section, category, price, status)
  SELECT 
    p_show_id,
    ((row_num - 1) * 10 + seat_num)::VARCHAR as number,
    row_num::VARCHAR as row,
    'A' as section,
    CASE 
      WHEN row_num <= 3 THEN 'premium'
      WHEN row_num <= 7 THEN 'standard'
      ELSE 'economy'
    END as category,
    CASE 
      WHEN row_num <= 3 THEN (SELECT base_price_premium FROM shows WHERE id = p_show_id)
      WHEN row_num <= 7 THEN (SELECT base_price_standard FROM shows WHERE id = p_show_id)
      ELSE (SELECT base_price_economy FROM shows WHERE id = p_show_id)
    END as price,
    'available' as status
  FROM 
    generate_series(1, 10) as row_num,
    generate_series(1, 10) as seat_num;
  
  -- Randomly select seats to mark as sold
  WITH random_seat_selection AS (
    SELECT id
    FROM seats 
    WHERE show_id = p_show_id 
    ORDER BY random() 
    LIMIT seats_to_book
  )
  UPDATE seats 
  SET status = 'sold' 
  WHERE id IN (SELECT id FROM random_seat_selection);
  
  -- Mark a few random seats as reserved (5% of total)
  WITH reserved_seat_selection AS (
    SELECT id
    FROM seats 
    WHERE show_id = p_show_id 
    AND status = 'available'
    ORDER BY random() 
    LIMIT greatest(1, floor(total_seats * 0.05))
  )
  UPDATE seats 
  SET status = 'reserved' 
  WHERE id IN (SELECT id FROM reserved_seat_selection);
  
END;
$$ LANGUAGE plpgsql;

-- Function to create a new show for a specific date
CREATE OR REPLACE FUNCTION create_show_for_date(target_date DATE)
RETURNS UUID AS $$
DECLARE
  new_show_id UUID;
  show_title TEXT;
  show_desc TEXT;
  show_duration INTEGER;
  occupancy_rate INTEGER;
BEGIN
  -- Check if show already exists for this date
  SELECT id INTO new_show_id FROM shows WHERE show_date = target_date;
  IF new_show_id IS NOT NULL THEN
    RETURN new_show_id;
  END IF;
  
  -- Get next show title
  show_title := get_next_show_title(target_date);
  
  -- Get show details from template
  SELECT description, duration_minutes 
  INTO show_desc, show_duration
  FROM show_templates 
  WHERE title = show_title;
  
  -- Random occupancy between 30-50%
  occupancy_rate := 30 + floor(random() * 21);
  
  -- Create the show
  INSERT INTO shows (
    title, 
    description, 
    show_date, 
    show_time,
    duration_minutes,
    target_occupancy_percent
  ) VALUES (
    show_title,
    show_desc,
    target_date,
    '19:30:00',
    COALESCE(show_duration, 120),
    occupancy_rate
  ) RETURNING id INTO new_show_id;
  
  -- Generate seats for the show
  PERFORM generate_seats_for_show(new_show_id, occupancy_rate);
  
  RETURN new_show_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate shows (called by cron)
CREATE OR REPLACE FUNCTION auto_generate_shows()
RETURNS VOID AS $$
DECLARE
  target_date DATE;
BEGIN
  -- Generate shows for today, tomorrow, and day after tomorrow
  FOR i IN 0..2 LOOP
    target_date := CURRENT_DATE + (i || ' days')::INTERVAL;
    PERFORM create_show_for_date(target_date);
  END LOOP;
  
  -- Clean up old shows (older than 7 days)
  DELETE FROM shows 
  WHERE show_date < CURRENT_DATE - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON shows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seats_updated_at BEFORE UPDATE ON seats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Allow public read access to shows and seats
CREATE POLICY "Allow public read access to shows" ON shows
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to seats" ON seats
  FOR SELECT USING (true);

-- Allow public booking operations
CREATE POLICY "Allow public booking operations" ON bookings
  FOR ALL USING (true);

-- Restrict API keys to authenticated users
CREATE POLICY "Restrict API keys access" ON api_keys
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert sample API keys
INSERT INTO api_keys (name, key_hash, permissions, is_active) VALUES
('External Booking System', 'vbs_live_sk_1a2b3c4d5e6f7g8h9i0j', ARRAY['book_seats', 'view_availability', 'cancel_booking'], true),
('Mobile App Integration', 'vbs_live_sk_9z8y7x6w5v4u3t2s1r0q', ARRAY['book_seats', 'view_availability'], true),
('Partner Website', 'vbs_test_sk_p9o8i7u6y5t4r3e2w1q0', ARRAY['view_availability'], false);

-- Generate initial shows for today, tomorrow, and day after
SELECT auto_generate_shows();

-- =====================================================
-- CRON JOB SETUP (Requires pg_cron extension)
-- =====================================================

-- Schedule automatic show generation at midnight GMT daily
-- Note: This requires pg_cron extension and superuser privileges
-- You may need to run this manually or set up via Supabase dashboard

-- SELECT cron.schedule(
--   'auto-generate-shows',
--   '0 0 * * *', -- Every day at midnight
--   'SELECT auto_generate_shows();'
-- );

-- =====================================================
-- HELPER VIEWS FOR EASY QUERYING
-- =====================================================

-- View for current show availability
CREATE VIEW current_show_availability AS
SELECT 
  s.id as show_id,
  s.title,
  s.show_date,
  s.show_time,
  COUNT(st.id) as total_seats,
  COUNT(CASE WHEN st.status = 'available' THEN 1 END) as available_seats,
  COUNT(CASE WHEN st.status = 'sold' THEN 1 END) as sold_seats,
  COUNT(CASE WHEN st.status = 'reserved' THEN 1 END) as reserved_seats,
  ROUND(
    (COUNT(CASE WHEN st.status = 'sold' THEN 1 END)::DECIMAL / COUNT(st.id)) * 100, 
    1
  ) as occupancy_percent
FROM shows s
LEFT JOIN seats st ON s.id = st.show_id
WHERE s.show_date >= CURRENT_DATE
GROUP BY s.id, s.title, s.show_date, s.show_time
ORDER BY s.show_date, s.show_time;

-- View for upcoming shows (next 3 days)
CREATE VIEW upcoming_shows AS
SELECT 
  id,
  title,
  description,
  show_date,
  show_time,
  duration_minutes,
  CASE 
    WHEN show_date = CURRENT_DATE THEN 'Today'
    WHEN show_date = CURRENT_DATE + 1 THEN 'Tomorrow'
    ELSE TO_CHAR(show_date, 'Day, Mon DD')
  END as display_date
FROM shows
WHERE show_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 2
AND is_active = true
ORDER BY show_date;

-- =====================================================
-- MANUAL TRIGGER FOR INITIAL SETUP
-- =====================================================

-- If you want to manually trigger show generation:
-- SELECT auto_generate_shows();

-- To create a specific show:
-- SELECT create_show_for_date('2024-12-16');

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================

-- This schema provides:
-- 1. Automatic show generation with 6 rotating titles
-- 2. No consecutive duplicate show names
-- 3. Randomized 30-50% occupancy per show
-- 4. Date-specific seat maps and bookings
-- 5. Automatic cleanup of old shows
-- 6. Helper views for easy API integration
-- 7. Proper indexing and security
-- 8. Extensible design for future features 