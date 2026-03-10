/**
 * Timeline reminders: store which sittings the user wants to be reminded about.
 * Stored in localStorage (no account). Reminders surface as in-app banner when the user visits.
 */

const SITTING_REMINDERS_KEY = "agora_sitting_reminders";

/** Fired when reminders are added or removed (so the banner can refresh in the same tab). */
export const SITTING_REMINDERS_CHANGED = "agora_sitting_reminders_changed";

export interface SittingReminderEntry {
  id: string;
  date: string;
  time_range?: string;
  title: string;
}

function loadReminders(): SittingReminderEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SITTING_REMINDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is SittingReminderEntry =>
        e != null &&
        typeof e === "object" &&
        typeof (e as SittingReminderEntry).id === "string" &&
        typeof (e as SittingReminderEntry).date === "string" &&
        typeof (e as SittingReminderEntry).title === "string"
    );
  } catch {
    return [];
  }
}

function saveReminders(entries: SittingReminderEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SITTING_REMINDERS_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent(SITTING_REMINDERS_CHANGED));
  } catch {
    // ignore
  }
}

export function getSittingReminders(): SittingReminderEntry[] {
  return loadReminders();
}

export function addSittingReminder(sitting: SittingReminderEntry): void {
  const list = loadReminders();
  if (list.some((e) => e.id === sitting.id)) return;
  saveReminders([...list, sitting]);
}

export function removeSittingReminder(sittingId: string): void {
  saveReminders(loadReminders().filter((e) => e.id !== sittingId));
}

export function isSittingReminderSet(sittingId: string): boolean {
  return loadReminders().some((e) => e.id === sittingId);
}

/** Today in YYYY-MM-DD (client local). */
function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/** Tomorrow in YYYY-MM-DD (client local). */
function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

/**
 * Reminders for today or tomorrow, for showing the in-app banner.
 * Sorted by date then time.
 */
export function getUpcomingReminders(): SittingReminderEntry[] {
  const today = getToday();
  const tomorrow = getTomorrow();
  return loadReminders()
    .filter((e) => e.date === today || e.date === tomorrow)
    .sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      const ta = a.time_range ?? "";
      const tb = b.time_range ?? "";
      return ta.localeCompare(tb);
    });
}
