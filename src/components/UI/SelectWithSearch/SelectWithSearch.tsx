"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { FiChevronDown, FiX, FiSearch } from "react-icons/fi"
import styles from "./SelectWithSearch.module.css"

export interface SelectWithSearchOption {
  value: string
  label: string
}

interface SelectWithSearchProps {
  label?: string
  options: SelectWithSearchOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  fullWidth?: boolean
}

// Changed to default export to match import pattern
export default function SelectWithSearch({
  label,
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  disabled = false,
  error,
  fullWidth = false,
}: SelectWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredOptions, setFilteredOptions] = useState(options)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Find selected option label
  const selectedOption = options.find((opt) => opt.value === value)

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOptions(options.slice(0, 50)) // Show first 50 by default
    } else {
      const filtered = options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredOptions(filtered.slice(0, 50)) // Limit to 50 results
    }
  }, [searchTerm, options])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setSearchTerm("")
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen((prev) => {
        const next = !prev
        if (next) {
          setTimeout(() => inputRef.current?.focus(), 0)
        } else {
          setSearchTerm("")
        }
        return next
      })
    }
  }

  const wrapperClasses = [styles.wrapper, fullWidth ? styles.fullWidth : ""].filter(Boolean).join(" ")

  const triggerClasses = [
    styles.trigger,
    isOpen ? styles.open : "",
    error ? styles.error : "",
    disabled ? styles.disabled : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={wrapperClasses} ref={wrapperRef}>
      {label && <label className={styles.label}>{label}</label>}

      <div
        className={triggerClasses}
        onClick={handleToggle}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleToggle()
          }
          if (e.key === "Escape") {
            setIsOpen(false)
            setSearchTerm("")
          }
        }}
      >
        <span className={selectedOption ? styles.selectedText : styles.placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={styles.icons}>
          {value && !disabled && (
            <button type="button" className={styles.clearButton} onClick={handleClear} aria-label="Limpiar selección">
              <FiX />
            </button>
          )}
          <FiChevronDown className={styles.chevron} />
        </div>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchContainer}>
            <FiSearch className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar tecnología..."
            />
          </div>

          <div className={styles.optionsList}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`${styles.option} ${value === option.value ? styles.selected : ""}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className={styles.noResults}>No se encontraron resultados</div>
            )}
          </div>

          {searchTerm && filteredOptions.length === 50 && (
            <div className={styles.moreResults}>Mostrando primeros 50 resultados. Refina tu búsqueda...</div>
          )}
        </div>
      )}

      {/* Reservar espacio para evitar que el layout “salte” al mostrar errores */}
      <span className={styles.errorText} style={{ visibility: error ? "visible" : "hidden" }}>
        {error || " "}
      </span>
    </div>
  )
}
