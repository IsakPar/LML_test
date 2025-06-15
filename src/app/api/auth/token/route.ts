import { NextRequest, NextResponse } from 'next/server';
import { withCors, validateRequired } from '@/lib/middleware';
import { validateApiKey, generateToken, logApiUsage } from '@/lib/auth';

async function handleTokenRequest(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const validationError = validateRequired(body, ['api_key']);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const { api_key } = body;

    // Validate API key against database
    const apiKeyRecord = await validateApiKey(api_key);
    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      apiKeyId: apiKeyRecord.id,
      name: apiKeyRecord.name,
      permissions: apiKeyRecord.permissions
    });

    // Log the API usage
    await logApiUsage(
      apiKeyRecord.id,
      '/api/auth/token',
      'POST',
      200,
      0 // We'll implement proper timing later
    );

    return NextResponse.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
      permissions: apiKeyRecord.permissions
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const POST = withCors(handleTokenRequest); 