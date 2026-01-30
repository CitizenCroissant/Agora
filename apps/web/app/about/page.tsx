import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './about.module.css'

export const metadata: Metadata = {
  title: 'À propos | Agora - Agenda de l\'Assemblée nationale',
  description:
    'Agora rend l\'activité de l\'Assemblée nationale accessible et transparente. Découvrez notre mission, notre fonctionnement et nos sources de données.',
  openGraph: {
    title: 'À propos | Agora - Agenda de l\'Assemblée nationale',
    description:
      'Agora rend l\'activité de l\'Assemblée nationale accessible et transparente.',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <Link href="/" className={styles.backLink}>
            ← Retour
          </Link>
          <h1 className={styles.title}>À propos</h1>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          <section className={styles.section}>
            <h2>Notre mission</h2>
            <p>
              Agora a pour objectif de rendre l'activité de
              l'Assemblée nationale plus accessible et transparente pour tous
              les citoyens.
            </p>
            <p>
              Nous croyons que chacun devrait pouvoir consulter facilement ce
              que font ses représentants aujourd'hui, cette semaine, et au-delà.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Comment ça marche ?</h2>
            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div>
                  <h3>Collecte des données</h3>
                  <p>
                    Nous récupérons automatiquement les données officielles de
                    l'Assemblée nationale via leurs sources ouvertes.
                  </p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div>
                  <h3>Organisation et structuration</h3>
                  <p>
                    Les données sont organisées pour faciliter la navigation et
                    la compréhension des séances et de l'ordre du jour.
                  </p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div>
                  <h3>Présentation claire</h3>
                  <p>
                    Nous présentons l'information de manière simple et
                    accessible, sur web et mobile.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Transparence et provenance</h2>
            <p>
              Toutes les informations présentées proviennent directement des
              sources officielles de l'Assemblée nationale. Nous affichons
              systématiquement :
            </p>
            <ul className={styles.list}>
              <li>La source originale des données</li>
              <li>La date de dernière mise à jour</li>
              <li>Des liens vers les documents officiels</li>
            </ul>
            <p>
              Nous ne modifions pas le contenu, nous le rendons simplement plus
              accessible.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Open Source</h2>
            <p>
              Agora est un projet open source. Le code est disponible
              librement pour que chacun puisse vérifier notre travail, proposer
              des améliorations, ou s'en inspirer.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Contact</h2>
            <p>
              Pour toute question, suggestion ou collaboration, n'hésitez pas à
              nous contacter.
            </p>
          </section>

          <div className={styles.cta}>
            <Link href="/sources" className={styles.ctaButton}>
              Consulter nos sources de données
            </Link>
          </div>
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
