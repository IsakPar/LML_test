# Venue Booking API - Complete Setup Guide

## 🚀 Quick Start

This is a Next.js-based venue booking API system with Supabase database integration. The system provides JWT-based authentication and seat reservation functionality for external integrations.

## 📁 Project Structure

**IMPORTANT**: Always work from the `venue-simulator/` directory, NOT the parent directory!

```
Venue_tester/
└── venue-simulator/          ← WORK FROM HERE
    ├── src/
    │   ├── app/api/          ← API endpoints
    │   └── lib/              ← Utilities and database
    ├── package.json          ← Dependencies
    └── .env.local            ← Environment variables
```

## 🔧 Installation & Setup

### 1. Navigate to Correct Directory
```bash
cd /Users/isakparild/Desktop/Venue_tester/venue-simulator
pwd  # Should show: /Users/isakparild/Desktop/Venue_tester/venue-simulator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create `.env.local` file in the `venue-simulator/` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://kwcrhvutdozzzwcwsduw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Y3JodnV0ZG96enp3Y3dzZHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzE2NzQsImV4cCI6MjA1MDA0NzY3NH0.Ej7VJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhk

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-12345

# API Configuration
API_RATE_LIMIT=100
API_RATE_WINDOW=900000
```

### 4. Start Development Server
```bash
npm run dev
```

Server will run at: `http://localhost:3000`

## 🗄️ Database Information

### Supabase Database
- **URL**: `https://kwcrhvutdozzzwcwsduw.supabase.co`
- **API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Y3JodnV0ZG96enp3Y3dzZHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzE2NzQsImV4cCI6MjA1MDA0NzY3NH0.Ej7VJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhk`

### Pre-loaded Test Data
- **1 Venue**: "Test Theater" (ID: `venue-1`)
- **5 Seats**: `seat-1` through `seat-5`
- **1 Show**: "Test Show" (ID: `show-1`)
- **3 API Keys**: With different permission levels

## 🔑 API Keys & Authentication

### Available API Keys

#### 1. Read-Only Access
```
API Key: vk_W18iPAR8AK3jptVfPJ7VN9Nxx2pqJyoe
Permissions: {"book": false, "read": true, "admin": false}
Use Case: View seat maps and venue information only
```

#### 2. Booking Access
```
API Key: vk_4Y06pVoEY0mX4hRcGbWl8id9Xu8xJj0w
Permissions: {"book": true, "read": true, "admin": false}
Use Case: Make reservations and view information
```

#### 3. Admin Access
```
API Key: vk_k1BcAgnbyGLqFWdOl26QW0fGMJDFulqI
Permissions: {"book": true, "read": true, "admin": true}
Use Case: Full system access including admin functions
```

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### 1. Health Check
```http
GET /api/test
```
**Response:**
```json
{
  "message": "API is working!",
  "timestamp": "2025-06-15T08:54:14.718Z"
}
```

### 2. Database Connection Test
```http
GET /api/test-supabase
```
**Response:**
```json
{
  "message": "Supabase connection successful!",
  "venueCount": 1,
  "venues": [{"id": "venue-1", "name": "Test Theater"}]
}
```

### 3. Authentication - Get JWT Token
```http
POST /api/auth/token
Content-Type: application/json

{
  "apiKey": "vk_4Y06pVoEY0mX4hRcGbWl8id9Xu8xJj0w"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h",
  "permissions": {"book": true, "read": true, "admin": false}
}
```

### 4. Get Venue Seat Map
```http
GET /api/venues/venue-1/seat-map
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "venue": {
    "id": "venue-1",
    "name": "Test Theater",
    "layouts": [...],
    "seats": [...],
    "shows": [...],
    "availability": [...]
  }
}
```

### 5. Make Reservation
```http
POST /api/reservations
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "showId": "show-1",
  "seatIds": ["seat-1", "seat-2"],
  "externalBookingId": "your-booking-ref-123"
}
```

**Response:**
```json
{
  "reservation_id": "730f5a44-5903-4c26-8dee-509c87083f9f",
  "seat_ids": ["seat-1", "seat-2"],
  "show_id": "show-1",
  "external_booking_id": "your-booking-ref-123",
  "expires_at": "2025-06-15T09:09:14.634Z",
  "created_at": "2025-06-15T08:54:14.718Z",
  "status": "reserved"
}
```

## 🧪 Testing the API

### Using cURL

#### 1. Get JWT Token
```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "vk_4Y06pVoEY0mX4hRcGbWl8id9Xu8xJj0w"}'
```

#### 2. Get Seat Map
```bash
curl -X GET http://localhost:3000/api/venues/venue-1/seat-map \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

#### 3. Make Reservation
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "showId": "show-1",
    "seatIds": ["seat-3", "seat-4"],
    "externalBookingId": "test-booking-456"
  }'
```

### Using JavaScript/Fetch

```javascript
// 1. Get JWT Token
const tokenResponse = await fetch('http://localhost:3000/api/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'vk_4Y06pVoEY0mX4hRcGbWl8id9Xu8xJj0w'
  })
});
const { token } = await tokenResponse.json();

