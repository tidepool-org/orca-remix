import { beforeEach, describe, expect, it, vi } from 'vitest';

// `api.server` reaches `auth.server`, which throws at import time without these.
process.env.SERVER_SECRET ||= 'test-secret';
process.env.SERVER_NAME ||= 'orca-test';
process.env.API_HOST ||= 'https://api.test';

const { apiRequestSafe } = vi.hoisted(() => ({ apiRequestSafe: vi.fn() }));

// Only the request helper is faked — the real `apiRoutes` still builds the path,
// so the probe's wire shape is asserted rather than assumed.
vi.mock('~/api.server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/api.server')>()),
  apiRequestSafe,
}));

type Resolver = typeof import('~/utils/deviceNames.server');

/** Fresh module per test — the model→name cache lives at module scope. */
async function loadResolver(): Promise<Resolver> {
  vi.resetModules();
  return import('~/utils/deviceNames.server');
}

/** A row as the platform endpoint hands it over: no `deviceName` yet. */
type Row = {
  uploadId: string;
  deviceModel?: string;
  deviceId?: string;
  deviceName?: string;
};

const upload = (deviceModel: string, deviceId: string): Row => ({
  uploadId: `upload-${deviceId}`,
  deviceModel,
  deviceId,
});

/** A successful probe whose latest upload carries `deviceName`. */
const named = (deviceName: string | undefined) => ({
  status: 'success' as const,
  data: [{ deviceName }],
});

/** The probed device ids, in call order. */
const probedDeviceIds = () =>
  apiRequestSafe.mock.calls.map(([request]) =>
    new URL(request.path, 'https://api.test').searchParams.get('deviceId'),
  );

beforeEach(() => {
  apiRequestSafe.mockReset();
});

describe('resolveDeviceNames', () => {
  it('probes once for a single-model page and enriches every row', async () => {
    const { resolveDeviceNames } = await loadResolver();
    apiRequestSafe.mockResolvedValue(named('ReliOn Platinum'));

    const resolved = await resolveDeviceNames('user-1', [
      upload('Platinum', 'dev-a'),
      upload('Platinum', 'dev-b'),
      upload('Platinum', 'dev-c'),
    ]);

    expect(apiRequestSafe).toHaveBeenCalledTimes(1);
    expect(resolved.map((row) => row.deviceName)).toEqual([
      'ReliOn Platinum',
      'ReliOn Platinum',
      'ReliOn Platinum',
    ]);
  });

  it('issues no probe for an already-resolved model', async () => {
    const { resolveDeviceNames } = await loadResolver();
    apiRequestSafe.mockResolvedValue(named('ReliOn Platinum'));

    await resolveDeviceNames('user-1', [upload('Platinum', 'dev-a')]);
    apiRequestSafe.mockClear();

    const resolved = await resolveDeviceNames('user-2', [
      upload('Platinum', 'dev-z'),
    ]);

    expect(apiRequestSafe).not.toHaveBeenCalled();
    expect(resolved[0].deviceName).toBe('ReliOn Platinum');
  });

  it('probes a model tide-whisperer cannot name once and never again', async () => {
    const { resolveDeviceNames } = await loadResolver();
    apiRequestSafe.mockResolvedValue(named('Unknown'));

    const first = await resolveDeviceNames('user-1', [
      upload('Mystery', 'dev-a'),
    ]);
    const second = await resolveDeviceNames('user-1', [
      upload('Mystery', 'dev-a'),
    ]);

    expect(apiRequestSafe).toHaveBeenCalledTimes(1);
    expect(first[0].deviceName).toBeUndefined();
    expect(second[0].deviceName).toBeUndefined();
  });

  it('passes rows without a deviceId through untouched and unprobed', async () => {
    const { resolveDeviceNames } = await loadResolver();

    const row: Row = { uploadId: 'upload-1', deviceModel: 'Platinum' };
    const resolved = await resolveDeviceNames('user-1', [row]);

    expect(apiRequestSafe).not.toHaveBeenCalled();
    expect(resolved[0]).toBe(row);
  });

  it('degrades only the failed model when a probe errors', async () => {
    const { resolveDeviceNames } = await loadResolver();
    apiRequestSafe.mockImplementation(async (request) => {
      const { searchParams } = new URL(request.path, 'https://api.test');
      return searchParams.get('deviceId') === 'dev-bad'
        ? { status: 'error', error: { message: 'boom', code: 500 } }
        : named('ReliOn Platinum');
    });

    const resolved = await resolveDeviceNames('user-1', [
      upload('Platinum', 'dev-a'),
      upload('Broken', 'dev-bad'),
    ]);

    expect(resolved[0].deviceName).toBe('ReliOn Platinum');
    expect(resolved[1].deviceName).toBeUndefined();
  });

  it('retries a model whose probe failed rather than caching the failure', async () => {
    const { resolveDeviceNames } = await loadResolver();
    apiRequestSafe.mockResolvedValueOnce({
      status: 'error',
      error: { message: 'boom', code: 500 },
    });
    apiRequestSafe.mockResolvedValue(named('ReliOn Platinum'));

    await resolveDeviceNames('user-1', [upload('Platinum', 'dev-a')]);
    const retried = await resolveDeviceNames('user-1', [
      upload('Platinum', 'dev-a'),
    ]);

    expect(apiRequestSafe).toHaveBeenCalledTimes(2);
    expect(retried[0].deviceName).toBe('ReliOn Platinum');
  });

  it('caps the probes one page can issue', async () => {
    const { resolveDeviceNames, maxProbesPerPage } = await loadResolver();
    apiRequestSafe.mockResolvedValue(named('Some Device'));

    const page = Array.from({ length: maxProbesPerPage + 5 }, (_, i) =>
      upload(`Model-${i}`, `dev-${i}`),
    );
    const resolved = await resolveDeviceNames('user-1', page);

    expect(apiRequestSafe).toHaveBeenCalledTimes(maxProbesPerPage);
    expect(resolved.filter((row) => row.deviceName === undefined)).toHaveLength(
      5,
    );
  });

  it('probes tide-whisperer for the latest upload from that device', async () => {
    const { resolveDeviceNames } = await loadResolver();
    apiRequestSafe.mockResolvedValue(named('ReliOn Platinum'));

    await resolveDeviceNames('user-1', [upload('Platinum', 'dev-a')]);

    const [request] = apiRequestSafe.mock.calls[0];
    const url = new URL(request.path, 'https://api.test');
    expect(request.method).toBe('get');
    expect(url.pathname).toBe('/data/user-1');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      type: 'upload',
      latest: 'true',
      deviceId: 'dev-a',
    });
  });

  it('probes one device per model rather than one per device', async () => {
    const { resolveDeviceNames } = await loadResolver();
    apiRequestSafe.mockResolvedValue(named('Some Device'));

    await resolveDeviceNames('user-1', [
      upload('Platinum', 'dev-a'),
      upload('Platinum', 'dev-b'),
      upload('Libre', 'dev-c'),
    ]);

    expect(probedDeviceIds()).toEqual(['dev-a', 'dev-c']);
  });
});

