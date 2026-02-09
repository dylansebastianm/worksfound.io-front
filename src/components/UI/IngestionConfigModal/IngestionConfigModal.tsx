"use client"
import { useState, useEffect } from "react"
import styles from "./IngestionConfigModal.module.css"
import { analyzeIngestionConfig } from "@/lib/ingestion"

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
  /** Smart Harvest: tipo de URL */
  type?: "BASE" | "HARVEST"
  /** Smart Harvest: tipo de harvest (ej. SortByDate) */
  harvest_type?: string
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
  const [analysis, setAnalysis] = useState<any | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

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

  const normalizeQueueItem = (item: any): GeneratedQueueItem | null => {
    if (!item) return null
    if (typeof item === "string") return { url: item, results_count: null }
    if (typeof item === "object" && typeof item.url === "string") return item as GeneratedQueueItem
    return null
  }

  const getScrapeable = (item: GeneratedQueueItem | null) => {
    if (!item) return 0
    const sc = item.scrapeable_count
    if (typeof sc === "number" && Number.isFinite(sc)) return sc
    const rc = item.results_count
    if (typeof rc === "number" && Number.isFinite(rc)) return Math.min(rc, 999)
    return 0
  }

  const normalizedQueue = (Array.isArray(queue) ? queue : []).map(normalizeQueueItem).filter(Boolean) as GeneratedQueueItem[]
  const baseItems = normalizedQueue.filter((x) => (x.type || "BASE") !== "HARVEST")
  const harvestItems = normalizedQueue.filter((x) => (x.type || "BASE") === "HARVEST")
  const baseTotal = baseItems.reduce((acc, x) => acc + getScrapeable(x), 0)
  const harvestTotal = harvestItems.reduce((acc, x) => acc + getScrapeable(x), 0)
  const totalBudget = baseTotal + harvestTotal
  const baseCoveragePct = seedTotal ? (baseTotal / seedTotal) * 100 : null
  const harvestCoveragePct = seedTotal ? (harvestTotal / seedTotal) * 100 : null
  const totalCoveragePct = seedTotal ? (totalBudget / seedTotal) * 100 : null

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

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await analyzeIngestionConfig(ingestUrl)
      setAnalysis(res)
    } finally {
      setIsAnalyzing(false)
    }
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
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleAnalyze}
                disabled={isAnalyzing || isSaving || !ingestUrl}
                style={{ padding: "8px 12px" }}
              >
                {isAnalyzing ? "Analizando…" : "Analizar (Smart Harvest)"}
              </button>
            </div>
          </div>

          {analysis?.success && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Pre‑Ingesta (Smart Harvest)</label>
              <div className={styles.helpText}>
                <div>
                  Total de mercado detectado:{" "}
                  <strong>{Number(analysis.seedTotalResults || 0).toLocaleString("es-ES")}</strong>
                </div>
                <div style={{ marginTop: 6 }}>
                  Cobertura Base Garantizada:{" "}
                  <strong>{Number(analysis.estimatedBaseCoveragePct || 0).toFixed(1)}%</strong>
                </div>
                <div style={{ marginTop: 8, height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, Number(analysis.estimatedBaseCoveragePct || 0)))}%`,
                      height: "100%",
                      background: "#22c55e",
                    }}
                  />
                </div>
                <div style={{ marginTop: 10 }}>
                  Estrategia de Pesca (Harvest):{" "}
                  <strong>{Array.isArray(analysis.strategyMap?.harvest) ? analysis.strategyMap.harvest.length : 0}</strong> URL(s) adicional(es)
                </div>
              </div>
            </div>
          )}
          {analysis && !analysis.success && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Pre‑Ingesta (Smart Harvest)</label>
              <p className={styles.helpText} style={{ color: "var(--danger)" }}>
                {analysis.error || "No se pudo analizar la URL."}
              </p>
            </div>
          )}

          {(seedTotal != null || queue.length > 0) && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Plan de Ingesta (desglose de búsqueda)</label>
              {(seedTotal != null || (initialConfig.segmentsTotal != null && initialConfig.segmentsTotal > 0)) && (
                <p className={styles.seedTotal}>
                  {seedTotal != null && (
                    <>Total en URL semilla: <strong>{seedTotal.toLocaleString("es-ES")} resultados</strong></>
                  )}
                  {seedTotal != null && initialConfig.segmentsTotal != null && <><br /></>}
                  {(normalizedQueue.length > 0 || (initialConfig.segmentsTotal != null && initialConfig.segmentsTotal > 0)) && (
                    <>
                      {normalizedQueue.length > 0 ? (
                        <>
                          Total BASE (techo 999): <strong>{baseTotal.toLocaleString("es-ES")}</strong> ·{" "}
                          Total HARVEST (techo 999): <strong>{harvestTotal.toLocaleString("es-ES")}</strong> ·{" "}
                          Total (budget): <strong>{totalBudget.toLocaleString("es-ES")}</strong>
                        </>
                      ) : (
                        <>Total segmentos (suma): <strong>{initialConfig.segmentsTotal?.toLocaleString("es-ES")} resultados</strong></>
                      )}
                    </>
                  )}
                  {seedTotal != null && normalizedQueue.length > 0 && (
                    <>
                      <br />
                      Cobertura BASE (garantizada): <strong>{baseCoveragePct != null ? `${baseCoveragePct.toFixed(1)}%` : "—"}</strong> ·{" "}
                      Cobertura HARVEST (potencial): <strong>{harvestCoveragePct != null ? `${harvestCoveragePct.toFixed(1)}%` : "—"}</strong> ·{" "}
                      Cobertura total (budget): <strong>{totalCoveragePct != null ? `${totalCoveragePct.toFixed(1)}%` : "—"}</strong>
                    </>
                  )}
                </p>
              )}
              {normalizedQueue.length > 0 && (
                <>
                  <p className={styles.helpText}>
                    Tu búsqueda se ha dividido en {normalizedQueue.length} URL(s): <strong>{baseItems.length}</strong> BASE + <strong>{harvestItems.length}</strong> HARVEST.
                  </p>
                  <div className={styles.queueList}>
                    {/* BASE */}
                    {baseItems.slice(0, 20).map((item, i) => {
                      const u = item.url
                      const count = item.results_count
                      const scrapeable = item.scrapeable_count
                      const filters = item?.filters
                      const urlType = item.type || "BASE"
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
                            {(urlType || filterLabels) && (
                              <span className={styles.queueFilters}>
                                {urlType ? `[${urlType}] ` : ""}
                                {filterLabels || ""}
                              </span>
                            )}
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
                    {baseItems.length > 20 && <p className={styles.helpText}>… y {baseItems.length - 20} BASE más</p>}

                    {/* HARVEST */}
                    {harvestItems.length > 0 && (
                      <>
                        <div style={{ marginTop: 12, fontWeight: 700 }}>Harvest (pesca excedente)</div>
                        {harvestItems.slice(0, 20).map((item, idx) => {
                          const u = item.url
                          const count = item.results_count
                          const scrapeable = item.scrapeable_count
                          const filters = item?.filters
                          const urlType = item.type || "HARVEST"
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
                            <div key={`harvest-${idx}`} className={styles.queueItem}>
                              <span className={styles.queueOrder}>{baseItems.length + idx + 1}.</span>
                              <div className={styles.queueItemContent}>
                                {(urlType || filterLabels) && (
                                  <span className={styles.queueFilters}>
                                    {urlType ? `[${urlType}] ` : ""}
                                    {filterLabels || ""}
                                  </span>
                                )}
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
                        {harvestItems.length > 20 && <p className={styles.helpText}>… y {harvestItems.length - 20} HARVEST más</p>}
                      </>
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
