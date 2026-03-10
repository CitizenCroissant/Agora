import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DEMOCRATIE } from "@/content/democratie";
import { getBaseUrl } from "@/lib/url";
import styles from "../democratie.module.css";

const { citoyen } = DEMOCRATIE;

export const metadata: Metadata = {
  title: `${citoyen.title} | Agora - Comprendre la démocratie`,
  description:
    "Votez, suivez les débats sur Agora, contactez votre député, signez des pétitions. S'informer et faire entendre son avis font partie de la participation citoyenne.",
  openGraph: {
    title: `${citoyen.title} | Agora`,
    description: citoyen.summary,
    type: "website"
  },
  alternates: {
    canonical: `${getBaseUrl()}/democratie/votre-role-citoyen`
  }
};

export default function VotreRoleCitoyenPage() {
  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Comprendre la démocratie", href: "/democratie" },
          { label: citoyen.title }
        ]}
      />

      <section className={styles.section} aria-labelledby="citoyen-title">
        <h1 id="citoyen-title">{citoyen.title}</h1>
        <p>{citoyen.body}</p>
        <div className={styles.summaryBox}>
          <h2>{citoyen.summaryTitle}</h2>
          <p>{citoyen.summary}</p>
        </div>
        <div className={styles.contactDeputeBox}>
          <h2>{citoyen.contactDeputeTitle}</h2>
          <p>{citoyen.contactDeputeIntro}</p>
          <dl className={styles.contactDeputeList}>
            {citoyen.contactDepute.map((item) => (
              <div key={item.label} className={styles.contactDeputeItem}>
                <dt>{item.label}</dt>
                <dd>
                  {item.value.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < item.value.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <ul className={styles.linkList}>
          {citoyen.links.map((link) => (
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
