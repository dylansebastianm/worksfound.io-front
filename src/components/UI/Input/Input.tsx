import { type InputHTMLAttributes, forwardRef, type ReactNode } from "react"
import styles from "./Input.module.css"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  fullWidth?: boolean
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, className = "", icon, ...props }, ref) => {
    const wrapperClasses = [styles.inputWrapper, fullWidth ? styles.fullWidth : ""].filter(Boolean).join(" ")

    const inputClasses = [
      styles.input, 
      error ? styles.error : "", 
      icon ? styles.inputWithIcon : "",
      className
    ].filter(Boolean).join(" ")

    return (
      <div className={wrapperClasses}>
        {label && (
          <label className={styles.label} htmlFor={props.id}>
            {label}
          </label>
        )}
        <div className={styles.inputContainer}>
          {icon && (
            <div className={styles.iconWrapper}>
              {icon}
            </div>
          )}
          <input ref={ref} className={inputClasses} {...props} />
        </div>
        {/* Reservar espacio para evitar que el layout "salte" al mostrar errores */}
        <span className={styles.errorText} style={{ visibility: error ? "visible" : "hidden" }}>
          {error || " "}
        </span>
      </div>
    )
  },
)

Input.displayName = "Input"
