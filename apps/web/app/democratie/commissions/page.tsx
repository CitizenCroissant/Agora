import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DEMOCRATIE } from "@/content/democratie";
import { getBaseUrl } from "@/lib/url";
import styles from "../democratie.module.css";

const { commissions } = DEMOCRATIE;

export const metadata: Metadata = {
  title: `${commissions.title} | Agora - Comprendre la démocratie`,
  description:
    "Commissions permanentes, spéciales, d'enquête, missions d'information : organisation et rôle du travail en commission à l'Assemblée nationale.",
  openGraph: {
    title: `${commissions.title} | Agora`,
    description: commissions.intro,
    type: "website"
  },
  alternates: {
    canonical: `${getBaseUrl()}/democratie/commissions`
  }
};

export default function CommissionsPage() {
  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Comprendre la démocratie", href: "/democratie" },
          { label: commissions.title }
        ]}
      />

      <section className={styles.section} aria-labelledby="commissions-title">
        <h1 id="commissions-title">{commissions.title}</h1>
        <p>{commissions.intro}</p>
        <h2 className={styles.subSectionTitle}>{commissions.typesTitle}</h2>
        {commissions.types.map((item) => (
          <div key={item.title} className={styles.subSection}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        ))}
        <h2 className={styles.subSectionTitle}>{commissions.roleTitle}</h2>
        <p>{commissions.roleIntro}</p>
        {commissions.rolePoints.map((item) => (
          <div key={item.title} className={styles.subSection}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        ))}
        <h2 className={styles.subSectionTitle}>{commissions.constitutionTitle}</h2>
        {commissions.constitution.map((item) => (
          <div key={item.title} className={styles.subSection}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        ))}
        <h2 className={styles.subSectionTitle}>{commissions.saisineTitle}</h2>
        {commissions.saisine.map((item) => (
          <div key={item.title} className={styles.subSection}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        ))}
        <div className={styles.summaryBox}>
          <h2>{commissions.summaryTitle}</h2>
          <p>{commissions.summary}</p>
        </div>
        <ul className={styles.linkList}>
          {commissions.links.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
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
