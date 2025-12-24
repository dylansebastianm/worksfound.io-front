"use client"
import { useState } from "react"
import styles from "./IngestionConfigModal.module.css"

interface IngestionConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: IngestionConfig) => void
  initialConfig?: IngestionConfig
}

export interface IngestionConfig {
  url: string
  limit: number
  scheduledTime: string
  autoSchedule: boolean
}

export default function IngestionConfigModal({
  isOpen,
  onClose,
  onSave,
  initialConfig = {
    url: "https://www.linkedin.com/jobs/search",
    limit: 100,
    scheduledTime: "",
    autoSchedule: false,
  },
}: IngestionConfigModalProps) {
  const [ingestUrl, setIngestUrl] = useState(initialConfig.url)
  const [ingestLimit, setIngestLimit] = useState(initialConfig.limit)
  const [scheduledTime, setScheduledTime] = useState(initialConfig.scheduledTime)
  const [autoSchedule, setAutoSchedule] = useState(initialConfig.autoSchedule)

  if (!isOpen) return null

  const handleSave = () => {
    onSave({
      url: ingestUrl,
      limit: ingestLimit,
      scheduledTime,
      autoSchedule,
    })
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Configuración de Ingesta</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>URL de Ingesta</label>
            <input
              type="text"
              className={styles.input}
              value={ingestUrl}
              onChange={(e) => setIngestUrl(e.target.value)}
              placeholder="https://www.linkedin.com/jobs/search"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Límite de Resultados</label>
            <input
              type="number"
              className={styles.input}
              value={ingestLimit}
              onChange={(e) => setIngestLimit(Number(e.target.value))}
              min="1"
              max="1000"
            />
            <p className={styles.helpText}>Cantidad máxima de ofertas a procesar por ingesta</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Hora de Ejecución</label>
            <input
              type="time"
              className={styles.input}
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              disabled={!autoSchedule}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={autoSchedule}
                onChange={(e) => setAutoSchedule(e.target.checked)}
              />
              <span>Ejecutar automáticamente todos los días</span>
            </label>
            {autoSchedule && (
              <p className={styles.helpText}>
                La ingesta se ejecutará automáticamente todos los días a las {scheduledTime || "00:00"}
              </p>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  )
}
