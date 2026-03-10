import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LegislativeProcessSteps } from "@/components/LegislativeProcessSteps";
import { DemocracyDiagram } from "@/components/DemocracyDiagram";
import { DEMOCRATIE } from "@/content/democratie";
import { getBaseUrl } from "@/lib/url";
import styles from "../democratie.module.css";

const { loi } = DEMOCRATIE;

export const metadata: Metadata = {
  title: `${loi.title} | Agora - Comprendre la démocratie`,
  description:
    "Du projet de loi à la promulgation : le parcours d'un texte en 7 étapes. Initiative, commission, débat, vote, navette, accord des chambres, promulgation.",
  openGraph: {
    title: `${loi.title} | Agora`,
    description: loi.intro,
    type: "website"
  },
  alternates: {
    canonical: `${getBaseUrl()}/democratie/comment-une-loi-est-votee`
  }
};

export default function CommentUneLoiEstVoteePage() {
  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Comprendre la démocratie", href: "/democratie" },
          { label: loi.title }
        ]}
      />

      <section className={styles.section} aria-labelledby="loi-title">
        <h1 id="loi-title">{loi.title}</h1>
        <p>{loi.intro}</p>
        <DemocracyDiagram />
        <LegislativeProcessSteps
          steps={loi.steps}
          nextLabel={loi.nextLabel}
          prevLabel={loi.prevLabel}
          showAllLabel={loi.showAllLabel}
        />
      </section>

      <p className={styles.backLink}>
        <Link href="/democratie">← Retour à Comprendre la démocratie</Link>
      </p>
    </div>
  );
}
