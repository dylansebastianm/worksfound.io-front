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
import styles from "./dashboard.module.css"

const mockUserData = {
  joinDate: new Date("2025-11-01"), // Date when user subscribed
  applicationsSubmitted: 847,
  manualApplicationsRate: 10, // per day
  contactsReceived: 23,
  hrInterviews: 8,
  technicalChallenges: 5,
  culturalInterviews: 3,
  proposalsReceived: 1,
  messagesSent: 156,
  aiResponsesGenerated: 342,
  portals: [
    { name: "LinkedIn", connected: true, applications: 312 },
    { name: "Indeed", connected: true, applications: 245 },
    { name: "Glassdoor", connected: false, applications: 0 },
    { name: "Google Jobs", connected: true, applications: 290 },
  ],
  avgSalaryPerDay: 250, // USD lost per day without job
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  const today = new Date()
  const daysSubscribed = Math.floor((today.getTime() - mockUserData.joinDate.getTime()) / (1000 * 60 * 60 * 24))
  const estimatedDaysToJob = 44
  const daysRemaining = Math.max(0, estimatedDaysToJob - daysSubscribed)
  const progressPercentage = Math.min(100, Math.round((daysSubscribed / estimatedDaysToJob) * 100))

  const manualApplications = daysSubscribed * mockUserData.manualApplicationsRate
  const extraApplications = mockUserData.applicationsSubmitted - manualApplications
  const hoursPerApplication = 0.5
  const hoursSaved = Math.floor(mockUserData.applicationsSubmitted * hoursPerApplication)
  const moneyLost = daysSubscribed * mockUserData.avgSalaryPerDay

  const connectedPortals = mockUserData.portals.filter((p) => p.connected).length
  const totalApplications = mockUserData.portals.reduce((sum, p) => sum + p.applications, 0)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
    } else {
      setUser(currentUser)
    }
  }, [router])

  if (!user) {
    return null
  }

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
              <p className={styles.metricValue}>{mockUserData.applicationsSubmitted}</p>
              <p className={styles.metricLabel}>Total de aplicaciones</p>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <FaUserTie className={styles.metricIcon} />
                <h3 className={styles.metricTitle}>Contactos Recibidos</h3>
              </div>
              <p className={styles.metricValue}>{mockUserData.contactsReceived}</p>
              <p className={styles.metricLabel}>Respuestas de reclutadores</p>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <SiOpenai className={styles.metricIcon} />
              <h3 className={styles.metricTitle}>Respuestas con IA</h3>
            </div>
            <p className={styles.metricValue}>{mockUserData.aiResponsesGenerated}</p>
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
          <p className={styles.metricValue}>{mockUserData.hrInterviews}</p>
          <p className={styles.metricLabel}>Realizadas</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaCode className={styles.metricIcon} />
            <h3 className={styles.metricTitle}>Desafíos Técnicos</h3>
          </div>
          <p className={styles.metricValue}>{mockUserData.technicalChallenges}</p>
          <p className={styles.metricLabel}>Pruebas y entrevistas técnicas</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaUsers className={styles.metricIcon} />
            <h3 className={styles.metricTitle}>Entrevista Final</h3>
          </div>
          <p className={styles.metricValue}>{mockUserData.culturalInterviews}</p>
          <p className={styles.metricLabel}>Entrevistas culturales</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <FaTrophy className={styles.metricIcon} />
            <h3 className={styles.metricTitle}>Propuestas</h3>
          </div>
          <p className={styles.metricValue}>{mockUserData.proposalsReceived}</p>
          <p className={styles.metricLabel}>Ofertas recibidas</p>
        </div>
      </div>

      <div className={styles.automationGrid}>
        <div className={styles.automationCard}>
          <div className={styles.metricHeader}>
            <FaEnvelope className={styles.metricIcon} />
            <h3 className={styles.automationTitle}>Mensajes Enviados</h3>
          </div>
          <p className={styles.automationValue}>{mockUserData.messagesSent}</p>
          <p className={styles.automationLabel}>A reclutadores automáticamente</p>
        </div>
      </div>

      <div className={styles.portalsCard}>
        <h2 className={styles.sectionTitle}>Portales Conectados ({connectedPortals})</h2>
        <div className={styles.portalsList}>
          {mockUserData.portals
            .filter((p) => p.connected)
            .map((portal) => {
              const percentage = totalApplications > 0 ? Math.round((portal.applications / totalApplications) * 100) : 0
              return (
                <div key={portal.name} className={styles.portalItem}>
                  <div className={styles.portalInfo}>
                    <div className={styles.portalNameWrapper}>
                      {portalIcons[portal.name]}
                      <span className={styles.portalName}>{portal.name}</span>
                    </div>
                    <span className={styles.portalApps}>
                      {portal.applications} aplicaciones ({percentage}%)
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

      <div className={styles.comparisonGrid}>
        <div className={styles.comparisonCard}>
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
              <span className={styles.statValue}>{mockUserData.applicationsSubmitted}</span>
            </div>
          </div>
          <p className={styles.extraApplications}>+{extraApplications} aplicaciones extra gracias a nosotros</p>
        </div>

        <div className={styles.savingsCard}>
          <div className={styles.savingItem}>
            <FaClock className={styles.metricIcon} style={{ marginBottom: "8px" }} />
            <h3 className={styles.savingTitle}>Horas Ahorradas</h3>
            <p className={styles.savingValue}>{hoursSaved}h</p>
            <p className={styles.savingLabel}>En búsqueda y postulación</p>
          </div>
          <div className={styles.savingDivider} />
          <div className={styles.savingItem}>
            <FaDollarSign className={styles.metricIcon} style={{ marginBottom: "8px" }} />
            <h3 className={styles.savingTitle}>Dinero en Riesgo</h3>
            <p className={styles.savingValue}>${moneyLost.toLocaleString()}</p>
            <p className={styles.savingLabel}>Perdido por {daysSubscribed} días sin trabajo</p>
          </div>
        </div>
      </div>
    </div>
  )
}
