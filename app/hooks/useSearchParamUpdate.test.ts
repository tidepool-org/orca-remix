import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSearchParamUpdate } from './useSearchParamUpdate';

const mockSubmit = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams, vi.fn()],
    useSubmit: () => mockSubmit,
  };
});

/** The params the hook submitted, as a plain object. */
function submittedParams(): Record<string, string> {
  const [params] = mockSubmit.mock.calls.at(-1) ?? [];
  return Object.fromEntries(params as URLSearchParams);
}

describe('useSearchParamUpdate', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
    mockSubmit.mockClear();
  });

  it('preserves params it was not asked to change', () => {
    mockSearchParams = new URLSearchParams('tab=patients&sort=name');

    const { result } = renderHook(() => useSearchParamUpdate());
    result.current({ patientsPage: 3 });

    expect(submittedParams()).toEqual({
      tab: 'patients',
      sort: 'name',
      patientsPage: '3',
    });
  });

  it('writes several keys in one submit, so a filter can reset paging', () => {
    mockSearchParams = new URLSearchParams('patientsPage=4');

    const { result } = renderHook(() => useSearchParamUpdate());
    result.current({ patientsSearch: 'ada', patientsPage: 1 });

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(submittedParams()).toEqual({
      patientsSearch: 'ada',
      patientsPage: '1',
    });
  });

  it.each([
    ['an empty string', ''],
    ['null', null],
    ['undefined', undefined],
  ])('drops the key when the value is %s', (_label, value) => {
    mockSearchParams = new URLSearchParams('patientsSearch=ada&tab=patients');

    const { result } = renderHook(() => useSearchParamUpdate());
    result.current({ patientsSearch: value });

    expect(submittedParams()).toEqual({ tab: 'patients' });
  });

  it('submits a GET that replaces history, so paging leaves no back-button trail', () => {
    const { result } = renderHook(() => useSearchParamUpdate());
    result.current({ patientsPage: 2 });

    expect(mockSubmit).toHaveBeenCalledWith(expect.any(URLSearchParams), {
      method: 'GET',
      replace: true,
    });
  });
});
