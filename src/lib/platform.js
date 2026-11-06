// Which build this is:
//   website        → demo accounts, marketing pages, admin on the web
//   app (Android)  → families: clean start, Create account / Log in, no admin
//   admin (Android)→ "Brilla Admin": admin screens only (prices, lessons, Twi & Ga, Voice studio)
import { Capacitor } from '@capacitor/core';

const TARGET = import.meta.env.VITE_TARGET;
export const IS_ADMIN_APP = TARGET === 'admin';
/** Either Android app: no demo data, no marketing pages. */
export const IS_APP = TARGET === 'app' || IS_ADMIN_APP;
export const IS_NATIVE = Capacitor.isNativePlatform();
