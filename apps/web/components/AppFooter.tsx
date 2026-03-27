import Link from "next/link";
import styles from "./AppFooter.module.css";
import { FooterShareCta } from "./FooterShareCta";
import { DataFreshness } from "./DataFreshness";

const FOOTER_SECTIONS = [
  {
    title: "Sections",
    links: [
      { label: "Aujourd'hui", href: "/" },
      { label: "Votes", href: "/votes" },
      { label: "Calendrier", href: "/timeline" },
      { label: "Dossiers législatifs", href: "/bills" },
      { label: "Comprendre la démocratie", href: "/democratie" }
    ]
  },
  {
    title: "Explorer",
    links: [
      { label: "Commissions", href: "/commissions" },
      { label: "Groupes politiques", href: "/groupes" },
      { label: "Mon député", href: "/mon-depute" },
      { label: "Ma circonscription", href: "/ma-circo" },
      { label: "Municipales 2026", href: "/municipales-2026" }
    ]
  },
  {
    title: "Ressources",
    links: [
      { label: "À propos", href: "/about" },
      { label: "Sources et données", href: "/sources" },
      { label: "Intégrer le widget", href: "/embed" },
      { label: "Recherche", href: "/search" }
    ]
  }
];

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      {/* Main footer content */}
      <div className={styles.main}>
        <div className="container">
          <div className={styles.grid}>
            {/* Brand column */}
            <div className={styles.brandCol}>
              <Link href="/" className={styles.brand}>
                Agora
              </Link>
              <p className={styles.brandTagline}>
                L&apos;Assemblée nationale,<br />en clair.
              </p>
              <div className={styles.freshnessWrap}>
                <DataFreshness dark />
              </div>
            </div>

            {/* Link columns */}
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title} className={styles.linkCol}>
                <h3 className={styles.colTitle}>{section.title}</h3>
                <ul className={styles.linkList}>
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={styles.link}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className="container">
          <div className={styles.bottomInner}>
            <p className={styles.legal}>
              © 2026 Agora &mdash; Données officielles{" "}
              <a
                href="https://data.assemblee-nationale.fr"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                data.assemblee-nationale.fr
              </a>
            </p>
            <FooterShareCta dark />
          </div>
        </div>
      </div>
    </footer>
  );
}
