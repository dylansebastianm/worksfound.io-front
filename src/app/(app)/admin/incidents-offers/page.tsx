"use client"

import { useEffect, useState } from "react"
import { Alert } from "@/components/UI/Alert/Alert"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { Pagination } from "@/components/UI/Pagination/Pagination"
import { AdminDataTable, ExternalLinkCell, MonoCell } from "@/components/UI/AdminDataTable/AdminDataTable"
import { SimpleLogModal } from "@/components/UI/SimpleLogModal/SimpleLogModal"
import { Select } from "@/components/UI/Select/Select"
import { Button } from "@/components/UI/Button/Button"
import { getJobApplicationAttempts } from "@/lib/incidents"
import type { JobApplicationAttempt } from "@/types/admin"
import styles from "../logs/logs.module.css"

export default function AdminOfferIncidentsPage() {
  const [items, setItems] = useState<JobApplicationAttempt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [failureType, setFailureType] = useState<"all" | "job_closed" | "other">("all")
  const [selectedLog, setSelectedLog] = useState<{ title: string; content: string } | null>(null)

  const itemsPerPage = 10
  const failureTypeOptions = [
    { value: "all", label: "Todos" },
    { value: "job_closed", label: "Job closed" },
    { value: "other", label: "Other" },
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
  }, [currentPage, failureType])

  const load = async () => {
    setIsLoading(true)
    try {
      const res = await getJobApplicationAttempts({
        page: currentPage,
        limit: itemsPerPage,
        failureType: failureType === "all" ? undefined : failureType,
        sortField: "created_at",
        sortDirection: "desc",
      })
      if (res.success && res.attempts && res.pagination) {
        setItems(res.attempts)
        setTotalPages(res.pagination.totalPages)
        setTotalCount(res.pagination.total)
      } else {
        setAlert({ status: "error", message: res.error || "Error al cargar ofertas específicas" })
      }
    } catch (e) {
      console.error(e)
      setAlert({ status: "error", message: "Error al cargar ofertas específicas" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {isLoading && <LoadingSpinner />}
      {alert && <Alert status={alert.status} message={alert.message} onClose={() => setAlert(null)} />}
      <SimpleLogModal
        isOpen={!!selectedLog}
        title={selectedLog?.title || "Log"}
        content={selectedLog?.content || ""}
        onClose={() => setSelectedLog(null)}
      />

      <div className={styles.header}>
        <h1 className={styles.title}>Ofertas específicas</h1>
        <p className={styles.subtitle}>Intentos fallidos/omitidos por oferta (vinculados a usuario). No incluye failure_message.</p>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.filters}>
          <Select
            options={failureTypeOptions}
            value={failureType}
            onChange={(v) => {
              setFailureType(v as any)
              setCurrentPage(1)
            }}
            placeholder="Filtrar…"
          />

          <Button
            variant="primary"
            size="medium"
            onClick={() => {
              setFailureType("all")
              setCurrentPage(1)
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      <AdminDataTable<JobApplicationAttempt>
        columns={[
          { key: "created_at", label: "Fecha", width: "auto", render: (r) => <MonoCell>{formatDateTime(r.created_at)}</MonoCell> },
          { key: "user", label: "Usuario", width: "auto", render: (r) => <MonoCell>{r.user_email || String(r.user_id)}</MonoCell> },
          {
            key: "offer_url",
            label: "Oferta",
            width: "clamp(220px, 30vw, 380px)",
            render: (r) => {
              if (!r.offer_url) return <MonoCell>-</MonoCell>
              const display = r.offer_url.replace(/^https?:\/\/(www\.)?/, "")
              // No cortar a mano: dejamos que el ellipsis CSS haga el truncado natural según el ancho real.
              return <ExternalLinkCell href={r.offer_url} text={display} />
            },
          },
          {
            key: "apply_type",
            label: "Tipo",
            width: "auto",
            render: (r) => <MonoCell>{r.easy_apply ? "Easy" : `ATS${r.redirect_page_name ? ` (${r.redirect_page_name})` : ""}`}</MonoCell>,
          },
          { key: "error_type", label: "Error type", width: "auto", render: (r) => <MonoCell>{r.error_type}</MonoCell> },
          { key: "step", label: "Step", width: "auto", render: (r) => <MonoCell>{r.step || "-"}</MonoCell> },
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
                    title: `Attempt #${r.id} (user ${r.user_id})`,
                    content: r.error_log || "-",
                  })
                }
              >
                Ver log
              </Button>
            ),
          },
        ]}
        rows={items}
        emptyText="No hay intentos por oferta"
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => setCurrentPage(p)}
      />
    </div>
  )
}


