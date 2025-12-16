"use client"
import type { InputHTMLAttributes } from "react"
import styles from "./Switch.module.css"

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  description?: string
}

export const Switch = ({ label, description, className = "", ...props }: SwitchProps) => {
  const wrapperClasses = [styles.switchWrapper, className].filter(Boolean).join(" ")

  return (
    <div className={wrapperClasses}>
      <div className={styles.content}>
        {label && (
          <label className={styles.label} htmlFor={props.id}>
            {label}
          </label>
        )}
        {description && <span className={styles.description}>{description}</span>}
      </div>
      <label className={styles.switch}>
        <input type="checkbox" {...props} />
        <span className={styles.slider}></span>
      </label>
    </div>
  )
}
