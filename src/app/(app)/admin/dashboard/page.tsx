"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
} from "react-icons/fa"
import { SiIndeed, SiGlassdoor } from "react-icons/si"
import { FcGoogle } from "react-icons/fc"
import IngestionConfigModal, { type IngestionConfig } from "@/components/UI/IngestionConfigModal/IngestionConfigModal"
import { getIngestionConfig, updateIngestionConfig } from "@/lib/ingestion"
import { scrapeJobs } from "@/lib/jobs"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import DistributionCard from "@/components/UI/DistributionCard/DistributionCard"
import { Alert } from "@/components/UI/Alert/Alert"
import styles from "./admin-dashboard.module.css"

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isIngesting, setIsIngesting] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [ingestConfig, setIngestConfig] = useState<IngestionConfig>({
    url: "https://www.linkedin.com/jobs/search/?currentJobId=4348975976&f_TPR=r2592000&geoId=92000000&keywords=fullstack%20developer&origin=JOB_SEARCH_PAGE_LOCATION_AUTOCOMPLETE&refresh=true",
    limit: 200,
    scheduledTime: "",
    autoSchedule: false,
  })
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<any>(null)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
    } else {
      setUser(currentUser)
      // Cargar configuración de ingesta al montar el componente
      loadIngestionConfig()
      loadAdminStats()
      
      // Verificar si hay una ingesta en curso desde sessionStorage
      if (typeof window !== "undefined") {
        const ingestingState = sessionStorage.getItem("ingesting_state")
        if (ingestingState === "true") {
          setIsIngesting(true)
        }
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

    setIsIngesting(true)
    // Guardar estado en sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ingesting_state", "true")
    }
    
    try {
      // Usar la configuración guardada
      const response = await scrapeJobs(
        user.id,
        ingestConfig.url,
        ingestConfig.limit
      )

      if (response.success) {
        const message = response.message || `Ingesta completada: ${response.jobs_saved || 0} ofertas nuevas guardadas`
        setAlert({
          status: "success",
          message: message,
        })
      } else {
        setAlert({
          status: "error",
          message: `Error en la ingesta: ${response.error || "Error desconocido"}`,
        })
      }
    } catch (error: any) {
      console.error("Error en ingesta:", error)
      setAlert({
        status: "error",
        message: "Error al realizar la ingesta. Por favor, intenta nuevamente.",
      })
    } finally {
      setIsIngesting(false)
      // Eliminar estado de sessionStorage al terminar
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("ingesting_state")
      }
    }
  }

  const handleSaveConfig = async (config: IngestionConfig) => {
    try {
      const response = await updateIngestionConfig({
        url: config.url,
        max_jobs: config.limit,
        scheduled_time: config.scheduledTime || null,
        auto_schedule_enabled: config.autoSchedule,
      })

      if (response.success) {
        setIngestConfig(config)
        setShowConfigModal(false)
        setAlert({
          status: "success",
          message: "Configuración guardada exitosamente",
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
            {isIngesting ? "Realizando Ingesta..." : "Realizar Ingesta"}
          </button>
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
