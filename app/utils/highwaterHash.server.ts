import { createHash } from 'node:crypto';

const salt = process.env.HIGHWATER_SALT;

if (!salt) {
  console.warn(
    '[highwaterHash] HIGHWATER_SALT is not set; profiles will not show the highwater hash',
  );
}

/**
 * Mirrors highwater's hash_id: SHA-1 over salt + user id, hex, first 10
 * characters. Returns null when no salt is configured.
 */
export function highwaterHash(userId: string): string | null {
  if (!salt) return null;
  return createHash('sha1')
    .update(salt)
    .update(userId)
    .digest('hex')
    .slice(0, 10);
}
