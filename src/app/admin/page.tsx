'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  created: string;
  lastUsed?: string;
  isActive: boolean;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['setup']));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const router = useRouter();

  // Mock API keys data - in production, this would come from your database
  const mockApiKeys: ApiKey[] = [
    {
      id: '1',
      name: 'External Booking System',
      key: 'vbs_live_sk_1a2b3c4d5e6f7g8h9i0j',
      permissions: ['book_seats', 'view_availability', 'cancel_booking'],
      created: '2024-12-15',
      lastUsed: '2024-12-15',
      isActive: true
    },
    {
      id: '2',
      name: 'Mobile App Integration',
      key: 'vbs_live_sk_9z8y7x6w5v4u3t2s1r0q',
      permissions: ['book_seats', 'view_availability'],
      created: '2024-12-10',
      lastUsed: '2024-12-14',
      isActive: true
    },
    {
      id: '3',
      name: 'Partner Website',
      key: 'vbs_test_sk_p9o8i7u6y5t4r3e2w1q0',
      permissions: ['view_availability'],
      created: '2024-12-05',
      isActive: false
    }
  ];

  useEffect(() => {
    // Check if already authenticated in session
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      setApiKeys(mockApiKeys);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check - in production, use proper authentication
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setError('');
      sessionStorage.setItem('admin_authenticated', 'true');
      setApiKeys(mockApiKeys);
    } else {
      setError('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setPassword('');
  };

  const generateNewApiKey = () => {
    if (!newKeyName.trim()) {
      showToastMessage('Please enter a name for the API key');
      return;
    }
    
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `vbs_live_sk_${Math.random().toString(36).substring(2, 22)}`,
      permissions: ['book_seats', 'view_availability'],
      created: new Date().toISOString().split('T')[0],
      isActive: true
    };
    
    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
    setShowNewKeyForm(false);
    showToastMessage(`API key "${newKey.name}" generated successfully!`);
    
    // Auto-copy the new key to clipboard
    setTimeout(() => {
      copyToClipboard(newKey.key, newKey.id);
    }, 500);
  };

  const toggleKeyStatus = (keyId: string) => {
    const key = apiKeys.find(k => k.id === keyId);
    if (!key) return;
    
    setApiKeys(apiKeys.map(k => 
      k.id === keyId ? { ...k, isActive: !k.isActive } : k
    ));
    
    showToastMessage(
      `API key "${key.name}" ${key.isActive ? 'disabled' : 'enabled'} successfully`
    );
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(keyId);
      showToastMessage('API key copied to clipboard!');
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const filteredApiKeys = apiKeys.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && key.isActive) ||
                         (filterStatus === 'inactive' && !key.isActive);
    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🔐 Admin Access</h1>
            <p className="text-gray-600">Enter password to access API management</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter admin password"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
            >
              Access Admin Panel
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to Seat Selection
            </button>
                  </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-pulse">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🔑 API Key Management</h1>
              <p className="text-gray-600 mt-1">Manage external booking integrations</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                View Theater
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* API Documentation */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📚 API Documentation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-bold text-blue-800 mb-2">Base URL</h3>
              <code className="text-sm bg-blue-100 px-2 py-1 rounded">
                {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api
              </code>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-bold text-green-800 mb-2">Authentication</h3>
              <code className="text-sm bg-green-100 px-2 py-1 rounded">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-bold text-gray-800 mb-3">Available Endpoints:</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">GET</span>
                  <code>/api/external/shows</code>
                </div>
                <p className="text-sm text-gray-600">Get upcoming shows for the next 3 days</p>
                <p className="text-xs text-gray-500 mt-1">Query params: days=3, include_stats=true</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">GET</span>
                  <code>/api/external/seats</code>
                </div>
                <p className="text-sm text-gray-600">Get seat availability for a specific date</p>
                <p className="text-xs text-gray-500 mt-1">Query params: date=YYYY-MM-DD, category, status, minPrice, maxPrice</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">POST</span>
                  <code>/api/external/book</code>
                </div>
                <p className="text-sm text-gray-600">Book selected seats with customer information</p>
                <p className="text-xs text-gray-500 mt-1">Body: {`{seatIds: [], customerInfo: {name, email, phone?}, showDate: "YYYY-MM-DD", notes?}`}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">DELETE</span>
                  <code>/api/external/cancel</code>
                </div>
                <p className="text-sm text-gray-600">Cancel existing booking</p>
                <p className="text-xs text-gray-500 mt-1">Body: {`{bookingId: "BK...", reason?: "..."}`}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Guide */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection('setup')}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <h2 className="text-xl font-bold text-gray-800">🚀 Integration Setup Guide</h2>
            <span className={`text-2xl transition-transform duration-300 ${
              expandedSections.has('setup') ? 'rotate-180' : ''
            }`}>
              ⌄
            </span>
          </button>
          
          {expandedSections.has('setup') && (
                         <div className="px-6 pb-6 transition-all duration-300 ease-in-out">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-bold text-blue-800 mb-3">📋 Quick Start Checklist</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>Get your API key from the table below</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>Test with the seat availability endpoint</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>Implement booking flow in your application</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>Handle errors and edge cases</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>Set up webhook notifications (optional)</span>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-bold text-yellow-800 mb-3">⚠️ Important Notes</h3>
              <div className="space-y-2 text-sm text-yellow-700">
                <div>• Keep your API keys secure and never expose them in client-side code</div>
                <div>• Use HTTPS in production environments</div>
                <div>• Implement proper error handling for network failures</div>
                <div>• Rate limit: 1000 requests per hour per API key</div>
                <div>• Test thoroughly in a staging environment first</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3">🔧 Integration Steps</h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Step 1: Authentication Setup</h4>
                  <p className="text-sm text-gray-600 mb-2">Add the Authorization header to all API requests:</p>
                  <pre className="bg-gray-800 text-green-400 p-2 rounded text-xs">
{`// JavaScript Example
const headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
};`}
                  </pre>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-800 mb-2">Step 2: Check Seat Availability</h4>
                  <p className="text-sm text-gray-600 mb-2">Before booking, always check current availability:</p>
                  <pre className="bg-gray-800 text-green-400 p-2 rounded text-xs">
{`// Get available premium seats
fetch('/api/external/seats?status=available&category=premium', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
})
.then(response => response.json())
.then(data => console.log(data.data.seats));`}
                  </pre>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-800 mb-2">Step 3: Book Seats</h4>
                  <p className="text-sm text-gray-600 mb-2">Submit booking with customer information:</p>
                  <pre className="bg-gray-800 text-green-400 p-2 rounded text-xs">
{`// Book seats
fetch('/api/external/book', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    seatIds: ['seat-1', 'seat-2'],
    customerInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890'
    }
  })
})
.then(response => response.json())
.then(booking => console.log('Booking ID:', booking.data.id));`}
                  </pre>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-red-800 mb-2">Step 4: Handle Errors</h4>
                  <p className="text-sm text-gray-600 mb-2">Implement proper error handling:</p>
                  <pre className="bg-gray-800 text-green-400 p-2 rounded text-xs">
{`// Error handling example
try {
  const response = await fetch('/api/external/book', options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Booking failed');
  }
  
  return data;
} catch (error) {
  console.error('Booking error:', error.message);
  // Handle error appropriately
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3">🌐 Supported Programming Languages</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-2xl mb-2">🟨</div>
                  <div className="font-semibold">JavaScript</div>
                  <div className="text-xs text-gray-500">fetch, axios, node.js</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-2xl mb-2">🐍</div>
                  <div className="font-semibold">Python</div>
                  <div className="text-xs text-gray-500">requests, urllib</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-2xl mb-2">☕</div>
                  <div className="font-semibold">Java</div>
                  <div className="text-xs text-gray-500">HttpClient, OkHttp</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-2xl mb-2">💎</div>
                  <div className="font-semibold">Ruby</div>
                  <div className="text-xs text-gray-500">Net::HTTP, HTTParty</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-2xl mb-2">🐘</div>
                  <div className="font-semibold">PHP</div>
                  <div className="text-xs text-gray-500">cURL, Guzzle</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-2xl mb-2">🦀</div>
                  <div className="font-semibold">Rust</div>
                  <div className="text-xs text-gray-500">reqwest, hyper</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3">📊 Response Format</h3>
              <p className="text-sm text-gray-600 mb-3">All API responses follow this consistent format:</p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm">
{`{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-12-15T10:30:00.000Z"
}

// Error responses:
{
  "error": "Bad Request",
  "message": "Detailed error description",
  "timestamp": "2024-12-15T10:30:00.000Z"
}`}
              </pre>
                         </div>
           </div>
           </div>
         )}
        </div>

        {/* Example Usage */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">💡 Example Usage</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-2">Get Available Seats</h3>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`curl -X GET "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/external/seats?status=available&category=premium" \\
  -H "Authorization: Bearer vbs_live_sk_1a2b3c4d5e6f7g8h9i0j"`}
              </pre>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-2">Book Seats</h3>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`curl -X POST "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/external/book" \\
  -H "Authorization: Bearer vbs_live_sk_1a2b3c4d5e6f7g8h9i0j" \\
  -H "Content-Type: application/json" \\
  -d '{
    "seatIds": ["seat-1", "seat-2"],
    "customerInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "notes": "Birthday celebration"
  }'`}
              </pre>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-2">Cancel Booking</h3>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`curl -X DELETE "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/external/cancel" \\
  -H "Authorization: Bearer vbs_live_sk_1a2b3c4d5e6f7g8h9i0j" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bookingId": "BK1734123456ABC123",
    "reason": "Customer requested cancellation"
  }'`}
              </pre>
            </div>
          </div>
        </div>

        {/* Language-Specific Examples */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔧 Language-Specific Examples</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">🐍</span>
                Python Example
              </h3>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`import requests
import json

# Configuration
API_KEY = "vbs_live_sk_1a2b3c4d5e6f7g8h9i0j"
BASE_URL = "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/external"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Get available seats
response = requests.get(f"{BASE_URL}/seats?status=available", headers=headers)
seats = response.json()
print(f"Available seats: {len(seats['data']['seats'])}")

# Book seats
booking_data = {
    "seatIds": ["seat-1", "seat-2"],
    "customerInfo": {
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+1234567890"
    }
}

response = requests.post(f"{BASE_URL}/book", 
                        headers=headers, 
                        data=json.dumps(booking_data))
booking = response.json()
print(f"Booking ID: {booking['data']['id']}")`}
              </pre>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">🐘</span>
                PHP Example
              </h3>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`<?php
$apiKey = "vbs_live_sk_1a2b3c4d5e6f7g8h9i0j";
$baseUrl = "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/external";

$headers = [
    "Authorization: Bearer " . $apiKey,
    "Content-Type: application/json"
];

// Get available seats
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . "/seats?status=available");
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$seats = json_decode($response, true);
echo "Available seats: " . count($seats['data']['seats']) . "\\n";

// Book seats
$bookingData = [
    "seatIds" => ["seat-1", "seat-2"],
    "customerInfo" => [
        "name" => "Bob Johnson",
        "email" => "bob@example.com",
        "phone" => "+1234567890"
    ]
];

curl_setopt($ch, CURLOPT_URL, $baseUrl . "/book");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($bookingData));
$response = curl_exec($ch);
$booking = json_decode($response, true);
echo "Booking ID: " . $booking['data']['id'] . "\\n";
curl_close($ch);
?>`}
              </pre>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">💎</span>
                Ruby Example
              </h3>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`require 'net/http'
require 'json'
require 'uri'

API_KEY = "vbs_live_sk_1a2b3c4d5e6f7g8h9i0j"
BASE_URL = "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/external"

def make_request(method, endpoint, body = nil)
  uri = URI("#{BASE_URL}#{endpoint}")
  http = Net::HTTP.new(uri.host, uri.port)
  
  request = case method
  when :get then Net::HTTP::Get.new(uri)
  when :post then Net::HTTP::Post.new(uri)
  end
  
  request['Authorization'] = "Bearer #{API_KEY}"
  request['Content-Type'] = 'application/json'
  request.body = body.to_json if body
  
  response = http.request(request)
  JSON.parse(response.body)
end

# Get available seats
seats = make_request(:get, "/seats?status=available")
puts "Available seats: #{seats['data']['seats'].length}"

# Book seats
booking_data = {
  seatIds: ["seat-1", "seat-2"],
  customerInfo: {
    name: "Alice Brown",
    email: "alice@example.com",
    phone: "+1234567890"
  }
}

booking = make_request(:post, "/book", booking_data)
puts "Booking ID: #{booking['data']['id']}"`}
              </pre>
            </div>
          </div>
        </div>

        {/* API Keys List */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800">🔐 API Key Management</h2>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search keys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Keys</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              
              <button
                onClick={() => setShowNewKeyForm(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 whitespace-nowrap"
              >
                + Generate New Key
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{apiKeys.length}</div>
              <div className="text-sm text-blue-800">Total Keys</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{apiKeys.filter(k => k.isActive).length}</div>
              <div className="text-sm text-green-800">Active Keys</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{filteredApiKeys.length}</div>
              <div className="text-sm text-orange-800">Filtered Results</div>
            </div>
          </div>

          {/* New Key Form */}
          {showNewKeyForm && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-blue-800 mb-3">Generate New API Key</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Enter key name (e.g., 'Partner Website')"
                  className="flex-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={generateNewApiKey}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Generate
                </button>
                <button
                  onClick={() => setShowNewKeyForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Keys Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">API Key</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Permissions</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Used</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApiKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-800">{apiKey.name}</div>
                        <div className="text-sm text-gray-500">Created: {apiKey.created}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {apiKey.key.substring(0, 20)}...
                        </code>
                        <button
                          onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                          className={`text-sm transition-all duration-200 ${
                            copiedKey === apiKey.id 
                              ? 'text-green-600 hover:text-green-800' 
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                          title={copiedKey === apiKey.id ? "Copied!" : "Copy full key"}
                        >
                          {copiedKey === apiKey.id ? '✅' : '📋'}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          apiKey.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {apiKey.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {apiKey.lastUsed || 'Never'}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleKeyStatus(apiKey.id)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          apiKey.isActive
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {apiKey.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredApiKeys.length === 0 && apiKeys.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <div>No API keys match your search criteria.</div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear filters
              </button>
            </div>
          )}
          
          {apiKeys.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔑</div>
              <div>No API keys generated yet.</div>
              <div className="text-sm mt-1">Click "Generate New Key" to create your first API key.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 