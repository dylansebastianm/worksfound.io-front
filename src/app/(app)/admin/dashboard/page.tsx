"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, type User } from "@/lib/auth"
import { getAdminStatistics } from "@/lib/admin"
import {
  FaUsers,
  FaUserCheck,
  FaBriefcase,
  FaUserTimes,
  FaChartLine,
  FaClock,
  FaLinkedin,
  FaPlay,
  FaCog,
  FaStop,
} from "react-icons/fa"
import { SiIndeed, SiGlassdoor } from "react-icons/si"
import { FcGoogle } from "react-icons/fc"
import IngestionConfigModal, { type IngestionConfig } from "@/components/UI/IngestionConfigModal/IngestionConfigModal"
import { getIngestionConfig, updateIngestionConfig } from "@/lib/ingestion"
import { scrapeJobs, getScrapeStatus, cancelScrapeJobs } from "@/lib/jobs"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import DistributionCard from "@/components/UI/DistributionCard/DistributionCard"
import { Alert } from "@/components/UI/Alert/Alert"
import styles from "./admin-dashboard.module.css"

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isIngesting, setIsIngesting] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [ingestConfig, setIngestConfig] = useState<IngestionConfig>({
    url: "https://www.linkedin.com/jobs/search",
    limit: 200,
    scheduledTime: "",
    autoSchedule: false,
    seedTotalResults: null,
    generatedQueue: null,
    segmentsTotal: null,
    coveragePercent: null,
  })
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<any>(null)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)
  const router = useRouter()
  const ingestPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ingestStartTimeRef = useRef<number | null>(null)
  const [elapsedDisplay, setElapsedDisplay] = useState("0s")

  function formatElapsed(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  useEffect(() => {
    if (!isIngesting) return
    const id = setInterval(() => {
      const start = ingestStartTimeRef.current
      if (start == null) return
      setElapsedDisplay(formatElapsed(Math.floor((Date.now() - start) / 1000)))
    }, 1000)
    return () => clearInterval(id)
  }, [isIngesting])

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
    } else {
      setUser(currentUser)
      loadIngestionConfig()
      loadAdminStats()
      
      // Verificar si hay una ingesta en curso desde sessionStorage y reanudar polling
      if (typeof window !== "undefined") {
        const ingestingState = sessionStorage.getItem("ingesting_state")
        if (ingestingState === "true" && currentUser?.id) {
          const startTs = sessionStorage.getItem("ingest_start_ts")
          const start = startTs ? parseInt(startTs, 10) : Date.now()
          ingestStartTimeRef.current = start
          setElapsedDisplay(formatElapsed(Math.floor((Date.now() - start) / 1000)))
          setIsIngesting(true)
          if (ingestPollRef.current) clearInterval(ingestPollRef.current)
          ingestPollRef.current = setInterval(async () => {
            const statusRes = await getScrapeStatus(currentUser.id)
            if (statusRes.success && statusRes.is_running === false) {
              if (ingestPollRef.current) {
                clearInterval(ingestPollRef.current)
                ingestPollRef.current = null
              }
              ingestStartTimeRef.current = null
              sessionStorage.removeItem("ingesting_state")
              sessionStorage.removeItem("ingest_start_ts")
              setIsIngesting(false)
              loadAdminStats()
              setAlert({
                status: "success",
                message: "Ingesta finalizada. Revisa Logs de ingesta para el resultado.",
              })
            }
          }, 4000)
        }
      }
    }
    return () => {
      if (ingestPollRef.current) {
        clearInterval(ingestPollRef.current)
        ingestPollRef.current = null
      }
    }
  }, [router])

  const loadAdminStats = async () => {
    setIsLoadingStats(true)
    setStatsError(null)
    try {
      const res = await getAdminStatistics()
      if (res.success && res.statistics) {
        setStatistics(res.statistics)
      } else {
        setStatsError(res.error || "Error al cargar estadísticas")
        setStatistics(null)
      }
    } catch (e) {
      setStatsError("Error al cargar estadísticas")
      setStatistics(null)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const loadIngestionConfig = async () => {
    setIsLoadingConfig(true)
    try {
      const response = await getIngestionConfig()
      if (response.success && response.config) {
        setIngestConfig({
          url: response.config.url,
          limit: response.config.max_jobs,
          scheduledTime: response.config.scheduled_time || "",
          autoSchedule: response.config.auto_schedule_enabled,
          seedTotalResults: response.config.seed_total_results ?? null,
          generatedQueue: response.config.generated_queue ?? null,
          segmentsTotal: response.config.segments_total ?? null,
          coveragePercent: response.config.coverage_percent ?? null,
        })
      }
    } catch (error) {
      console.error("Error cargando configuración de ingesta:", error)
    } finally {
      setIsLoadingConfig(false)
    }
  }

  const handleIngestOffers = async () => {
    if (!user) return

    const startedAt = Date.now()
    setIsIngesting(true)
    ingestStartTimeRef.current = startedAt
    setElapsedDisplay("0s")
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ingesting_state", "true")
      sessionStorage.setItem("ingest_start_ts", String(startedAt))
    }

    try {
      const response = await scrapeJobs(
        user.id,
        ingestConfig.url,
        ingestConfig.limit
      )

      if (response.success) {
        setAlert({
          status: "success",
          message: response.message || "Ingesta iniciada. El proceso continúa en segundo plano.",
        })
        // Polling hasta que el backend termine
        if (ingestPollRef.current) clearInterval(ingestPollRef.current)
        ingestPollRef.current = setInterval(async () => {
          const statusRes = await getScrapeStatus(user.id)
          if (statusRes.success && statusRes.is_running === false) {
            if (ingestPollRef.current) {
              clearInterval(ingestPollRef.current)
              ingestPollRef.current = null
            }
            ingestStartTimeRef.current = null
            setIsIngesting(false)
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("ingesting_state")
              sessionStorage.removeItem("ingest_start_ts")
            }
            loadAdminStats()
            setAlert({
              status: "success",
              message: "Ingesta finalizada. Revisa Logs de ingesta para el resultado.",
            })
          }
        }, 4000)
      } else {
        ingestStartTimeRef.current = null
        setIsIngesting(false)
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("ingesting_state")
          sessionStorage.removeItem("ingest_start_ts")
        }
        setAlert({
          status: "error",
          message: `Error en la ingesta: ${response.error || "Error desconocido"}`,
        })
      }
    } catch (error: any) {
      console.error("Error en ingesta:", error)
      ingestStartTimeRef.current = null
      setIsIngesting(false)
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("ingesting_state")
        sessionStorage.removeItem("ingest_start_ts")
      }
      setAlert({
        status: "error",
        message: "Error al realizar la ingesta. Por favor, intenta nuevamente.",
      })
    }
  }

  const handleCancelIngest = async () => {
    if (!user) return
    try {
      const response = await cancelScrapeJobs(user.id)
      if (ingestPollRef.current) {
        clearInterval(ingestPollRef.current)
        ingestPollRef.current = null
      }
      ingestStartTimeRef.current = null
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("ingesting_state")
        sessionStorage.removeItem("ingest_start_ts")
      }
      setIsIngesting(false)
      if (response.success) {
        setAlert({ status: "success", message: "Ingesta detenida correctamente." })
      } else {
        setAlert({ status: "error", message: response.error || "No se pudo detener la ingesta." })
      }
    } catch (error) {
      console.error("Error deteniendo ingesta:", error)
      ingestStartTimeRef.current = null
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("ingesting_state")
        sessionStorage.removeItem("ingest_start_ts")
      }
      setIsIngesting(false)
      setAlert({ status: "error", message: "Error al detener la ingesta." })
    }
  }

  const handleSaveConfig = async (config: IngestionConfig) => {
    setIsSavingConfig(true)
    try {
      const response = await updateIngestionConfig({
        url: config.url,
        max_jobs: config.limit,
        scheduled_time: config.scheduledTime || null,
        auto_schedule_enabled: config.autoSchedule,
      })

      if (response.success && response.config) {
        setIngestConfig({
          url: config.url,
          limit: config.limit,
          scheduledTime: config.scheduledTime,
          autoSchedule: config.autoSchedule,
          seedTotalResults: response.config.seed_total_results ?? null,
          generatedQueue: response.config.generated_queue ?? null,
          segmentsTotal: response.config.segments_total ?? null,
          coveragePercent: response.config.coverage_percent ?? null,
        })
        setShowConfigModal(false)
        setAlert({
          status: "success",
          message: response.config.generated_queue?.length
            ? `Configuración guardada. Plan de ingesta: ${response.config.generated_queue.length} URL(s).`
            : "Configuración guardada exitosamente",
        })
      } else {
        setAlert({
          status: "error",
          message: `Error al guardar configuración: ${response.error || "Error desconocido"}`,
        })
      }
    } catch (error) {
      console.error("Error guardando configuración:", error)
      setAlert({
        status: "error",
        message: "Error al guardar la configuración. Por favor, intenta nuevamente.",
      })
    } finally {
      setIsSavingConfig(false)
    }
  }

  if (!user) {
    return null
  }

  if (isLoadingStats) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className={styles.container}>
        <p style={{ color: "var(--text-secondary)" }}>{statsError || "No se pudo cargar el dashboard"}</p>
      </div>
    )
  }

  const portalIcons: Record<string, React.ReactNode> = {
    LinkedIn: <FaLinkedin size={24} color="#0077B5" />,
    Indeed: <SiIndeed size={24} color="#2164f3" />,
    Glassdoor: <SiGlassdoor size={24} color="#0caa41" />,
    "Google Jobs": <FcGoogle size={24} />,
  }

  const upcomingPortals = ["Indeed", "Glassdoor", "Google Jobs"]

  const totalApplications = statistics.applications?.total || 0
  const portalCountsMap = new Map<string, number>(
    (statistics.applications?.byPortal || []).map((p: any) => [p.name, p.count])
  )

  const portalsToShow = ["LinkedIn", "Indeed", "Glassdoor", "Google Jobs"].map((name) => ({
    name,
    applications: portalCountsMap.get(name) || 0,
  }))

  const redirectsOffersRaw = statistics.offers?.redirectsOffers || []
  const redirectsOffersSorted = [...redirectsOffersRaw].sort((a: any, b: any) => (b?.count || 0) - (a?.count || 0))
  const totalRedirectOffers = redirectsOffersSorted.reduce((acc: number, p: any) => acc + (p?.count || 0), 0)

  return (
    <div className={styles.container}>
      {alert && <Alert status={alert.status} message={alert.message} onClose={() => setAlert(null)} />}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard Administrativo</h1>
          <p className={styles.subtitle}>Métricas y gestión del sistema</p>
        </div>
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.ingestButton} ${isIngesting ? styles.ingesting : ""}`}
            onClick={handleIngestOffers}
            disabled={isIngesting}
          >
            <FaPlay />
            {isIngesting ? `Realizando ingesta ${elapsedDisplay}` : "Realizar Ingesta"}
          </button>
          {isIngesting && (
            <button
              type="button"
              className={styles.stopButton}
              onClick={handleCancelIngest}
              title="Detener ingesta"
            >
              <FaStop />
              Detener
            </button>
          )}
          <button className={styles.configButton} onClick={() => setShowConfigModal(true)} title="Configurar ingesta">
            <FaCog />
          </button>
        </div>
      </div>

      <IngestionConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleSaveConfig}
        initialConfig={ingestConfig}
        isSaving={isSavingConfig}
      />

      <div className={styles.usersGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaUsers className={styles.metricIcon} />
            <h3 className={styles.metricTitle}>Total Usuarios</h3>
          </div>
          <p className={styles.metricValue}>{statistics.users?.total || 0}</p>
          <p className={styles.metricLabel}>Usuarios registrados</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaUserCheck className={styles.metricIcon} style={{ color: "#10b981" }} />
            <h3 className={styles.metricTitle}>Usuarios Activos</h3>
          </div>
          <p className={styles.metricValue}>{statistics.users?.active || 0}</p>
          <p className={styles.metricLabel}>Suscripción vigente</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaBriefcase className={styles.metricIcon} style={{ color: "#3b82f6" }} />
            <h3 className={styles.metricTitle}>Contratados</h3>
          </div>
          <p className={styles.metricValue}>{statistics.users?.contracted || 0}</p>
          <p className={styles.metricLabel}>Usuarios empleados</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaUserTimes className={styles.metricIcon} style={{ color: "#ef4444" }} />
            <h3 className={styles.metricTitle}>Bajas</h3>
          </div>
          <p className={styles.metricValue}>{statistics.users?.cancelled || 0}</p>
          <p className={styles.metricLabel}>Usuarios dados de baja</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <FaChartLine className={styles.statIcon} />
            <h3 className={styles.statTitle}>% Clientes Contratados</h3>
          </div>
          <p className={styles.statValue}>{statistics.users?.contractedPercentage || 0}%</p>
          <p className={styles.statDescription}>
            {statistics.users?.contracted || 0} de {statistics.users?.total || 0} usuarios
          </p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <FaClock className={styles.statIcon} />
            <h3 className={styles.statTitle}>Promedio Días de Contratación</h3>
          </div>
          <p className={styles.statValue}>{statistics.users?.avgContractDays || 0}</p>
          <p className={styles.statDescription}>días promedio hasta contratar</p>
        </div>
      </div>

      <div className={styles.offersGrid}>
        <div className={styles.offerCard}>
          <h3 className={styles.offerTitle}>Ofertas Totales</h3>
          <p className={styles.offerValue}>{(statistics.offers?.total || 0).toLocaleString()}</p>
          <p className={styles.offerLabel}>Disponibles en portales</p>
        </div>

        <div className={styles.offerCard}>
          <h3 className={styles.offerTitle}>Aplicaciones Totales</h3>
          <p className={styles.offerValue}>{(statistics.applications?.total || 0).toLocaleString()}</p>
          <p className={styles.offerLabel}>Enviadas por el sistema</p>
        </div>

        <div className={styles.offerCard}>
          <h3 className={styles.offerTitle}>Respuestas IA Totales</h3>
          <p className={styles.offerValue}>{(statistics.ai?.responsesTotal || 0).toLocaleString()}</p>
          <p className={styles.offerLabel}>Generadas automáticamente</p>
        </div>
      </div>

      <DistributionCard
        title="Distribución por Portal"
        unitLabelPlural="aplicaciones"
        totalOverride={totalApplications}
        items={portalsToShow.map((p) => ({
          name: p.name,
          count: p.applications,
          icon: portalIcons[p.name],
          inactive: upcomingPortals.includes(p.name),
          inactiveLabel: "Próximamente",
        }))}
      />

      <div style={{ height: 16 }} />

      <DistributionCard
        title="Redirects por ATS"
        unitLabelPlural="ofertas"
        totalOverride={totalRedirectOffers}
        items={redirectsOffersSorted.map((p: any) => ({
          name: p.name,
          count: p.count,
        }))}
      />
    </div>
  )
}
