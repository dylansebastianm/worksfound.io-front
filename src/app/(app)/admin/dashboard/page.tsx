"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, type User } from "@/lib/auth"
import {
  FaUsers,
  FaUserCheck,
  FaBriefcase,
  FaUserTimes,
  FaChartLine,
  FaClock,
  FaLinkedin,
  FaPlay,
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

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isIngesting, setIsIngesting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
    } else {
      setUser(currentUser)
    }
  }, [router])

  const handleIngestOffers = () => {
    setIsIngesting(true)
    // Simulate ingestion process
    setTimeout(() => {
      setIsIngesting(false)
      alert("Ingesta completada exitosamente")
    }, 3000)
  }

  if (!user) {
    return null
  }

  const totalApplications = mockAdminData.portals.reduce((sum, p) => sum + p.applications, 0)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard Administrativo</h1>
          <p className={styles.subtitle}>Métricas y gestión del sistema</p>
        </div>
        <button
          className={`${styles.ingestButton} ${isIngesting ? styles.ingesting : ""}`}
          onClick={handleIngestOffers}
          disabled={isIngesting}
        >
          <FaPlay />
          {isIngesting ? "Ingiriendo ofertas..." : "Realizar Ingesta"}
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
