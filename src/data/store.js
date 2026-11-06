// Local-first store (Zustand + localStorage). Phase 2 swaps these actions for Supabase calls.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { buildSeed, DEFAULT_SETTINGS } from './seed';
import { IS_ADMIN_APP, IS_APP } from '../lib/platform';

const seed = () => buildSeed({ demo: !IS_APP });
import { uid, nowISO, todayKey } from '../lib/format';

const safeStorage = createJSONStorage(() => ({
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      window.dispatchEvent(new Event('brilla-storage-full'));
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
}));

export const useDB = create(
  persist(
    (set) => ({
      ...seed(),
      session: { userId: null, childId: null, studentId: null, parentUnlockedAt: 0 },
      prefs: { sound: true, voice: true, music: true, musicVolume: 0.5 },

      // ---- generic collection helpers ----
      add: (col, item) => {
        const rec = { id: uid(col.slice(0, 3)), createdAt: nowISO(), ...item };
        set((s) => ({ [col]: [...s[col], rec] }));
        return rec;
      },
      update: (col, id, patch) => set((s) => ({ [col]: s[col].map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      remove: (col, id) => set((s) => ({ [col]: s[col].filter((x) => x.id !== id) })),

      // ---- session ----
      login: (userId) => set({ session: { userId, childId: null, studentId: null, parentUnlockedAt: 0 } }),
      loginStudent: (studentId) => set({ session: { userId: null, childId: studentId, studentId, parentUnlockedAt: 0 } }),
      logout: () => set({ session: { userId: null, childId: null, studentId: null, parentUnlockedAt: 0 } }),
      selectChild: (childId) => set((s) => ({ session: { ...s.session, childId } })),
      unlockParent: () => set((s) => ({ session: { ...s.session, parentUnlockedAt: Date.now() } })),
      setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),

      // ---- learning ----
      recordLesson: (childId, lessonId, stars) =>
        set((s) => {
          const prev = s.progress[childId]?.[lessonId];
          const rec = { stars: Math.max(stars, prev?.stars || 0), attempts: (prev?.attempts || 0) + 1, lastAt: nowISO() };
          const day = todayKey();
          const u = s.usage[childId]?.[day] || { secs: 0, lessons: 0 };
          return {
            progress: { ...s.progress, [childId]: { ...s.progress[childId], [lessonId]: rec } },
            usage: { ...s.usage, [childId]: { ...s.usage[childId], [day]: { ...u, lessons: u.lessons + 1 } } },
          };
        }),
      addTime: (childId, secs) =>
        set((s) => {
          const day = todayKey();
          const u = s.usage[childId]?.[day] || { secs: 0, lessons: 0 };
          return { usage: { ...s.usage, [childId]: { ...s.usage[childId], [day]: { ...u, secs: u.secs + secs } } } };
        }),
      addSticker: (childId, sticker) => set((s) => ({ stickers: { ...s.stickers, [childId]: [...(s.stickers[childId] || []), sticker] } })),
      saveDrawing: (childId, drawing) =>
        set((s) => ({ gallery: { ...s.gallery, [childId]: [{ id: uid('art'), at: nowISO(), ...drawing }, ...(s.gallery[childId] || [])].slice(0, 12) } })),
      removeDrawing: (childId, id) => set((s) => ({ gallery: { ...s.gallery, [childId]: (s.gallery[childId] || []).filter((d) => d.id !== id) } })),

      // ---- admin ----
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setLessonOverride: (lessonId, patch) =>
        set((s) => ({ settings: { ...s.settings, lessonOverrides: { ...s.settings.lessonOverrides, [lessonId]: { ...s.settings.lessonOverrides[lessonId], ...patch } } } })),
      resetDemo: () => set({ ...seed(), session: { userId: null, childId: null, studentId: null, parentUnlockedAt: 0 } }),
    }),
    {
      name: IS_ADMIN_APP ? 'brilla-admin' : IS_APP ? 'brilla-app' : 'brilla-db',
      version: 5,
      // v2: add demo records introduced later (e.g. the expired-plan family) without touching the user's own data.
      migrate: (state, version) => {
        const start = seed();
        const addMissing = (col) => [...(state[col] || []), ...start[col].filter((x) => !(state[col] || []).some((y) => y.id === x.id))];
        let next = { ...state, users: addMissing('users'), children: addMissing('children'), subscriptions: addMissing('subscriptions'), payments: addMissing('payments') };
        // v3: one Family plan (GH₵25/week), 10 free lessons, school accounts off; old Single plans become Family.
        if (version < 3) {
          const toFamily = (x) => (x.plan === 'single' ? { ...x, plan: 'family' } : x);
          next = {
            ...next,
            users: next.users.map(toFamily),
            subscriptions: next.subscriptions.map(toFamily),
            payments: next.payments.map(toFamily),
            settings: { ...(next.settings || {}), plans: DEFAULT_SETTINGS.plans, freeLessons: DEFAULT_SETTINGS.freeLessons, schoolsEnabled: false },
          };
        }
        // v5: refresh the plan's feature list to match the unit size (prices stay as Admin set them).
        if (version < 5 && next.settings?.plans?.family) {
          next = { ...next, settings: { ...next.settings, plans: { ...next.settings.plans, family: { ...next.settings.plans.family, features: DEFAULT_SETTINGS.plans.family.features } } } };
        }
        return next;
      },
      storage: safeStorage,
      merge: (persisted, current) => ({ ...current, ...persisted, prefs: { ...current.prefs, ...(persisted?.prefs || {}) }, settings: { ...DEFAULT_SETTINGS, ...(persisted?.settings || {}) } }),
    },
  ),
);

export const db = () => useDB.getState();
