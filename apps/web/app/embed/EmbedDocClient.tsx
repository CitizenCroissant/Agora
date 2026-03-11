"use client";

import { useState } from "react";
import styles from "./embed-doc.module.css";

const DEFAULT_ACTEUR_REF = "PA842279";

/** Base URL for embed snippet (canonical production domain). */
function getEmbedBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://agora-citoyens.fr";
}

export function EmbedDocClient() {
  const [acteurRef, setActeurRef] = useState(DEFAULT_ACTEUR_REF);
  const [limit, setLimit] = useState(5);
  const [copied, setCopied] = useState(false);

  const encoded = encodeURIComponent(acteurRef);
  const query = limit !== 5 ? `?limit=${limit}` : "";
  const iframeSrc = `/embed/deputy/${encoded}/votes${query}`;

  const baseUrl = getEmbedBaseUrl();
  const snippet = `<iframe
  title="Derniers votes - Député"
  src="${baseUrl}${iframeSrc}"
  width="100%"
  height="320"
  frameborder="0"
  loading="lazy"
></iframe>`;

  return (
    <div className={styles.demo}>
      <div className={styles.controls}>
        <label className={styles.label}>
          Identifiant député (acteur_ref)
          <input
            type="text"
            className={styles.input}
            value={acteurRef}
            onChange={(e) => setActeurRef(e.target.value.trim() || DEFAULT_ACTEUR_REF)}
            placeholder={DEFAULT_ACTEUR_REF}
          />
        </label>
        <label className={styles.label}>
          Nombre de votes
          <select
            className={styles.select}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.live}>
        <h3 className={styles.liveTitle}>Aperçu du widget</h3>
        <div className={styles.iframeWrap}>
          <iframe
            title="Exemple : derniers votes d’un député"
            src={iframeSrc}
            className={styles.iframe}
            loading="lazy"
          />
        </div>
      </div>
      <div className={styles.codeBlock}>
        <h3 className={styles.codeTitle}>Code à copier</h3>
        <pre className={styles.pre}>
          <code>{snippet}</code>
        </pre>
        <button
          type="button"
          className={styles.copyBtn}
          onClick={() => {
            navigator.clipboard.writeText(snippet).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
        >
          {copied ? "Copié !" : "Copier le code"}
        </button>
      </div>
    </div>
  );
}
