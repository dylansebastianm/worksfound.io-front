"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, getAuthHeaders, type User } from "@/lib/auth"
import { getUsers, type User as ApiUser } from "@/lib/users"
import { runProxyDiagnostic } from "@/lib/admin"
import type { ProxyDiagnosticResult } from "@/types/admin"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { Alert } from "@/components/UI/Alert/Alert"
import styles from "./proxy-diagnostic.module.css"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default function AdminProxyDiagnosticPage() {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<ApiUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | "">("")
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<ProxyDiagnosticResult | null>(null)
  const [screenshotBlobUrl, setScreenshotBlobUrl] = useState<string | null>(null)
  const screenshotBlobUrlRef = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(currentUser)
    const load = async () => {
      setLoadingUsers(true)
      try {
        const res = await getUsers({ limit: 500 })
        if (res.success && res.users) {
          setUsers(res.users)
          if (res.users.length > 0 && selectedUserId === "") {
            setSelectedUserId(res.users[0].id)
          }
        }
      } finally {
        setLoadingUsers(false)
      }
    }
    load()
  }, [router])

  const handleRun = async () => {
    if (selectedUserId === "" || running) return
    setRunning(true)
    setError(null)
    setResults(null)
    setScreenshotBlobUrl(null)
    try {
      const res = await runProxyDiagnostic(selectedUserId)
      if (res.success && res.results) {
        setResults(res.results)
        setAlert({ status: "success", message: "Diagnóstico completado." })
      } else {
        setError(res.error || "Error al ejecutar el diagnóstico")
        setAlert({ status: "error", message: res.error || "Error al ejecutar el diagnóstico" })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
      setAlert({ status: "error", message: msg })
    } finally {
      setRunning(false)
    }
  }

  // Cargar la imagen del screenshot por el proxy (con auth admin) para evitar AccessDenied de GCS
  const loadScreenshotViaProxy = useCallback(async (blobPath: string) => {
    if (screenshotBlobUrlRef.current) {
      URL.revokeObjectURL(screenshotBlobUrlRef.current)
      screenshotBlobUrlRef.current = null
    }
    const proxyUrl = `${API_URL}/api/admin/proxy-diagnostic-screenshot?path=${encodeURIComponent(blobPath)}`
    const res = await fetch(proxyUrl, { headers: getAuthHeaders() })
    if (!res.ok) return
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    screenshotBlobUrlRef.current = blobUrl
    setScreenshotBlobUrl(blobUrl)
  }, [])

  useEffect(() => {
    if (!results?.screenshot_blob_path) {
      if (screenshotBlobUrlRef.current) {
        URL.revokeObjectURL(screenshotBlobUrlRef.current)
        screenshotBlobUrlRef.current = null
      }
      setScreenshotBlobUrl(null)
      return
    }
    loadScreenshotViaProxy(results.screenshot_blob_path)
    return () => {
      if (screenshotBlobUrlRef.current) {
        URL.revokeObjectURL(screenshotBlobUrlRef.current)
        screenshotBlobUrlRef.current = null
      }
      setScreenshotBlobUrl(null)
    }
  }, [results?.screenshot_blob_path, loadScreenshotViaProxy])

  if (!user) return null

  return (
    <div className={styles.container}>
      {alert && <Alert status={alert.status} message={alert.message} onClose={() => setAlert(null)} />}
      <div className={styles.header}>
        <h1 className={styles.title}>Diagnóstico de Proxy</h1>
        <p className={styles.subtitle}>
          Comprueba IP, conectividad a LinkedIn y captura de pantalla para un usuario (usa su sesión/cookies).
        </p>
      </div>

      <div className={styles.form}>
        <label className={styles.label}>Usuario</label>
        <select
          className={styles.select}
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : "")}
          disabled={loadingUsers}
        >
          <option value="">Selecciona un usuario</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullname} ({u.email}) — ID {u.id}
            </option>
          ))}
        </select>
        <button
          className={styles.runButton}
          onClick={handleRun}
          disabled={running || selectedUserId === "" || loadingUsers}
        >
          {running ? "Ejecutando..." : "Ejecutar diagnóstico"}
        </button>
      </div>

      {running && (
        <div className={styles.loading}>
          <LoadingSpinner />
          <p>Ejecutando pruebas (IP, LinkedIn, screenshot). Puede tardar unos segundos.</p>
        </div>
      )}

      {error && !results && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {results && (
        <div className={styles.results}>
          <h2 className={styles.resultsTitle}>Resultados</h2>
          <dl className={styles.resultList}>
            <div className={styles.resultRow}>
              <dt>IP del proxy</dt>
              <dd>{results.proxy_ip ?? "—"}</dd>
            </div>
            <div className={styles.resultRow}>
              <dt>Estado IP</dt>
              <dd>
                <span className={results.ip_check_status === "ok" ? styles.ok : styles.warn}>
                  {results.ip_check_status}
                </span>
              </dd>
            </div>
            <div className={styles.resultRow}>
              <dt>Latencia IP (ms)</dt>
              <dd>{results.ip_latency_ms}</dd>
            </div>
            <div className={styles.resultRow}>
              <dt>Estado LinkedIn</dt>
              <dd>
                <span className={results.linkedin_status === "ok" ? styles.ok : styles.warn}>
                  {results.linkedin_status}
                </span>
              </dd>
            </div>
            <div className={styles.resultRow}>
              <dt>Latencia LinkedIn (ms)</dt>
              <dd>{results.linkedin_latency_ms}</dd>
            </div>
            {results.error && (
              <div className={styles.resultRow}>
                <dt>Error</dt>
                <dd className={styles.errorText}>{results.error}</dd>
              </div>
            )}
          </dl>
          {(results.screenshot_blob_path || results.screenshot_url || screenshotBlobUrl) && (
            <div className={styles.screenshot}>
              <dt className={styles.screenshotLabel}>Captura LinkedIn</dt>
              {screenshotBlobUrl ? (
                <>
                  <a href={screenshotBlobUrl} target="_blank" rel="noopener noreferrer" className={styles.screenshotLink}>
                    Abrir en nueva pestaña
                  </a>
                  <img src={screenshotBlobUrl} alt="Screenshot LinkedIn" className={styles.screenshotImg} />
                </>
              ) : (
                <>
                  {results.screenshot_url && (
                    <a href={results.screenshot_url} target="_blank" rel="noopener noreferrer" className={styles.screenshotLink}>
                      Abrir en nueva pestaña
                    </a>
                  )}
                  <p className={styles.screenshotLoading}>Cargando imagen…</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
