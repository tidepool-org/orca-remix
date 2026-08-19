import { beforeEach, describe, expect, it, vi } from 'vitest';

// `api.server` reaches `auth.server`, which throws at import time without these.
process.env.SERVER_SECRET ||= 'test-secret';
process.env.SERVER_NAME ||= 'orca-test';
process.env.API_HOST ||= 'https://api.test';

const { apiRequestSafe } = vi.hoisted(() => ({ apiRequestSafe: vi.fn() }));

// Only the request helper is faked — the real `apiRoutes` still builds the path,
// so the page/size arithmetic is asserted on the wire rather than assumed. That
// arithmetic is the whole reason this module exists: it has shipped two defects.
vi.mock('~/api.server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/api.server')>()),
  apiRequestSafe,
}));

type Module = typeof import('~/utils/uploadsPaging.server');

/** Fresh module per test — the device-name cache lives at module scope. */
async function load(): Promise<Module> {
  vi.resetModules();
  return import('~/utils/uploadsPaging.server');
}

const ok = (rows: unknown[]) => ({ status: 'success' as const, data: rows });

/** The `page`/`size` pairs the two requests went out with, in call order. */
const requested = () =>
  apiRequestSafe.mock.calls.map(([request]) => {
    const { searchParams } = new URL(request.path, 'https://api.test');
    return `page=${searchParams.get('page')}&size=${searchParams.get('size')}`;
  });

beforeEach(() => {
  apiRequestSafe.mockReset();
});

describe('loadUploadsPage', () => {
  it('requests the page and probes the row that would open the next one', async () => {
    const { loadUploadsPage } = await load();
    const { uploadsPageSize } = await import('~/utils/uploadsPaging');
    apiRequestSafe.mockResolvedValue(ok([]));

    await loadUploadsPage('user-1', 3);

    // Page 3 starts at 2 * pageSize; the probe addresses 3 * pageSize, counted
    // in single rows. Widening `size` to carry the probe instead would shift the
    // page's own offset and drop one upload per boundary.
    expect(requested()).toEqual([
      `page=2&size=${uploadsPageSize}`,
      `page=${3 * uploadsPageSize}&size=1`,
    ]);
  });

  it('reports a further page when the probe returns a row', async () => {
    const { loadUploadsPage } = await load();
    apiRequestSafe
      .mockResolvedValueOnce(ok([{ uploadId: 'up-1' }]))
      .mockResolvedValueOnce(ok([{ uploadId: 'up-2' }]));

    const { hasMore } = await loadUploadsPage('user-1', 1);

    expect(hasMore).toBe(true);
  });

  it('reports no further page when the probe comes back empty', async () => {
    const { loadUploadsPage } = await load();
    apiRequestSafe
      .mockResolvedValueOnce(ok([{ uploadId: 'up-1' }]))
      .mockResolvedValueOnce(ok([]));

    const { hasMore } = await loadUploadsPage('user-1', 1);

    expect(hasMore).toBe(false);
  });

  it('treats a failed probe as no further page rather than failing the panel', async () => {
    const { loadUploadsPage } = await load();
    apiRequestSafe
      .mockResolvedValueOnce(ok([{ uploadId: 'up-1' }]))
      .mockResolvedValueOnce({
        status: 'error',
        error: { message: 'boom', code: 500 },
      });

    const { dataSetsState, hasMore } = await loadUploadsPage('user-1', 1);

    expect(hasMore).toBe(false);
    expect(dataSetsState.status).toBe('success');
  });

  it('passes a failed page fetch through as the error state', async () => {
    const { loadUploadsPage } = await load();
    apiRequestSafe
      .mockResolvedValueOnce({
        status: 'error',
        error: { message: 'nope', code: 503 },
      })
      .mockResolvedValueOnce(ok([]));

    const { dataSetsState } = await loadUploadsPage('user-1', 1);

    expect(dataSetsState).toEqual({
      status: 'error',
      error: { message: 'nope', code: 503 },
    });
  });

  it('accepts the enveloped response shape as well as a bare array', async () => {
    const { loadUploadsPage } = await load();
    apiRequestSafe
      .mockResolvedValueOnce(ok({ data: [{ uploadId: 'up-1' }] } as never))
      .mockResolvedValueOnce(ok({ data: [] } as never));

    const { dataSetsState, hasMore } = await loadUploadsPage('user-1', 1);

    expect(
      dataSetsState.status === 'success' && dataSetsState.data,
    ).toHaveLength(1);
    expect(hasMore).toBe(false);
  });

  it('enriches the page with resolved device names', async () => {
    const { loadUploadsPage } = await load();
    apiRequestSafe.mockImplementation(async (request) => {
      const { pathname, searchParams } = new URL(
        request.path,
        'https://api.test',
      );
      // The device-name probe goes to tide-whisperer, not the data-set endpoint.
      if (pathname.startsWith('/data/')) {
        return ok([{ deviceName: 'ReliOn Platinum' }]);
      }
      return searchParams.get('size') === '1'
        ? ok([])
        : ok([{ uploadId: 'up-1', deviceId: 'dev-a', deviceModel: '982' }]);
    });

    const { dataSetsState } = await loadUploadsPage('user-1', 1);

    expect(
      dataSetsState.status === 'success' && dataSetsState.data[0].deviceName,
    ).toBe('ReliOn Platinum');
  });
});
