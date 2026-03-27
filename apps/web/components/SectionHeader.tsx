import React from 'react'
import Link from 'next/link'
import styles from './SectionHeader.module.css'

type SectionHeaderSize = 'sm' | 'md' | 'lg' | 'xl'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  size?: SectionHeaderSize
  sectionColor?: string
  /** Link or button rendered to the right of the title */
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

const sizeClass: Record<SectionHeaderSize, string> = {
  sm: styles.titleSm,
  md: styles.titleMd,
  lg: styles.titleLg,
  xl: styles.titleXl
}

export function SectionHeader({
  title,
  subtitle,
  size = 'md',
  sectionColor,
  action,
  className
}: SectionHeaderProps) {
  const style = sectionColor
    ? ({ '--section-color': sectionColor } as React.CSSProperties)
    : undefined

  const renderAction = () => {
    if (!action) return null

    if (action.href) {
      return (
        <Link href={action.href} className={styles.action} style={style}>
          {action.label} →
        </Link>
      )
    }

    return (
      <button
        type="button"
        className={styles.action}
        style={style}
        onClick={action.onClick}
      >
        {action.label} →
      </button>
    )
  }

  return (
    <div className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')} style={style}>
      <div className={styles.left}>
        {sectionColor && <div className={styles.accentLine} />}
        <h2 className={[styles.title, sizeClass[size]].join(' ')}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {renderAction()}
    </div>
  )
}
