import Link from "next/link";
import styles from "./AppFooter.module.css";
import { FooterShareCta } from "./FooterShareCta";
import { DataFreshness } from "./DataFreshness";

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <p>Agora - Données officielles de l&apos;Assemblée nationale</p>
        <DataFreshness />
        <div className={styles.footerLinks}>
          <Link href="/about">En savoir plus</Link>
          <Link href="/democratie">Comprendre la démocratie</Link>
          <Link href="/elections-2026">Élections 2026</Link>
          <Link href="/ma-circo">Ma circonscription</Link>
          <Link href="/sources">Sources</Link>
          <Link href="/embed">Intégrer le widget</Link>
          <Link href="/votes">Scrutins</Link>
          <Link href="/timeline">Calendrier</Link>
        </div>
        <FooterShareCta />
      </div>
    </footer>
  );
}
