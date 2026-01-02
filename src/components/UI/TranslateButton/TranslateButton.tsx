"use client"

import type React from "react"
import { SiGoogletranslate } from "react-icons/si"
import styles from "./TranslateButton.module.css"

interface TranslateButtonProps {
  currentLanguage: "es" | "en"
  onClick: () => void
  disabled?: boolean
}

const TranslateButton: React.FC<TranslateButtonProps> = ({ currentLanguage, onClick, disabled = false }) => {
  const targetLanguage = currentLanguage === "es" ? "EN" : "ES"

  return (
    <button onClick={onClick} disabled={disabled} className={styles.translateButton}>
      <SiGoogletranslate className={styles.icon} />
      <span className={styles.text}>Traducir a {targetLanguage}</span>
    </button>
  )
}

export default TranslateButton
