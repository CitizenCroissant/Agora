"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getUpcomingReminders,
  removeSittingReminder,
  SITTING_REMINDERS_CHANGED,
  type SittingReminderEntry
} from "@/lib/sitting-reminders";
import styles from "./SittingReminderBanner.module.css";

function getRelativeDay(dateStr: string): "today" | "tomorrow" {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today ? "today" : "tomorrow";
}

function ReminderLine({
  reminder,
  onDismiss
}: {
  reminder: SittingReminderEntry;
  onDismiss: (id: string) => void;
}) {
  const day = getRelativeDay(reminder.date);
  const dayLabel = day === "today" ? "Aujourd'hui" : "Demain";
  const time = reminder.time_range ? ` à ${reminder.time_range}` : "";
  const title =
    reminder.title.length > 60 ? reminder.title.slice(0, 60).trim() + "…" : reminder.title;

  return (
    <div className={styles.line}>
      <span className={styles.text}>
        <strong>Rappel :</strong> Séance {dayLabel.toLowerCase()}
        {time} — {title}
      </span>
      <div className={styles.actions}>
        <Link href={`/sitting/${reminder.id}`} className={styles.link}>
          Voir la séance
        </Link>
        <button
          type="button"
          className={styles.dismiss}
          onClick={() => onDismiss(reminder.id)}
          aria-label="Ne plus rappeler cette séance"
        >
          Ne plus rappeler
        </button>
      </div>
    </div>
  );
}

/**
 * Shows upcoming sitting reminders (today/tomorrow) when the user visits the app.
 * Renders above main content so they see "Sitting today at 15h: [title]" and can open the sitting.
 */
export function SittingReminderBanner() {
  const [reminders, setReminders] = useState<SittingReminderEntry[]>([]);

  const refresh = useCallback(() => {
    setReminders(getUpcomingReminders());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (): void => refresh();
    const onChanged = (): void => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener(SITTING_REMINDERS_CHANGED, onChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SITTING_REMINDERS_CHANGED, onChanged);
    };
  }, [refresh]);

  const handleDismiss = useCallback((id: string) => {
    removeSittingReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  if (reminders.length === 0) return null;

  return (
    <aside className={styles.banner} role="complementary" aria-label="Rappels de séances">
      <div className={styles.content}>
        <span className={styles.heading}>Rappels de séances</span>
        {reminders.map((r) => (
          <ReminderLine key={r.id} reminder={r} onDismiss={handleDismiss} />
        ))}
      </div>
    </aside>
  );
}
