import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './sources.module.css'

export const metadata: Metadata = {
  title: 'Sources de données | Agora - Agenda de l\'Assemblée nationale',
  description:
    'Toutes les données Agora proviennent des sources officielles de l\'Assemblée nationale. Découvrez nos sources, la fréquence de mise à jour et notre glossaire.',
  openGraph: {
    title: 'Sources de données | Agora',
    description:
      'Données officielles de l\'Assemblée nationale utilisées par Agora.',
    type: 'website',
  },
}

export default function SourcesPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <Link href="/" className={styles.backLink}>
            ← Retour
          </Link>
          <h1 className={styles.title}>Sources de données</h1>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          <section className={styles.section}>
            <h2>Données officielles</h2>
            <p>
              Toutes les informations affichées sur Agora proviennent
              exclusivement des sources officielles de l'Assemblée nationale.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Sources utilisées</h2>
            <div className={styles.sources}>
              <div className={styles.source}>
                <h3>Open Data Assemblée nationale</h3>
                <p>
                  Plateforme officielle de données ouvertes de l'Assemblée
                  nationale française, donnant accès aux séances, ordres du jour,
                  textes législatifs et plus encore.
                </p>
                <a
                  href="https://data.assemblee-nationale.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  Visiter data.assemblee-nationale.fr →
                </a>
              </div>

              <div className={styles.source}>
                <h3>Site officiel de l'Assemblée nationale</h3>
                <p>
                  Site web officiel de l'Assemblée nationale, contenant
                  l'information institutionnelle, les travaux parlementaires et
                  l'actualité législative.
                </p>
                <a
                  href="https://www.assemblee-nationale.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  Visiter assemblee-nationale.fr →
                </a>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Fréquence de mise à jour</h2>
            <p>
              Les données sont synchronisées automatiquement chaque nuit à 2h du
              matin. En cas de changement important, une synchronisation
              supplémentaire peut être déclenchée.
            </p>
            <p>
              La date et l'heure de dernière mise à jour sont toujours affichées
              avec les données pour garantir la transparence.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Exactitude et responsabilité</h2>
            <p>
              Nous faisons notre maximum pour présenter les données de manière
              fidèle et à jour. Cependant, en cas de divergence, les sources
              officielles de l'Assemblée nationale font autorité.
            </p>
            <p>
              Nous recommandons de toujours consulter les documents officiels
              pour toute décision importante. Des liens directs vers les sources
              originales sont fournis pour chaque séance.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Glossaire</h2>
            <div className={styles.glossary}>
              <div className={styles.term}>
                <h4>Séance publique</h4>
                <p>
                  Réunion plénière de l'Assemblée nationale où les députés
                  débattent et votent sur les textes législatifs.
                </p>
              </div>
              <div className={styles.term}>
                <h4>Ordre du jour</h4>
                <p>
                  Liste des points et sujets qui seront traités lors d'une
                  séance, avec leur ordre et horaire prévisionnel.
                </p>
              </div>
              <div className={styles.term}>
                <h4>Questions au Gouvernement</h4>
                <p>
                  Séance hebdomadaire où les députés interrogent les ministres
                  sur l'action du Gouvernement.
                </p>
              </div>
              <div className={styles.term}>
                <h4>Projet de loi</h4>
                <p>
                  Texte législatif proposé par le Gouvernement pour être examiné
                  et voté par le Parlement.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <p>Agora - Données officielles de l'Assemblée nationale</p>
        </div>
      </footer>
    </div>
  )
}
