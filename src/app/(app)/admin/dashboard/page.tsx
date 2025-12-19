"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, type User } from "@/lib/auth"
import { scrapeJobs, cancelScrapeJobs } from "@/lib/jobs"
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

const mockAdminData = {
  totalUsers: 156,
  activeUsers: 142,
  hiredUsers: 8,
  inactiveUsers: 6,
  hiredPercentage: 5.1,
  avgDaysToHire: 38,
  totalOffers: 45230,
  totalApplications: 132847,
  portals: [
    { name: "LinkedIn", applications: 48920 },
    { name: "Indeed", applications: 38450 },
    { name: "Glassdoor", applications: 21377 },
    { name: "Google Jobs", applications: 24100 },
  ],
}

const INGEST_STORAGE_KEY = "admin_ingest_status"

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null)
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
    }
  }, [router])

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

  if (!user) {
    return null
  }

  const totalApplications = mockAdminData.portals.reduce((sum, p) => sum + p.applications, 0)

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
          <p className={styles.metricValue}>{mockAdminData.totalUsers}</p>
          <p className={styles.metricLabel}>Usuarios registrados</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaUserCheck className={styles.metricIcon} style={{ color: "#10b981" }} />
            <h3 className={styles.metricTitle}>Usuarios Activos</h3>
          </div>
          <p className={styles.metricValue}>{mockAdminData.activeUsers}</p>
          <p className={styles.metricLabel}>Suscripción vigente</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaBriefcase className={styles.metricIcon} style={{ color: "#3b82f6" }} />
            <h3 className={styles.metricTitle}>Contratados</h3>
          </div>
          <p className={styles.metricValue}>{mockAdminData.hiredUsers}</p>
          <p className={styles.metricLabel}>Usuarios empleados</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaUserTimes className={styles.metricIcon} style={{ color: "#ef4444" }} />
            <h3 className={styles.metricTitle}>Bajas</h3>
          </div>
          <p className={styles.metricValue}>{mockAdminData.inactiveUsers}</p>
          <p className={styles.metricLabel}>Usuarios dados de baja</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <FaChartLine className={styles.statIcon} />
            <h3 className={styles.statTitle}>% Clientes Contratados</h3>
          </div>
          <p className={styles.statValue}>{mockAdminData.hiredPercentage}%</p>
          <p className={styles.statDescription}>
            {mockAdminData.hiredUsers} de {mockAdminData.totalUsers} usuarios
          </p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <FaClock className={styles.statIcon} />
            <h3 className={styles.statTitle}>Promedio Días de Contratación</h3>
          </div>
          <p className={styles.statValue}>{mockAdminData.avgDaysToHire}</p>
          <p className={styles.statDescription}>días promedio hasta contratar</p>
        </div>
      </div>

      <div className={styles.offersGrid}>
        <div className={styles.offerCard}>
          <h3 className={styles.offerTitle}>Ofertas Totales</h3>
          <p className={styles.offerValue}>{mockAdminData.totalOffers.toLocaleString()}</p>
          <p className={styles.offerLabel}>Disponibles en portales</p>
        </div>

        <div className={styles.offerCard}>
          <h3 className={styles.offerTitle}>Aplicaciones Totales</h3>
          <p className={styles.offerValue}>{mockAdminData.totalApplications.toLocaleString()}</p>
          <p className={styles.offerLabel}>Enviadas por el sistema</p>
        </div>
      </div>

      <div className={styles.portalsCard}>
        <h2 className={styles.sectionTitle}>Distribución por Portal</h2>
        <div className={styles.portalsList}>
          {mockAdminData.portals.map((portal) => {
            const percentage = totalApplications > 0 ? Math.round((portal.applications / totalApplications) * 100) : 0
            const portalIcons: Record<string, React.ReactNode> = {
              LinkedIn: <FaLinkedin size={24} color="#0077B5" />,
              Indeed: <SiIndeed size={24} color="#2164f3" />,
              Glassdoor: <SiGlassdoor size={24} color="#0caa41" />,
              "Google Jobs": <FcGoogle size={24} />,
            }

            return (
              <div key={portal.name} className={styles.portalItem}>
                <div className={styles.portalInfo}>
                  <div className={styles.portalNameWrapper}>
                    {portalIcons[portal.name]}
                    <span className={styles.portalName}>{portal.name}</span>
                  </div>
                  <span className={styles.portalApps}>
                    {portal.applications.toLocaleString()} aplicaciones ({percentage}%)
                  </span>
                </div>
                <div className={styles.portalBar}>
                  <div className={styles.portalBarFill} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
