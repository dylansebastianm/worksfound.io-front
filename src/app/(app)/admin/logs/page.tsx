"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { FiChevronUp, FiChevronDown, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiExternalLink, FiImage, FiX, FiEye } from "react-icons/fi"
import { Pagination } from "@/components/UI/Pagination/Pagination"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { Alert } from "@/components/UI/Alert/Alert"
import { Select } from "@/components/UI/Select/Select"
import { getIngestionLogs } from "@/lib/ingestion"
import { getAuthHeaders } from "@/lib/auth"
import type { IngestionLog, SmartHarvestSearchDetail, SmartHarvestExecutionLogItem, SearchDetailItem } from "@/types/ingestion"
import styles from "./logs.module.css"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default function AdminLoggingsPage() {
  const [logs, setLogs] = useState<IngestionLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)
  const [sortField, setSortField] = useState<"date_time" | "found" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedStatus, setSelectedStatus] = useState<"Exitoso" | "Fallido" | "En Proceso" | "Error" | "Cancelado" | "Incompleto" | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [screenshotModal, setScreenshotModal] = useState<{ open: boolean; blobUrl: string | null; loading: boolean }>({
    open: false,
    blobUrl: null,
    loading: false,
  })
  const [detailModal, setDetailModal] = useState<{ open: boolean; log: IngestionLog | null }>({
    open: false,
    log: null,
  })
  const screenshotBlobUrlRef = useRef<string | null>(null)
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const itemsPerPage = 10

  // Carga inicial y al cambiar filtros/página
  useEffect(() => {
    loadLogs()
  }, [currentPage, selectedStatus, sortField, sortDirection])

  // Polling cada 1 minuto para actualizar logs (p. ej. ingesta "En Proceso" → contadores y estado)
  useEffect(() => {
    pollingIntervalRef.current = setInterval(() => {
      loadLogs(true) // silent: no mostrar spinner en cada refresco
    }, 60_000) // 1 minuto
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [currentPage, selectedStatus, sortField, sortDirection])

  const loadLogs = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const response = await getIngestionLogs({
        page: currentPage,
        limit: itemsPerPage,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        sortField: sortField || "date_time",
        sortDirection: sortDirection,
      })

      if (response.success && response.logs && response.pagination) {
        // Mapear estados de la base de datos a los estados del frontend
        const mappedLogs: IngestionLog[] = response.logs.map((log) => {
          let mappedStatus: "Exitoso" | "Fallido" | "En Proceso" | "Incompleto" = "Exitoso"
          if (log.status === "Exitoso") {
            mappedStatus = "Exitoso"
          } else if (log.status === "Error" || log.status === "Cancelado" || log.status === "Fallido") {
            mappedStatus = "Fallido"
          } else if (log.status === "Incompleto") {
            mappedStatus = "Incompleto"
          } else if (log.status === "En Proceso") {
            mappedStatus = "En Proceso"
          }
          return {
            ...log,
            status: mappedStatus
          }
        })
        setLogs(mappedLogs)
        setTotalPages(response.pagination.totalPages)
        setTotalCount(response.pagination.total)
      } else {
        setAlert({
          status: "error",
          message: response.error || "Error al cargar los logs",
        })
      }
    } catch (error) {
      console.error("Error loading logs:", error)
      setAlert({
        status: "error",
        message: "Error al cargar los logs",
      })
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const handleSort = (field: "date_time" | "found") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
    setCurrentPage(1) // Resetear a primera página al cambiar ordenamiento
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status as typeof selectedStatus)
    setCurrentPage(1) // Resetear a primera página al cambiar filtro
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Exitoso":
        return styles.statusSuccess
      case "Fallido":
      case "Error":
      case "Incompleto":
        return styles.statusFailed
      case "En Proceso":
        return styles.statusInProgress
      default:
        return ""
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Exitoso":
        return <FiCheckCircle size={18} />
      case "Fallido":
      case "Error":
      case "Incompleto":
        return <FiXCircle size={18} />
      case "En Proceso":
        return <FiAlertCircle size={18} />
      default:
        return null
    }
  }

  const truncateUrl = (url: string, maxLength: number = 30) => {
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + "..."
  }

  const formatDateTimeArgentina = (raw: string): string => {
    const value = (raw || "").trim()
    if (!value) return raw

    // Esperado: "dd/mm/yyyy HH:MM:SS" (backend)
    const m = value.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/
    )
    if (!m) return raw

    const day = Number(m[1])
    const month = Number(m[2])
    const year = Number(m[3])
    const hour = Number(m[4])
    const minute = Number(m[5])
    const second = Number(m[6])

    if ([day, month, year, hour, minute, second].some((n) => Number.isNaN(n))) return raw

    // Normalizamos como UTC y mostramos en horario Argentina
    const dtUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    if (Number.isNaN(dtUtc.getTime())) return raw

    return new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(dtUtc)
  }

  const formatExecutionTimeDisplay = (raw: string): string => {
    const value = (raw || "").trim()
    if (!value) return raw

    // Si ya viene en formato con horas (ej: "1hs 30m 55s"), no tocar.
    if (/\d+\s*hs\b/i.test(value)) return value

    // Soporta "639m 26s", "26s", "2h 5m 1s", etc.
    const hourMatch = value.match(/(\d+)\s*h\b/i)
    const minMatch = value.match(/(\d+)\s*m\b/i)
    const secMatch = value.match(/(\d+)\s*s\b/i)

    const hoursParsed = hourMatch ? Number(hourMatch[1]) : 0
    const minsParsed = minMatch ? Number(minMatch[1]) : 0
    const secsParsed = secMatch ? Number(secMatch[1]) : 0

    if (!Number.isFinite(hoursParsed) || !Number.isFinite(minsParsed) || !Number.isFinite(secsParsed)) {
      return raw
    }

    const totalSeconds = (hoursParsed * 3600) + (minsParsed * 60) + secsParsed
    if (totalSeconds <= 0) return raw

    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60

    if (h > 0) return `${h}hs ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const getDetailCount = (searchDetail: IngestionLog["searchDetail"]) => {
    if (!searchDetail) return 0
    if (Array.isArray(searchDetail)) return searchDetail.length
    return Array.isArray((searchDetail as SmartHarvestSearchDetail).execution_log) ? (searchDetail as SmartHarvestSearchDetail).execution_log.length : 0
  }

  const getExecutionLog = (searchDetail: IngestionLog["searchDetail"]): (SmartHarvestExecutionLogItem | SearchDetailItem)[] => {
    if (!searchDetail) return []
    if (Array.isArray(searchDetail)) return searchDetail
    return (searchDetail as SmartHarvestSearchDetail).execution_log || []
  }

  // Cargar y mostrar screenshot en modal (usando proxy con auth admin)
  const openScreenshotModal = useCallback(async (blobPath: string) => {
    // Revocar URL anterior si existe
    if (screenshotBlobUrlRef.current) {
      URL.revokeObjectURL(screenshotBlobUrlRef.current)
      screenshotBlobUrlRef.current = null
    }
    setScreenshotModal({ open: true, blobUrl: null, loading: true })
    const proxyUrl = `${API_URL}/api/admin/proxy-diagnostic-screenshot?path=${encodeURIComponent(blobPath)}`
    try {
      const res = await fetch(proxyUrl, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error("No se pudo cargar la imagen")
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      screenshotBlobUrlRef.current = blobUrl
      setScreenshotModal({ open: true, blobUrl, loading: false })
    } catch {
      setScreenshotModal({ open: true, blobUrl: null, loading: false })
    }
  }, [])

  const closeScreenshotModal = useCallback(() => {
    if (screenshotBlobUrlRef.current) {
      URL.revokeObjectURL(screenshotBlobUrlRef.current)
      screenshotBlobUrlRef.current = null
    }
    setScreenshotModal({ open: false, blobUrl: null, loading: false })
  }, [])

  const openDetailModal = useCallback((log: IngestionLog) => {
    setDetailModal({ open: true, log })
  }, [])

  const closeDetailModal = useCallback(() => {
    setDetailModal({ open: false, log: null })
  }, [])

  return (
    <div className={styles.container}>
      {isLoading && <LoadingSpinner />}
      {alert && <Alert status={alert.status} message={alert.message} onClose={() => setAlert(null)} />}

      <div className={styles.header}>
        <h1 className={styles.title}>Logs de Ingesta</h1>
        <p className={styles.subtitle}>Historial de procesos de obtención de ofertas laborales</p>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.filters}>
          <Select
            options={[
              { value: "all", label: "Todos los estados" },
              { value: "Exitoso", label: "Exitoso" },
              { value: "Error", label: "Error" },
              { value: "Incompleto", label: "Incompleto" },
              { value: "Cancelado", label: "Cancelado" },
              { value: "En Proceso", label: "En Proceso" },
            ]}
            value={selectedStatus}
            onChange={(value: string) => handleStatusChange(value)}
            placeholder="Selecciona un estado"
          />

          <button
            className={styles.clearButton}
            onClick={() => {
              handleStatusChange("all")
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.columnDateTime} onClick={() => handleSort("date_time")}>
            <span className={styles.sortableHeader}>
              Fecha y Hora
              <span className={sortField === "date_time" ? styles.sortIconActive : styles.sortIconInactive}>
                {sortDirection === "asc" ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </span>
            </span>
          </div>
          <div className={styles.columnStatus}>Estado</div>
          <div className={styles.columnTime}>Tiempo Ejec.</div>
          <div className={styles.columnUrl}>URL</div>
          <div className={styles.columnFound} onClick={() => handleSort("found")}>
            <span className={styles.sortableHeader}>
              Encontradas
              <span className={sortField === "found" ? styles.sortIconActive : styles.sortIconInactive}>
                {sortDirection === "asc" ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </span>
            </span>
          </div>
          <div className={styles.columnDuplicates}>Duplicadas</div>
          <div className={styles.columnInserted}>Insertadas</div>
          <div className={styles.columnScreen}>Screen</div>
        </div>

        <div className={styles.tableBody}>
          {logs.length === 0 && !isLoading ? (
            <div className={styles.emptyState}>
              <p>No hay logs de ingesta disponibles</p>
            </div>
          ) : (
            logs.map((log) => (
            <div key={log.id} className={styles.tableRow}>
              <div className={styles.columnDateTime}>
                <div className={styles.dateTimeWrapper}>
                  <FiClock className={styles.clockIcon} />
                  <span className={styles.dateTime}>{formatDateTimeArgentina(log.startDateTime)}</span>
                </div>
              </div>

              <div className={styles.columnStatus}>
                <div className={`${styles.statusBadge} ${getStatusClass(log.status)}`}>
                  {getStatusIcon(log.status)}
                  <span>{log.status}</span>
                </div>
              </div>

              <div className={styles.columnTime}>
                <span className={styles.executionTime}>{formatExecutionTimeDisplay(log.executionTime)}</span>
              </div>

              <div className={styles.columnUrl}>
                <a href={log.url} target="_blank" rel="noopener noreferrer" className={styles.urlLink} title={log.url}>
                  <span className={styles.urlText}>{truncateUrl(log.url)}</span>
                  <FiExternalLink className={styles.externalIcon} size={14} />
                </a>
              </div>

              <div className={styles.columnFound}>
                <span className={styles.offersCount}>{log.offersFound}</span>
              </div>

              <div className={styles.columnDuplicates}>
                <span className={styles.duplicatesCount}>{log.duplicateOffers}</span>
              </div>

              <div className={styles.columnInserted}>
                {log.baseOffersInserted != null || log.harvestOffersInserted != null ? (
                  <button
                    type="button"
                    className={styles.detailLinkButton}
                    onClick={() => openDetailModal(log)}
                    title="Ver detalle Smart Harvest"
                  >
                    Ver detalle <FiEye size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.detailLinkButton}
                    onClick={() => openDetailModal(log)}
                    title="Ver detalle"
                  >
                    Ver detalle <FiEye size={16} />
                  </button>
                )}
              </div>

              <div className={styles.columnScreen}>
                {log.screenshotBlobPath ? (
                  <FiImage
                    size={20}
                    className={styles.screenIcon}
                    onClick={() => openScreenshotModal(log.screenshotBlobPath!)}
                    title="Ver captura de error"
                  />
                ) : (
                  <span className={styles.noScreen}>—</span>
                )}
              </div>
            </div>
            ))
          )}
        </div>

        {totalPages > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>

      {/* Modal de Screenshot */}
      {screenshotModal.open && (
        <div className={styles.modalOverlay} onClick={closeScreenshotModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeScreenshotModal}>
              <FiX size={24} />
            </button>
            <h3 className={styles.modalTitle}>Captura de Error</h3>
            {screenshotModal.loading ? (
              <div className={styles.modalLoading}>
                <LoadingSpinner />
                <p>Cargando imagen...</p>
              </div>
            ) : screenshotModal.blobUrl ? (
              <div className={styles.modalImageContainer}>
                <img src={screenshotModal.blobUrl} alt="Screenshot de error" className={styles.modalImage} />
              </div>
            ) : (
              <p className={styles.modalError}>No se pudo cargar la imagen.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal de detalle por URL */}
      {detailModal.open && detailModal.log && (
        <div className={styles.modalOverlay} onClick={closeDetailModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeDetailModal}>
              <FiX size={24} />
            </button>
            <h3 className={styles.modalTitle}>Detalle Smart Harvest · Ingesta #{detailModal.log.id}</h3>

            {(() => {
              const log = detailModal.log!
              const sd = log.searchDetail as SmartHarvestSearchDetail | SearchDetailItem[] | null | undefined
              const isV2 = sd && !Array.isArray(sd) && (sd as SmartHarvestSearchDetail).execution_log

              const seed = (log.seedTotalResults ?? (isV2 ? (sd as SmartHarvestSearchDetail).market_stats?.total_market_jobs : null)) || null
              const baseInserted = (log.baseOffersInserted ?? (isV2 ? (sd as SmartHarvestSearchDetail).base_performance?.offers_inserted_unique : null) ?? 0) || 0
              const harvestInserted = (log.harvestOffersInserted ?? (isV2 ? (sd as SmartHarvestSearchDetail).harvest_performance?.offers_inserted_unique : null) ?? 0) || 0
              const totalInserted = baseInserted + harvestInserted
              const totalCov = seed ? (totalInserted / seed) * 100 : null
              const basePct = seed ? Math.min(100, (baseInserted / seed) * 100) : 0
              const harvestPct = seed ? Math.min(100, (harvestInserted / seed) * 100) : 0

              const baseCovPct = seed ? (baseInserted / seed) * 100 : null
              const harvestCovPct = seed ? (harvestInserted / seed) * 100 : null

              const normalizeItem = (item: any) => {
                const type = item?.type || "BASE"
                const foundRaw = item?.found_raw ?? item?.jobs_found ?? 0
                const inserted = item?.inserted ?? item?.jobs_inserted ?? 0
                const duplicates = item?.duplicates ?? Math.max(Number(foundRaw || 0) - Number(inserted || 0), 0)
                return {
                  type,
                  order: item?.order,
                  url: item?.url,
                  status: item?.status,
                  foundRaw: Number(foundRaw || 0),
                  inserted: Number(inserted || 0),
                  duplicates: Number(duplicates || 0),
                  resultsCount: item?.results_count ?? null,
                  scrapeableCount: item?.scrapeable_count ?? null,
                  filters: item?.filters ?? null,
                  error: item?.error,
                }
              }

              const allItems = getExecutionLog(log.searchDetail).map(normalizeItem).sort((a, b) => (a.order || 0) - (b.order || 0))
              const baseItems = allItems.filter((x) => x.type !== "HARVEST")
              const harvestItems = allItems.filter((x) => x.type === "HARVEST")

              const baseFoundRaw =
                (isV2 ? (sd as SmartHarvestSearchDetail).base_performance?.offers_found_raw : null) ??
                baseItems.filter((x) => x.status === "completed").reduce((acc, x) => acc + (x.foundRaw || 0), 0)
              const harvestFoundRaw =
                (isV2 ? (sd as SmartHarvestSearchDetail).harvest_performance?.offers_found_raw : null) ??
                harvestItems.filter((x) => x.status === "completed").reduce((acc, x) => acc + (x.foundRaw || 0), 0)

              const baseEfficiency =
                (isV2 ? (sd as SmartHarvestSearchDetail).base_performance?.efficiency_pct : null) ??
                (baseFoundRaw ? (baseInserted / baseFoundRaw) * 100 : 0)
              const harvestEfficiency =
                (isV2 ? (sd as SmartHarvestSearchDetail).harvest_performance?.efficiency_pct : null) ??
                (harvestFoundRaw ? (harvestInserted / harvestFoundRaw) * 100 : 0)

              const baseUrlsProcessed =
                (isV2 ? (sd as SmartHarvestSearchDetail).base_performance?.urls_processed : null) ??
                baseItems.filter((x) => x.status === "completed").length
              const harvestUrlsProcessed =
                (isV2 ? (sd as SmartHarvestSearchDetail).harvest_performance?.urls_processed : null) ??
                harvestItems.filter((x) => x.status === "completed").length

              const renderUrlList = (items: any[], label: string) => {
                if (!items.length) {
                  return <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>No hay URLs en {label}.</div>
                }
                return (
                  <div style={{ marginTop: 8 }}>
                    {items.map((item) => {
                      const f = item.filters || undefined
                      const filterLabels = f
                        ? [
                            f.work_type,
                            f.job_type,
                            f.experience_level,
                            f.keyword ? `kw:${f.keyword}` : null,
                            f.sortBy ? `sort:${f.sortBy}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : null
                      const uniqueLabel = `${item.inserted.toLocaleString("es-ES")}/${item.foundRaw.toLocaleString("es-ES")} únicas`
                      const capLabel =
                        item.resultsCount != null && item.scrapeableCount != null
                          ? `${Number(item.scrapeableCount).toLocaleString("es-ES")}/${Number(item.resultsCount).toLocaleString("es-ES")} resultados`
                          : null

                      return (
                        <div key={`${label}-${item.order}-${item.url}`} style={{ padding: "10px 0", borderBottom: "1px solid var(--border-color)" }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            {item.order}. {filterLabels || "URL"}
                          </div>
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.urlLink} title={item.url}>
                            <span className={styles.urlText}>{truncateUrl(item.url, 90)}</span>
                            <FiExternalLink className={styles.externalIcon} size={14} />
                          </a>
                          <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap", color: "var(--text-secondary)", fontSize: 13 }}>
                            <span><strong>Únicas</strong>: {uniqueLabel}</span>
                            {capLabel && <span><strong>Techo</strong>: {capLabel}</span>}
                            <span><strong>Estado</strong>: {item.status}</span>
                            {item.error && <span style={{ color: "#ef4444" }}><strong>Error</strong>: {item.error}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }

              return (
                <div style={{ marginBottom: 12, color: "var(--text-secondary)", fontSize: 14 }}>
                  {seed != null && seed > 0 && (
                    <>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Mercado</div>
                        <div>
                          <strong>URL semilla (mercado estimado)</strong>: {seed.toLocaleString("es-ES")} ofertas
                        </div>
                        <div>
                          <strong>Cobertura total</strong>: {totalCov != null ? `${totalCov.toFixed(1)}%` : "—"} ({totalInserted.toLocaleString("es-ES")} únicas)
                        </div>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Cobertura por fase</div>
                        <div style={{ height: 14, background: "rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden", display: "flex" }}>
                          <div style={{ width: `${basePct}%`, height: "100%", background: "#22c55e" }} />
                          <div style={{ width: `${harvestPct}%`, height: "100%", background: "#3b82f6" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12 }}>
                          <span><strong>Base</strong>: {baseInserted.toLocaleString("es-ES")}</span>
                          <span><strong>Harvest</strong>: {harvestInserted.toLocaleString("es-ES")}</span>
                          <span><strong>Total</strong>: {totalInserted.toLocaleString("es-ES")}</span>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          Se scrapearon <strong>{baseInserted.toLocaleString("es-ES")}</strong> ofertas de la base +{" "}
                          <strong>{harvestInserted.toLocaleString("es-ES")}</strong> ofertas rescatadas por harvest.{" "}
                          <strong>Cobertura Total</strong>: {totalCov != null ? `${totalCov.toFixed(1)}%` : "—"} del mercado estimado.
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>BASE (garantizado)</div>
                        <div>
                          <strong>Total BASE</strong>: {baseInserted.toLocaleString("es-ES")} únicas ·{" "}
                          <strong>Cobertura BASE</strong>: {baseCovPct != null ? `${baseCovPct.toFixed(1)}%` : "—"} ·{" "}
                          <strong>Eficiencia</strong>: {Number(baseEfficiency || 0).toFixed(1)}% ·{" "}
                          <strong>URLs procesadas</strong>: {Number(baseUrlsProcessed || 0).toLocaleString("es-ES")}
                        </div>
                        {renderUrlList(baseItems, "BASE")}
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>HARVEST (pesca excedente)</div>
                        <div>
                          <strong>Total HARVEST</strong>: {harvestInserted.toLocaleString("es-ES")} únicas ·{" "}
                          <strong>Cobertura HARVEST</strong>: {harvestCovPct != null ? `${harvestCovPct.toFixed(1)}%` : "—"} ·{" "}
                          <strong>Eficiencia</strong>: {Number(harvestEfficiency || 0).toFixed(1)}% ·{" "}
                          <strong>URLs procesadas</strong>: {Number(harvestUrlsProcessed || 0).toLocaleString("es-ES")}
                        </div>
                        {renderUrlList(harvestItems, "HARVEST")}
                      </div>
                    </>
                  )}

                  {!(seed != null && seed > 0) && (
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Resumen</div>
                      <div>
                        <strong>Insertadas (únicas)</strong>: {totalInserted.toLocaleString("es-ES")} ·{" "}
                        <strong>Encontradas</strong>: {log.offersFound.toLocaleString("es-ES")} ·{" "}
                        <strong>Duplicadas</strong>: {log.duplicateOffers.toLocaleString("es-ES")}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>URLs</div>
                        {renderUrlList(allItems, "URLs")}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
