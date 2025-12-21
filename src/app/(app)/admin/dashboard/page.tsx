"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, type User } from "@/lib/auth"
import { scrapeJobs, cancelScrapeJobs } from "@/lib/jobs"
import { getAdminStatistics } from "@/lib/admin"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { Alert } from "@/components/UI/Alert/Alert"
import {
  FaUsers,
  FaUserCheck,
  FaBriefcase,
  FaUserTimes,
  FaChartLine,
  FaClock,
  FaLinkedin,
  FaPlay,
  FaStop,
} from "react-icons/fa"
import { SiIndeed, SiGlassdoor } from "react-icons/si"
import { FcGoogle } from "react-icons/fc"
import styles from "./admin-dashboard.module.css"

const INGEST_STORAGE_KEY = "admin_ingest_status"

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [statistics, setStatistics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isIngesting, setIsIngesting] = useState(false)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
    } else {
      setUser(currentUser)
      // Restaurar estado de ingesta desde sessionStorage
      const savedStatus = sessionStorage.getItem(INGEST_STORAGE_KEY)
      if (savedStatus === "ingesting") {
        setIsIngesting(true)
      }
      loadStatistics()
    }
  }, [router])

  const loadStatistics = async () => {
    setIsLoading(true)
    try {
      const response = await getAdminStatistics()
      if (response.success && response.statistics) {
        setStatistics(response.statistics)
      } else {
        setAlert({
          status: "error",
          message: response.error || "Error al cargar las estadísticas",
        })
      }
    } catch (error) {
      console.error("Error loading statistics:", error)
      setAlert({
        status: "error",
        message: "Error al cargar las estadísticas",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleIngestOffers = async () => {
    if (!user) return

    // Si ya está ingiriendo, cancelar
    if (isIngesting) {
      handleCancelIngest()
      return
    }

    setIsIngesting(true)
    sessionStorage.setItem(INGEST_STORAGE_KEY, "ingesting")
    setAlert(null)

    // Crear AbortController para poder cancelar la petición
    abortControllerRef.current = new AbortController()

    try {
      // URL de búsqueda genérica de LinkedIn Jobs (últimas 24 horas, todo el mundo)
      const searchUrl =
        "https://www.linkedin.com/jobs/search/?f_TPR=r86400&geoId=92000000&keywords=developer&origin=JOB_SEARCH_PAGE_LOCATION_AUTOCOMPLETE&refresh=true"

      const response = await scrapeJobs(user.id, searchUrl, 50, abortControllerRef.current.signal)

      if (response.success) {
        const successMessage =
          response.message || `Ingesta completada: ${response.jobs_saved || 0} ofertas nuevas guardadas`
        setAlert({
          status: "success",
          message: successMessage,
        })
        // Ocultar alerta después de 8 segundos
        setTimeout(() => setAlert(null), 8000)
      } else {
        setAlert({
          status: "error",
          message: response.error || "Error al realizar la ingesta",
        })
        // Ocultar alerta después de 8 segundos
        setTimeout(() => setAlert(null), 8000)
      }
    } catch (error: any) {
      // Si el error es por cancelación, no mostrar error
      if (error.name === "AbortError") {
        setAlert({
          status: "error",
          message: "Ingesta cancelada",
        })
        setTimeout(() => setAlert(null), 5000)
      } else {
        setAlert({
          status: "error",
          message: "Error conectando con el servidor",
        })
        // Ocultar alerta después de 8 segundos
        setTimeout(() => setAlert(null), 8000)
      }
    } finally {
      setIsIngesting(false)
      sessionStorage.removeItem(INGEST_STORAGE_KEY)
      abortControllerRef.current = null
    }
  }

  const handleCancelIngest = async () => {
    if (!user) return

    // Cancelar la petición HTTP si está en curso
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Llamar al endpoint del backend para cancelar el scraping
    try {
      const response = await cancelScrapeJobs(user.id)
      if (response.success) {
        setAlert({
          status: "error",
          message: response.message || "Ingesta cancelada",
        })
      } else {
        setAlert({
          status: "error",
          message: response.error || "Error al cancelar la ingesta",
        })
      }
      setTimeout(() => setAlert(null), 5000)
    } catch (error) {
      console.error("Error cancelando scraping:", error)
      setAlert({
        status: "error",
        message: "Error al cancelar la ingesta",
      })
      setTimeout(() => setAlert(null), 5000)
    }

    setIsIngesting(false)
    sessionStorage.removeItem(INGEST_STORAGE_KEY)
  }

  if (!user || isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className={styles.container}>
        <p>Error al cargar las estadísticas</p>
      </div>
    )
  }

  const totalApplications = statistics.applications.total

  // Portales que siempre deben mostrarse
  const allPortals = ["LinkedIn", "Indeed", "Google Jobs"]
  const upcomingPortals = ["Indeed", "Google Jobs"]

  // Crear un mapa de portales desde los datos del backend
  const portalDataMap = new Map(
    statistics.applications.byPortal.map((portal: any) => [portal.name, portal.count])
  )

  // Combinar portales fijos con datos del backend
  const portalsToDisplay = allPortals.map((portalName) => {
    const count = portalDataMap.get(portalName) || 0
    return {
      name: portalName,
      count: count,
    }
  })

  const portalIcons: Record<string, React.ReactNode> = {
    LinkedIn: <FaLinkedin size={24} color="#0077B5" />,
    Indeed: <SiIndeed size={24} color="#2164f3" />,
    "Google Jobs": <FcGoogle size={24} />,
  }

  return (
    <div className={styles.container}>
      {alert && <Alert status={alert.status} message={alert.message} onClose={() => setAlert(null)} />}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard Administrativo</h1>
          <p className={styles.subtitle}>Métricas y gestión del sistema</p>
        </div>
        <button
          className={`${styles.ingestButton} ${isIngesting ? styles.ingesting : ""}`}
          onClick={handleIngestOffers}
        >
          {isIngesting ? <FaStop /> : <FaPlay />}
          {isIngesting ? "Detener Ingesta" : "Realizar Ingesta"}
        </button>
      </div>

      <div className={styles.usersGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaUsers className={styles.metricIcon} />
            <h3 className={styles.metricTitle}>Total Usuarios</h3>
          </div>
          <p className={styles.metricValue}>{statistics.users.total}</p>
          <p className={styles.metricLabel}>Usuarios registrados</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaUserCheck className={styles.metricIcon} style={{ color: "#10b981" }} />
            <h3 className={styles.metricTitle}>Usuarios Activos</h3>
          </div>
          <p className={styles.metricValue}>{statistics.users.active}</p>
          <p className={styles.metricLabel}>Suscripción vigente</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaBriefcase className={styles.metricIcon} style={{ color: "#3b82f6" }} />
            <h3 className={styles.metricTitle}>Contratados</h3>
          </div>
          <p className={styles.metricValue}>{statistics.users.contracted}</p>
          <p className={styles.metricLabel}>Usuarios empleados</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaUserTimes className={styles.metricIcon} style={{ color: "#ef4444" }} />
            <h3 className={styles.metricTitle}>Bajas</h3>
          </div>
          <p className={styles.metricValue}>{statistics.users.cancelled}</p>
          <p className={styles.metricLabel}>Usuarios dados de baja</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <FaChartLine className={styles.statIcon} />
            <h3 className={styles.statTitle}>% Clientes Contratados</h3>
          </div>
          <p className={styles.statValue}>{statistics.users.contractedPercentage}%</p>
          <p className={styles.statDescription}>
            {statistics.users.contracted} de {statistics.users.total} usuarios
          </p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <FaClock className={styles.statIcon} />
            <h3 className={styles.statTitle}>Promedio Días de Contratación</h3>
          </div>
          <p className={styles.statValue}>{statistics.users.avgContractDays}</p>
          <p className={styles.statDescription}>días promedio hasta contratar</p>
        </div>
      </div>

      <div className={styles.offersGrid}>
        <div className={styles.offerCard}>
          <h3 className={styles.offerTitle}>Ofertas Totales</h3>
          <p className={styles.offerValue}>{statistics.offers.total.toLocaleString()}</p>
          <p className={styles.offerLabel}>Disponibles en portales</p>
        </div>

        <div className={styles.offerCard}>
          <h3 className={styles.offerTitle}>Aplicaciones Totales</h3>
          <p className={styles.offerValue}>{statistics.applications.total.toLocaleString()}</p>
          <p className={styles.offerLabel}>Enviadas por el sistema</p>
        </div>
      </div>

      <div className={styles.portalsCard}>
        <h2 className={styles.sectionTitle}>Distribución por Portal</h2>
        <div className={styles.portalsList}>
          {portalsToDisplay.map((portal) => {
            const isUpcoming = upcomingPortals.includes(portal.name)
            const percentage = isUpcoming
              ? 0
              : totalApplications > 0
                ? Math.round((portal.count / totalApplications) * 100)
                : 0

            return (
              <div key={portal.name} className={styles.portalItem}>
                <div className={styles.portalInfo}>
                  <div className={`${styles.portalNameWrapper} ${isUpcoming ? styles.portalInactive : ""}`}>
                    {portalIcons[portal.name]}
                    <span className={styles.portalName}>{portal.name}</span>
                  </div>
                  <span className={styles.portalApps}>
                    {isUpcoming
                      ? "Próximamente"
                      : `${portal.count.toLocaleString()} aplicaciones (${percentage}%)`}
                  </span>
                </div>
                {!isUpcoming && (
                  <div className={styles.portalBar}>
                    <div className={styles.portalBarFill} style={{ width: `${percentage}%` }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
