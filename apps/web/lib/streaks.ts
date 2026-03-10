/**
 * Lightweight engagement streaks (localStorage only, no account).
 * Tracks "days checking votes" and "scrutins read this week" for habit formation.
 */

import { getTodayDate, getWeekStart, getWeekEnd, subtractDays } from "@agora/shared";

const STORAGE_KEY_VISITS = "agora_streak_visits";
const STORAGE_KEY_SCRUTINS = "agora_streak_scrutins";
const MAX_VISIT_DAYS = 400;
const MAX_SCRUTIN_ENTRIES = 500;

function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

/** Record that the user visited the votes section (list or a scrutin) today. */
export function recordVotePageVisit(): void {
  const today = getTodayDate();
  const raw = safeGetItem(STORAGE_KEY_VISITS);
  const dates: string[] = raw ? (JSON.parse(raw) as string[]) : [];
  if (dates.includes(today)) return;
  const next = [...dates, today]
    .sort()
    .slice(-MAX_VISIT_DAYS);
  safeSetItem(STORAGE_KEY_VISITS, JSON.stringify(next));
}

/** Record that the user viewed a scrutin detail today. */
export function recordScrutinView(scrutinId: string): void {
  recordVotePageVisit();
  const today = getTodayDate();
  const raw = safeGetItem(STORAGE_KEY_SCRUTINS);
  const entries: { d: string; id: string }[] = raw ? (JSON.parse(raw) as { d: string; id: string }[]) : [];
  const next = [...entries, { d: today, id: scrutinId }].slice(-MAX_SCRUTIN_ENTRIES);
  safeSetItem(STORAGE_KEY_SCRUTINS, JSON.stringify(next));
}

/** Consecutive days (including today or yesterday) with at least one vote-page visit. */
export function getStreakDays(): number {
  const raw = safeGetItem(STORAGE_KEY_VISITS);
  const dates: string[] = raw ? (JSON.parse(raw) as string[]) : [];
  const unique = [...new Set(dates)].sort();
  if (unique.length === 0) return 0;
  const today = getTodayDate();
  const yesterday = subtractDays(today, 1);
  const last = unique[unique.length - 1]!;
  // Streak must end on today or yesterday (otherwise user "broke" the streak)
  if (last !== today && last !== yesterday) return 0;
  let count = 1;
  let prev = last;
  for (let i = unique.length - 2; i >= 0; i--) {
    const d = unique[i]!;
    const prevDate = new Date(prev);
    const currDate = new Date(d);
    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
    if (diffDays !== 1) break;
    prev = d;
    count++;
  }
  return count;
}

/** Number of scrutins viewed this week (Monday–Sunday). */
export function getScrutinsReadThisWeek(): number {
  const raw = safeGetItem(STORAGE_KEY_SCRUTINS);
  const entries: { d: string; id: string }[] = raw ? (JSON.parse(raw) as { d: string; id: string }[]) : [];
  const today = getTodayDate();
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(today);
  return entries.filter((e) => e.d >= weekStart && e.d <= weekEnd).length;
}

export interface StreakSnapshot {
  streakDays: number;
  scrutinsThisWeek: number;
}

/** Get current streak stats (for UI). */
export function getStreakSnapshot(): StreakSnapshot {
  return {
    streakDays: getStreakDays(),
    scrutinsThisWeek: getScrutinsReadThisWeek()
  };
}
