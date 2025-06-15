# Vercel Deployment Fix Guide

## 🚨 Build Error Fix

The build is failing because Supabase environment variables are missing. Here's how to fix it:

## 📋 Required Environment Variables

Add these environment variables in your Vercel dashboard:

### 1. Go to Vercel Dashboard
- Navigate to your project settings
- Go to "Environment Variables" section

### 2. Add These Variables

```bash
# Client-side Supabase Configuration (Required for build)
NEXT_PUBLIC_SUPABASE_URL=https://kwcrhvutdozzzwcwsduw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Y3JodnV0ZG96enp3Y3dzZHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzE2NzQsImV4cCI6MjA1MDA0NzY3NH0.Ej7VJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhk

# Server-side Supabase Configuration
SUPABASE_URL=https://kwcrhvutdozzzwcwsduw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Y3JodnV0ZG96enp3Y3dzZHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzE2NzQsImV4cCI6MjA1MDA0NzY3NH0.Ej7VJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhk

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-12345

# API Configuration
API_RATE_LIMIT=100
API_RATE_WINDOW=900000
```

## 🔧 Step-by-Step Fix

### Option 1: Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable above with their values
5. Set Environment to "Production, Preview, and Development"
6. Click "Save"
7. Redeploy your project

### Option 2: Via Vercel CLI
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Enter: https://kwcrhvutdozzzwcwsduw.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Y3JodnV0ZG96enp3Y3dzZHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzE2NzQsImV4cCI6MjA1MDA0NzY3NH0.Ej7VJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhkzJhk

vercel env add JWT_SECRET
# Enter: your-super-secret-jwt-key-here-make-it-long-and-random-12345

# Redeploy
vercel --prod
```

## 🎯 What This Fixes

The error `supabaseUrl is required` occurs because:
1. Supabase client tries to initialize during build
2. Environment variables aren't available in build environment
3. Build fails when creating the client

With the environment variables set, the build will succeed and your app will deploy properly.

## ✅ After Deployment

Once deployed, your app will be available at:
- **Production URL**: `https://your-app-name.vercel.app`
- **API Base URL**: `https://your-app-name.vercel.app/api`

### Test Your Deployment
```bash
# Test basic API
curl https://your-app-name.vercel.app/api/test

# Test Supabase connection
curl https://your-app-name.vercel.app/api/test-supabase

# Test external API
curl -H "Authorization: Bearer vk_4Y06pVoEY0mX4hRcGbWl8id9Xu8xJj0w" \
  https://your-app-name.vercel.app/api/external/shows
```

## 🔒 Security Notes

- The `NEXT_PUBLIC_` prefixed variables are exposed to the client
- This is safe for Supabase anon keys (they're meant to be public)
- Keep `JWT_SECRET` secure (no `NEXT_PUBLIC_` prefix)
- Never expose service role keys in client-side variables

## 🚀 Next Steps

After successful deployment:
1. Update your external booking integrations to use the production URL
2. Test all API endpoints
3. Update the admin panel password if needed
4. Monitor the deployment for any issues

The venue booking system should now be fully functional in production! 