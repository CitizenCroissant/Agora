import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DEMOCRATIE } from "@/content/democratie";
import { getBaseUrl } from "@/lib/url";
import styles from "../democratie.module.css";

const { senat } = DEMOCRATIE;

export const metadata: Metadata = {
  title: `${senat.title} | Agora - Comprendre la démocratie`,
  description:
    "348 sénateurs, élus pour 6 ans au suffrage indirect. Ils participent au vote des lois et représentent les territoires. En cas de désaccord, navette ou dernier mot à l'Assemblée.",
  openGraph: {
    title: `${senat.title} | Agora`,
    description: senat.summary,
    type: "website"
  },
  alternates: {
    canonical: `${getBaseUrl()}/democratie/senat`
  }
};

export default function SenatPage() {
  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Comprendre la démocratie", href: "/democratie" },
          { label: senat.title }
        ]}
      />

      <section className={styles.section} aria-labelledby="senat-title">
        <h1 id="senat-title">{senat.title}</h1>
        <p>{senat.body}</p>
        <div className={styles.summaryBox}>
          <h2>{senat.summaryTitle}</h2>
          <p>{senat.summary}</p>
        </div>
        <ul className={styles.linkList}>
          {senat.links.map((link) => (
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
