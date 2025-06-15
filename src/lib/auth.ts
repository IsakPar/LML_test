import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase, type ApiKey } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '1h';

export interface ApiKeyPermissions {
  read: boolean;
  book: boolean;
  admin: boolean;
}

export interface JWTPayload {
  apiKeyId: string;
  name: string;
  permissions: ApiKeyPermissions;
  iat?: number;
  exp?: number;
}

// Generate JWT token
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Generate API key hash
export async function hashApiKey(apiKey: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(apiKey, saltRounds);
}

// Verify API key
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}

// Generate random API key
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'vk_'; // venue key prefix
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create new API key
export async function createApiKey(
  name: string,
  permissions: ApiKeyPermissions,
  rateLimit: number = 100
) {
  const apiKey = generateApiKey();
  const keyHash = await hashApiKey(apiKey);

  const { data: dbApiKey, error } = await supabase
    .from('ApiKey')
    .insert({
      keyHash,
      name,
      permissions,
      rateLimit,
      isActive: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create API key: ${error.message}`);
  }

  return {
    id: dbApiKey.id,
    apiKey, // Return the plain key only once
    name: dbApiKey.name,
    permissions: dbApiKey.permissions as ApiKeyPermissions,
    rateLimit: dbApiKey.rateLimit,
    createdAt: dbApiKey.createdAt,
  };
}

// Validate API key and return key info
export async function validateApiKey(apiKey: string) {
  const { data: apiKeys, error } = await supabase
    .from('ApiKey')
    .select('*')
    .eq('isActive', true);

  if (error) {
    throw new Error(`Failed to fetch API keys: ${error.message}`);
  }

  for (const key of apiKeys) {
    if (await verifyApiKey(apiKey, key.keyHash)) {
      // Update last used timestamp
      await supabase
        .from('ApiKey')
        .update({ lastUsedAt: new Date().toISOString() })
        .eq('id', key.id);

      return {
        id: key.id,
        name: key.name,
        permissions: key.permissions as ApiKeyPermissions,
        rateLimit: key.rateLimit,
      };
    }
  }

  return null;
}

// Check if API key has specific permission
export function hasPermission(permissions: ApiKeyPermissions, required: keyof ApiKeyPermissions): boolean {
  return permissions[required] === true;
}

// Rate limiting check (simplified - in production use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(apiKeyId: string, limit: number): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  const current = rateLimitStore.get(apiKeyId);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(apiKeyId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
}

// Log API usage
export async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs?: number,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await supabase
      .from('ApiLog')
      .insert({
        apiKeyId,
        endpoint,
        method,
        statusCode,
        responseTimeMs,
        ipAddress,
        userAgent,
      });
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
} 