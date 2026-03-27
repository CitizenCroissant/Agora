import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <section className={styles.section} aria-labelledby="not-found-title">
      <p className={styles.code} aria-hidden="true">
        404
      </p>
      <h1 id="not-found-title" className={styles.title}>
        Page introuvable
      </h1>
      <p className={styles.lead}>
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" className={styles.link}>
        ← Retour à l&apos;accueil
      </Link>
    </section>
  );
}
