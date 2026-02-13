import Link from "next/link";
import styles from "./AppFooter.module.css";
import { FooterShareCta } from "./FooterShareCta";

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <p>Agora - Données officielles de l&apos;Assemblée nationale</p>
        <div className={styles.footerLinks}>
          <Link href="/about">En savoir plus</Link>
          <Link href="/democratie">Comprendre la démocratie</Link>
          <Link href="/sources">Sources</Link>
          <Link href="/votes">Scrutins</Link>
          <Link href="/timeline">Calendrier</Link>
        </div>
        <FooterShareCta />
      </div>
    </footer>
  );
}
