"use client"
import { useState, useEffect } from "react"
import styles from "./IngestionConfigModal.module.css"
import {
  analyzeIngestionConfig,
  cancelIngestionExplorer,
  getIngestionExplorerStatus,
  getIngestionCountryDetail,
  type GetIngestionExplorerStatusResponse,
  type IngestionCountryDetailResponse,
} from "@/lib/ingestion"

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
  /** Estado del explorador (productor) */
  explorerExecutionId?: string | null
  explorerStatus?: string | null
  explorerError?: string | null
  explorerStartedAt?: string | null
  explorerFinishedAt?: string | null
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
  const [isCancellingExplorer, setIsCancellingExplorer] = useState(false)
  const [live, setLive] = useState<GetIngestionExplorerStatusResponse | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [countryDetail, setCountryDetail] = useState<IngestionCountryDetailResponse | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [pollError, setPollError] = useState<string | null>(null)

  // Al abrir el modal, sincronizar estado con la config actual para mostrar siempre la URL/config guardada
  useEffect(() => {
    if (isOpen) {
      setIngestUrl(initialConfig.url)
      setIngestLimit(initialConfig.limit)
      setScheduledTime(initialConfig.scheduledTime)
      setAutoSchedule(initialConfig.autoSchedule)
      setDetailError(null)
    }
  }, [isOpen, initialConfig.url, initialConfig.limit, initialConfig.scheduledTime, initialConfig.autoSchedule])

  // Polling del explorador (productor) para actualizar por país/batch.
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    let inflight = false
    let aborter: AbortController | null = null
    const load = async () => {
      if (cancelled || inflight) return
      inflight = true
      try {
        // Cancelar el request anterior si sigue colgado.
        if (aborter) aborter.abort()
        aborter = new AbortController()
        const res = await getIngestionExplorerStatus(200, { signal: aborter.signal })
        if (cancelled) return
        setLive(res)
        setPollError(null)
      } catch (e: any) {
        if (cancelled) return
        setPollError("El polling al backend no está respondiendo (request colgado).")
      } finally {
        inflight = false
      }
    }
    load()
    const id = setInterval(load, 4000)
    return () => {
      cancelled = true
      if (aborter) aborter.abort()
      clearInterval(id)
    }
  }, [isOpen])

  // Elegir país activo (por defecto: el último visto).
  useEffect(() => {
    const countries = (live?.countries || []).map((c) => c.country).filter(Boolean)
    if (countries.length === 0) return
    if (!selectedCountry || !countries.includes(selectedCountry)) {
      setSelectedCountry(countries[countries.length - 1] || null)
    }
  }, [live?.execution_id, live?.countries, selectedCountry])

  // Cargar detalle del país seleccionado desde ingestion_batches.
  useEffect(() => {
    if (!isOpen) return
    const execId = live?.execution_id
    if (!execId || !selectedCountry) return
    let cancelled = false
    setIsLoadingDetail(true)
    setDetailError(null)
    setCountryDetail(null)
    getIngestionCountryDetail(execId, selectedCountry)
      .then((res) => {
        if (cancelled) return
        if (res.success && res.detail) {
          setCountryDetail(res.detail)
        } else {
          setDetailError(res.error || "No se pudo cargar el detalle del país.")
        }
      })
      .catch(() => {
        if (cancelled) return
        setDetailError("No se pudo cargar el detalle del país.")
      })
      .finally(() => {
        if (cancelled) return
        setIsLoadingDetail(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, live?.execution_id, selectedCountry])

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

  const handleCancelExplorer = async () => {
    setIsCancellingExplorer(true)
    try {
      const res = await cancelIngestionExplorer()
      if (res.success) {
        setAnalysis({
          success: false,
          cancelled: true,
          error: res.was_running
            ? "Explorador cancelado correctamente."
            : "No había un explorador corriendo en este momento.",
        })
      } else {
        setAnalysis({
          success: false,
          error: res.error || "No se pudo cancelar el explorador.",
        })
      }
    } finally {
      setIsCancellingExplorer(false)
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
                disabled={isAnalyzing || isSaving || isCancellingExplorer || !ingestUrl}
                style={{ padding: "8px 12px" }}
              >
                {isAnalyzing ? "Analizando…" : "Analizar (Smart Harvest)"}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancelExplorer}
                disabled={isCancellingExplorer}
                style={{ padding: "8px 12px" }}
              >
                {isCancellingExplorer ? "Cancelando explorador…" : "Cancelar Explorador"}
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
            <label className={styles.label}>Exploración en vivo (por país/batch)</label>
            {!live?.success && (
              <p className={styles.helpText}>{live?.error ? `No se pudo cargar progreso: ${live.error}` : "—"}</p>
            )}
            {live?.success && !live.execution_id && <p className={styles.helpText}>No hay un explorador activo en este momento.</p>}
            {live?.success && live.execution_id && (
              <div className={styles.liveWrap}>
                {pollError && <div className={styles.liveError}>{pollError}</div>}
                {live.stalled && (
                  <div className={styles.liveError}>
                    {live.stalled_reason || "El explorador parece trabado (sin progreso)."}
                  </div>
                )}
                <div className={styles.liveStats}>
                  <div>
                    <div className={styles.liveK}>execution_id</div>
                    <div className={styles.liveV}>{live.execution_id}</div>
                  </div>
                  <div>
                    <div className={styles.liveK}>estado</div>
                    <div className={styles.liveV}>{live.status || (live.running ? "RUNNING" : "—")}</div>
                  </div>
                  <div>
                    <div className={styles.liveK}>países</div>
                    <div className={styles.liveV}>
                      {live.totals?.countries_seen ?? 0}
                      {live.totals?.countries_limit ? ` / ${live.totals.countries_limit}` : ""}
                    </div>
                  </div>
                  <div>
                    <div className={styles.liveK}>límite (TEST_COUNTRY_LIMIT)</div>
                    <div className={styles.liveV}>{live.totals?.countries_limit ?? "—"}</div>
                  </div>
                  <div>
                    <div className={styles.liveK}>URL semilla (global)</div>
                    <div className={styles.liveV}>{live.seed_url ? "Disponible" : "—"}</div>
                  </div>
                  <div>
                    <div className={styles.liveK}>total URL semilla (global)</div>
                    <div className={styles.liveV}>
                      {typeof live.totals?.seed_url_total_results === "number"
                        ? Number(live.totals.seed_url_total_results).toLocaleString("es-ES")
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className={styles.liveK}>total semilla (sum)</div>
                    <div className={styles.liveV}>{Number(live.totals?.audit_total_sum ?? 0).toLocaleString("es-ES")}</div>
                  </div>
                  <div>
                    <div className={styles.liveK}>budget (cap 999)</div>
                    <div className={styles.liveV}>{Number(live.totals?.segments_budget_sum ?? 0).toLocaleString("es-ES")}</div>
                  </div>
                  <div>
                    <div className={styles.liveK}>% cobertura</div>
                    <div className={styles.liveV}>
                      {live.totals?.global_coverage_vs_seed_pct != null
                        ? `${Number(live.totals.global_coverage_vs_seed_pct).toFixed(1)}% (global vs URL semilla)`
                        : live.totals?.coverage_vs_audit_sum_pct != null
                          ? `${Number(live.totals.coverage_vs_audit_sum_pct).toFixed(1)}% (sum países vs sum audits)`
                          : "—"}
                    </div>
                  </div>
                </div>

                {live.error && <div className={styles.liveError}>{live.error}</div>}

                <div className={styles.countryTabs} role="tablist" aria-label="Países explorados">
                  {(live.countries || []).map((c) => {
                    const active = c.country === selectedCountry
                    const cov = c.segmentation_coverage_pct != null ? `${Number(c.segmentation_coverage_pct).toFixed(1)}%` : "—"
                    const subtitle = `${Number(c.audit_total || 0).toLocaleString("es-ES")} · ${c.segments_count || 0} seg · cov ${cov}`
                    return (
                      <button
                        key={c.country}
                        type="button"
                        className={`${styles.countryTab} ${active ? styles.countryTabActive : ""}`}
                        onClick={() => setSelectedCountry(c.country)}
                      >
                        <div className={styles.countryName}>{c.country}</div>
                        <div className={styles.countryMeta}>{subtitle}</div>
                        <div className={styles.countryMeta}>
                          P:{c.segments_pending} · Pr:{c.segments_processing} · C:{c.segments_completed} · F:{c.segments_failed}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className={styles.liveDetail}>
                  {!selectedCountry && <p className={styles.helpText}>Selecciona un país para ver detalle.</p>}
                  {selectedCountry && isLoadingDetail && <p className={styles.helpText}>Cargando detalle de {selectedCountry}…</p>}
                  {selectedCountry && !isLoadingDetail && detailError && (
                    <p className={styles.helpText} style={{ color: "var(--danger)" }}>
                      {detailError}
                    </p>
                  )}
                  {selectedCountry && !isLoadingDetail && countryDetail && (
                    <>
                      <div className={styles.detailHeaderRow}>
                        <div>
                          <strong>{countryDetail.header.country}</strong>
                          <span className={styles.detailHeaderMeta}>
                            {" "}· audit {Number(countryDetail.header.audit_total || 0).toLocaleString("es-ES")}
                            {" "}· insertado {Number(countryDetail.header.inserted_total || 0).toLocaleString("es-ES")}
                          </span>
                          {countryDetail.header.audit_url && (
                            <div className={styles.countryMeta} style={{ marginTop: 6 }}>
                              URL audit:{" "}
                              <a href={countryDetail.header.audit_url} target="_blank" rel="noopener noreferrer">
                                {countryDetail.header.audit_url.length > 90 ? countryDetail.header.audit_url.slice(0, 90) + "…" : countryDetail.header.audit_url}
                              </a>
                            </div>
                          )}
                        </div>
                        <div className={styles.queueCount}>{countryDetail.batches?.length || 0} batch(es)</div>
                      </div>
                      <div className={styles.batchList}>
                        {(countryDetail.batches || []).map((b) => (
                          <div key={b.batch_id} className={styles.batchRow}>
                            <div className={styles.batchTop}>
                              <div className={styles.batchStatus}>{b.status}</div>
                              <div className={styles.batchCounts}>
                                exp {Number(b.expected_count || 0).toLocaleString("es-ES")} · ins {Number(b.inserted_count || 0).toLocaleString("es-ES")} · eff {Number(b.efficiency_pct || 0).toFixed(1)}%
                              </div>
                            </div>
                            <div className={styles.batchUrl}>{b.original_url}</div>
                            {Array.isArray(b.filters_readable) && b.filters_readable.length > 0 && (
                              <div className={styles.batchFilters}>{b.filters_readable.join(" · ")}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

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
