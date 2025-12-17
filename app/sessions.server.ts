import { createCookieSessionStorage } from 'react-router';
import { createThemeSessionResolver } from 'remix-themes';

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('Missing SESSION_SECRET environment variable');
}

const commonCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
  sameSite: 'lax' as const,
  secrets: [SESSION_SECRET],
  secure: process.env.NODE_ENV === 'production',
};

// Store light/dark theme prefs in a session cookie
const themeSessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__remix-themes',
    ...commonCookieOptions,
  },
});

export const themeSessionResolver =
  createThemeSessionResolver(themeSessionStorage);

// Store recent user and clinic search results in a session cookie for persistence/re-use
export const usersSession = createCookieSessionStorage({
  cookie: {
    name: '__users',
    ...commonCookieOptions,
  },
});

export const clinicsSession = createCookieSessionStorage({
  cookie: {
    name: '__clinics',
    ...commonCookieOptions,
  },
});

// Store recent patients and clinicians with explicit session management
export const patientsSession = createCookieSessionStorage({
  cookie: {
    name: '__patients_session',
    ...commonCookieOptions,
  },
});

export const cliniciansSession = createCookieSessionStorage({
  cookie: {
    name: '__clinicians_session',
    ...commonCookieOptions,
  },
});
