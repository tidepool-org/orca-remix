import { createCookieSessionStorage } from 'react-router';
import { createThemeSessionResolver } from 'remix-themes';

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('Missing SESSION_SECRET environment variable');
}

const baseCookieOptions = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
  secrets: [SESSION_SECRET],
  secure: process.env.NODE_ENV === 'production',
};

// Data/cache cookies expire after 3 days of inactivity (resets on each write)
const dataCookieOptions = {
  ...baseCookieOptions,
  maxAge: 60 * 60 * 24 * 3, // 3 days
};

// UI preference cookies persist longer for convenience
const prefCookieOptions = {
  ...baseCookieOptions,
  maxAge: 60 * 60 * 24 * 90, // 90 days
};

// Store light/dark theme prefs in a session cookie
const themeSessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__remix-themes',
    ...prefCookieOptions,
  },
});

export const themeSessionResolver =
  createThemeSessionResolver(themeSessionStorage);

// Store recent user and clinic search results in a session cookie for persistence/re-use
export const usersSession = createCookieSessionStorage({
  cookie: {
    name: '__users',
    ...dataCookieOptions,
  },
});

export const clinicsSession = createCookieSessionStorage({
  cookie: {
    name: '__clinics',
    ...dataCookieOptions,
  },
});

// Store recent patients and clinicians with explicit session management
export const patientsSession = createCookieSessionStorage({
  cookie: {
    name: '__patients_session',
    ...dataCookieOptions,
  },
});

export const cliniciansSession = createCookieSessionStorage({
  cookie: {
    name: '__clinicians_session',
    ...dataCookieOptions,
  },
});

export const prescriptionsSession = createCookieSessionStorage({
  cookie: {
    name: '__prescriptions_session',
    ...dataCookieOptions,
  },
});

// Store sidebar expanded/collapsed preference
export const sidebarSession = createCookieSessionStorage({
  cookie: {
    name: '__sidebar',
    ...prefCookieOptions,
  },
});

// Store profile header expanded/collapsed preferences (map of profileType -> boolean)
export const profileExpandedSession = createCookieSessionStorage({
  cookie: {
    name: '__profile-expanded',
    ...prefCookieOptions,
  },
});
