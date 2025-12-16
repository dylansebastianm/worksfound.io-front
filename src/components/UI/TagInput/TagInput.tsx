"use client"

import React, { useState, type KeyboardEvent } from "react"
import { IoClose } from "react-icons/io5"
import styles from "./TagInput.module.css"

interface TagInputProps {
  label?: string
  placeholder?: string
  placeholderExamples?: string[]
  helpText?: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
  maxTags?: number
}

export const TagInput = ({ label, placeholder, placeholderExamples, helpText, tags, onTagsChange, maxTags }: TagInputProps) => {
  const [inputValue, setInputValue] = useState("")

  const addTag = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue && !tags.includes(trimmedValue)) {
      if (maxTags && tags.length >= maxTags) return
      onTagsChange([...tags, trimmedValue])
      setInputValue("")
    }
  }

  const removeTag = (indexToRemove: number) => {
    onTagsChange(tags.filter((_, index) => index !== indexToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  // Generar placeholder dinámico basado en ejemplos
  const placeholderText = React.useMemo(() => {
    // Solo mostrar placeholder si no hay tags
    if (tags.length > 0) return ""
    if (placeholderExamples && placeholderExamples.length > 0) {
      return placeholderExamples.join(", ")
    }
    return placeholder || ""
  }, [tags, placeholderExamples, placeholder])

  return (
    <div className={styles.tagInputWrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputContainer}>
        <div className={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <span key={index} className={styles.tag}>
              {tag}
              <button type="button" onClick={() => removeTag(index)} className={styles.removeButton}>
                <IoClose />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addTag}
            placeholder={placeholderText}
            className={styles.input}
          />
        </div>
      </div>
      {helpText && <p className={styles.helpText}>{helpText}</p>}
    </div>
  )
}
