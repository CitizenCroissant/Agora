import React, { useEffect, useState } from 'react'
import styles from './VoteResultBar.module.css'

interface VoteResultBarProps {
  pour: number
  contre: number
  abstentions: number
  nonVotants?: number
  size?: 'sm' | 'md' | 'lg'
  showLegend?: boolean
  showStats?: boolean
  /** Animate bar segments from 0 → actual width on mount (default: true) */
  animated?: boolean
  className?: string
}

export function VoteResultBar({
  pour,
  contre,
  abstentions,
  nonVotants = 0,
  size = 'md',
  showLegend = true,
  showStats = false,
  animated = true,
  className
}: VoteResultBarProps) {
  // Hooks must be called unconditionally before any early returns.
  // Start at false so bars animate from 0 → actual width on mount.
  const [mounted, setMounted] = useState(!animated)
  useEffect(() => {
    if (!animated) return
    // rAF ensures the 0-width render is painted before we expand
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [animated])

  const total = pour + contre + abstentions + nonVotants
  if (total === 0) return null

  const pctPour = (pour / total) * 100
  const pctContre = (contre / total) * 100
  const pctAbstention = (abstentions / total) * 100

  const pourWidth   = mounted ? `${pctPour}%`       : '0%'
  const contreWidth = mounted ? `${pctContre}%`      : '0%'
  const abstWidth   = mounted ? `${pctAbstention}%`  : '0%'

  return (
    <div className={[styles.wrap, className ?? ''].filter(Boolean).join(' ')}>
      {showStats && (
        <div className={styles.statsGrid}>
          <div className={`${styles.statItem} ${styles.pour}`}>
            <span className={styles.statValue}>{pour}</span>
            <span className={styles.statLabel}>Pour</span>
          </div>
          <div className={`${styles.statItem} ${styles.contre}`}>
            <span className={styles.statValue}>{contre}</span>
            <span className={styles.statLabel}>Contre</span>
          </div>
          <div className={`${styles.statItem} ${styles.abstention}`}>
            <span className={styles.statValue}>{abstentions}</span>
            <span className={styles.statLabel}>Abstentions</span>
          </div>
          <div className={`${styles.statItem} ${styles.nonVotant}`}>
            <span className={styles.statValue}>{nonVotants}</span>
            <span className={styles.statLabel}>Non votants</span>
          </div>
        </div>
      )}

      <div
        className={`${styles.bar} ${styles[size]}`}
        role="img"
        aria-label={`Pour: ${pour}, Contre: ${contre}, Abstentions: ${abstentions}`}
      >
        <span className={styles.segPour}      style={{ width: pourWidth }}  />
        <span className={styles.segContre}    style={{ width: contreWidth }} />
        <span className={styles.segAbstention} style={{ width: abstWidth }} />
      </div>

      {showLegend && (
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.pour}`} />
            <span className={styles.count}>{pour}</span> pour
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.contre}`} />
            <span className={styles.count}>{contre}</span> contre
          </span>
          {abstentions > 0 && (
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.abstention}`} />
              <span className={styles.count}>{abstentions}</span> abstentions
            </span>
          )}
        </div>
      )}
    </div>
  )
}
