# External Booking System Integration Guide

## 🎭 Complete Setup Guide for Venue Booking API Integration

This guide provides everything you need to integrate the Venue Booking System APIs into your external booking platform, website, or mobile application.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication Setup](#authentication-setup)
3. [API Endpoints Overview](#api-endpoints-overview)
4. [Complete Integration Examples](#complete-integration-examples)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Testing Your Integration](#testing-your-integration)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- API Key from the venue administrator
- Basic understanding of REST APIs
- HTTPS-capable hosting (required for production)

### Base URL
```
Development: http://localhost:3001
Production: https://your-venue-domain.com
```

### Authentication
All API requests require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_API_KEY_HERE
```

---

## 🔐 Authentication Setup

### Step 1: Obtain API Key
1. Contact venue administrator for API access
2. Receive API key with appropriate permissions:
   - **Read-only**: View shows and seat availability
   - **Booking**: Create and view bookings
   - **Full Access**: Create, view, and cancel bookings

### Step 2: Test Authentication
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3001/api/external/shows
```

Expected response:
```json
{
  "success": true,
  "shows": [...]
}
```

---

## 🔗 API Endpoints Overview

### 1. Get Available Shows
**Endpoint**: `GET /api/external/shows`
**Purpose**: Fetch all upcoming shows with availability

### 2. Get Seat Availability
**Endpoint**: `GET /api/external/seats?date=YYYY-MM-DD`
**Purpose**: Get detailed seat map for specific show date

### 3. Create Booking
**Endpoint**: `POST /api/external/book`
**Purpose**: Book seats for a customer

### 4. Cancel Booking
**Endpoint**: `DELETE /api/external/cancel`
**Purpose**: Cancel existing booking

---

## 💻 Complete Integration Examples

### JavaScript/Web Integration

#### HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Venue Booking Integration</title>
    <style>
        .show-card {
            border: 1px solid #ddd;
            padding: 20px;
            margin: 10px 0;
            border-radius: 8px;
            background: #f9f9f9;
        }
        .seat-grid {
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            gap: 5px;
            margin: 20px 0;
        }
        .seat {
            width: 30px;
            height: 30px;
            border: 1px solid #ccc;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
        }
        .seat.available { background: #90EE90; }
        .seat.occupied { background: #FFB6C1; cursor: not-allowed; }
        .seat.selected { background: #4169E1; color: white; }
        .loading { text-align: center; padding: 20px; }
        .error { color: red; padding: 10px; background: #ffe6e6; }
        .success { color: green; padding: 10px; background: #e6ffe6; }
    </style>
</head>
<body>
    <div id="app">
        <h1>🎭 Venue Booking System</h1>
        
        <!-- Shows Section -->
        <div id="shows-section">
            <button id="fetch-shows-btn">🎭 Fetch Available Shows</button>
            <div id="shows-container"></div>
        </div>
        
        <!-- Seats Section -->
        <div id="seats-section" style="display: none;">
            <h2>Select Your Seats</h2>
            <div id="seat-info"></div>
            <div id="seats-container"></div>
            <button id="back-to-shows">← Back to Shows</button>
        </div>
        
        <!-- Booking Section -->
        <div id="booking-section" style="display: none;">
            <h2>Complete Your Booking</h2>
            <form id="booking-form">
                <div>
                    <label>Name: <input type="text" id="customer-name" required></label>
                </div>
                <div>
                    <label>Email: <input type="email" id="customer-email" required></label>
                </div>
                <div>
                    <label>Phone: <input type="tel" id="customer-phone" required></label>
                </div>
                <div id="selected-seats-info"></div>
                <button type="submit">Complete Booking</button>
                <button type="button" id="back-to-seats">← Back to Seats</button>
            </form>
        </div>
        
        <!-- Messages -->
        <div id="messages"></div>
    </div>

    <script src="booking-integration.js"></script>
</body>
</html>
```

#### JavaScript Implementation
```javascript
// booking-integration.js
class VenueBookingAPI {
    constructor(apiKey, baseUrl = 'http://localhost:3001') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.selectedSeats = [];
        this.currentShow = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('fetch-shows-btn').addEventListener('click', () => this.fetchShows());
        document.getElementById('back-to-shows').addEventListener('click', () => this.showSection('shows'));
        document.getElementById('back-to-seats').addEventListener('click', () => this.showSection('seats'));
        document.getElementById('booking-form').addEventListener('submit', (e) => this.handleBooking(e));
    }

    async apiRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            this.showMessage(`API Error: ${error.message}`, 'error');
            throw error;
        }
    }

    async fetchShows() {
        this.showLoading('Fetching available shows...');
        
        try {
            const data = await this.apiRequest('/api/external/shows');
            this.displayShows(data.shows);
        } catch (error) {
            console.error('Failed to fetch shows:', error);
        }
    }

    displayShows(shows) {
        const container = document.getElementById('shows-container');
        
        if (!shows || shows.length === 0) {
            container.innerHTML = '<p>No shows available at this time.</p>';
            return;
        }

        container.innerHTML = shows.map(show => `
            <div class="show-card">
                <h3>${show.title}</h3>
                <p><strong>📅 Date:</strong> ${new Date(show.date).toLocaleDateString()}</p>
                <p><strong>🕰️ Time:</strong> ${show.time}</p>
                <p><strong>📝 Description:</strong> ${show.description}</p>
                <p><strong>💺 Available Seats:</strong> ${show.availableSeats}/${show.totalSeats}</p>
                <p><strong>📊 Availability:</strong> ${(100 - show.occupancyPercentage).toFixed(1)}%</p>
                <button onclick="bookingAPI.selectShow('${show.date}', '${show.title}')">
                    Select This Show →
                </button>
            </div>
        `).join('');
    }

    async selectShow(date, title) {
        this.currentShow = { date, title };
        this.showLoading('Loading seat map...');
        
        try {
            const data = await this.apiRequest(`/api/external/seats?date=${date}`);
            this.displaySeats(data.seats);
            this.showSection('seats');
        } catch (error) {
            console.error('Failed to fetch seats:', error);
        }
    }

    displaySeats(seats) {
        const container = document.getElementById('seats-container');
        const info = document.getElementById('seat-info');
        
        info.innerHTML = `
            <h3>${this.currentShow.title}</h3>
            <p>📅 ${new Date(this.currentShow.date).toLocaleDateString()}</p>
            <p>Select your preferred seats (click to select/deselect)</p>
        `;

        // Group seats by row
        const seatsByRow = {};
        seats.forEach(seat => {
            const row = seat.seatNumber.charAt(0);
            if (!seatsByRow[row]) seatsByRow[row] = [];
            seatsByRow[row].push(seat);
        });

        // Create seat grid
        let html = '<div class="theater-layout">';
        Object.keys(seatsByRow).sort().forEach(row => {
            html += `<div class="seat-row">`;
            html += `<span class="row-label">${row}</span>`;
            seatsByRow[row].sort((a, b) => 
                parseInt(a.seatNumber.slice(1)) - parseInt(b.seatNumber.slice(1))
            ).forEach(seat => {
                const status = seat.isOccupied ? 'occupied' : 'available';
                html += `
                    <div class="seat ${status}" 
                         data-seat="${seat.seatNumber}"
                         onclick="bookingAPI.toggleSeat('${seat.seatNumber}', ${seat.isOccupied})">
                        ${seat.seatNumber}
                    </div>
                `;
            });
            html += `</div>`;
        });
        html += '</div>';
        
        html += `
            <div style="margin-top: 20px;">
                <button onclick="bookingAPI.proceedToBooking()" 
                        id="proceed-btn" 
                        disabled>
                    Proceed to Booking
                </button>
                <p id="selected-count">Selected seats: 0</p>
            </div>
        `;

        container.innerHTML = html;
    }

    toggleSeat(seatNumber, isOccupied) {
        if (isOccupied) return;

        const seatElement = document.querySelector(`[data-seat="${seatNumber}"]`);
        const isSelected = this.selectedSeats.includes(seatNumber);

        if (isSelected) {
            // Deselect
            this.selectedSeats = this.selectedSeats.filter(s => s !== seatNumber);
            seatElement.classList.remove('selected');
        } else {
            // Select
            this.selectedSeats.push(seatNumber);
            seatElement.classList.add('selected');
        }

        this.updateSelectionUI();
    }

    updateSelectionUI() {
        const count = this.selectedSeats.length;
        document.getElementById('selected-count').textContent = `Selected seats: ${count}`;
        document.getElementById('proceed-btn').disabled = count === 0;
    }

    proceedToBooking() {
        if (this.selectedSeats.length === 0) return;

        document.getElementById('selected-seats-info').innerHTML = `
            <h4>Selected Seats:</h4>
            <p>${this.selectedSeats.join(', ')}</p>
            <p><strong>Show:</strong> ${this.currentShow.title}</p>
            <p><strong>Date:</strong> ${new Date(this.currentShow.date).toLocaleDateString()}</p>
        `;

        this.showSection('booking');
    }

    async handleBooking(event) {
        event.preventDefault();
        
        const customerData = {
            name: document.getElementById('customer-name').value,
            email: document.getElementById('customer-email').value,
            phone: document.getElementById('customer-phone').value
        };

        const bookingData = {
            date: this.currentShow.date,
            seats: this.selectedSeats,
            customer: customerData
        };

        this.showLoading('Processing booking...');

        try {
            const result = await this.apiRequest('/api/external/book', {
                method: 'POST',
                body: JSON.stringify(bookingData)
            });

            this.showMessage(`
                🎉 Booking Successful!<br>
                Booking ID: ${result.bookingId}<br>
                Seats: ${this.selectedSeats.join(', ')}<br>
                Show: ${this.currentShow.title}<br>
                Date: ${new Date(this.currentShow.date).toLocaleDateString()}
            `, 'success');

            // Reset form
            this.selectedSeats = [];
            this.currentShow = null;
            document.getElementById('booking-form').reset();
            this.showSection('shows');

        } catch (error) {
            console.error('Booking failed:', error);
        }
    }

    showSection(section) {
        ['shows', 'seats', 'booking'].forEach(s => {
            document.getElementById(`${s}-section`).style.display = 
                s === section ? 'block' : 'none';
        });
    }

    showLoading(message) {
        document.getElementById('messages').innerHTML = 
            `<div class="loading">⏳ ${message}</div>`;
    }

    showMessage(message, type = 'info') {
        const className = type === 'error' ? 'error' : 
                         type === 'success' ? 'success' : 'info';
        document.getElementById('messages').innerHTML = 
            `<div class="${className}">${message}</div>`;
        
        // Auto-clear after 5 seconds
        setTimeout(() => {
            document.getElementById('messages').innerHTML = '';
        }, 5000);
    }
}

// Initialize the booking system
const bookingAPI = new VenueBookingAPI('YOUR_API_KEY_HERE');
```

### Python Integration Example

```python
import requests
import json
from datetime import datetime
from typing import List, Dict, Optional

class VenueBookingAPI:
    def __init__(self, api_key: str, base_url: str = "http://localhost:3001"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make HTTP request to the API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=self.headers)
            elif method.upper() == "POST":
                response = requests.post(url, headers=self.headers, json=data)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=self.headers, json=data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {e}")
            raise
    
    def get_shows(self) -> List[Dict]:
        """Fetch all available shows"""
        result = self._make_request("GET", "/api/external/shows")
        return result.get("shows", [])
    
    def get_seats(self, date: str) -> List[Dict]:
        """Get seat availability for specific date"""
        result = self._make_request("GET", f"/api/external/seats?date={date}")
        return result.get("seats", [])
    
    def book_seats(self, date: str, seats: List[str], customer: Dict) -> Dict:
        """Book seats for a customer"""
        booking_data = {
            "date": date,
            "seats": seats,
            "customer": customer
        }
        return self._make_request("POST", "/api/external/book", booking_data)
    
    def cancel_booking(self, booking_id: str) -> Dict:
        """Cancel an existing booking"""
        cancel_data = {"bookingId": booking_id}
        return self._make_request("DELETE", "/api/external/cancel", cancel_data)

# Example usage
def main():
    # Initialize API client
    api = VenueBookingAPI("YOUR_API_KEY_HERE")
    
    try:
        # 1. Fetch available shows
        print("📅 Available Shows:")
        shows = api.get_shows()
        for i, show in enumerate(shows):
            print(f"{i+1}. {show['title']}")
            print(f"   Date: {show['date']}")
            print(f"   Time: {show['time']}")
            print(f"   Available: {show['availableSeats']}/{show['totalSeats']}")
            print()
        
        if not shows:
            print("No shows available")
            return
        
        # 2. Select first show and get seats
        selected_show = shows[0]
        print(f"🎭 Getting seats for: {selected_show['title']}")
        seats = api.get_seats(selected_show['date'])
        
        # 3. Find available seats
        available_seats = [seat['seatNumber'] for seat in seats if not seat['isOccupied']]
        print(f"💺 Available seats: {len(available_seats)}")
        print(f"First 10: {available_seats[:10]}")
        
        # 4. Book first 2 available seats
        if len(available_seats) >= 2:
            customer_info = {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+1234567890"
            }
            
            seats_to_book = available_seats[:2]
            print(f"🎫 Booking seats: {seats_to_book}")
            
            booking_result = api.book_seats(
                selected_show['date'],
                seats_to_book,
                customer_info
            )
            
            print("✅ Booking successful!")
            print(f"Booking ID: {booking_result['bookingId']}")
            print(f"Total Cost: ${booking_result['totalCost']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
```

### PHP Integration Example

```php
<?php

class VenueBookingAPI {
    private $apiKey;
    private $baseUrl;
    
    public function __construct($apiKey, $baseUrl = 'http://localhost:3001') {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }
    
    private function makeRequest($method, $endpoint, $data = null) {
        $url = $this->baseUrl . $endpoint;
        
        $headers = [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json'
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        switch (strtoupper($method)) {
            case 'POST':
                curl_setopt($ch, CURLOPT_POST, true);
                if ($data) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
                break;
            case 'DELETE':
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
                if ($data) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
                break;
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 400) {
            throw new Exception("API request failed with status: $httpCode");
        }
        
        return json_decode($response, true);
    }
    
    public function getShows() {
        $result = $this->makeRequest('GET', '/api/external/shows');
        return $result['shows'] ?? [];
    }
    
    public function getSeats($date) {
        $result = $this->makeRequest('GET', "/api/external/seats?date=$date");
        return $result['seats'] ?? [];
    }
    
    public function bookSeats($date, $seats, $customer) {
        $bookingData = [
            'date' => $date,
            'seats' => $seats,
            'customer' => $customer
        ];
        return $this->makeRequest('POST', '/api/external/book', $bookingData);
    }
    
    public function cancelBooking($bookingId) {
        $cancelData = ['bookingId' => $bookingId];
        return $this->makeRequest('DELETE', '/api/external/cancel', $cancelData);
    }
}

// Example usage
try {
    $api = new VenueBookingAPI('YOUR_API_KEY_HERE');
    
    // Fetch shows
    $shows = $api->getShows();
    echo "Available Shows:\n";
    foreach ($shows as $show) {
        echo "- {$show['title']} on {$show['date']}\n";
        echo "  Available: {$show['availableSeats']}/{$show['totalSeats']}\n";
    }
    
    if (!empty($shows)) {
        // Get seats for first show
        $firstShow = $shows[0];
        $seats = $api->getSeats($firstShow['date']);
        
        $availableSeats = array_filter($seats, function($seat) {
            return !$seat['isOccupied'];
        });
        
        echo "\nAvailable seats: " . count($availableSeats) . "\n";
        
        // Book first 2 available seats
        if (count($availableSeats) >= 2) {
            $seatsToBook = array_slice(array_column($availableSeats, 'seatNumber'), 0, 2);
            $customer = [
                'name' => 'Jane Smith',
                'email' => 'jane@example.com',
                'phone' => '+1987654321'
            ];
            
            $booking = $api->bookSeats($firstShow['date'], $seatsToBook, $customer);
            echo "Booking successful! ID: {$booking['bookingId']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
```

---

## ⚠️ Error Handling

### Common Error Responses

```json
{
  "success": false,
  "error": "Invalid API key",
  "code": "UNAUTHORIZED"
}
```

```json
{
  "success": false,
  "error": "Seats A1, A2 are no longer available",
  "code": "SEATS_UNAVAILABLE"
}
```

### Error Codes Reference

| Code | Description | Action |
|------|-------------|---------|
| `UNAUTHORIZED` | Invalid API key | Check API key |
| `SEATS_UNAVAILABLE` | Selected seats taken | Refresh seat map |
| `INVALID_DATE` | Date format wrong | Use YYYY-MM-DD |
| `SHOW_NOT_FOUND` | No show for date | Check available dates |
| `RATE_LIMITED` | Too many requests | Wait and retry |
| `VALIDATION_ERROR` | Missing required fields | Check request data |

### Recommended Error Handling

```javascript
async function handleAPICall(apiFunction) {
    try {
        return await apiFunction();
    } catch (error) {
        switch (error.code) {
            case 'SEATS_UNAVAILABLE':
                // Refresh seat map and ask user to select again
                await refreshSeatMap();
                showMessage('Selected seats are no longer available. Please choose different seats.');
                break;
            case 'RATE_LIMITED':
                // Wait and retry
                setTimeout(() => handleAPICall(apiFunction), 5000);
                break;
            default:
                showMessage(`Error: ${error.message}`);
        }
    }
}
```

---

## 🚦 Rate Limiting

### Current Limits
- **100 requests per minute** per API key
- **1000 requests per hour** per API key
- **10,000 requests per day** per API key

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits
```javascript
function checkRateLimit(response) {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    if (remaining < 10) {
        console.warn(`Rate limit warning: ${remaining} requests remaining`);
    }
    
    if (response.status === 429) {
        const resetTime = new Date(reset * 1000);
        throw new Error(`Rate limited. Try again at ${resetTime}`);
    }
}
```

---

## 🧪 Testing Your Integration

### Test API Key
For development, use this test API key:
```
test_key_12345_read_only
```

### Test Scenarios

#### 1. Basic Flow Test
```bash
# 1. Get shows
curl -H "Authorization: Bearer test_key_12345_read_only" \
  http://localhost:3001/api/external/shows

# 2. Get seats for first show date
curl -H "Authorization: Bearer test_key_12345_read_only" \
  "http://localhost:3001/api/external/seats?date=2024-12-20"

# 3. Book seats (requires booking permission)
curl -X POST \
  -H "Authorization: Bearer YOUR_BOOKING_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-12-20",
    "seats": ["A1", "A2"],
    "customer": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+1234567890"
    }
  }' \
  http://localhost:3001/api/external/book
```

#### 2. Error Handling Test
```bash
# Test invalid API key
curl -H "Authorization: Bearer invalid_key" \
  http://localhost:3001/api/external/shows

# Test invalid date format
curl -H "Authorization: Bearer test_key_12345_read_only" \
  "http://localhost:3001/api/external/seats?date=invalid-date"
```

### Integration Checklist

- [ ] API key authentication works
- [ ] Shows fetch correctly with all required fields
- [ ] Seat map loads for selected show
- [ ] Seat selection/deselection works
- [ ] Booking submission succeeds
- [ ] Error messages display properly
- [ ] Rate limiting is handled
- [ ] Loading states are shown
- [ ] Success confirmations appear

---

## 🚀 Production Deployment

### Environment Setup

#### 1. Environment Variables
```bash
# .env.production
VENUE_API_BASE_URL=https://your-venue-domain.com
VENUE_API_KEY=your_production_api_key_here
VENUE_API_TIMEOUT=30000
```

#### 2. Security Considerations
- **HTTPS Only**: All production API calls must use HTTPS
- **API Key Security**: Store API keys securely, never in client-side code
- **CORS Setup**: Configure CORS for your domain
- **Rate Limiting**: Implement client-side rate limiting

#### 3. Performance Optimization
```javascript
// Cache shows data for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;
let showsCache = null;
let cacheTimestamp = 0;

async function getCachedShows() {
    const now = Date.now();
    if (showsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        return showsCache;
    }
    
    showsCache = await fetchShows();
    cacheTimestamp = now;
    return showsCache;
}
```

### Monitoring and Analytics

#### 1. API Usage Tracking
```javascript
// Track API usage
function trackAPICall(endpoint, success, responseTime) {
    analytics.track('API Call', {
        endpoint,
        success,
        responseTime,
        timestamp: new Date().toISOString()
    });
}
```

#### 2. Error Monitoring
```javascript
// Monitor errors
function logError(error, context) {
    console.error('Booking API Error:', error);
    
    // Send to error tracking service
    errorTracker.captureException(error, {
        tags: { component: 'booking-api' },
        extra: context
    });
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Invalid API Key" Error
**Symptoms**: All API calls return 401 Unauthorized
**Solutions**:
- Verify API key is correct
- Check Authorization header format: `Bearer YOUR_KEY`
- Ensure API key has required permissions

#### 2. "Seats No Longer Available" Error
**Symptoms**: Booking fails with seat availability error
**Solutions**:
- Refresh seat map before booking
- Implement real-time seat updates
- Add seat reservation timeout

#### 3. CORS Errors in Browser
**Symptoms**: Browser blocks API requests
**Solutions**:
- Configure CORS on venue server
- Use server-side proxy for API calls
- Ensure proper headers are set

#### 4. Rate Limiting Issues
**Symptoms**: 429 Too Many Requests errors
**Solutions**:
- Implement exponential backoff
- Cache API responses
- Reduce request frequency

### Debug Mode

Enable debug logging:
```javascript
const DEBUG = true;

function debugLog(message, data) {
    if (DEBUG) {
        console.log(`[Venue API Debug] ${message}`, data);
    }
}

// Use in API calls
debugLog('Making API request', { endpoint, method, data });
```

### Support Contacts

- **Technical Support**: tech-support@venue.com
- **API Documentation**: https://venue.com/api-docs
- **Status Page**: https://status.venue.com

---

## 📚 Additional Resources

### Sample Applications
- [React Booking App](https://github.com/venue/react-booking-example)
- [Vue.js Integration](https://github.com/venue/vue-booking-example)
- [Mobile App (React Native)](https://github.com/venue/mobile-booking-example)

### API Testing Tools
- [Postman Collection](https://venue.com/postman-collection)
- [Insomnia Workspace](https://venue.com/insomnia-workspace)

### Community
- [Developer Forum](https://forum.venue.com)
- [Discord Channel](https://discord.gg/venue-dev)
- [Stack Overflow Tag](https://stackoverflow.com/questions/tagged/venue-api)

---

## 📄 License and Terms

By using the Venue Booking API, you agree to:
- Use the API only for legitimate booking purposes
- Not exceed rate limits
- Protect customer data according to privacy laws
- Provide accurate booking information

For full terms of service, visit: https://venue.com/api-terms

---

**Last Updated**: December 2024
**API Version**: v1.0
**Guide Version**: 1.0.0