// Which build this is: the website (with demo accounts) or the Android app (clean start, no demo data).
import { Capacitor } from '@capacitor/core';

export const IS_APP = import.meta.env.VITE_TARGET === 'app';
export const IS_NATIVE = Capacitor.isNativePlatform();
