import { jwtDecode } from 'jwt-decode';

export type PomeriumJWTPayload = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  iat?: number;
  exp?: number;
  aud?: string[];
  iss?: string;
};

/**
 * Check if auth bypass is enabled for local development.
 * Set DEV_AUTH_BYPASS=true in your .env file to skip auth verification.
 * Only works when NODE_ENV=development.
 */
const isAuthBypassed =
  process.env.NODE_ENV === 'development' &&
  process.env.DEV_AUTH_BYPASS === 'true';

/**
 * Mock payload returned when auth is bypassed in development.
 * Customize via DEV_AUTH_EMAIL and DEV_AUTH_NAME env vars.
 */
const DEV_MOCK_PAYLOAD: PomeriumJWTPayload = {
  sub: 'dev-user',
  email: process.env.DEV_AUTH_EMAIL || 'dev@localhost',
  name: process.env.DEV_AUTH_NAME || 'Development User',
};

/**
 * Verifies that a request has valid Pomerium authentication.
 *
 * This provides defense-in-depth authentication verification. While Pomerium
 * validates JWTs at the proxy level, this function ensures:
 * 1. The JWT header is present (catches misconfiguration)
 * 2. The JWT is properly formatted and decodable
 * 3. The JWT has not expired
 *
 * For local development without Pomerium, set these env vars:
 *   DEV_AUTH_BYPASS=true    - Skip auth verification (requires NODE_ENV=development)
 *   DEV_AUTH_EMAIL=...      - Optional: customize mock user email
 *   DEV_AUTH_NAME=...       - Optional: customize mock user name
 *
 * Note: This does NOT verify the JWT signature. Full signature verification
 * would require maintaining Pomerium's public keys. The primary protection
 * comes from Pomerium itself; this is a secondary safeguard.
 *
 * @throws Response with 401 status if authentication fails (when not bypassed)
 */
export function requireAuth(request: Request): PomeriumJWTPayload {
  const jwt = request.headers.get('x-pomerium-jwt-assertion');

  // Allow bypass in development when explicitly enabled
  if (!jwt) {
    if (isAuthBypassed) {
      return DEV_MOCK_PAYLOAD;
    }
    throw new Response('Unauthorized: Missing authentication token', {
      status: 401,
    });
  }

  try {
    const payload = jwtDecode<PomeriumJWTPayload>(jwt);

    // Check if token has expired (skip when bypassed for convenience)
    if (payload.exp && !isAuthBypassed) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new Response('Unauthorized: Authentication token has expired', {
          status: 401,
        });
      }
    }

    return payload;
  } catch (error) {
    // If it's already a Response (from expiry check), re-throw
    if (error instanceof Response) {
      throw error;
    }

    // In bypass mode, return mock payload even if JWT is malformed
    if (isAuthBypassed) {
      console.warn('Auth: Invalid JWT in dev bypass mode, using mock payload');
      return DEV_MOCK_PAYLOAD;
    }

    // JWT decode failed - malformed token
    throw new Response('Unauthorized: Invalid authentication token', {
      status: 401,
    });
  }
}

/**
 * Optional auth check that returns the payload or null.
 * Use this when you want to check auth without throwing.
 * In development mode, returns mock payload if no JWT is present.
 */
export function getAuthPayload(request: Request): PomeriumJWTPayload | null {
  try {
    return requireAuth(request);
  } catch {
    return null;
  }
}
