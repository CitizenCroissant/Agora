"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addSittingReminder,
  removeSittingReminder,
  isSittingReminderSet,
  type SittingReminderEntry
} from "@/lib/sitting-reminders";
import styles from "./SittingReminderButton.module.css";

export interface SittingReminderButtonProps {
  sitting: {
    id: string;
    date: string;
    time_range?: string;
    title: string;
  };
  /** Callback when subscription state changes (e.g. to re-render a parent list). */
  onToggle?: (subscribed: boolean) => void;
  /** Use compact label for tight layouts (e.g. timeline cards). */
  compact?: boolean;
  /** Optional: pass a ref to the container so click doesn't trigger parent Link. */
  className?: string;
}

/**
 * "Turn on notifications for this sitting?" – subscribe/unsubscribe to a sitting reminder.
 * Stored in localStorage; reminders surface as in-app banner when the user visits.
 * Request Notification permission when subscribing (for future push support).
 */
export function SittingReminderButton({
  sitting,
  onToggle,
  compact = false,
  className
}: SittingReminderButtonProps) {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setSubscribed(isSittingReminderSet(sitting.id));
  }, [sitting.id]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const entry: SittingReminderEntry = {
        id: sitting.id,
        date: sitting.date,
        time_range: sitting.time_range,
        title: sitting.title
      };
      if (subscribed) {
        removeSittingReminder(sitting.id);
        setSubscribed(false);
        onToggle?.(false);
      } else {
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
          Notification.requestPermission().catch(() => {});
        }
        addSittingReminder(entry);
        setSubscribed(true);
        onToggle?.(true);
      }
    },
    [sitting, subscribed, onToggle]
  );

  const label = subscribed
    ? compact
      ? "Rappel activé"
      : "Rappel activé pour cette séance"
    : compact
      ? "Rappel"
      : "Recevoir un rappel pour cette séance";

  return (
    <button
      type="button"
      className={`${styles.button} ${subscribed ? styles.subscribed : ""} ${className ?? ""}`}
      onClick={handleClick}
      aria-pressed={subscribed}
      aria-label={label}
      title={label}
    >
      <span className={styles.icon} aria-hidden>
        {subscribed ? "🔔" : "🔕"}
      </span>
      <span className={styles.label}>{label}</span>
    </button>
  );
}
