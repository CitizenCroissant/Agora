"use client";

import { useState, useCallback } from "react";
import styles from "./FooterShareCta.module.css";

const AGORA_HOME_MESSAGE =
  "Découvrez l'agenda et les votes de l'Assemblée nationale en clair – Agora, transparence citoyenne.";

function getHomeUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin + "/";
  }
  return "https://agora.example.com/";
}

export function FooterShareCta() {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = getHomeUrl();
    const title = "Agora – L'Assemblée nationale, en clair";

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: AGORA_HOME_MESSAGE,
          url
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyFallback(url);
        }
      }
    } else {
      copyFallback(url);
    }
  }, []);

  function copyFallback(url: string) {
    try {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } finally {
        document.body.removeChild(input);
      }
    }
  }

  return (
    <div className={styles.cta}>
      <p className={styles.text}>
        Connaissez-vous quelqu&apos;un qui s&apos;intéresse à l&apos;Assemblée ?{" "}
        <button
          type="button"
          onClick={handleShare}
          className={styles.shareButton}
          aria-label={copied ? "Lien copié" : "Partager Agora"}
        >
          {copied ? "Lien copié !" : "Partagez Agora."}
        </button>
      </p>
    </div>
  );
}
