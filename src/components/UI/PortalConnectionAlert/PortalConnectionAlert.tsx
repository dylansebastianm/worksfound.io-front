"use client"

import { FiCheck, FiX } from "react-icons/fi"
import styles from "./PortalConnectionAlert.module.css"

interface PortalConnectionAlertProps {
  variant: 'success' | 'error'
  title: string
  message: string
}

export function PortalConnectionAlert({
  variant,
  title,
  message,
}: PortalConnectionAlertProps) {
  return (
    <div className={styles.container}>
      <div className={`${styles.iconWrapper} ${styles[variant]}`}>
        {variant === 'success' ? (
          <FiCheck size={32} className={styles.icon} />
        ) : (
          <FiX size={32} className={styles.icon} />
        )}
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
    </div>
  )
}
