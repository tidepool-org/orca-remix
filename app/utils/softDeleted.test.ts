import { describe, it, expect } from 'vitest';
import { excludeSoftDeleted } from './softDeleted';
import type { DataSet } from '~/components/User/types';

const upload = (overrides: Partial<DataSet>): DataSet => ({
  uploadId: 'u1',
  dataSetType: 'continuous',
  time: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('excludeSoftDeleted', () => {
  it('drops a record carrying deletedTime', () => {
    const kept = excludeSoftDeleted([
      upload({ uploadId: 'live' }),
      upload({ uploadId: 'gone', deletedTime: '2026-07-30T12:00:00Z' }),
    ]);

    expect(kept.map((u) => u.uploadId)).toEqual(['live']);
  });

  it('retains a record with no deletedTime', () => {
    const live = upload({ uploadId: 'live' });

    expect(excludeSoftDeleted([live])).toEqual([live]);
  });

  it('returns an empty list for an empty list', () => {
    expect(excludeSoftDeleted([])).toEqual([]);
  });

  it('preserves the input order of retained records', () => {
    const kept = excludeSoftDeleted([
      upload({ uploadId: 'a' }),
      upload({ uploadId: 'b', deletedTime: '2026-07-30T12:00:00Z' }),
      upload({ uploadId: 'c' }),
      upload({ uploadId: 'd' }),
    ]);

    expect(kept.map((u) => u.uploadId)).toEqual(['a', 'c', 'd']);
  });
});
