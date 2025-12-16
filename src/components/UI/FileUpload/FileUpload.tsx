"use client"

import type React from "react"
import { useState, useRef } from "react"
import { IoCloudUploadOutline, IoDocumentOutline, IoCloseOutline } from "react-icons/io5"
import styles from "./FileUpload.module.css"

interface FileUploadProps {
  label?: string
  accept?: string
  onChange?: (file: File | null) => void
  value?: File | null
  error?: string
  disabled?: boolean
  placeholder?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = ".pdf,.doc,.docx",
  onChange,
  value,
  error,
  disabled = false,
  placeholder = "Arrastra un archivo o haz clic para seleccionar",
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      onChange?.(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onChange?.(files[0])
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}

      <div
        className={`${styles.uploadArea} ${isDragging ? styles.dragging : ""} ${disabled ? styles.disabled : ""} ${error ? styles.error : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className={styles.input}
        />

        {value ? (
          <div className={styles.fileInfo}>
            <IoDocumentOutline className={styles.fileIcon} />
            <span className={styles.fileName}>{value.name}</span>
            <button type="button" onClick={handleRemove} className={styles.removeButton} disabled={disabled}>
              <IoCloseOutline />
            </button>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <IoCloudUploadOutline className={styles.uploadIcon} />
            <p className={styles.placeholderText}>{placeholder}</p>
            <p className={styles.hint}>Formatos aceptados: {accept}</p>
          </div>
        )}
      </div>

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  )
}
