"use client"

import type React from "react"
import styles from "./TranslateButton.module.css"
import { FiGlobe } from "react-icons/fi"

interface TranslateButtonProps {
  currentLanguage: "es" | "en"
  onClick: () => void
  variant?: "primary" | "secondary" | "outline"
  disabled?: boolean
}

const TranslateButton: React.FC<TranslateButtonProps> = ({
  currentLanguage,
  onClick,
  variant = "secondary",
  disabled = false,
}) => {
  const targetLanguage = currentLanguage === "es" ? "EN" : "ES"

  return (
    <button onClick={onClick} disabled={disabled} className={`${styles.translateButton} ${styles[variant]}`}>
      <FiGlobe className={styles.icon} />
      <span className={styles.text}>Traducir a {targetLanguage}</span>
    </button>
  )
}

export default TranslateButton
