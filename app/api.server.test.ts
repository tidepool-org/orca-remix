import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APIError } from '~/utils/errors';

// auth.server reads SERVER_SECRET / SERVER_NAME / API_HOST at import time and
// throws when any is missing. api.server imports it at module scope, so the
// module is mocked rather than relying on ambient env vars.
const authorizeServer = vi.fn(async () => {});
const invalidateServerToken = vi.fn();

vi.mock('~/auth.server', () => ({
  serverAuth: {
    serverSecret: 'test-secret',
    serverName: 'orca-test',
    apiHost: 'https://api.test',
    serverSessionToken: 'test-token',
  },
  authorizeServer,
  invalidateServerToken,
}));

const { apiRequest } = await import('~/api.server');

/** Minimal stand-in for the parts of Response that apiRequest reads. */
const mockResponse = (
  status: number,
  { statusText = '', body = '' } = {},
): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: async () => body,
  }) as Response;

const originalFetch = globalThis.fetch;
let fetchMock: ReturnType<typeof vi.fn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

/** Every argument of every console.error call, flattened for substring checks. */
const loggedText = () => JSON.stringify(errorSpy.mock.calls);

beforeEach(() => {
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  errorSpy.mockRestore();
  authorizeServer.mockClear();
  invalidateServerToken.mockClear();
});

describe('apiRequest failure logging', () => {
  describe('When a record is emitted', () => {
    it('logs exactly one record for a failing mutating request', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(500, { statusText: 'Internal Server Error' }),
      );

      await expect(
        apiRequest({ method: 'delete', path: '/v1/datasets/abcdef0123456789' }),
      ).rejects.toThrow(APIError);

      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('includes the HTTP method and the numeric status', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(403, { statusText: 'Forbidden' }),
      );

      await expect(
        apiRequest({ method: 'delete', path: '/v1/datasets/abcdef0123456789' }),
      ).rejects.toThrow(APIError);

      const [message, meta] = errorSpy.mock.calls[0];
      expect(message).toContain('DELETE');
      expect(meta).toEqual({ code: 403 });
    });

    it('logs nothing for a failing GET', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(404, { statusText: 'Not Found' }),
      );

      await expect(
        apiRequest({ method: 'get', path: '/v1/datasets/abcdef0123456789' }),
      ).rejects.toThrow(APIError);

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('logs nothing when a 401 succeeds on the re-auth retry', async () => {
      fetchMock
        .mockResolvedValueOnce(
          mockResponse(401, { statusText: 'Unauthorized' }),
        )
        .mockResolvedValueOnce(mockResponse(200));

      await expect(
        apiRequest({ method: 'delete', path: '/v1/datasets/abcdef0123456789' }),
      ).resolves.toEqual({});

      expect(invalidateServerToken).toHaveBeenCalledTimes(1);
      expect(authorizeServer).toHaveBeenCalledTimes(1);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('logs one record when the request still fails after the re-auth retry', async () => {
      fetchMock
        .mockResolvedValueOnce(
          mockResponse(401, { statusText: 'Unauthorized' }),
        )
        .mockResolvedValueOnce(
          mockResponse(401, { statusText: 'Unauthorized' }),
        );

      await expect(
        apiRequest({ method: 'delete', path: '/v1/datasets/abcdef0123456789' }),
      ).rejects.toThrow(APIError);

      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Redaction', () => {
    it('replaces an email segment with a placeholder', async () => {
      fetchMock.mockResolvedValue(mockResponse(500, { statusText: 'Error' }));
      const email = 'patient@example.com';

      await expect(
        apiRequest({
          method: 'delete',
          path: `/auth/user/${encodeURIComponent(email)}`,
        }),
      ).rejects.toThrow(APIError);

      expect(loggedText()).toContain(':email');
      expect(loggedText()).not.toContain('patient');
      expect(loggedText()).not.toContain('example.com');
    });

    it('replaces a hex identifier segment with a placeholder', async () => {
      fetchMock.mockResolvedValue(mockResponse(500, { statusText: 'Error' }));
      const dataSetId = 'abcdef0123456789abcdef01';

      await expect(
        apiRequest({ method: 'delete', path: `/v1/datasets/${dataSetId}` }),
      ).rejects.toThrow(APIError);

      expect(loggedText()).toContain('/v1/datasets/:id');
      expect(loggedText()).not.toContain(dataSetId);
    });

    it('drops the query string', async () => {
      fetchMock.mockResolvedValue(mockResponse(500, { statusText: 'Error' }));

      await expect(
        apiRequest({
          method: 'delete',
          path: '/v1/datasets/abcdef0123456789?patientEmail=patient@example.com',
        }),
      ).rejects.toThrow(APIError);

      expect(loggedText()).not.toContain('patientEmail');
      expect(loggedText()).not.toContain('?');
    });

    it('omits the backend response body', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(500, {
          statusText: 'Internal Server Error',
          body: '{"code":"data-set-not-found","detail":"glucose upload for patient@example.com"}',
        }),
      );

      await expect(
        apiRequest({ method: 'delete', path: '/v1/datasets/abcdef0123456789' }),
      ).rejects.toThrow(APIError);

      expect(loggedText()).not.toContain('data-set-not-found');
      expect(loggedText()).not.toContain('glucose');
      expect(loggedText()).not.toContain('patient@example.com');
    });
  });

  describe('Error propagation', () => {
    it('still rejects with an APIError carrying the original status and message', async () => {
      fetchMock.mockResolvedValue(
        mockResponse(409, { statusText: 'Conflict', body: 'already deleted' }),
      );

      await expect(
        apiRequest({ method: 'delete', path: '/v1/datasets/abcdef0123456789' }),
      ).rejects.toMatchObject({
        name: 'APIError',
        status: 409,
        message: 'Conflict (409): already deleted',
      });
    });
  });
});