describe('fetchBackfillUploads', () => {
  /** A pump-settings record missing the device fields the backfill fills in. */
  const incomplete = (uploadId: string) => ({ uploadId });
  const complete = (uploadId: string) => ({
    uploadId,
    manufacturers: ['Roche'],
    model: '982',
    serialNumber: 'SN-1',
  });

  const uploadFor = (uploadId: string) => ({
    status: 'success' as const,
    data: [{ uploadId, deviceName: 'ReliOn Platinum' }],
  });

  it('fetches one upload per distinct incomplete record', async () => {
    const { fetchBackfillUploads } = await loadResolver();
    apiRequestSafe.mockImplementation(async (request) => {
      const uploadId = new URL(
        request.path,
        'https://api.test',
      ).searchParams.get('uploadId');
      return uploadFor(uploadId as string);
    });

    const uploads = await fetchBackfillUploads('user-1', [
      incomplete('up-a'),
      incomplete('up-b'),
      incomplete('up-a'),
    ]);

    expect(apiRequestSafe).toHaveBeenCalledTimes(2);
    expect(uploads.map((u) => u.uploadId)).toEqual(['up-a', 'up-b']);
  });

  it('fetches nothing for records that already carry device info', async () => {
    const { fetchBackfillUploads } = await loadResolver();

    const uploads = await fetchBackfillUploads('user-1', [
      complete('up-a'),
      complete('up-b'),
    ]);

    expect(apiRequestSafe).not.toHaveBeenCalled();
    expect(uploads).toEqual([]);
  });

  it('ignores records with no uploadId to fetch by', async () => {
    const { fetchBackfillUploads } = await loadResolver();

    await fetchBackfillUploads('user-1', [{}, { model: 'x' }]);

    expect(apiRequestSafe).not.toHaveBeenCalled();
  });

  it('caps how many uploads a single page load will fetch', async () => {
    const { fetchBackfillUploads, maxBackfillFetches } = await loadResolver();
    apiRequestSafe.mockResolvedValue({ status: 'success', data: [] });

    const many = Array.from({ length: maxBackfillFetches + 250 }, (_, i) =>
      incomplete(`up-${i}`),
    );
    await fetchBackfillUploads('user-1', many);

    expect(apiRequestSafe).toHaveBeenCalledTimes(maxBackfillFetches);
  });

  it('never has more than a batch in flight at once', async () => {
    const { fetchBackfillUploads, backfillBatchSize, maxBackfillFetches } =
      await loadResolver();

    let inFlight = 0;
    let peak = 0;
    apiRequestSafe.mockImplementation(async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      inFlight--;
      return { status: 'success', data: [] };
    });

    const many = Array.from({ length: maxBackfillFetches }, (_, i) =>
      incomplete(`up-${i}`),
    );
    await fetchBackfillUploads('user-1', many);

    expect(peak).toBeLessThanOrEqual(backfillBatchSize);
  });

  it('drops a failed fetch without losing the rest of the batch', async () => {
    const { fetchBackfillUploads } = await loadResolver();
    apiRequestSafe.mockImplementation(async (request) => {
      const uploadId = new URL(
        request.path,
        'https://api.test',
      ).searchParams.get('uploadId');
      return uploadId === 'up-bad'
        ? { status: 'error', error: { message: 'boom', code: 500 } }
        : uploadFor(uploadId as string);
    });

    const uploads = await fetchBackfillUploads('user-1', [
      incomplete('up-a'),
      incomplete('up-bad'),
      incomplete('up-b'),
    ]);

    expect(uploads.map((u) => u.uploadId)).toEqual(['up-a', 'up-b']);
  });
});
