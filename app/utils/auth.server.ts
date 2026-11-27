/**
 * Identity of the person making a request, as asserted by the Tailscale Serve
 * proxy (Kubernetes-operator Ingress) in front of the app.
 */
export type AuthUser = {
  /** Tailscale login name, normally the user's email (e.g. `alice@tidepool.org`). */
  email: string;
  /** Display name, if Tailscale supplied one. */
  name?: string;
  /** Profile picture URL, if the identity provider supplies one. */
  picture?: string;
};

const LOGIN_HEADER = 'Tailscale-User-Login';
const NAME_HEADER = 'Tailscale-User-Name';
const PROFILE_PIC_HEADER = 'Tailscale-User-Profile-Pic';

/**
 * Check if auth bypass is enabled for local development.
 * Set DEV_AUTH_BYPASS=true in your .env file to skip auth verification.
 * Only works when NODE_ENV=development.
 */
const isAuthBypassed =
  process.env.NODE_ENV === 'development' &&
  process.env.DEV_AUTH_BYPASS === 'true';

/**
 * Mock user returned when auth is bypassed in development.
 * Customize via DEV_AUTH_EMAIL and DEV_AUTH_NAME env vars.
 */
const DEV_MOCK_USER: AuthUser = {
  email: process.env.DEV_AUTH_EMAIL || 'dev@localhost',
  name: process.env.DEV_AUTH_NAME || 'Development User',
};

// An RFC 2047 encoded-word: =?charset?encoding?encoded-text?=
const ENCODED_WORD = /=\?([^?\s]+)\?([QqBb])\?([^?\s]*)\?=/g;

/** Decodes the "Q" encoding (RFC 2047 section 4.2). Returns null if malformed. */
function decodeQ(text: string): number[] | null {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '_') {
      bytes.push(0x20);
    } else if (ch === '=') {
      const hex = text.slice(i + 1, i + 3);
      if (!/^[0-9A-Fa-f]{2}$/.test(hex)) return null;
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else {
      const code = ch.charCodeAt(0);
      if (code < 0x21 || code > 0x7e) return null;
      bytes.push(code);
    }
  }
  return bytes;
}

/** Decodes the "B" (base64) encoding. Returns null if malformed. */
function decodeB(text: string): number[] | null {
  try {
    return Array.from(atob(text), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

/** Adjacent encoded-words in one charset, collected before decoding. */
type EncodedRun = { charset: string; bytes: number[]; raw: string };

function decodeRun(run: EncodedRun): string {
  try {
    return new TextDecoder(run.charset, { fatal: true }).decode(
      Uint8Array.from(run.bytes),
    );
  } catch {
    // Unknown charset or invalid bytes: keep the original text.
    return run.raw;
  }
}

/**
 * Decodes RFC 2047 encoded-words in a header value. Tailscale "Q"-encodes
 * identity header values that contain non-ASCII characters, e.g.
 * `=?utf-8?q?Ferris_B=C3=BCller?=`, and splits long values into several
 * encoded-words separated by a space. Plain values pass through unchanged.
 *
 * Whitespace between adjacent encoded-words is dropped (RFC 2047 section 6.2)
 * and their bytes are joined before decoding, so a multi-byte character split
 * across two words still decodes. Malformed encoded-words, or ones in an
 * unknown charset, are left as-is rather than rejected.
 */
function decodeRfc2047(value: string): string {
  if (!value.includes('=?')) return value;

  let result = '';
  let lastIndex = 0;
  let run: EncodedRun | null = null;

  for (const match of value.matchAll(ENCODED_WORD)) {
    const [word, rawCharset, encoding, text] = match;
    const between = value.slice(lastIndex, match.index);
    lastIndex = match.index + word.length;

    // RFC 2231 allows a language suffix: charset*language.
    const charset = rawCharset.split('*')[0].toLowerCase();
    const bytes =
      encoding.toUpperCase() === 'Q' ? decodeQ(text) : decodeB(text);

    if (run && bytes && between.trim() === '') {
      // Adjacent to the previous encoded-word: drop the whitespace between.
      if (run.charset === charset) {
        run.bytes.push(...bytes);
        run.raw += between + word;
      } else {
        result += decodeRun(run);
        run = { charset, bytes, raw: word };
      }
      continue;
    }

    if (run) {
      result += decodeRun(run);
      run = null;
    }
    if (bytes) {
      result += between;
      run = { charset, bytes, raw: word };
    } else {
      result += between + word;
    }
  }

  if (run) result += decodeRun(run);
  return result + value.slice(lastIndex);
}

/** Reads and decodes an identity header; empty values become undefined. */
function readIdentityHeader(
  request: Request,
  name: string,
): string | undefined {
  const value = request.headers.get(name);
  if (!value) return undefined;
  return decodeRfc2047(value).trim() || undefined;
}

/**
 * Returns the authenticated user from Tailscale Serve's identity headers.
 *
 * The app sits behind a Tailscale Kubernetes-operator Ingress. Tailscale Serve
 * removes any client-supplied `Tailscale-User-*` headers and sets its own for
 * requests from (untagged) tailnet users, so the headers can be trusted as
 * long as the Ingress is the only way to reach the app. Access control is
 * enforced by the tailnet ACL; this function only needs the user's identity.
 *
 * Headers read:
 *   Tailscale-User-Login       - required, the user's login (email)
 *   Tailscale-User-Name        - optional display name
 *   Tailscale-User-Profile-Pic - optional picture URL
 *
 * For local development without Tailscale, set these env vars:
 *   DEV_AUTH_BYPASS=true    - Skip auth verification (requires NODE_ENV=development)
 *   DEV_AUTH_EMAIL=...      - Optional: customize mock user email
 *   DEV_AUTH_NAME=...       - Optional: customize mock user name
 * Real identity headers, when present, take precedence over the mock user.
 *
 * @throws Response with 401 status if the login header is missing or empty
 * (when not bypassed)
 */
export function requireAuth(request: Request): AuthUser {
  const email = readIdentityHeader(request, LOGIN_HEADER);

  if (!email) {
    // Allow bypass in development when explicitly enabled
    if (isAuthBypassed) {
      return DEV_MOCK_USER;
    }
    throw new Response('Unauthorized: Missing Tailscale identity', {
      status: 401,
    });
  }

  return {
    email,
    name: readIdentityHeader(request, NAME_HEADER),
    // Tailscale sends the picture URL as-is (it is not RFC 2047 encoded).
    picture: request.headers.get(PROFILE_PIC_HEADER) || undefined,
  };
}

/**
 * Optional auth check that returns the user or null.
 * Use this when you want to check auth without throwing.
 * In development mode, returns the mock user if no identity is present.
 */
export function getAuthPayload(request: Request): AuthUser | null {
  try {
    return requireAuth(request);
  } catch {
    return null;
  }
}
