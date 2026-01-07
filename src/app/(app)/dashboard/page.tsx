"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, type User } from "@/lib/auth"
import {
  FaBriefcase,
  FaUserTie,
  FaHandshake,
  FaCode,
  FaUsers,
  FaTrophy,
  FaEnvelope,
  FaLinkedin,
  FaClock,
  FaDollarSign,
  FaChartLine,
  FaCalendarAlt,
} from "react-icons/fa"
import { SiIndeed, SiGlassdoor, SiOpenai } from "react-icons/si"
import { FcGoogle } from "react-icons/fc"
import { getUserStatistics, type UserStatistics } from "@/lib/users"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { InfoIcon } from "@/components/UI/InfoIcon/InfoIcon"
import styles from "./dashboard.module.css"

// Datos mockeados que se mantienen
const mockData = {
  manualApplicationsRate: 10, // per day
  avgSalaryPerDay: 250, // USD lost per day without job
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [statistics, setStatistics] = useState<UserStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
    } else {
      setUser(currentUser)
      loadStatistics()
    }
  }, [router])

  const loadStatistics = async () => {
    setIsLoading(true)
    try {
      const response = await getUserStatistics()
      if (response.success && response.statistics) {
        setStatistics(response.statistics)
      }
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setIsLoading(false)
    }
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

  // Calcular días desde joinDate
  const today = new Date()
  const joinDate = statistics.joinDate ? new Date(statistics.joinDate) : today
  const daysSubscribed = Math.floor((today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24))
  const estimatedDaysToJob = 44
  const daysRemaining = Math.max(0, estimatedDaysToJob - daysSubscribed)
  const progressPercentage = Math.min(100, Math.round((daysSubscribed / estimatedDaysToJob) * 100))

  // Cálculos mockeados (no tocar)
  const manualApplications = daysSubscribed * mockData.manualApplicationsRate
  const extraApplications = statistics.totalApplications - manualApplications
  // Usar métricas reales del backend
  const hoursSaved = statistics.hoursSaved || 0
  const moneyLost = statistics.opportunityCost || 0

  // Portales conectados (solo los que tienen aplicaciones > 0 o están en la lista)
  const upcomingPortals = ["Indeed", "Google Jobs"]
  const activePortals = statistics.portals.filter((p) => !upcomingPortals.includes(p.name))
  const connectedPortals = statistics.portals.length
  const totalApplications = statistics.portals.reduce((sum, p) => sum + p.applications, 0)

  const portalIcons: Record<string, React.ReactNode> = {
    LinkedIn: <FaLinkedin size={24} color="#0077B5" />,
    Indeed: <SiIndeed size={24} color="#2164f3" />,
    Glassdoor: <SiGlassdoor size={24} color="#0caa41" />,
    "Google Jobs": <FcGoogle size={24} />,
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.welcome}>Bienvenido, {user.name}!</p>

      <div className={styles.topSection}>
        <div className={styles.countdownCard}>
          <div className={styles.countdownHeader}>
            <FaCalendarAlt className={styles.countdownIcon} />
            <div className={styles.countdownInfo}>
              <h2 className={styles.countdownTitle}>Tiempo Estimado para Conseguir Empleo</h2>
              <p className={styles.countdownDisclaimer}>Estimado basado en estadísticas, no garantizable</p>
            </div>
          </div>
          <div className={styles.countdownContent}>
            <div className={styles.countdownValue}>{daysRemaining}</div>
            <div className={styles.countdownLabel}>días restantes</div>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }} />
          </div>
          <div className={styles.progressText}>
            {daysSubscribed} de {estimatedDaysToJob} días transcurridos ({progressPercentage}%)
          </div>
        </div>

        <div className={styles.topMetricsContainer}>
          <div className={styles.topMetricsRow}>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <FaBriefcase className={styles.metricIcon} />
                <h3 className={styles.metricTitle}>Ofertas Aplicadas</h3>
              </div>
              <p className={styles.metricValue}>{statistics.totalApplications}</p>
              <p className={styles.metricLabel}>Total de aplicaciones</p>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <FaUserTie className={styles.metricIcon} />
                <h3 className={styles.metricTitle}>Mensajes Directos</h3>
              </div>
              <p className={styles.metricValue}>{statistics.directMessages}</p>
              <p className={styles.metricLabel}>Mensajes directos recibidos</p>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <SiOpenai className={styles.metricIcon} />
              <h3 className={styles.metricTitle}>Respuestas con IA</h3>
            </div>
            <p className={styles.metricValue}>{statistics.aiResponsesGenerated}</p>
            <p className={styles.metricLabel}>Generadas automáticamente</p>
          </div>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaHandshake className={styles.metricIcon} />
            <h3 className={styles.metricTitle}>Entrevistas RRHH</h3>
          </div>
          <p className={styles.metricValue}>{statistics.hrInterviews}</p>
          <p className={styles.metricLabel}>Realizadas</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaCode className={styles.metricIcon} />
            <h3 className={styles.metricTitle}>Desafíos Técnicos</h3>
          </div>
          <p className={styles.metricValue}>{statistics.technicalChallenges}</p>
          <p className={styles.metricLabel}>Pruebas y entrevistas técnicas</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaUsers className={styles.metricIcon} />
            <h3 className={styles.metricTitle}>Entrevista Final</h3>
          </div>
          <p className={styles.metricValue}>{statistics.culturalInterviews}</p>
          <p className={styles.metricLabel}>Entrevistas culturales</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaTrophy className={styles.metricIcon} />
            <h3 className={styles.metricTitle}>Propuestas</h3>
          </div>
          <p className={styles.metricValue}>{statistics.proposalsReceived}</p>
          <p className={styles.metricLabel}>Ofertas recibidas</p>
        </div>
      </div>

      <div className={styles.automationGrid}>
        <div className={styles.automationCard}>
          <div className={styles.metricHeader}>
            <FaEnvelope className={styles.metricIcon} />
            <h3 className={styles.automationTitle}>Mensajes Enviados</h3>
          </div>
          <p className={styles.automationValue}>{statistics.messagesSent}</p>
          <p className={styles.automationLabel}>A reclutadores automáticamente</p>
        </div>
      </div>

      <div className={styles.portalsCard}>
        <h2 className={styles.sectionTitle}>Portales Conectados ({connectedPortals})</h2>
        <div className={styles.portalsList}>
          {statistics.portals.map((portal) => {
            const isUpcoming = upcomingPortals.includes(portal.name)
            const percentage = isUpcoming
              ? 0
              : totalApplications > 0
                ? Math.round((portal.applications / totalApplications) * 100)
                : 0
            return (
              <div key={portal.name} className={styles.portalItem}>
                <div className={styles.portalInfo}>
                  <div className={`${styles.portalNameWrapper} ${isUpcoming ? styles.portalInactive : ""}`}>
                    {portalIcons[portal.name]}
                    <span className={styles.portalName}>{portal.name}</span>
                  </div>
                  <span className={styles.portalApps}>
                    {isUpcoming ? "Próximamente" : `${portal.applications} aplicaciones (${percentage}%)`}
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

      <div className={styles.comparisonGrid}>
        <div className={styles.comparisonCard}>
          <InfoIcon tooltip="Los usuarios en promedio mandan 10 aplicaciones por día de manera manual" />
          <div className={styles.comparisonHeader}>
            <FaChartLine className={styles.metricIcon} />
            <h3 className={styles.comparisonTitle}>vs Aplicación Manual</h3>
          </div>
          <div className={styles.comparisonStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Manual (10/día)</span>
              <span className={styles.statValue}>{manualApplications}</span>
            </div>
            <div className={styles.statDivider}>vs</div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Con worksfound.io</span>
              <span className={styles.statValue}>{statistics.totalApplications}</span>
            </div>
          </div>
          <p className={styles.extraApplications}>+{extraApplications} aplicaciones extra gracias a nosotros</p>
        </div>

        <div className={styles.savingsCard}>
          <div className={styles.savingItem}>
            <InfoIcon tooltip="En promedio una persona demora 10 minutos en una aplicación sencilla y este tiempo se puede elevar si es redireccionado a otro sitio para concluir la misma" />
            <FaClock className={styles.metricIcon} style={{ marginBottom: "8px" }} />
            <h3 className={styles.savingTitle}>Horas Ahorradas</h3>
            <p className={styles.savingValue}>{hoursSaved.toFixed(1)}h</p>
            <p className={styles.savingLabel}>En búsqueda y postulación</p>
          </div>
          <div className={styles.savingDivider} />
          <div className={styles.savingItem}>
            <InfoIcon tooltip="Costo de oportunidad monetario por día teniendo en cuenta la diferencia entre tu salario actual y el pretendido, por 22 días laborales desde que te diste de alta en worksfound.io" />
            <FaDollarSign className={styles.metricIcon} style={{ marginBottom: "8px" }} />
            <h3 className={styles.savingTitle}>Dinero en Riesgo</h3>
            <p className={styles.savingValue}>${Math.round(moneyLost).toLocaleString()}</p>
            <p className={styles.savingLabel}>Perdido por {daysSubscribed} días sin trabajo</p>
          </div>
        </div>
      </div>
    </div>
  )
}
