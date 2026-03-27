import React from 'react'
import Link from 'next/link'
import styles from './Card.module.css'

type CardVariant = 'default' | 'elevated' | 'interactive' | 'featured'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

interface BaseCardProps {
  variant?: CardVariant
  padding?: CardPadding
  accentColor?: string
  className?: string
  children: React.ReactNode
}

interface DivCardProps extends BaseCardProps {
  href?: undefined
  onClick?: React.MouseEventHandler<HTMLDivElement>
}

interface LinkCardProps extends BaseCardProps {
  href: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

type CardProps = DivCardProps | LinkCardProps

const paddingClass: Record<CardPadding, string> = {
  none: '',
  sm: styles.paddedSm,
  md: styles.padded,
  lg: styles.paddedLg
}

export function Card({
  variant = 'default',
  padding = 'md',
  accentColor,
  className,
  children,
  href,
  onClick
}: CardProps) {
  const classNames = [
    styles.card,
    styles[variant],
    paddingClass[padding],
    accentColor ? styles.accentBorder : '',
    className ?? ''
  ]
    .filter(Boolean)
    .join(' ')

  const style = accentColor ? ({ '--accent-color': accentColor } as React.CSSProperties) : undefined

  const divClick = onClick as React.MouseEventHandler<HTMLDivElement> | undefined
  const isClickableDiv = Boolean(divClick)

  const handleDivKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!divClick) return
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    divClick(e as unknown as React.MouseEvent<HTMLDivElement>)
  }

  if (href) {
    return (
      <Link
        href={href}
        className={classNames}
        style={style}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
      >
        {children}
      </Link>
    )
  }

  return (
    <div
      className={classNames}
      style={style}
      onClick={divClick}
      onKeyDown={isClickableDiv ? handleDivKeyDown : undefined}
      role={isClickableDiv ? 'button' : undefined}
      tabIndex={isClickableDiv ? 0 : undefined}
    >
      {children}
    </div>
  )
}
