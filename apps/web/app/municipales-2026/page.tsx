import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MUNICIPALES_2026 } from "@/content/municipales-2026";
import { getBaseUrl } from "@/lib/url";
import styles from "./municipales.module.css";

const content = MUNICIPALES_2026;

export const metadata: Metadata = {
  title: "Municipales 2026 | Agora - Bilan et informations",
  description:
    "Les élections municipales des 15 et 22 mars 2026 : résultats officiels, chiffres clés, mode de scrutin et lien avec le Parlement.",
  openGraph: {
    title: "Municipales 2026 | Agora",
    description:
      "Bilan des élections municipales 2026 : chiffres, mode de scrutin, calendrier, sources officielles.",
    type: "website"
  },
  alternates: { canonical: `${getBaseUrl()}/municipales-2026` }
};

export default function Municipales2026Page() {
  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Municipales 2026" }
        ]}
      />

      <div className={styles.wrapper}>
        {/* Archive banner */}
        <div className={styles.archiveBanner} role="note" aria-label="Page archivée">
          <span className={styles.archiveBannerIcon}>🗃️</span>
          <p className={styles.archiveBannerText}>
            <strong>Scrutin terminé.</strong> Les élections municipales des 15 et
            22 mars 2026 sont terminées. Cette page est conservée à titre
            d&apos;archive.
          </p>
        </div>

        {/* Hero */}
        <header className={styles.hero}>
          <span className={styles.heroBadge}>{content.hero.badge}</span>
          <h1 className={styles.title}>{content.hero.title}</h1>
          <p className={styles.subtitle}>{content.hero.subtitle}</p>
        </header>

        {/* Key facts */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{content.keyFacts.title}</h2>
          <div className={styles.factsGrid}>
            {content.keyFacts.facts.map((fact) => (
              <div key={fact.label} className={styles.factCard}>
                <span className={styles.factValue}>{fact.value}</span>
                <span className={styles.factLabel}>{fact.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{content.howItWorks.title}</h2>
          <p className={styles.sectionIntro}>{content.howItWorks.intro}</p>
          <div className={styles.modeCards}>
            {content.howItWorks.modes.map((mode) => (
              <div key={mode.title} className={styles.modeCard}>
                <h3>{mode.title}</h3>
                <p>{mode.body}</p>
                <span className={styles.modeHighlight}>{mode.highlight}</span>
              </div>
            ))}
          </div>
          <p className={styles.mayorNote}>{content.howItWorks.electionOfMayor}</p>
        </section>

        {/* Timeline */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{content.timeline.title}</h2>
          <div className={styles.timeline}>
            {content.timeline.events.map((event) => (
              <div key={event.date} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineDate}>{event.date}</div>
                <div className={styles.timelineLabel}>{event.label}</div>
                <div className={styles.timelineDesc}>{event.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Link to parliament */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {content.localAndNational.title}
          </h2>
          <p className={styles.sectionIntro}>
            {content.localAndNational.intro}
          </p>
          <div className={styles.pointsGrid}>
            {content.localAndNational.points.map((point) => (
              <div key={point.title} className={styles.pointCard}>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Official sources */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {content.officialSources.title}
          </h2>
          <p className={styles.sectionIntro}>
            {content.officialSources.intro}
          </p>
          <div className={styles.sourcesList}>
            {content.officialSources.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceCard}
              >
                <div className={styles.sourceCardLabel}>{source.label}</div>
                <p className={styles.sourceCardDesc}>{source.description}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Did you know */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{content.didYouKnow.title}</h2>
          <ul className={styles.didYouKnowList}>
            {content.didYouKnow.facts.map((fact, i) => (
              <li key={i} className={styles.didYouKnowItem}>
                {fact}
              </li>
            ))}
          </ul>
        </section>

        {/* Agora and municipales */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {content.agoraAndMunicipales.title}
          </h2>
          <p className={styles.agoraNote}>
            {content.agoraAndMunicipales.body}
          </p>
          <ul className={styles.linkList}>
            {content.agoraAndMunicipales.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
