"use client"

import { FiX } from "react-icons/fi"
import styles from "./SimpleLogModal.module.css"

export function SimpleLogModal({
  isOpen,
  title,
  content,
  onClose,
}: {
  isOpen: boolean
  title: string
  content: string
  onClose: () => void
}) {
  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
            <FiX />
          </button>
        </div>
        <div className={styles.content}>
          <pre className={styles.pre}>{content || "-"}</pre>
        </div>
      </div>
    </div>
  )
}


