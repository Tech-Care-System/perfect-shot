import { createStore } from 'jotai';
import { liteModeAtom, deviceUnsupportedAtom, deviceWarningDismissedAtom } from './settings-store';

describe('settings-store', () => {
  it('liteModeAtom defaults to false', () => {
    const store = createStore();
    expect(store.get(liteModeAtom)).toBe(false);
  });

  it('deviceUnsupportedAtom defaults to false', () => {
    const store = createStore();
    expect(store.get(deviceUnsupportedAtom)).toBe(false);
  });

  it('deviceWarningDismissedAtom defaults to false', () => {
    const store = createStore();
    expect(store.get(deviceWarningDismissedAtom)).toBe(false);
  });
});
