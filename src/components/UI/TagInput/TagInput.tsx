"use client"

import { useState, type KeyboardEvent } from "react"
import { IoClose } from "react-icons/io5"
import styles from "./TagInput.module.css"

interface TagInputProps {
  label?: string
  placeholder?: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
  maxTags?: number
}

export const TagInput = ({ label, placeholder, tags, onTagsChange, maxTags }: TagInputProps) => {
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
            placeholder={tags.length === 0 ? placeholder : ""}
            className={styles.input}
          />
        </div>
      </div>
    </div>
  )
}
