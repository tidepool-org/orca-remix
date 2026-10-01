import { describe, it, expect } from 'vitest';
import { knownUploadCount, parseUploadsPage } from './uploadsPaging';

describe('knownUploadCount', () => {
  it('counts a full first page', () => {
    expect(knownUploadCount(1, 100, 100)).toBe(100);
  });

  it('counts a partial first page exactly', () => {
    expect(knownUploadCount(1, 100, 4)).toBe(4);
  });

  it('adds the full pages behind a later page', () => {
    expect(knownUploadCount(3, 100, 100)).toBe(300);
    expect(knownUploadCount(3, 100, 7)).toBe(207);
  });

  // The bug this function exists to pin: a blind jump past the end returns no
  // rows, and multiplying the page number would have claimed 200 uploads on an
  // account with none.
  it('claims nothing for an empty page past the end', () => {
    expect(knownUploadCount(3, 100, 0)).toBe(0);
    expect(knownUploadCount(500, 100, 0)).toBe(0);
  });

  it('claims nothing for an empty first page', () => {
    expect(knownUploadCount(1, 100, 0)).toBe(0);
  });
});

describe('parseUploadsPage', () => {
  const params = (search: string) => new URLSearchParams(search);

  it('defaults to page 1 when the param is absent', () => {
    expect(parseUploadsPage(params(''))).toBe(1);
  });

  it('reads the requested page', () => {
    expect(parseUploadsPage(params('uploadsPage=4'))).toBe(4);
  });

  it('clamps below page 1', () => {
    expect(parseUploadsPage(params('uploadsPage=0'))).toBe(1);
    expect(parseUploadsPage(params('uploadsPage=-5'))).toBe(1);
  });

  // Without this, `NaN` propagates into the page arithmetic and reaches the API
  // as `page=NaN`.
  it('falls back to page 1 for a non-numeric value', () => {
    expect(parseUploadsPage(params('uploadsPage=abc'))).toBe(1);
    expect(parseUploadsPage(params('uploadsPage='))).toBe(1);
  });
});
