import React from 'react'
import styles from './Skeleton.module.css'

type SkeletonShape = 'text' | 'heading' | 'circle' | 'rect' | 'pill'

interface SkeletonProps {
  shape?: SkeletonShape
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({
  shape = 'rect',
  width,
  height,
  className,
  style: extraStyle
}: SkeletonProps) {
  const classNames = [styles.skeleton, styles[shape], className ?? '']
    .filter(Boolean)
    .join(' ')

  const style: React.CSSProperties = { ...extraStyle }
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height

  return <div className={classNames} style={style} aria-hidden="true" />
}

/** Pre-built card skeleton for list/grid loading states */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className={styles.card} aria-hidden="true">
      <Skeleton shape="heading" width="60%" height={20} />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          shape="text"
          width={i === lines - 1 ? '75%' : '100%'}
          height={14}
        />
      ))}
    </div>
  )
}
