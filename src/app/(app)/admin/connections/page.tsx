"use client"

import { useEffect, useState } from "react"
import { Alert } from "@/components/UI/Alert/Alert"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { Pagination } from "@/components/UI/Pagination/Pagination"
import { AdminDataTable, MonoCell } from "@/components/UI/AdminDataTable/AdminDataTable"
import { SimpleLogModal } from "@/components/UI/SimpleLogModal/SimpleLogModal"
import { Select } from "@/components/UI/Select/Select"
import { Button } from "@/components/UI/Button/Button"
import { getConnections } from "@/lib/incidents"
import type { Connection } from "@/types/admin"
import styles from "../logs/logs.module.css"

export default function AdminConnectionsPage() {
  const [items, setItems] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)
  const [sortField, setSortField] = useState<"created_at" | "updated_at" | "connection_duration_seconds">("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [successFilter, setSuccessFilter] = useState<"all" | "true" | "false">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedLog, setSelectedLog] = useState<{ title: string; content: string } | null>(null)

  const itemsPerPage = 10
  const successOptions = [
    { value: "all", label: "Todas" },
    { value: "true", label: "Exitosas" },
    { value: "false", label: "Con error" },
  ]

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "-"
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  const formatDuration = (sec: number | null) => {
    if (sec == null) return "-"
    if (sec < 60) return `${Math.round(sec)}s`
    const m = Math.floor(sec / 60)
    const s = Math.round(sec % 60)
    return `${m}m ${s}s`
  }

  useEffect(() => {
    load()
  }, [currentPage, sortField, sortDirection, successFilter])

  const load = async () => {
    setIsLoading(true)
    try {
      const res = await getConnections({
        page: currentPage,
        limit: itemsPerPage,
        success: successFilter,
        sortField,
        sortDirection,
      })
      if (res.success && res.connections && res.pagination) {
        setItems(res.connections)
        setTotalPages(res.pagination.totalPages)
        setTotalCount(res.pagination.total)
      } else {
        setAlert({ status: "error", message: res.error || "Error al cargar conexiones" })
      }
    } catch (e) {
      console.error(e)
      setAlert({ status: "error", message: "Error al cargar conexiones" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (field: "created_at" | "updated_at" | "connection_duration_seconds") => {
    if (sortField === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    else {
      setSortField(field)
      setSortDirection("desc")
    }
    setCurrentPage(1)
  }

  return (
    <div className={styles.container}>
      {isLoading && <LoadingSpinner />}
      {alert && <Alert status={alert.status} message={alert.message} onClose={() => setAlert(null)} />}
      <SimpleLogModal
        isOpen={!!selectedLog}
        title={selectedLog?.title || "Log de error"}
        content={selectedLog?.content || ""}
        onClose={() => setSelectedLog(null)}
      />

      <div className={styles.header}>
        <h1 className={styles.title}>Conexiones</h1>
        <p className={styles.subtitle}>Historial de intentos de conexión (LinkedIn, etc.): éxito, duración, CAPTCHA, OTP</p>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.filters}>
          <Select
            options={successOptions}
            value={successFilter}
            onChange={(v) => {
              setSuccessFilter(v as typeof successFilter)
              setCurrentPage(1)
            }}
            placeholder="Estado"
          />
          <Button variant="primary" size="medium" onClick={() => { setSuccessFilter("all"); setCurrentPage(1) }}>
            Limpiar filtros
          </Button>
        </div>
      </div>

      <AdminDataTable<Connection>
        columns={[
          { key: "created_at", label: "Fecha", width: "minmax(160px, auto)", sortable: true, render: (r) => <MonoCell>{formatDateTime(r.createdAt)}</MonoCell> },
          { key: "user", label: "Usuario", width: "minmax(180px, auto)", render: (r) => <MonoCell>{r.userEmail || String(r.userId)}</MonoCell> },
          { key: "portal", label: "Portal", width: "minmax(80px, auto)", render: (r) => <MonoCell>{r.portal || "linkedin"}</MonoCell> },
          { key: "success", label: "Éxito", width: "minmax(70px, auto)", render: (r) => <MonoCell>{r.success === true ? "Sí" : r.success === false ? "No" : "-"}</MonoCell> },
          { key: "duration", label: "Duración", width: "minmax(80px, auto)", sortable: true, render: (r) => <MonoCell>{formatDuration(r.connectionDurationSeconds)}</MonoCell> },
          { key: "captcha", label: "CAPTCHA", width: "minmax(70px, auto)", render: (r) => <MonoCell>{r.captchaResolved === true ? "Sí" : r.captchaResolved === false ? "No" : "-"}</MonoCell> },
          { key: "otp", label: "OTP", width: "minmax(60px, auto)", render: (r) => <MonoCell>{r.hadOtp === true ? "Sí" : r.hadOtp === false ? "No" : "-"}</MonoCell> },
          { key: "loginStatus", label: "Estado", width: "minmax(120px, auto)", render: (r) => <MonoCell>{r.loginStatus || "-"}</MonoCell> },
          {
            key: "errorLog",
            label: "Log error",
            width: "auto",
            render: (r) =>
              r.errorLog ? (
                <Button
                  variant="primary"
                  size="small"
                  onClick={() =>
                    setSelectedLog({
                      title: `Conexión #${r.id} - Error`,
                      content: r.errorLog || "",
                    })
                  }
                >
                  Ver log
                </Button>
              ) : (
                <MonoCell>-</MonoCell>
              ),
          },
        ]}
        rows={items}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={(f) => handleSort(f as typeof sortField)}
        emptyText="No hay conexiones registradas"
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => setCurrentPage(p)}
      />
    </div>
  )
}
