"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, type User } from "@/lib/auth"
import styles from "./dashboard.module.css"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.welcome}>Bienvenido, {user.name || user.email}!</p>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Ofertas Aplicadas</h3>
          <p className={styles.cardValue}>0</p>
          <p className={styles.cardLabel}>Total de aplicaciones</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Esta Semana</h3>
          <p className={styles.cardValue}>0</p>
          <p className={styles.cardLabel}>Nuevas aplicaciones</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>En Proceso</h3>
          <p className={styles.cardValue}>0</p>
          <p className={styles.cardLabel}>Respuestas pendientes</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Tasa de Respuesta</h3>
          <p className={styles.cardValue}>0%</p>
          <p className={styles.cardLabel}>Últimos 30 días</p>
        </div>
      </div>
    </div>
  )
}
