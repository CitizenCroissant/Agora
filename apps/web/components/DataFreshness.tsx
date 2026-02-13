"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import type { IngestionStatusResponse } from "@agora/shared";
import styles from "./DataFreshness.module.css";

function formatLastSynced(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function DataFreshness() {
  const [status, setStatus] = useState<IngestionStatusResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getIngestionStatus()
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error || !status?.ok || !status.agenda.last_synced_at) {
    return null;
  }

  const { last_synced_at, is_fresh } = status.agenda;

  return (
    <p className={styles.freshness} aria-live="polite">
      <span className={is_fresh ? styles.fresh : styles.stale}>
        {is_fresh ? "Données à jour" : "Données mises à jour le "}
        {is_fresh
          ? ` — ${formatLastSynced(last_synced_at)}`
          : formatLastSynced(last_synced_at)}
      </span>
      {" · "}
      <Link href="/sources" className={styles.sourcesLink}>
        Sources et méthodologie
      </Link>
    </p>
  );
}
