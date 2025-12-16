"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { IoChevronDown } from "react-icons/io5"
import styles from "./Select.module.css"

export interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  label?: string
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  fullWidth?: boolean
  disabled?: boolean
  children?: never
}

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  fullWidth?: boolean
  options?: never
  children: React.ReactNode
}

type SelectProps = CustomSelectProps | NativeSelectProps

const Select: React.FC<SelectProps> = (props) => {
  if (props.children) {
    return <NativeSelect {...(props as NativeSelectProps)} />
  }

  return <CustomSelect {...(props as CustomSelectProps)} />
}

const NativeSelect: React.FC<NativeSelectProps> = ({ label, error, fullWidth = false, className = "", ...props }) => {
  const wrapperClasses = [styles.selectWrapper, fullWidth ? styles.fullWidth : ""].filter(Boolean).join(" ")

  const selectClasses = [styles.nativeSelect, error ? styles.error : "", className].filter(Boolean).join(" ")

  return (
    <div className={wrapperClasses}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.nativeSelectContainer}>
        <select className={selectClasses} {...props}>
          {props.children}
        </select>
        <IoChevronDown className={styles.nativeIcon} />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  )
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  error,
  fullWidth = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const wrapperClasses = [styles.selectWrapper, fullWidth ? styles.fullWidth : ""].filter(Boolean).join(" ")

  const buttonClasses = [styles.selectButton, error ? styles.error : "", disabled ? styles.disabled : ""]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={wrapperClasses}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.selectContainer} ref={selectRef}>
        <button
          type="button"
          className={buttonClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className={selectedOption ? styles.selectedText : styles.placeholder}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <IoChevronDown className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`} />
        </button>

        {isOpen && !disabled && (
          <div className={styles.dropdown}>
            {options.map((option) => (
              <div
                key={option.value}
                className={`${styles.option} ${option.value === value ? styles.optionSelected : ""}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  )
}

export { Select }
