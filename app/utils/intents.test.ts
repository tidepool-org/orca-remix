import { describe, it, expect } from 'vitest';
import {
  intents,
  isIntent,
  patientRouteIntents,
  userRouteIntents,
} from './intents';

describe('isIntent', () => {
  it('accepts an intent the route lists', () => {
    expect(isIntent(intents.clearDataSetData, userRouteIntents)).toBe(true);
  });

  it('rejects an intent another route owns', () => {
    expect(isIntent(intents.deleteAccount, patientRouteIntents)).toBe(false);
  });

  it('rejects a missing or non-string form value', () => {
    expect(isIntent(null, userRouteIntents)).toBe(false);
    expect(isIntent(new File([], 'intent'), userRouteIntents)).toBe(false);
  });
});
