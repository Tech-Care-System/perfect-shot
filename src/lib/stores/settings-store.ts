import { atom } from 'jotai';

export const liteModeAtom = atom<boolean>(false);

export const deviceUnsupportedAtom = atom<boolean>(false);

export const deviceWarningDismissedAtom = atom<boolean>(false);
