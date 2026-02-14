import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LegislativeProcessSteps } from "@/components/LegislativeProcessSteps";
import { DemocracyDiagram } from "@/components/DemocracyDiagram";
import { ScrollToTopOnLanding } from "@/components/ScrollToTopOnLanding";
import { DEMOCRATIE } from "@/content/democratie";
import styles from "./democratie.module.css";

export const metadata: Metadata = {
  title: "Comprendre la démocratie | Agora - L'Assemblée nationale, en clair",
  description:
    "Découvrez comment les lois sont votées, le rôle de l'Assemblée et du Sénat, et comment participer en tant que citoyen.",
  openGraph: {
    title: "Comprendre la démocratie | Agora",
    description:
      "Comment une loi est votée, l'Assemblée nationale, le Sénat et votre rôle de citoyen.",
    type: "website"
  }
};

export default function DemocratiePage() {
  const { hub, loi, assemblee, senat, citoyen, commissions } = DEMOCRATIE;

  return (
    <div className="container">
      <ScrollToTopOnLanding />
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Comprendre la démocratie" }
        ]}
      />

      <p className={styles.intro}>{hub.intro}</p>

      <nav className={styles.cards} aria-label="Sections de la page">
        {hub.cards.map((card) => {
          const href =
            "externalHref" in card && card.externalHref
              ? card.externalHref
              : `#${card.id}`;
          const isExternalUrl = href.startsWith("http://") || href.startsWith("https://");
          return (
            <a
              key={card.id}
              href={href}
              className={styles.card}
              {...(isExternalUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <h2 className={styles.cardTitle}>{card.title}</h2>
              <p className={styles.cardDescription}>{card.description}</p>
            </a>
          );
        })}
      </nav>

      <section id="loi" className={styles.section} aria-labelledby="loi-title">
        <h2 id="loi-title">{loi.title}</h2>
        <p>{loi.intro}</p>
        <DemocracyDiagram />
        <LegislativeProcessSteps
          steps={loi.steps}
          nextLabel={loi.nextLabel}
          prevLabel={loi.prevLabel}
          showAllLabel={loi.showAllLabel}
        />
      </section>

      <section
        id="assemblee"
        className={styles.section}
        aria-labelledby="assemblee-title"
      >
        <h2 id="assemblee-title">{assemblee.title}</h2>
        <p>{assemblee.body}</p>
        <div className={styles.summaryBox}>
          <h3>{assemblee.summaryTitle}</h3>
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

      <section
        id="senat"
        className={styles.section}
        aria-labelledby="senat-title"
      >
        <h2 id="senat-title">{senat.title}</h2>
        <p>{senat.body}</p>
        <div className={styles.summaryBox}>
          <h3>{senat.summaryTitle}</h3>
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

      <section
        id="citoyen"
        className={styles.section}
        aria-labelledby="citoyen-title"
      >
        <h2 id="citoyen-title">{citoyen.title}</h2>
        <p>{citoyen.body}</p>
        <div className={styles.summaryBox}>
          <h3>{citoyen.summaryTitle}</h3>
          <p>{citoyen.summary}</p>
        </div>
        <div className={styles.contactDeputeBox}>
          <h3>{citoyen.contactDeputeTitle}</h3>
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

      <section
        id="commissions"
        className={styles.section}
        aria-labelledby="commissions-title"
      >
        <h2 id="commissions-title">{commissions.title}</h2>
        <p>{commissions.intro}</p>
        <h3 className={styles.subSectionTitle}>{commissions.typesTitle}</h3>
        {commissions.types.map((item) => (
          <div key={item.title} className={styles.subSection}>
            <h4>{item.title}</h4>
            <p>{item.body}</p>
          </div>
        ))}
        <h3 className={styles.subSectionTitle}>{commissions.roleTitle}</h3>
        <p>{commissions.roleIntro}</p>
        {commissions.rolePoints.map((item) => (
          <div key={item.title} className={styles.subSection}>
            <h4>{item.title}</h4>
            <p>{item.body}</p>
          </div>
        ))}
        <h3 className={styles.subSectionTitle}>{commissions.constitutionTitle}</h3>
        {commissions.constitution.map((item) => (
          <div key={item.title} className={styles.subSection}>
            <h4>{item.title}</h4>
            <p>{item.body}</p>
          </div>
        ))}
        <h3 className={styles.subSectionTitle}>{commissions.saisineTitle}</h3>
        {commissions.saisine.map((item) => (
          <div key={item.title} className={styles.subSection}>
            <h4>{item.title}</h4>
            <p>{item.body}</p>
          </div>
        ))}
        <div className={styles.summaryBox}>
          <h3>{commissions.summaryTitle}</h3>
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
    </div>
  );
}
