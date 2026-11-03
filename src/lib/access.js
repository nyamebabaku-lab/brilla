// Free vs paid: who is covered by which subscription.
import { useDB } from '../data/store';

export const isActive = (sub) => !!sub && sub.status === 'active' && new Date(sub.expiresAt) > new Date();

/** The newest active subscription for a user (parent or teacher), or null. */
export function activeSub(userId, subs = useDB.getState().subscriptions) {
  return subs.filter((s) => s.userId === userId && isActive(s)).sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt))[0] || null;
}

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

export const canOpenLesson = (child, lesson, state) => lesson.free || childUnlocked(child, state);

/** Reactive hook: { sub, unlocked } for a child. */
export function useChildAccess(child) {
  const subs = useDB((s) => s.subscriptions);
  const children = useDB((s) => s.children);
  const settings = useDB((s) => s.settings);
  if (!child) return { sub: null, unlocked: false };
  const state = { subscriptions: subs, children, settings };
  return { sub: activeSub(child.ownerId, subs), unlocked: childUnlocked(child, state) };
}
