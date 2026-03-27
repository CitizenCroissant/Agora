import React from 'react'
import Link from 'next/link'
import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'coral' | 'teal'
type ButtonSize = 'sm' | 'md' | 'lg'

interface BaseButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  pill?: boolean
  fullWidth?: boolean
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

interface ButtonElementProps extends BaseButtonProps {
  href?: undefined
  type?: 'button' | 'submit' | 'reset'
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

interface LinkButtonProps extends BaseButtonProps {
  href: string
  type?: undefined
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

type ButtonProps = ButtonElementProps | LinkButtonProps

export function Button({
  variant = 'primary',
  size = 'md',
  pill = false,
  fullWidth = false,
  disabled = false,
  className,
  children,
  href,
  type = 'button',
  onClick
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    pill ? styles.pill : '',
    fullWidth ? styles.fullWidth : '',
    className ?? ''
  ]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return (
      <Link
        href={href}
        className={classNames}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
        aria-disabled={disabled}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
    >
      {children}
    </button>
  )
}
