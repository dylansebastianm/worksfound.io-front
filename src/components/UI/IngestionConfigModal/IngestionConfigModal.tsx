"use client"
import { useState, useEffect } from "react"
import styles from "./IngestionConfigModal.module.css"

interface IngestionConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: IngestionConfig) => void
  initialConfig?: IngestionConfig
  isSaving?: boolean
}

export interface GeneratedQueueItem {
  url: string
  results_count: number | null
  /** Máximo a scrapear por esta URL (min(results_count, 999)) */
  scrapeable_count?: number
  /** Filtros aplicados (modalidad, tipo empleo, experiencia, fecha publicación) */
  filters?: {
    work_type?: string
    job_type?: string
    experience_level?: string
    time_posted?: string
    keyword?: string
    sortBy?: string
    harvest?: string
  }
}

export interface IngestionConfig {
  url: string
  limit: number
  scheduledTime: string
  autoSchedule: boolean
  /** Total resultados en la URL semilla */
  seedTotalResults?: number | null
  /** Plan de ingesta: URL + conteo por segmento */
  generatedQueue?: GeneratedQueueItem[] | null
  /** Suma de results_count de todos los segmentos */
  segmentsTotal?: number | null
  /** Porcentaje de cobertura (segments / seed * 100) */
  coveragePercent?: number | null
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
  isSaving = false,
}: IngestionConfigModalProps) {
  const [ingestUrl, setIngestUrl] = useState(initialConfig.url)
  const [ingestLimit, setIngestLimit] = useState(initialConfig.limit)
  const [scheduledTime, setScheduledTime] = useState(initialConfig.scheduledTime)
  const [autoSchedule, setAutoSchedule] = useState(initialConfig.autoSchedule)

  // Al abrir el modal, sincronizar estado con la config actual para mostrar siempre la URL/config guardada
  useEffect(() => {
    if (isOpen) {
      setIngestUrl(initialConfig.url)
      setIngestLimit(initialConfig.limit)
      setScheduledTime(initialConfig.scheduledTime)
      setAutoSchedule(initialConfig.autoSchedule)
    }
  }, [isOpen, initialConfig.url, initialConfig.limit, initialConfig.scheduledTime, initialConfig.autoSchedule])

  const queue = initialConfig.generatedQueue ?? []
  const seedTotal = initialConfig.seedTotalResults ?? null

  if (!isOpen) return null

  const handleSave = () => {
    onSave({
      url: ingestUrl,
      limit: ingestLimit,
      scheduledTime,
      autoSchedule,
      seedTotalResults: seedTotal,
      generatedQueue: queue,
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
            <label className={styles.label}>URL de Ingesta (semilla)</label>
            <input
              type="text"
              className={styles.input}
              value={ingestUrl}
              onChange={(e) => setIngestUrl(e.target.value)}
              placeholder="https://www.linkedin.com/jobs/search"
            />
          </div>

          {(seedTotal != null || queue.length > 0) && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Plan de Ingesta (desglose de búsqueda)</label>
              {(seedTotal != null || (initialConfig.segmentsTotal != null && initialConfig.segmentsTotal > 0)) && (
                <p className={styles.seedTotal}>
                  {seedTotal != null && (
                    <>Total en URL semilla: <strong>{seedTotal.toLocaleString("es-ES")} resultados</strong></>
                  )}
                  {seedTotal != null && initialConfig.segmentsTotal != null && <><br /></>}
                  {initialConfig.segmentsTotal != null && initialConfig.segmentsTotal > 0 && (
                    <>Total segmentos (suma): <strong>{initialConfig.segmentsTotal.toLocaleString("es-ES")} resultados</strong></>
                  )}
                  {(initialConfig.coveragePercent != null || (seedTotal != null && initialConfig.segmentsTotal != null && initialConfig.segmentsTotal > 0)) && (
                    <>
                      <br />
                      Cobertura: <strong>{initialConfig.coveragePercent != null ? `${initialConfig.coveragePercent}%` : `${((initialConfig.segmentsTotal! / seedTotal!) * 100).toFixed(1)}%`}</strong>
                    </>
                  )}
                </p>
              )}
              {queue.length > 0 && (
                <>
                  <p className={styles.helpText}>
                    Tu búsqueda se ha dividido en {queue.length} URL(s) para no superar el límite de LinkedIn (1.000 resultados por búsqueda).
                  </p>
                  <div className={styles.queueList}>
                    {queue.slice(0, 20).map((item, i) => {
                      const u = typeof item === "string" ? item : item.url
                      const count = typeof item === "string" ? null : item.results_count
                      const scrapeable = typeof item === "object" ? item.scrapeable_count : undefined
                      const filters = typeof item === "object" && item?.filters ? item.filters : undefined
                      const filterLabels = filters
                        ? [
                            filters.work_type,
                            filters.job_type,
                            filters.experience_level,
                            filters.keyword ? `kw:${filters.keyword}` : null,
                            filters.sortBy ? `sort:${filters.sortBy}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : null
                      const countLabel =
                        count != null
                          ? scrapeable != null && count > 999
                            ? `${scrapeable.toLocaleString("es-ES")}/${count.toLocaleString("es-ES")} resultados`
                            : `${count.toLocaleString("es-ES")} resultados`
                          : null
                      return (
                        <div key={i} className={styles.queueItem}>
                          <span className={styles.queueOrder}>{i + 1}.</span>
                          <div className={styles.queueItemContent}>
                            {filterLabels && <span className={styles.queueFilters}>{filterLabels}</span>}
                            <div className={styles.queueLinkRow}>
                              <a href={u} target="_blank" rel="noopener noreferrer" className={styles.queueLink} title={u}>
                                {u.length > 60 ? u.slice(0, 60) + "…" : u}
                              </a>
                              {countLabel && <span className={styles.queueCount}>{countLabel}</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {queue.length > 20 && (
                      <p className={styles.helpText}>… y {queue.length - 20} más</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Límite de Resultados</label>
            <input
              type="number"
              className={styles.input}
              value={ingestLimit}
              onChange={(e) => setIngestLimit(Number(e.target.value))}
              min="1"
              max="10000"
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
          <button className={styles.cancelButton} onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Analizando y guardando…" : "Guardar Configuración"}
          </button>
        </div>
      </div>
    </div>
  )
}
