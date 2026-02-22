"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiExternalLink, FiX, FiEye } from "react-icons/fi"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { Alert } from "@/components/UI/Alert/Alert"
import { Select } from "@/components/UI/Select/Select"
import { getIngestionsSummary, getIngestionCountryDetail, getIngestionDetailByLog, type IngestionSummaryRow, type IngestionCountryDetailResponse } from "@/lib/ingestion"
import styles from "./logs.module.css"

export default function AdminLoggingsPage() {
  const [rows, setRows] = useState<IngestionSummaryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<"all" | "En Progreso" | "Finalizado" | "Fallido" | "Cancelado">("all")
  const [detailModal, setDetailModal] = useState<{ open: boolean; row: IngestionSummaryRow | null; loading: boolean; detail: IngestionCountryDetailResponse | null }>({
    open: false,
    row: null,
    loading: false,
    detail: null,
  })
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadSummary = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true)
      try {
        const res = await getIngestionsSummary()
        if (res.success && res.rows) {
          const filtered = selectedStatus === "all" ? res.rows : res.rows.filter((r) => r.status === selectedStatus)
          setRows(filtered)
        } else {
          setAlert({
            status: "error",
            message: res.error || "Error al cargar el resumen",
          })
        }
      } catch (error) {
        console.error("Error loading summary:", error)
        setAlert({
          status: "error",
          message: "Error al cargar el resumen",
        })
      } finally {
        if (!silent) setIsLoading(false)
      }
    },
    [selectedStatus]
  )

  // Carga inicial y al cambiar filtros/estado
  useEffect(() => {
    loadSummary()
  }, [loadSummary, selectedStatus])

  // Polling cada 1 minuto para actualizar ingestas
  useEffect(() => {
    pollingIntervalRef.current = setInterval(() => {
      loadSummary(true) // silent: no mostrar spinner en cada refresco
    }, 60_000) // 1 minuto
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [loadSummary, selectedStatus])

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status as typeof selectedStatus)
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Finalizado":
        return styles.statusSuccess
      case "Fallido":
        return styles.statusFailed
      case "Cancelado":
        return styles.statusCanceled
      case "En Progreso":
        return styles.statusInProgress
      default:
        return ""
    }
  }

  const formatDurationSeconds = (seconds: number): string => {
    const s = Math.round(seconds)
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60)
    const sec = s % 60
    return sec > 0 ? `${m}m ${sec}s` : `${m}m`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Finalizado":
        return <FiCheckCircle size={18} />
      case "Fallido":
        return <FiXCircle size={18} />
      case "Cancelado":
        return <FiClock size={18} />
      case "En Progreso":
        return <FiAlertCircle size={18} />
      default:
        return null
    }
  }

  const openDetailModal = useCallback(async (row: IngestionSummaryRow) => {
    setDetailModal({ open: true, row, loading: true, detail: null })
    const res =
      row.ingestion_log_id != null
        ? await getIngestionDetailByLog(row.ingestion_log_id, row.country)
        : await getIngestionCountryDetail(row.execution_id, row.country)
    if (res.success && res.detail) {
      setDetailModal({ open: true, row, loading: false, detail: res.detail })
    } else {
      setDetailModal({ open: true, row, loading: false, detail: null })
      setAlert({ status: "error", message: res.error || "No se pudo cargar el detalle" })
    }
  }, [])

  const closeDetailModal = useCallback(() => {
    setDetailModal({ open: false, row: null, loading: false, detail: null })
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
              { value: "En Progreso", label: "En Progreso" },
              { value: "Finalizado", label: "Finalizado" },
              { value: "Fallido", label: "Fallido" },
              { value: "Cancelado", label: "Cancelado" },
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
          <div className={styles.columnDateTime}>Inicio</div>
          <div className={styles.columnStatus}>Estado</div>
          <div className={styles.columnTime}>Duración</div>
          <div className={styles.columnExecutionId}>ID ejecución</div>
          <div className={styles.columnUrl}>País</div>
          <div className={styles.columnFound}>Audit</div>
          <div className={styles.columnDuplicates}>Segmentado</div>
          <div className={styles.columnInserted}>Insertado</div>
          <div className={styles.columnScreen}>Detalle</div>
        </div>

        <div className={styles.tableBody}>
          {rows.length === 0 && !isLoading ? (
            <div className={styles.emptyState}>
              <p>No hay ejecuciones en ingestion_batches</p>
            </div>
          ) : (
            rows.map((row) => (
            <div key={`${row.ingestion_log_id ?? row.execution_id}-${row.country}`} className={styles.tableRow}>
              <div className={styles.columnDateTime}>
                <div className={styles.dateTimeWrapper}>
                  <FiClock className={styles.clockIcon} />
                  <span className={styles.dateTime}>{row.start_date || "—"}</span>
                </div>
              </div>

              <div className={styles.columnStatus}>
                <div className={`${styles.statusBadge} ${getStatusClass(row.status)}`}>
                  {getStatusIcon(row.status)}
                  <span>{row.status}</span>
                </div>
              </div>

              <div className={styles.columnTime}>
                <span className={styles.executionTime}>{row.duration}</span>
              </div>

              <div className={styles.columnExecutionId}>
                <span className={styles.executionIdText} title={row.execution_id}>
                  {row.execution_id ? `${row.execution_id.slice(0, 8)}…` : "—"}
                </span>
              </div>

              <div className={styles.columnUrl}>
                <span className={styles.urlText}>
                  {row.country}
                  {row.ingestion_log_id != null && (
                    <span style={{ color: "var(--text-secondary)" }}> · run #{row.ingestion_log_id}</span>
                  )}
                </span>
              </div>

              <div className={styles.columnFound}>
                <span className={styles.offersCount}>{row.audit_total}</span>
              </div>

              <div className={styles.columnDuplicates}>
                <span className={styles.duplicatesCount}>{row.segmentation_total}</span>
              </div>

              <div className={styles.columnInserted}>
                <span className={styles.offersCount}>{row.inserted_total}</span>
              </div>

              <div className={styles.columnScreen}>
                <button
                  type="button"
                  className={styles.detailLinkButton}
                  onClick={() => openDetailModal(row)}
                  title="Ver batches"
                >
                  Ver <FiEye size={16} />
                </button>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Modal detalle batches */}
      {detailModal.open && detailModal.row && (
        <div className={styles.modalOverlay} onClick={closeDetailModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeDetailModal}>
              <FiX size={24} />
            </button>
            <h3 className={styles.modalTitle}>
              Detalle · {detailModal.row.country}
              {detailModal.row.ingestion_log_id != null && ` · run #${detailModal.row.ingestion_log_id}`}
            </h3>
            {detailModal.row.execution_id && (
              <p className={styles.modalExecutionId} title={detailModal.row.execution_id}>
                ID ejecución (explorador): <code>{detailModal.row.execution_id}</code>
              </p>
            )}

            {detailModal.loading ? (
              <div className={styles.modalLoading}>
                <LoadingSpinner />
                <p>Cargando batches...</p>
              </div>
            ) : detailModal.detail ? (
              <div style={{ marginBottom: 12, color: "var(--text-secondary)", fontSize: 14 }}>
                <div style={{ marginBottom: 10 }}>
                  <div>
                    <strong>Audit total</strong>: {detailModal.detail.header.audit_total}
                  </div>
                  <div>
                    <strong>Insertadas</strong>: {detailModal.detail.header.inserted_total}
                  </div>
                  {detailModal.detail.header.not_inserted != null && detailModal.detail.header.not_inserted > 0 && (
                    <div style={{ marginTop: 6, padding: "6px 8px", background: "var(--surface)", borderRadius: 6, fontSize: 13 }}>
                      <strong>No insertadas</strong>: {detailModal.detail.header.not_inserted}
                      {((detailModal.detail.header.total_duplicates_db ?? 0) + (detailModal.detail.header.total_duplicates_memory ?? 0) + (detailModal.detail.header.total_duplicates_at_save ?? 0)) > 0 && (
                        <> — Duplicados: BD {(detailModal.detail.header.total_duplicates_db ?? 0)}, memoria {(detailModal.detail.header.total_duplicates_memory ?? 0)}, al guardar {(detailModal.detail.header.total_duplicates_at_save ?? 0)}</>
                      )}
                    </div>
                  )}
                  {(() => {
                    const totalSec = detailModal.detail.header.total_execution_seconds ?? detailModal.detail.batches.reduce((acc, b) => acc + (b.execution_time_seconds ?? 0), 0)
                    return totalSec > 0 ? (
                      <div>
                        <strong>Tiempo de ejecución (país)</strong>: {formatDurationSeconds(totalSec)}
                      </div>
                    ) : null
                  })()}
                </div>

                <div>
                  {detailModal.detail.batches.map((b) => (
                    <div key={b.batch_id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border-color)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 700 }}>
                          #{b.batch_id} · {b.status}
                        </div>
                        <div style={{ fontSize: 12 }}>
                          {b.updated_at}
                        </div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13 }}>
                        {b.filters_readable?.length ? b.filters_readable.join(" · ") : "—"}
                      </div>
                      <a href={b.original_url} target="_blank" rel="noopener noreferrer" className={styles.urlLink} title={b.original_url}>
                        <span className={styles.urlText}>{b.original_url ? b.original_url.slice(0, 100) : ""}</span>
                        <FiExternalLink className={styles.externalIcon} size={14} />
                      </a>
                      <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13 }}>
                        <span><strong>Expected</strong>: {b.expected_count}</span>
                        <span><strong>Inserted</strong>: {b.inserted_count}</span>
                        <span><strong>Eficiencia</strong>: {Number(b.efficiency_pct || 0).toFixed(1)}%</span>
                        {b.execution_time_seconds != null && b.execution_time_seconds > 0 && (
                          <span><strong>Tiempo</strong>: {formatDurationSeconds(b.execution_time_seconds)}</span>
                        )}
                      </div>
                      {(b.scraped_count != null || (b.duplicates_db ?? b.duplicates_memory ?? b.duplicates_at_save) != null) && (
                        <div style={{ marginTop: 8, padding: "8px 10px", background: "var(--surface)", borderRadius: 6, fontSize: 12 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>Por qué no se insertaron todas</div>
                          {b.scraped_count != null && (
                            <div><strong>Scrapeado</strong>: {b.scraped_count} ofertas obtenidas de LinkedIn</div>
                          )}
                          <div style={{ marginTop: 4 }}>
                            <strong>Diferencia</strong> (Expected − Inserted): {Math.max(0, (b.expected_count ?? 0) - (b.inserted_count ?? 0))}
                            {((b.duplicates_db ?? 0) + (b.duplicates_memory ?? 0) + (b.duplicates_at_save ?? 0)) > 0 && (
                              <> →
                                {(b.duplicates_db ?? 0) > 0 && <span> Duplicados BD: {(b.duplicates_db ?? 0)}</span>}
                                {(b.duplicates_memory ?? 0) > 0 && <span> Duplicados memoria: {(b.duplicates_memory ?? 0)}</span>}
                                {(b.duplicates_at_save ?? 0) > 0 && <span> Duplicados al guardar: {(b.duplicates_at_save ?? 0)}</span>}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>No hay detalle disponible.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
