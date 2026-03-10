import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmbedDocClient } from "./EmbedDocClient";
import styles from "./embed.module.css";

export const metadata: Metadata = {
  title: "Intégrer le widget Agora | Agora - Assemblée nationale",
  description:
    "Intégrez les derniers votes d'un député sur votre site avec une iframe ou l'API. Documentation et exemple fonctionnel.",
  openGraph: {
    title: "Intégrer le widget Agora | Agora",
    description:
      "Widget « Derniers votes » pour députés : iframe ou API. Exemple d'intégration.",
    type: "website"
  }
};

export default function EmbedPage() {
  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Intégrer le widget" }
        ]}
      />
      <h1 className={styles.title}>Intégrer le widget Agora</h1>
      <p className={styles.lead}>
        Vous pouvez afficher les <strong>derniers votes d&apos;un député</strong> sur
        votre site (blog, association, média) via une iframe ou en appelant
        l&apos;API. Le widget affiche jusqu&apos;à 5 scrutins par défaut, avec un lien
        « Voir sur Agora » vers la fiche complète.
      </p>

      <section className={styles.section} aria-labelledby="iframe-title">
        <h2 id="iframe-title" className={styles.sectionTitle}>
          Méthode 1 : iframe
        </h2>
        <p>
          Copiez le code ci-dessous en remplaçant <code className={styles.code}>ACTEUR_REF</code> par
          l&apos;identifiant du député (ex. <code className={styles.code}>PA842279</code>). Vous
          pouvez obtenir cet identifiant depuis la fiche député sur Agora (URL
          du type <code className={styles.code}>/deputy/PA842279</code>) ou via l&apos;API{" "}
          <code className={styles.code}>GET /api/deputies</code>.
        </p>
        <pre className={styles.pre}>
          <code>{`<iframe
  title="Derniers votes - Député"
  src="https://agora.gouv.fm/embed/deputy/PA842279/votes"
  width="100%"
  height="320"
  frameborder="0"
  loading="lazy"
></iframe>`}</code>
        </pre>
        <p>
          Paramètre optionnel : <code className={styles.code}>?limit=10</code> pour afficher
          jusqu&apos;à 10 votes (max 20). Exemple :{" "}
          <code className={styles.code}>.../votes?limit=10</code>.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="api-title">
        <h2 id="api-title" className={styles.sectionTitle}>
          Méthode 2 : API seule
        </h2>
        <p>
          Pour un rendu personnalisé, appelez l&apos;endpoint d&apos;embed (CORS autorisé) et
          affichez les données vous-même :
        </p>
        <pre className={styles.pre}>
          <code>{`GET https://votre-api.vercel.app/api/embed/deputy/PA842279/votes?limit=5`}</code>
        </pre>
        <p>
          Réponse JSON : <code className={styles.code}>acteur_ref</code>,{" "}
          <code className={styles.code}>acteur_nom</code>, et un tableau{" "}
          <code className={styles.code}>votes</code> (chaque vote :{" "}
          <code className={styles.code}>scrutin_id</code>,{" "}
          <code className={styles.code}>scrutin_titre</code>,{" "}
          <code className={styles.code}>date_scrutin</code>,{" "}
          <code className={styles.code}>position</code>). Voir{" "}
          <a href="/sources" className={styles.anchor}>
            l&apos;API Agora
          </a>{" "}
          pour la documentation complète.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="demo-title">
        <h2 id="demo-title" className={styles.sectionTitle}>
          Exemple en direct
        </h2>
        <p>
          Voici le widget « Derniers votes » pour un député, intégré dans cette
          page. Vous pouvez changer l&apos;identifiant pour tester.
        </p>
        <EmbedDocClient />
      </section>
    </div>
  );
}
