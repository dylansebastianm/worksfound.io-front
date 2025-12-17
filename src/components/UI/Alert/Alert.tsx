"use client"

import { useEffect } from "react"
import styles from "./Alert.module.css"

interface AlertProps {
  status: "success" | "error" | "warning" | "info"
  message: string
  onClose: () => void
  duration?: number
}

export const Alert = ({ status, message, onClose, duration = 3000 }: AlertProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className={`${styles.alert} ${styles[status]}`}>
      <span className={styles.message}>{message}</span>
      <button className={styles.closeButton} onClick={onClose}>
        ✕
      </button>
    </div>
  )
}
