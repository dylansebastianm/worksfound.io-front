"use client"

import type React from "react"
import styles from "./Checkbox.module.css"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  error?: string
}

const Checkbox: React.FC<CheckboxProps> = ({ label, error, className = "", ...props }) => {
  const wrapperClasses = [styles.checkboxWrapper, className].filter(Boolean).join(" ")

  return (
    <div className={wrapperClasses}>
      <label className={styles.checkboxLabel}>
        <input type="checkbox" className={styles.checkbox} {...props} />
        {label && <span className={styles.labelText}>{label}</span>}
      </label>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  )
}

export { Checkbox }