// 2. Get Seat Map
const seatMapResponse = await fetch('http://localhost:3000/api/venues/venue-1/seat-map', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const seatMap = await seatMapResponse.json();

// 3. Make Reservation
const reservationResponse = await fetch('http://localhost:3000/api/reservations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    showId: 'show-1',
    seatIds: ['seat-5'],
    externalBookingId: 'js-booking-789'
  })
});
const reservation = await reservationResponse.json();
```

## 🔗 External Integration Examples

### React Component Example
```jsx
import { useState, useEffect } from 'react';

const VenueBooking = () => {
  const [token, setToken] = useState('');
  const [seatMap, setSeatMap] = useState(null);
  
  useEffect(() => {
    // Get authentication token
    fetch('http://localhost:3000/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: 'vk_4Y06pVoEY0mX4hRcGbWl8id9Xu8xJj0w'
      })
    })
    .then(res => res.json())
    .then(data => {
      setToken(data.token);
      
      // Get seat map
      return fetch('http://localhost:3000/api/venues/venue-1/seat-map', {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
    })
    .then(res => res.json())
    .then(setSeatMap);
  }, []);

  const bookSeats = async (seatIds) => {
    const response = await fetch('http://localhost:3000/api/reservations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        showId: 'show-1',
        seatIds,
        externalBookingId: `react-${Date.now()}`
      })
    });
    return response.json();
  };

  return (
    <div>
      <h1>Venue Booking</h1>
      {seatMap && (
        <div>
          <h2>{seatMap.venue.name}</h2>
          {/* Render seat map and booking interface */}
        </div>
      )}
    </div>
  );
};
```

### WordPress Integration
```php
<?php
// Get JWT Token
$api_key = 'vk_4Y06pVoEY0mX4hRcGbWl8id9Xu8xJj0w';
$token_response = wp_remote_post('http://localhost:3000/api/auth/token', [
    'headers' => ['Content-Type' => 'application/json'],
    'body' => json_encode(['apiKey' => $api_key])
]);
$token_data = json_decode(wp_remote_retrieve_body($token_response), true);
$jwt_token = $token_data['token'];

// Get Seat Map
$seat_map_response = wp_remote_get('http://localhost:3000/api/venues/venue-1/seat-map', [
    'headers' => ['Authorization' => 'Bearer ' . $jwt_token]
]);
$seat_map = json_decode(wp_remote_retrieve_body($seat_map_response), true);

// Make Reservation
$reservation_response = wp_remote_post('http://localhost:3000/api/reservations', [
    'headers' => [
        'Authorization' => 'Bearer ' . $jwt_token,
        'Content-Type' => 'application/json'
    ],
    'body' => json_encode([
        'showId' => 'show-1',
        'seatIds' => ['seat-1'],
        'externalBookingId' => 'wp-booking-' . time()
    ])
]);
?>
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Module not found" errors
- **Cause**: Running from wrong directory
- **Solution**: Always run from `venue-simulator/` directory
```bash
cd /Users/isakparild/Desktop/Venue_tester/venue-simulator
pwd  # Verify correct directory
npm run dev
```

#### 2. "supabaseUrl is required" error
- **Cause**: Missing environment variables
- **Solution**: Ensure `.env.local` exists in `venue-simulator/` directory with correct values

#### 3. JWT Token expired
- **Cause**: Tokens expire after 1 hour
- **Solution**: Request new token using `/api/auth/token` endpoint

#### 4. Port already in use
- **Solution**: Kill existing processes
```bash
pkill -f "next dev"
npm run dev
```

### Debugging Commands
```bash
# Check current directory
pwd

# List files to verify structure
ls -la

# Check if server is running
lsof -i :3000

# View environment variables
cat .env.local

# Check package.json exists
ls package.json
```

## 🔒 Security Notes

- This is a **TEST ENVIRONMENT** - credentials are hardcoded for development
- In production, use proper environment variable management
- JWT tokens expire after 1 hour for security
- API keys have different permission levels for access control
- Rate limiting is implemented (100 requests per 15 minutes)

## 📊 System Features

- ✅ JWT-based authentication with permission levels
- ✅ Rate limiting and API logging
- ✅ Seat reservation system with expiration times
- ✅ Complete venue/seat/show data management
- ✅ External booking API ready for third-party integrations
- ✅ Supabase database integration
- ✅ TypeScript support
- ✅ Next.js API routes

## 🎯 Use Cases

This API system enables:
1. **External website integration** - Add booking to existing sites
2. **Mobile app development** - Build native booking apps
3. **Third-party platform integration** - Connect with booking platforms
4. **Custom booking interfaces** - Create tailored user experiences
5. **Multi-venue management** - Scale to multiple venues

## 🚀 Vercel Deployment

### Environment Variables for Vercel
When deploying to Vercel, add these environment variables in your Vercel dashboard:

```env
SUPABASE_URL=https://kwcrhvutdozzzwcwsduw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Y3JodnV0ZG96enp3Y3dzZHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzE2NzQsImV4cCI6MjA1MDA0NzY3NH0.Ej7VJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhk
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-12345
API_RATE_LIMIT=100
API_RATE_WINDOW=900000
```

### Build Configuration
The project includes:
- **ESLint disabled during builds** to prevent deployment failures
- **TypeScript errors ignored** for faster deployment
- **External packages configured** for server components

### Deployment Steps
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add the environment variables above
4. Deploy!

Your API will be available at: `https://your-app-name.vercel.app/api`

---

**Happy Booking! 🎭🎪🎨** 