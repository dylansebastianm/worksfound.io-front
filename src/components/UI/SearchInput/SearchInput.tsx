"use client"

import type React from "react"
import { FiSearch } from "react-icons/fi"
import styles from "./SearchInput.module.css"

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

const SearchInput: React.FC<SearchInputProps> = ({
  label,
  error,
  fullWidth = false,
  className = "",
  ...props
}) => {
  const wrapperClasses = [styles.searchInputWrapper, fullWidth ? styles.fullWidth : "", className]
    .filter(Boolean)
    .join(" ")

  const inputClasses = [styles.searchInput, error ? styles.error : ""].filter(Boolean).join(" ")

  return (
    <div className={wrapperClasses}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.searchContainer}>
        <FiSearch className={styles.searchIcon} />
        <input type="text" className={inputClasses} {...props} />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  )
}

export { SearchInput }

