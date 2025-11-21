import { createCookieSessionStorage } from '@remix-run/node';
import { createThemeSessionResolver } from 'remix-themes';

// Store light/dark theme prefs in a session cookie
// TODO: need to set domain and secure for remote builds
const themeSessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__remix-themes',
    // domain: 'remix.run',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secrets: ['s3cr3t'],
    // secure: true,
  },
});

export const themeSessionResolver =
  createThemeSessionResolver(themeSessionStorage);

// Store recent user and clinic search results in a session cookie for persistence/re-use
export const usersSession = createCookieSessionStorage({
  cookie: {
    name: '__users',
    secrets: ['s3cr3t'],
    sameSite: 'lax',
  },
});

export const clinicsSession = createCookieSessionStorage({
  cookie: {
    name: '__clinics',
    secrets: ['s3cr3t'],
    sameSite: 'lax',
  },
});

// Store recent patients and clinicians with explicit session management
const patientsSessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__patients_session',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET || 'default-secret'],
    secure: process.env.NODE_ENV === 'production',
  },
});

const cliniciansSessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__clinicians_session',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET || 'default-secret'],
    secure: process.env.NODE_ENV === 'production',
  },
});

export const patientsSession = {
  getSession: patientsSessionStorage.getSession,
  commitSession: patientsSessionStorage.commitSession,
  destroySession: patientsSessionStorage.destroySession,
};

export const cliniciansSession = {
  getSession: cliniciansSessionStorage.getSession,
  commitSession: cliniciansSessionStorage.commitSession,
  destroySession: cliniciansSessionStorage.destroySession,
};
