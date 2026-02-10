"use client";

import { useState } from "react";
import { findGlossaryEntry } from "@agora/shared";
import styles from "./GlossaryTooltip.module.css";

interface GlossaryTooltipProps {
  term: string;
}

export function GlossaryTooltip({ term }: GlossaryTooltipProps) {
  const [open, setOpen] = useState(false);
  const entry = findGlossaryEntry(term);

  if (!entry) {
    return <>{term}</>;
  }

  return (
    <span
      className={styles.tooltipWrapper}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
      aria-label={entry.shortDefinition}
    >
      <span className={styles.term}>{term}</span>
      <span className={styles.icon}>?</span>
      {open && (
        <div className={styles.popover}>
          <div className={styles.popoverTitle}>{entry.term}</div>
          <p className={styles.popoverText}>{entry.shortDefinition}</p>
        </div>
      )}
    </span>
  );
}

