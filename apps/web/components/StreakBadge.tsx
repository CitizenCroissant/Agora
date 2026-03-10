"use client";

import { useEffect, useState } from "react";
import { getStreakSnapshot, type StreakSnapshot } from "@/lib/streaks";
import styles from "./StreakBadge.module.css";

export function StreakBadge() {
  const [snap, setSnap] = useState<StreakSnapshot | null>(null);

  useEffect(() => {
    setSnap(getStreakSnapshot());
  }, []);

  if (!snap || (snap.streakDays < 2 && snap.scrutinsThisWeek === 0)) {
    return null;
  }

  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      {snap.streakDays >= 2 && (
        <span className={styles.streak}>
          <span className={styles.streakIcon} aria-hidden>
            🔥
          </span>
          Vous avez consulté les votes {snap.streakDays} jours de suite
        </span>
      )}
      {snap.scrutinsThisWeek > 0 && (
        <span className={styles.scrutins}>
          <span className={styles.scrutinsIcon} aria-hidden>
            📖
          </span>
          Cette semaine : {snap.scrutinsThisWeek} scrutin{snap.scrutinsThisWeek > 1 ? "s" : ""} lu
          {snap.scrutinsThisWeek > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
