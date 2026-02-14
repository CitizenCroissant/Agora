import type { Metadata } from 'next'
import styles from './sources.module.css'
import { Breadcrumb } from "@/components/Breadcrumb"

export const metadata: Metadata = {
  title: 'Sources de données | Agora - Agenda de l\'Assemblée nationale',
  description:
    'Toutes les données Agora proviennent des sources officielles de l\'Assemblée nationale. Découvrez nos sources, comment nous présentons les votes (méthodologie), la fréquence de mise à jour et notre glossaire.',
  openGraph: {
    title: 'Sources de données | Agora',
    description:
      'Données officielles de l\'Assemblée nationale utilisées par Agora. Méthodologie de présentation des votes.',
    type: 'website'
  }
}

export default function SourcesPage() {
  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Sources de données" }]} />
          <section className={styles.section}>
            <h2>Données officielles</h2>
            <p>
              Toutes les informations affichées sur Agora proviennent
              exclusivement des sources officielles de l'Assemblée nationale.
            </p>
            <p>
              Pour savoir comment nous récupérons ces données, comment nous
              présentons les votes (pour / contre / abstention / non votant) et
              ce que signifient « adopté » et « rejeté », consultez la section{' '}
              <a href="#methodologie" className={styles.anchorLink}>
                Comment nous présentons les votes
              </a>
              .
            </p>
          </section>

          <section
            id="methodologie"
            className={styles.section}
            aria-labelledby="methodologie-title"
          >
            <h2 id="methodologie-title">Comment nous présentons les votes</h2>
            <p>
              Cette section explique de façon transparente d'où viennent les
              données affichées sur Agora, comment nous les regroupons et ce que
              signifient les termes utilisés. Tous les chiffres et résultats
              proviennent des données officielles de l'Assemblée nationale ; nous
              ne les modifions pas.
            </p>

            <h3 className={styles.methodologieSubtitle}>
              D'où viennent les données ?
            </h3>
            <p>
              Agora récupère ses données via la plateforme ouverte de
              l'Assemblée nationale (
              <a
                href="https://data.assemblee-nationale.fr"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceLink}
              >
                data.assemblee-nationale.fr
              </a>
              ). Les séances, ordres du jour, scrutins et votes des députés sont
              synchronisés automatiquement à partir de ces sources. Chaque
              scrutin et chaque séance peuvent être vérifiés en suivant les
              liens vers les pages officielles fournis sur Agora.
            </p>

            <h3 className={styles.methodologieSubtitle}>
              Comment sont regroupés les votes ?
            </h3>
            <p>
              Pour chaque scrutin, nous affichons la position de chaque député
              selon les catégories fournies par l'Assemblée nationale :
            </p>
            <ul className={styles.methodologieList}>
              <li>
                <strong>Pour</strong> : le député a voté en faveur du texte ou
                de la question mise au vote.
              </li>
              <li>
                <strong>Contre</strong> : le député a voté contre.
              </li>
              <li>
                <strong>Abstention</strong> : le député s'est abstenu (il
                était présent mais n'a pas voté pour ni contre).
              </li>
              <li>
                <strong>Non votant</strong> : le député n'a pas pris part au
                vote (absent, excusé ou non inscrit au scrutin). Ce statut
                provient des données officielles de l'Assemblée.
              </li>
            </ul>
            <p>
              Nous ne créons pas ces catégories : elles correspondent à celles
              publiées par l'Assemblée nationale. Les totaux (nombre de pour,
              contre, abstentions, non votants) sont ceux des données
              officielles.
            </p>

            <h3 className={styles.methodologieSubtitle}>
              Que signifient « adopté » et « rejeté » ?
            </h3>
            <p>
              <strong>Adopté</strong> signifie que la question mise au vote a
              été adoptée par l'Assemblée : la majorité des suffrages exprimés
              (pour + contre + abstentions) a été en faveur du texte ou de
              l'amendement. <strong>Rejeté</strong> signifie que la question a
              été rejetée : la majorité s'est prononcée contre. Le résultat
              (adopté ou rejeté) est celui enregistré par l'Assemblée nationale
              pour ce scrutin ; nous le reprenons tel quel.
            </p>
            <p>
              Sur chaque page de scrutin, un lien vers la fiche officielle du
              scrutin sur le site de l'Assemblée permet de vérifier le détail
              et le contexte.
            </p>

            <h3 className={styles.methodologieSubtitle}>
              Liens vers les sources officielles
            </h3>
            <p>
              Pour chaque séance et chaque scrutin, Agora propose des liens
              directs vers les pages correspondantes sur le site officiel de
              l'Assemblée nationale. Nous nous engageons à toujours fournir
              ces liens lorsque les données le permettent, afin que tout
              citoyen ou élu puisse contrôler l'information à la source.
            </p>

            <div className={styles.charteBox}>
              <h3 className={styles.charteTitle}>
                Charte « Comment nous présentons les données »
              </h3>
              <ul className={styles.methodologieList}>
                <li>
                  <strong>Neutralité des libellés</strong> : nous utilisons les
                  termes officiels (pour, contre, adopté, rejeté, etc.) sans
                  commentaire ni formulation orientée.
                </li>
                <li>
                  <strong>Traçabilité</strong> : tous les chiffres et résultats
                  proviennent des données ouvertes ou des pages officielles de
                  l'Assemblée nationale ; nous ne les modifions pas.
                </li>
                <li>
                  <strong>Liens vers les sources</strong> : nous nous
                  engageons à afficher, lorsque c'est possible, un lien vers la
                  fiche officielle du scrutin ou de la séance pour permettre la
                  vérification.
                </li>
              </ul>
            </div>
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
  )
}
