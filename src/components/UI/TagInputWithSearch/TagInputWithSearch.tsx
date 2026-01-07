"use client"
import { useState, useRef, useEffect } from "react"
import { IoCloseOutline, IoChevronDownOutline, IoSearchOutline } from "react-icons/io5"
import styles from "./TagInputWithSearch.module.css"

export interface TagInputWithSearchOption {
  value: string
  label: string
}

interface TagInputWithSearchProps {
  label?: string
  options: TagInputWithSearchOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
  maxResults?: number
}

export default function TagInputWithSearch({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Buscar y agregar...",
  disabled = false,
  maxResults = 50,
}: TagInputWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredOptions, setFilteredOptions] = useState<TagInputWithSearchOption[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter options based on search term and exclude already selected
  useEffect(() => {
    if (searchTerm.trim() === "") {
      const unselected = options.filter((opt) => !selectedValues.includes(opt.value))
      setFilteredOptions(unselected.slice(0, maxResults))
    } else {
      const filtered = options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedValues.includes(option.value),
      )
      setFilteredOptions(filtered.slice(0, maxResults))
    }
  }, [searchTerm, options, selectedValues, maxResults])

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
    onChange([...selectedValues, optionValue])
    setSearchTerm("")
    setIsOpen(false)
  }

  const handleRemove = (valueToRemove: string) => {
    onChange(selectedValues.filter((v) => v !== valueToRemove))
  }

  const toggleOpen = () => {
    if (disabled) return
    setIsOpen((prev) => {
      const next = !prev
      if (!next) setSearchTerm("")
      return next
    })
  }

  const getOptionLabel = (value: string) => {
    return options.find((opt) => opt.value === value)?.label || value
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {label && <label className={styles.label}>{label}</label>}

      <div
        className={`${styles.container} ${disabled ? styles.disabled : ""}`}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === "Escape") {
            setIsOpen(false)
            setSearchTerm("")
            inputRef.current?.blur()
          }
        }}
        tabIndex={disabled ? -1 : 0}
        role="group"
      >
        {/* Selected tags */}
        {selectedValues.length > 0 && (
          <div className={styles.tagsContainer}>
            {selectedValues.map((value) => (
              <div key={value} className={styles.tag}>
                <span>{getOptionLabel(value)}</span>
                {!disabled && (
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(value)
                    }}
                    aria-label={`Eliminar ${getOptionLabel(value)}`}
                  >
                    <IoCloseOutline />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={() => !disabled && setIsOpen(true)}
            onFocus={() => !disabled && setIsOpen(true)}
            placeholder={!searchTerm ? placeholder : ""}
            disabled={disabled}
          />
          <button
            type="button"
            className={styles.chevronButton}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleOpen()
            }}
            aria-label={isOpen ? "Cerrar" : "Abrir"}
            disabled={disabled}
          >
            <IoChevronDownOutline className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ""}`} />
          </button>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className={styles.dropdown}>
            {searchTerm && (
              <div className={styles.searchHeader}>
                <IoSearchOutline className={styles.searchIcon} />
                <span>Buscando: "{searchTerm}"</span>
              </div>
            )}

            <div className={styles.optionsList}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div key={option.value} className={styles.option} onClick={() => handleSelect(option.value)}>
                    {option.label}
                  </div>
                ))
              ) : (
                <div className={styles.noResults}>
                  {searchTerm ? "No se encontraron resultados" : "No hay más opciones disponibles"}
                </div>
              )}
            </div>

            {searchTerm && filteredOptions.length === maxResults && (
              <div className={styles.moreResults}>Mostrando primeros {maxResults} resultados...</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
