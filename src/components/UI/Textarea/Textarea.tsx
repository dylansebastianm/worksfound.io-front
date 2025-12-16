import { type TextareaHTMLAttributes, forwardRef } from "react"
import styles from "./Textarea.module.css"

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth = false, className = "", ...props }, ref) => {
    const wrapperClasses = [styles.textareaWrapper, fullWidth ? styles.fullWidth : ""].filter(Boolean).join(" ")

    const textareaClasses = [styles.textarea, error ? styles.error : "", className].filter(Boolean).join(" ")

    return (
      <div className={wrapperClasses}>
        {label && (
          <label className={styles.label} htmlFor={props.id}>
            {label}
          </label>
        )}
        <textarea ref={ref} className={textareaClasses} {...props} />
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    )
  },
)

Textarea.displayName = "Textarea"
