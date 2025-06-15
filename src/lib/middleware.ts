import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, verifyToken, hasPermission, checkRateLimit, logApiUsage, ApiKeyPermissions } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  apiKey?: {
    id: string;
    name: string;
    permissions: ApiKeyPermissions;
    rateLimit: number;
  };
}

// Middleware to authenticate API requests
export async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean;
  response?: NextResponse;
  apiKey?: {
    id: string;
    name: string;
    permissions: ApiKeyPermissions;
    rateLimit: number;
  };
}> {
  const startTime = Date.now();
  
  try {
    // Check for Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      const response = NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
      return { success: false, response };
    }

    let apiKeyInfo = null;

    // Check if it's a Bearer token (JWT)
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      
      if (!payload) {
        const response = NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
        return { success: false, response };
      }

      // Get API key info from database
      apiKeyInfo = await validateApiKey(''); // We'll need to store the original key or modify this
      if (!apiKeyInfo) {
        const response = NextResponse.json(
          { error: 'API key not found or inactive' },
          { status: 401 }
        );
        return { success: false, response };
      }
    }
    // Check if it's an API key
    else if (authHeader.startsWith('ApiKey ')) {
      const apiKey = authHeader.substring(7);
      apiKeyInfo = await validateApiKey(apiKey);
      
      if (!apiKeyInfo) {
        const response = NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
        return { success: false, response };
      }
    }
    else {
      const response = NextResponse.json(
        { error: 'Invalid authorization format. Use "Bearer <token>" or "ApiKey <key>"' },
        { status: 401 }
      );
      return { success: false, response };
    }

    // Check rate limiting
    if (!checkRateLimit(apiKeyInfo.id, apiKeyInfo.rateLimit)) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
      
      // Log the rate limit violation
      await logApiUsage(
        apiKeyInfo.id,
        request.nextUrl.pathname,
        request.method,
        429,
        Date.now() - startTime,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        request.headers.get('user-agent') || undefined
      );
      
      return { success: false, response };
    }

    return { success: true, apiKey: apiKeyInfo };
  } catch (error) {
    console.error('Authentication error:', error);
    const response = NextResponse.json(
      { error: 'Internal authentication error' },
      { status: 500 }
    );
    return { success: false, response };
  }
}

// Middleware to check permissions
export function requirePermission(permission: keyof ApiKeyPermissions) {
  return (apiKey: { permissions: ApiKeyPermissions }) => {
    if (!hasPermission(apiKey.permissions, permission)) {
      return NextResponse.json(
        { error: `Insufficient permissions. Required: ${permission}` },
        { status: 403 }
      );
    }
    return null;
  };
}

// Wrapper function for API routes
export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  requiredPermission?: keyof ApiKeyPermissions
) {
  return async (request: NextRequest) => {
    const startTime = Date.now();
    
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return authResult.response!;
    }

    // Check permissions if required
    if (requiredPermission && authResult.apiKey) {
      const permissionCheck = requirePermission(requiredPermission)(authResult.apiKey);
      if (permissionCheck) {
                 // Log permission denied
         await logApiUsage(
           authResult.apiKey.id,
           request.nextUrl.pathname,
           request.method,
           403,
           Date.now() - startTime,
           request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
           request.headers.get('user-agent') || undefined
         );
        return permissionCheck;
      }
    }

    // Add API key info to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.apiKey = authResult.apiKey;

    try {
      // Call the actual handler
      const response = await handler(authenticatedRequest);
      
             // Log successful request
       if (authResult.apiKey) {
         await logApiUsage(
           authResult.apiKey.id,
           request.nextUrl.pathname,
           request.method,
           response.status,
           Date.now() - startTime,
           request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
           request.headers.get('user-agent') || undefined
         );
       }
      
      return response;
    } catch (error) {
      console.error('API handler error:', error);
      
             // Log error
       if (authResult.apiKey) {
         await logApiUsage(
           authResult.apiKey.id,
           request.nextUrl.pathname,
           request.method,
           500,
           Date.now() - startTime,
           request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
           request.headers.get('user-agent') || undefined
         );
       }
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// CORS middleware
export function withCors(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = await handler(request);
    
    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  };
}

// Validation helpers
export function validateRequired(data: any, fields: string[]): string | null {
  for (const field of fields) {
    if (!data[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
} 