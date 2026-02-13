"use client";

import { useState } from "react";
import styles from "./PageHelp.module.css";

interface PageHelpProps {
  title: string;
  points: string[];
  /** When true, show only a toggle button by default so content stays below the fold */
  collapsible?: boolean;
  /** When collapsible, start closed so the main content is visible first */
  defaultClosed?: boolean;
}

export function PageHelp({
  title,
  points,
  collapsible = true,
  defaultClosed = true
}: PageHelpProps) {
  const [open, setOpen] = useState(!defaultClosed);

  if (!points.length) return null;

  if (collapsible) {
    return (
      <section className={styles.helpCollapsible} aria-label={title}>
        <button
          type="button"
          className={styles.helpTrigger}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span className={styles.helpTriggerTitle}>{title}</span>
          <span aria-hidden="true" className={styles.helpTriggerIcon}>
            {open ? "−" : "+"}
          </span>
        </button>
        {open && (
          <ul className={styles.list}>
            {points.map((point) => (
              <li key={point} className={styles.listItem}>
                {point}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section className={styles.help} aria-label={title}>
      <h2 className={styles.title}>{title}</h2>
      <ul className={styles.list}>
        {points.map((point) => (
          <li key={point} className={styles.listItem}>
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}

