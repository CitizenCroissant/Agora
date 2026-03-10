import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DEMOCRATIE } from "@/content/democratie";
import { getBaseUrl } from "@/lib/url";
import styles from "../democratie.module.css";

const { assemblee } = DEMOCRATIE;

export const metadata: Metadata = {
  title: `${assemblee.title} | Agora - Comprendre la démocratie`,
  description:
    "577 députés, élus pour 5 ans. Ils votent les lois, débattent en séance publique et contrôlent le Gouvernement. Agora vous permet de suivre l'ordre du jour et les scrutins.",
  openGraph: {
    title: `${assemblee.title} | Agora`,
    description: assemblee.summary,
    type: "website"
  },
  alternates: {
    canonical: `${getBaseUrl()}/democratie/assemblee-nationale`
  }
};

export default function AssembleeNationalePage() {
  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Comprendre la démocratie", href: "/democratie" },
          { label: assemblee.title }
        ]}
      />

      <section className={styles.section} aria-labelledby="assemblee-title">
        <h1 id="assemblee-title">{assemblee.title}</h1>
        <p>{assemblee.body}</p>
        <div className={styles.summaryBox}>
          <h2>{assemblee.summaryTitle}</h2>
          <p>{assemblee.summary}</p>
        </div>
        <ul className={styles.linkList}>
          {assemblee.links.map((link) => (
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
