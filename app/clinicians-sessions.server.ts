import { createCookieSessionStorage } from '@remix-run/node';

type SessionData = {
  recentClinicians: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: '__clinicians_session',
      // all of these are optional
      domain: undefined,
      // Expires can also be set (although maxAge overrides it when used in combination).
      // Note that this method is NOT recommended as `new Date` creates only one date on each server deployment, not a dynamic date in the future!
      //
      // expires: new Date(Date.now() + 60_000),
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
      secrets: ['s3cret1'],
      secure: false,
    },
  });

export const cliniciansSession = { getSession, commitSession, destroySession };
