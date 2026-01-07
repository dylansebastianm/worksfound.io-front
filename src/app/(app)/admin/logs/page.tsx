"use client"

import { useState, useEffect } from "react"
import { FiChevronUp, FiChevronDown, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiExternalLink } from "react-icons/fi"
import { Pagination } from "@/components/UI/Pagination/Pagination"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { Alert } from "@/components/UI/Alert/Alert"
import { Select } from "@/components/UI/Select/Select"
import { getIngestionLogs } from "@/lib/ingestion"
import type { IngestionLog } from "@/types/ingestion"
import styles from "./logs.module.css"

export default function AdminLoggingsPage() {
  const [logs, setLogs] = useState<IngestionLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)
  const [sortField, setSortField] = useState<"date_time" | "found" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedStatus, setSelectedStatus] = useState<"Exitoso" | "Fallido" | "En Proceso" | "Error" | "Cancelado" | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const itemsPerPage = 10

  useEffect(() => {
    loadLogs()
  }, [currentPage, selectedStatus, sortField, sortDirection])

  const loadLogs = async () => {
    setIsLoading(true)
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
          let mappedStatus: "Exitoso" | "Fallido" | "En Proceso" = "Exitoso"
          // Mapear estados de la base de datos a los estados del frontend
          if (log.status === "Exitoso") {
            mappedStatus = "Exitoso"
          } else if (log.status === "Error" || log.status === "Cancelado" || log.status === "Fallido") {
            mappedStatus = "Fallido"
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
      setIsLoading(false)
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
              { value: "Fallido", label: "Fallido" },
              { value: "Error", label: "Error" },
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
                  <span className={styles.dateTime}>{log.startDateTime}</span>
                </div>
              </div>

              <div className={styles.columnStatus}>
                <div className={`${styles.statusBadge} ${getStatusClass(log.status)}`}>
                  {getStatusIcon(log.status)}
                  <span>{log.status}</span>
                </div>
              </div>

              <div className={styles.columnTime}>
                <span className={styles.executionTime}>{log.executionTime}</span>
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
                <span className={styles.insertedCount}>{log.offersInserted}</span>
              </div>
            </div>
            ))
          )}
        </div>

        {totalPages > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>
    </div>
  )
}
