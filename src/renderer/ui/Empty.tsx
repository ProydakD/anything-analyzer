import React from 'react'
import { useLocale } from '../i18n'
import styles from './Empty.module.css'

export interface EmptyProps {
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const Empty: React.FC<EmptyProps> = ({
  description,
  icon,
  children,
  className,
  style,
}) => {
  const { t } = useLocale()

  return (
    <div className={`${styles.empty} ${className ?? ''}`} style={style}>
      <div className={styles.icon}>
        {icon || (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        )}
      </div>
      <div className={styles.text}>{description ?? t('common.noData')}</div>
      {children}
    </div>
  )
}
