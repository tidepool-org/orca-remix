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
