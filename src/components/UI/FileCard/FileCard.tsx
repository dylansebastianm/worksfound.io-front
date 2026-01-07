"use client"

import type React from "react"
import { FiFileText, FiDownload, FiX } from "react-icons/fi"
import styles from "./FileCard.module.css"

interface FileCardProps {
  fileName: string
  fileUrl?: string
  file?: File // Archivo local para descargar
  onDelete?: () => void
  onDownload?: () => void
  showDownload?: boolean
  className?: string
}

export const FileCard: React.FC<FileCardProps> = ({
  fileName,
  fileUrl,
  file,
  onDelete,
  onDownload,
  showDownload = true,
  className = "",
}) => {
  const handleDownload = () => {
    if (onDownload) {
      onDownload()
    } else if (file) {
      // Descargar archivo local creando una URL temporal
      const url = URL.createObjectURL(file)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url) // Limpiar la URL temporal
    } else if (fileUrl) {
      // Descargar el archivo desde la URL
      const link = document.createElement("a")
      link.href = fileUrl
      link.download = fileName
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className={`${styles.fileCard} ${className}`}>
      <FiFileText className={styles.fileCardIcon} />
      <span className={styles.fileCardName} title={fileName}>
        {fileName}
      </span>
      <div className={styles.fileCardActions}>
        {showDownload && (fileUrl || file || onDownload) && (
          <button
            type="button"
            className={styles.fileCardButtonDownload}
            onClick={handleDownload}
            title="Descargar archivo"
          >
            <FiDownload />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className={styles.fileCardButtonDelete}
            onClick={onDelete}
            title="Eliminar archivo"
          >
            <FiX />
          </button>
        )}
      </div>
    </div>
  )
}

