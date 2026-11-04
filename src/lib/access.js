// Free vs paid: who is covered by which subscription.
// Plans end automatically at their end date, online or offline. The device clock is checked against the
// latest time Brilla has seen, so turning the clock back can't stretch a plan.
import { useEffect, useState } from 'react';
import { useDB } from '../data/store';

const LAST_SEEN = 'brilla-last-seen';
const SLACK = 10 * 60 * 1000; // small clock corrections are fine

let lastSeen = 0;
try {
  lastSeen = Number(localStorage.getItem(LAST_SEEN)) || 0;
} catch {
  /* private mode */
}

/** Current time that can't go backwards: max(device clock, latest time seen). */
export function trustedNow() {
  const now = Date.now();
  if (now > lastSeen) {
    lastSeen = now;
    try {
      localStorage.setItem(LAST_SEEN, String(now));
    } catch {
      /* ignore */
    }
  }
  return now < lastSeen - SLACK ? lastSeen : now;
}
export const clockWasTurnedBack = () => Date.now() < lastSeen - SLACK;

export const isActive = (sub) => !!sub && sub.status === 'active' && new Date(sub.expiresAt).getTime() > trustedNow();

/** The newest active subscription for a user (parent or teacher), or null. */
export function activeSub(userId, subs = useDB.getState().subscriptions) {
  return subs.filter((s) => s.userId === userId && isActive(s)).sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt))[0] || null;
}

/** The most recent plan the user ever had (active or not). */
export const latestSub = (userId, subs = useDB.getState().subscriptions) => subs.filter((s) => s.userId === userId).sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt))[0] || null;

/** True when the user has paid before but no plan is running now: the whole app is locked until they renew. */
export const planExpired = (userId, subs = useDB.getState().subscriptions) => !!latestSub(userId, subs) && !activeSub(userId, subs);

/** How many child profiles / pupils the user's current subscription covers. */
export function seatsCovered(userId, state = useDB.getState()) {
  const sub = activeSub(userId, state.subscriptions);
  if (!sub) return 0;
  const plan = state.settings.plans[sub.plan];
  return plan?.perSeat ? sub.seats : plan?.maxKids || 1;
}

/** Whether a child's paid lessons are unlocked: they must be within the owner's covered seats (oldest profiles first). */
export function childUnlocked(child, state = useDB.getState()) {
  if (!child) return false;
  const seats = seatsCovered(child.ownerId, state);
  if (!seats) return false;
  const siblings = state.children.filter((c) => c.ownerId === child.ownerId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return siblings.findIndex((c) => c.id === child.id) < seats;
}

export const canOpenLesson = (child, lesson, state) => (lesson.free && !planExpired(child.ownerId, state.subscriptions)) || childUnlocked(child, state);

/** Re-renders every `ms` so time-based checks (like a plan ending) update on screen. */
export function useTick(ms = 30000) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

/** Reactive: { sub, unlocked, expired } for a child. */
export function useChildAccess(child) {
  useTick();
  const subs = useDB((s) => s.subscriptions);
  const children = useDB((s) => s.children);
  const settings = useDB((s) => s.settings);
  if (!child) return { sub: null, unlocked: false, expired: false };
  const state = { subscriptions: subs, children, settings };
  return { sub: activeSub(child.ownerId, subs), unlocked: childUnlocked(child, state), expired: planExpired(child.ownerId, subs) };
}

/** Days left on a plan (0 when ending today). */
export const daysLeft = (sub) => (sub ? Math.max(0, Math.ceil((new Date(sub.expiresAt).getTime() - trustedNow()) / 86400000)) : 0);
