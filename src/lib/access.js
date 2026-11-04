// Free vs paid: who is covered by which subscription.
// Plans end automatically at their end date, online or offline. The device clock is checked against the
// latest time Brilla has seen, so turning the clock back can't stretch a plan.
import { useEffect, useState } from 'react';
import { useDB } from '../data/store';
import { UNIT_SIZE } from '../curriculum';

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

// ---- Weekly units: one unit of lessons opens for every week a family has paid for ----
export const WEEK = 7 * 86400000;
const PAID = (s) => s.status !== 'failed' && s.status !== 'refunded';

/** Paid time so far in ms: all paid periods merged (overlaps counted once), up to now. */
export function paidTime(userId, subs = useDB.getState().subscriptions, now = trustedNow()) {
  const spans = subs
    .filter((s) => s.userId === userId && PAID(s))
    .map((s) => [new Date(s.startedAt).getTime(), Math.min(new Date(s.expiresAt).getTime(), now)])
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let cur = null;
  for (const [a, b] of spans) {
    if (cur && a <= cur[1]) cur[1] = Math.max(cur[1], b);
    else {
      if (cur) total += cur[1] - cur[0];
      cur = [a, b];
    }
  }
  if (cur) total += cur[1] - cur[0];
  return total;
}

/** Paid weeks started so far: Week 1 opens the moment the first payment goes through, Week 2 a week later… */
export const paidWeeks = (userId, subs, now) => {
  const t = paidTime(userId, subs, now);
  return t > 0 ? Math.floor((t - 1) / WEEK) + 1 : 0;
};
export const unitsUnlocked = (userId, subs = useDB.getState().subscriptions) => paidWeeks(userId, subs);

/** When the next unit opens, or null if the plan ends before then. */
export function nextUnitAt(userId, subs = useDB.getState().subscriptions) {
  const sub = activeSub(userId, subs);
  if (!sub) return null;
  const now = trustedNow();
  const t = paidTime(userId, subs, now);
  const at = now + (WEEK - (t % WEEK));
  return at < new Date(sub.expiresAt).getTime() ? new Date(at).toISOString() : null;
}

export const unitOf = (lesson, unitSize) => Math.floor(lesson.order / unitSize);

/**
 * Can this child open this lesson right now?
 * Never paid: the free taster lessons. Plan ended: nothing. Plan active: open units (and custom lessons),
 * for the first `maxKids` profiles.
 */
export function canOpenLesson(child, lesson, state, unitSize) {
  if (!child || !lesson) return false;
  const subs = state.subscriptions;
  if (planExpired(child.ownerId, subs)) return false;
  if (!latestSub(child.ownerId, subs)) return !!lesson.free;
  if (!childUnlocked(child, state)) return !!lesson.free;
  if (lesson.custom) return true;
  return unitOf(lesson, unitSize) < unitsUnlocked(child.ownerId, subs);
}

/** Re-renders every `ms` so time-based checks (like a plan ending) update on screen. */
export function useTick(ms = 30000) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

/** Reactive access info for a child: plan, units open, and `canOpen(lesson)`. */
export function useChildAccess(child) {
  useTick();
  const subs = useDB((s) => s.subscriptions);
  const children = useDB((s) => s.children);
  const settings = useDB((s) => s.settings);
  if (!child) return { sub: null, unlocked: false, expired: false, paid: false, units: 0, nextUnit: null, canOpen: () => false };
  const state = { subscriptions: subs, children, settings };
  return {
    sub: activeSub(child.ownerId, subs),
    unlocked: childUnlocked(child, state),
    expired: planExpired(child.ownerId, subs),
    paid: !!latestSub(child.ownerId, subs),
    units: unitsUnlocked(child.ownerId, subs),
    nextUnit: nextUnitAt(child.ownerId, subs),
    canOpen: (lesson) => canOpenLesson(child, lesson, state, UNIT_SIZE),
  };
}

/** Days left on a plan (0 when ending today). */
export const daysLeft = (sub) => (sub ? Math.max(0, Math.ceil((new Date(sub.expiresAt).getTime() - trustedNow()) / 86400000)) : 0);
