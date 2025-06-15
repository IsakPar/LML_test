import { NextRequest } from 'next/server';

// Mock API keys - in production, these would be stored in a database
const VALID_API_KEYS = new Set([
  'vbs_live_sk_1a2b3c4d5e6f7g8h9i0j',
  'vbs_live_sk_9z8y7x6w5v4u3t2s1r0q',
  'vbs_test_sk_p9o8i7u6y5t4r3e2w1q0'
]);

export interface AuthenticatedRequest extends NextRequest {
  apiKey?: string;
  isAuthenticated?: boolean;
}

export function validateApiKey(request: NextRequest): { isValid: boolean; apiKey?: string } {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return { isValid: false };
  }

  // Check for Bearer token format
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    return { isValid: false };
  }

  const apiKey = match[1];
  
  // Validate the API key
  if (VALID_API_KEYS.has(apiKey)) {
    return { isValid: true, apiKey };
  }

  return { isValid: false };
}

export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const { isValid, apiKey } = validateApiKey(request);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Valid API key required. Include Authorization: Bearer YOUR_API_KEY header.'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Add authentication info to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.apiKey = apiKey;
    authenticatedRequest.isAuthenticated = true;

    return handler(authenticatedRequest);
  };
}

export function getApiKeyPermissions(apiKey: string): string[] {
  // Mock permissions - in production, this would come from database
  const permissions: Record<string, string[]> = {
    'vbs_live_sk_1a2b3c4d5e6f7g8h9i0j': ['book_seats', 'view_availability', 'cancel_booking'],
    'vbs_live_sk_9z8y7x6w5v4u3t2s1r0q': ['book_seats', 'view_availability'],
    'vbs_test_sk_p9o8i7u6y5t4r3e2w1q0': ['view_availability']
  };
  
  return permissions[apiKey] || [];
}

export function hasPermission(apiKey: string, permission: string): boolean {
  const permissions = getApiKeyPermissions(apiKey);
  return permissions.includes(permission);
} 