import { afterEach, describe, expect, it, vi } from 'vitest';

// The salt is read at module load, so each case re-imports the module.
async function load(salt: string | undefined) {
  vi.resetModules();
  vi.stubEnv('HIGHWATER_SALT', salt);
  return (await import('./highwaterHash.server')).highwaterHash;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('highwaterHash', () => {
  it('hashes salt + user id with SHA-1 and keeps the first 10 hex chars', async () => {
    const highwaterHash = await load('salt');
    expect(highwaterHash('user1')).toBe('59f12da533');
  });

  it('returns null and warns once at load when the salt is unset', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const highwaterHash = await load(undefined);
    expect(highwaterHash('user1')).toBeNull();
    expect(highwaterHash('user2')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('produces different hashes for the same user under different salts', async () => {
    const a = (await load('salt-a'))('user1');
    const b = (await load('salt-b'))('user1');
    expect(a).not.toBe(b);
  });
});
