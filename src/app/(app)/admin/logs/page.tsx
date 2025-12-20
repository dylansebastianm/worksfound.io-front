"use client"

import { useState } from "react"
import { FiChevronUp, FiChevronDown, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle } from "react-icons/fi"
import { Pagination } from "@/components/UI/Pagination/Pagination"
import styles from "./logs.module.css"

interface IngestLog {
  id: number
  startDateTime: string
  status: "Exitoso" | "Fallido" | "En Proceso"
  executionTime: string
  url: string
  offersFound: number
  duplicateOffers: number
  offersInserted: number
}

// Mock data for ingest logs
const mockLogs: IngestLog[] = [
  {
    id: 1,
    startDateTime: "15/01/2025 14:32:15",
    status: "Exitoso",
    executionTime: "2m 34s",
    url: "https://www.linkedin.com/jobs/search",
    offersFound: 847,
    duplicateOffers: 102,
    offersInserted: 745,
  },
  {
    id: 2,
    startDateTime: "15/01/2025 10:15:42",
    status: "Exitoso",
    executionTime: "1m 58s",
    url: "https://www.indeed.com/jobs",
    offersFound: 623,
    duplicateOffers: 89,
    offersInserted: 534,
  },
  {
    id: 3,
    startDateTime: "15/01/2025 06:08:22",
    status: "Fallido",
    executionTime: "45s",
    url: "https://www.glassdoor.com/job-listings",
    offersFound: 0,
    duplicateOffers: 0,
    offersInserted: 0,
  },
  {
    id: 4,
    startDateTime: "14/01/2025 22:45:10",
    status: "Exitoso",
    executionTime: "3m 12s",
    url: "https://www.linkedin.com/jobs/search",
    offersFound: 1023,
    duplicateOffers: 156,
    offersInserted: 867,
  },
  {
    id: 5,
    startDateTime: "14/01/2025 18:30:55",
    status: "Exitoso",
    executionTime: "2m 15s",
    url: "https://www.indeed.com/jobs",
    offersFound: 734,
    duplicateOffers: 98,
    offersInserted: 636,
  },
  {
    id: 6,
    startDateTime: "14/01/2025 14:22:33",
    status: "En Proceso",
    executionTime: "1m 05s",
    url: "https://www.glassdoor.com/job-listings",
    offersFound: 423,
    duplicateOffers: 67,
    offersInserted: 356,
  },
  {
    id: 7,
    startDateTime: "14/01/2025 10:18:47",
    status: "Exitoso",
    executionTime: "2m 42s",
    url: "https://www.linkedin.com/jobs/search",
    offersFound: 912,
    duplicateOffers: 134,
    offersInserted: 778,
  },
  {
    id: 8,
    startDateTime: "14/01/2025 06:12:20",
    status: "Exitoso",
    executionTime: "1m 52s",
    url: "https://www.indeed.com/jobs",
    offersFound: 567,
    duplicateOffers: 72,
    offersInserted: 495,
  },
  {
    id: 9,
    startDateTime: "13/01/2025 22:55:12",
    status: "Fallido",
    executionTime: "38s",
    url: "https://www.glassdoor.com/job-listings",
    offersFound: 0,
    duplicateOffers: 0,
    offersInserted: 0,
  },
  {
    id: 10,
    startDateTime: "13/01/2025 18:40:35",
    status: "Exitoso",
    executionTime: "2m 58s",
    url: "https://www.linkedin.com/jobs/search",
    offersFound: 1134,
    duplicateOffers: 189,
    offersInserted: 945,
  },
  {
    id: 11,
    startDateTime: "13/01/2025 14:28:18",
    status: "Exitoso",
    executionTime: "2m 21s",
    url: "https://www.indeed.com/jobs",
    offersFound: 689,
    duplicateOffers: 95,
    offersInserted: 594,
  },
  {
    id: 12,
    startDateTime: "13/01/2025 10:15:42",
    status: "Exitoso",
    executionTime: "1m 48s",
    url: "https://www.glassdoor.com/job-listings",
    offersFound: 456,
    duplicateOffers: 63,
    offersInserted: 393,
  },
]

export default function AdminLoggingsPage() {
  const [sortField, setSortField] = useState<"startDateTime" | "offersFound" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10

  const handleSort = (field: "startDateTime" | "offersFound") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const parseDateTime = (dateTimeStr: string): Date => {
    const [datePart, timePart] = dateTimeStr.split(" ")
    const [day, month, year] = datePart.split("/")
    const [hours, minutes, seconds] = timePart.split(":")
    return new Date(
      Number.parseInt(year),
      Number.parseInt(month) - 1,
      Number.parseInt(day),
      Number.parseInt(hours),
      Number.parseInt(minutes),
      Number.parseInt(seconds),
    )
  }

  const filteredAndSortedLogs = mockLogs
    .filter((log) => {
      const matchesStatus = selectedStatus === "all" || log.status === selectedStatus
      return matchesStatus
    })
    .sort((a, b) => {
      if (!sortField) return 0

      if (sortField === "startDateTime") {
        const dateA = parseDateTime(a.startDateTime)
        const dateB = parseDateTime(b.startDateTime)
        return sortDirection === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
      }

      if (sortField === "offersFound") {
        return sortDirection === "asc" ? a.offersFound - b.offersFound : b.offersFound - a.offersFound
      }

      return 0
    })

  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentLogs = filteredAndSortedLogs.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Exitoso":
        return styles.statusSuccess
      case "Fallido":
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
        return <FiXCircle size={18} />
      case "En Proceso":
        return <FiAlertCircle size={18} />
      default:
        return null
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Logs de Ingesta</h1>
        <p className={styles.subtitle}>Historial de procesos de obtención de ofertas laborales</p>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.filters}>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={styles.select}>
            <option value="all">Todos los estados</option>
            <option value="Exitoso">Exitoso</option>
            <option value="Fallido">Fallido</option>
            <option value="En Proceso">En Proceso</option>
          </select>

          <button
            className={styles.clearButton}
            onClick={() => {
              setSelectedStatus("all")
              setCurrentPage(1)
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.columnDateTime} onClick={() => handleSort("startDateTime")}>
            <span className={styles.sortableHeader}>
              Fecha y Hora
              <span className={sortField === "startDateTime" ? styles.sortIconActive : styles.sortIconInactive}>
                {sortDirection === "asc" ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </span>
            </span>
          </div>
          <div className={styles.columnStatus}>Estado</div>
          <div className={styles.columnTime}>Tiempo Ejec.</div>
          <div className={styles.columnUrl}>URL</div>
          <div className={styles.columnFound} onClick={() => handleSort("offersFound")}>
            <span className={styles.sortableHeader}>
              Encontradas
              <span className={sortField === "offersFound" ? styles.sortIconActive : styles.sortIconInactive}>
                {sortDirection === "asc" ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </span>
            </span>
          </div>
          <div className={styles.columnDuplicates}>Duplicadas</div>
          <div className={styles.columnInserted}>Insertadas</div>
        </div>

        <div className={styles.tableBody}>
          {currentLogs.map((log) => (
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
                <a href={log.url} target="_blank" rel="noopener noreferrer" className={styles.urlLink}>
                  {log.url}
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
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </div>
  )
}
