import { type InputHTMLAttributes, forwardRef } from "react"
import styles from "./Input.module.css"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, className = "", ...props }, ref) => {
    const wrapperClasses = [styles.inputWrapper, fullWidth ? styles.fullWidth : ""].filter(Boolean).join(" ")

    const inputClasses = [styles.input, error ? styles.error : "", className].filter(Boolean).join(" ")

    return (
      <div className={wrapperClasses}>
        {label && (
          <label className={styles.label} htmlFor={props.id}>
            {label}
          </label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    )
  },
)

Input.displayName = "Input"
