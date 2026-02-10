"use client";

import styles from "./PageHelp.module.css";

interface PageHelpProps {
  title: string;
  points: string[];
}

export function PageHelp({ title, points }: PageHelpProps) {
  if (!points.length) return null;

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

