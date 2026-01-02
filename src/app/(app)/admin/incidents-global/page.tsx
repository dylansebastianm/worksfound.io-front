"use client"

import { useEffect, useState } from "react"
import { Alert } from "@/components/UI/Alert/Alert"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { Pagination } from "@/components/UI/Pagination/Pagination"
import { AdminDataTable, MonoCell } from "@/components/UI/AdminDataTable/AdminDataTable"
import { SimpleLogModal } from "@/components/UI/SimpleLogModal/SimpleLogModal"
import { Select } from "@/components/UI/Select/Select"
import { Button } from "@/components/UI/Button/Button"
import { getRunnerIncidents } from "@/lib/incidents"
import type { RunnerIncident } from "@/types/admin"
import styles from "../logs/logs.module.css"

export default function AdminGlobalIncidentsPage() {
  const [items, setItems] = useState<RunnerIncident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)
  const [sortField, setSortField] = useState<"detected_at" | "cooldown_until" | "started_at">("detected_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [activeOnly, setActiveOnly] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedLog, setSelectedLog] = useState<{ title: string; content: string } | null>(null)

  const itemsPerPage = 10
  const activeOptions = [
    { value: "all", label: "Todas" },
    { value: "active", label: "Solo activas (no resueltas)" },
  ]

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "-"
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  useEffect(() => {
    load()
  }, [currentPage, sortField, sortDirection, activeOnly])

  const load = async () => {
    setIsLoading(true)
    try {
      const res = await getRunnerIncidents({
        page: currentPage,
        limit: itemsPerPage,
        activeOnly,
        sortField,
        sortDirection,
      })
      if (res.success && res.incidents && res.pagination) {
        setItems(res.incidents)
        setTotalPages(res.pagination.totalPages)
        setTotalCount(res.pagination.total)
      } else {
        setAlert({ status: "error", message: res.error || "Error al cargar incidencias globales" })
      }
    } catch (e) {
      console.error(e)
      setAlert({ status: "error", message: "Error al cargar incidencias globales" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (field: "detected_at" | "cooldown_until" | "started_at") => {
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
        title={selectedLog?.title || "Detalle"}
        content={selectedLog?.content || ""}
        onClose={() => setSelectedLog(null)}
      />

      <div className={styles.header}>
        <h1 className={styles.title}>Incidencias globales</h1>
        <p className={styles.subtitle}>Eventos que bloquean o degradan el auto-apply por usuario (cooldowns, etc.)</p>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.filters}>
          <Select
            options={activeOptions}
            value={activeOnly ? "active" : "all"}
            onChange={(v) => {
              setActiveOnly(v === "active")
              setCurrentPage(1)
            }}
            placeholder="Filtrar…"
          />

          <Button variant="primary" size="medium" onClick={() => setActiveOnly(false)}>
            Limpiar filtros
          </Button>
        </div>
      </div>

      <AdminDataTable<RunnerIncident>
        columns={[
          { key: "detected_at", label: "Detectada", width: "auto", sortable: true, render: (r) => <MonoCell>{formatDateTime(r.detected_at)}</MonoCell> },
          { key: "user", label: "Usuario", width: "auto", render: (r) => <MonoCell>{r.user_email || String(r.user_id)}</MonoCell> },
          { key: "incident_type", label: "Tipo", width: "minmax(0, 1fr)", render: (r) => <MonoCell>{r.incident_type}</MonoCell> },
          { key: "severity", label: "Sev", width: "auto", render: (r) => <MonoCell>{r.severity}</MonoCell> },
          { key: "cooldown_until", label: "Cooldown hasta", width: "auto", sortable: true, render: (r) => <MonoCell>{formatDateTime(r.cooldown_until)}</MonoCell> },
          { key: "resolved_at", label: "Resuelta", width: "auto", render: (r) => <MonoCell>{formatDateTime(r.resolved_at)}</MonoCell> },
          {
            key: "resolved_by",
            label: "Resuelta por",
            width: "auto",
            render: (r) => <MonoCell>{r.resolved_by_job_application_id ? `JobApp #${r.resolved_by_job_application_id}` : "-"}</MonoCell>,
          },
          {
            key: "actions",
            label: "Acciones",
            width: "auto",
            render: (r) => (
              <Button
                variant="primary"
                size="small"
                onClick={() =>
                  setSelectedLog({
                    title: `Incident #${r.id} (${r.incident_type})`,
                    content: JSON.stringify(r, null, 2),
                  })
                }
              >
                Ver detalle
              </Button>
            ),
          },
        ]}
        rows={items}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={(f) => handleSort(f as any)}
        emptyText="No hay incidencias globales"
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => setCurrentPage(p)}
      />
    </div>
  )
}


