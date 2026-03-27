import React from 'react'
import styles from './Badge.module.css'

type BadgeVariant = 'default' | 'primary' | 'coral' | 'teal' | 'amber' | 'success' | 'error' | 'neutral'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
  children: React.ReactNode
}

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  children
}: BadgeProps) {
  const classNames = [styles.badge, styles[variant], styles[size], className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classNames}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  )
}
