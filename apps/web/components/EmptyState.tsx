import React from 'react'
import styles from './EmptyState.module.css'

export type EmptyStateVariant =
  | 'agenda'      // no sitting / no agenda items
  | 'votes'       // no scrutins
  | 'search'      // no search results
  | 'deputy'      // deputy not found / no activity
  | 'calendar'    // no events in selected period
  | 'bills'       // no bills
  | 'commissions' // no commissions
  | 'groups'      // no groups
  | 'generic'     // fallback

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  message?: string
  /** Optional call-to-action rendered below the message */
  action?: React.ReactNode
  className?: string
}

/* ── Inline SVG illustrations ─────────────────────────────────── */

function IllustrationAgenda() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="20" y="18" width="80" height="64" rx="8" fill="var(--color-background-alt)" stroke="var(--color-border)" strokeWidth="1.5"/>
      <rect x="20" y="18" width="80" height="20" rx="8" fill="var(--color-primary)" opacity=".12"/>
      <rect x="20" y="30" width="80" height="8" fill="var(--color-primary)" opacity=".12"/>
      <line x1="36" y1="18" x2="36" y2="12" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="84" y1="18" x2="84" y2="12" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="34" y="46" width="14" height="10" rx="3" fill="var(--color-border)" opacity=".5"/>
      <rect x="53" y="46" width="14" height="10" rx="3" fill="var(--color-border)" opacity=".5"/>
      <rect x="72" y="46" width="14" height="10" rx="3" fill="var(--color-border)" opacity=".5"/>
      <rect x="34" y="62" width="14" height="10" rx="3" fill="var(--color-border)" opacity=".3"/>
      <rect x="53" y="62" width="14" height="10" rx="3" fill="var(--color-border)" opacity=".3"/>
      {/* sad moon */}
      <circle cx="60" cy="90" r="7" fill="var(--color-accent-amber)" opacity=".35"/>
    </svg>
  )
}

function IllustrationVotes() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="20" y="22" width="80" height="56" rx="8" fill="var(--color-background-alt)" stroke="var(--color-border)" strokeWidth="1.5"/>
      {/* ballot slot */}
      <rect x="47" y="10" width="26" height="6" rx="3" fill="var(--color-primary)" opacity=".2"/>
      <rect x="56" y="6" width="8" height="16" rx="2" fill="var(--color-primary)" opacity=".15"/>
      {/* empty bar */}
      <rect x="34" y="46" width="52" height="8" rx="4" fill="var(--color-border)" opacity=".45"/>
      <rect x="34" y="58" width="38" height="8" rx="4" fill="var(--color-border)" opacity=".3"/>
      {/* check with question */}
      <circle cx="60" cy="35" r="10" fill="var(--color-accent-amber)" opacity=".2"/>
      <text x="60" y="40" textAnchor="middle" fill="var(--color-accent-amber)" fontSize="14" fontWeight="700" opacity=".7">?</text>
    </svg>
  )
}

function IllustrationSearch() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="52" cy="46" r="22" stroke="var(--color-border)" strokeWidth="2.5" fill="var(--color-background-alt)"/>
      <line x1="68" y1="62" x2="86" y2="80" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round"/>
      {/* dashed lines inside */}
      <line x1="44" y1="42" x2="60" y2="42" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3"/>
      <line x1="44" y1="50" x2="56" y2="50" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3"/>
      <circle cx="52" cy="35" r="3" fill="var(--color-accent-amber)" opacity=".6"/>
    </svg>
  )
}

function IllustrationDeputy() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="38" r="18" fill="var(--color-background-alt)" stroke="var(--color-border)" strokeWidth="1.5"/>
      <circle cx="60" cy="34" r="10" fill="var(--color-border)" opacity=".35"/>
      <path d="M32 80 C32 64 88 64 88 80" stroke="var(--color-border)" strokeWidth="2" fill="none"/>
      <circle cx="60" cy="60" r="3" fill="var(--color-accent-amber)" opacity=".7"/>
      <line x1="60" y1="63" x2="60" y2="70" stroke="var(--color-accent-amber)" strokeWidth="2" strokeLinecap="round" opacity=".7"/>
    </svg>
  )
}

