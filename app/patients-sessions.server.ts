import { createCookieSessionStorage } from '@remix-run/node';

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: '__patients_session',

      // all of these are optional
      // expires: new Date(Date.now() + 60_000),
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
      secrets: [process.env.SESSION_SECRET || 'default-secret'],
      secure: process.env.NODE_ENV === 'production',
    },
  });

export { getSession, commitSession, destroySession };

export const patientsSession = {
  getSession,
  commitSession,
  destroySession,
};
