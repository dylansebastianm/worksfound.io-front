"use client"

import type React from "react"
import styles from "./Button.module.css"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "small" | "medium" | "large"
  fullWidth?: boolean
  loading?: boolean
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  loading = false,
  disabled,
  className = "",
  ...props
}) => {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    loading ? styles.loading : "",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <button className={classNames} disabled={disabled || loading} {...props}>
      {loading ? "Cargando..." : children}
    </button>
  )
}

export { Button }