function IllustrationCalendar() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="22" y="20" width="76" height="64" rx="8" fill="var(--color-background-alt)" stroke="var(--color-border)" strokeWidth="1.5"/>
      <rect x="22" y="20" width="76" height="22" rx="8" fill="var(--color-section-calendrier)" opacity=".15"/>
      <rect x="22" y="34" width="76" height="8" fill="var(--color-section-calendrier)" opacity=".1"/>
      <line x1="38" y1="20" x2="38" y2="13" stroke="var(--color-section-calendrier)" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="82" y1="20" x2="82" y2="13" stroke="var(--color-section-calendrier)" strokeWidth="2.5" strokeLinecap="round"/>
      {/* sparkle / empty */}
      <circle cx="60" cy="62" r="10" fill="var(--color-section-calendrier)" opacity=".12"/>
      <line x1="60" y1="56" x2="60" y2="68" stroke="var(--color-section-calendrier)" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      <line x1="54" y1="62" x2="66" y2="62" stroke="var(--color-section-calendrier)" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
    </svg>
  )
}

function IllustrationGeneric() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="24" y="24" width="72" height="52" rx="8" fill="var(--color-background-alt)" stroke="var(--color-border)" strokeWidth="1.5"/>
      <rect x="36" y="38" width="48" height="6" rx="3" fill="var(--color-border)" opacity=".5"/>
      <rect x="36" y="50" width="34" height="6" rx="3" fill="var(--color-border)" opacity=".35"/>
      <rect x="36" y="62" width="20" height="6" rx="3" fill="var(--color-border)" opacity=".25"/>
      <circle cx="60" cy="88" r="5" fill="var(--color-accent-amber)" opacity=".4"/>
    </svg>
  )
}

const VARIANTS: Record<EmptyStateVariant, {
  illustration: React.ReactNode
  defaultTitle: string
  defaultMessage: string
}> = {
  agenda: {
    illustration: <IllustrationAgenda />,
    defaultTitle: "Aucune séance prévue",
    defaultMessage: "Aucune séance n\u2019est programmée pour cette date."
  },
  votes: {
    illustration: <IllustrationVotes />,
    defaultTitle: "Aucun scrutin trouvé",
    defaultMessage: "Aucun vote ne correspond à vos critères de recherche."
  },
  search: {
    illustration: <IllustrationSearch />,
    defaultTitle: "Aucun résultat",
    defaultMessage: "Essayez d\u2019autres termes ou ajustez vos filtres."
  },
  deputy: {
    illustration: <IllustrationDeputy />,
    defaultTitle: "Député introuvable",
    defaultMessage: "Aucun résultat ne correspond à votre recherche."
  },
  calendar: {
    illustration: <IllustrationCalendar />,
    defaultTitle: "Période vide",
    defaultMessage: "Aucun événement prévu sur cette période."
  },
  bills: {
    illustration: <IllustrationGeneric />,
    defaultTitle: "Aucun texte trouvé",
    defaultMessage: "Aucun projet de loi ne correspond à vos critères."
  },
  commissions: {
    illustration: <IllustrationGeneric />,
    defaultTitle: "Aucune commission",
    defaultMessage: "Aucune commission ne correspond à votre recherche."
  },
  groups: {
    illustration: <IllustrationGeneric />,
    defaultTitle: "Aucun groupe",
    defaultMessage: "Aucun groupe politique n\u2019est disponible pour le moment."
  },
  generic: {
    illustration: <IllustrationGeneric />,
    defaultTitle: "Rien ici pour l\u2019instant",
    defaultMessage: "Les données seront disponibles prochainement."
  }
}

export function EmptyState({
  variant = 'generic',
  title,
  message,
  action,
  className
}: EmptyStateProps) {
  const { illustration, defaultTitle, defaultMessage } = VARIANTS[variant]

  return (
    <div className={[styles.wrap, className ?? ''].filter(Boolean).join(' ')}>
      <div className={styles.illustration}>{illustration}</div>
      <h3 className={styles.title}>{title ?? defaultTitle}</h3>
      <p className={styles.message}>{message ?? defaultMessage}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
