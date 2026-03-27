import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DEMOCRATIE } from "@/content/democratie";
import { getBaseUrl } from "@/lib/url";
import styles from "../democratie.module.css";

const { municipales } = DEMOCRATIE;

export const metadata: Metadata = {
  title: `${municipales.title} | Agora - Comprendre la démocratie`,
  description:
    "Comment fonctionnent les élections municipales en France : mode de scrutin, rôle du conseil municipal, lien avec le Parlement.",
  openGraph: {
    title: `${municipales.title} | Agora`,
    description: municipales.summary,
    type: "website"
  },
  alternates: {
    canonical: `${getBaseUrl()}/democratie/elections-municipales`
  }
};

export default function ElectionsMunicipalesPage() {
  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Comprendre la démocratie", href: "/democratie" },
          { label: municipales.title }
        ]}
      />

      <section className={styles.section} aria-labelledby="municipales-title">
        <h1 id="municipales-title">{municipales.title}</h1>
        <p>{municipales.intro}</p>
        <p>{municipales.body}</p>

        <h2>Quel lien avec le Parlement ?</h2>
        <p>{municipales.parlement}</p>

        <div className={styles.summaryBox}>
          <h3>{municipales.summaryTitle}</h3>
          <p>{municipales.summary}</p>
        </div>
        <ul className={styles.linkList}>
          {municipales.links.map((link) => (
            <li key={link.href}>
              {"external" in link && link.external ? (
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ) : (
                <Link href={link.href}>{link.label}</Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.backLink}>
        <Link href="/democratie">← Retour à Comprendre la démocratie</Link>
      </p>
    </div>
  );
}
