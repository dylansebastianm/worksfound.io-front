import type React from "react"
import { Sidebar } from "@/components/Layout/Sidebar/Sidebar"
import { Footer } from "@/components/Layout/Footer/Footer"
import { FloatingWhatsApp } from "@/components/UI/FloatingWhatsApp/FloatingWhatsApp"
import SkillsHydrator from "@/components/Providers/SkillsHydrator"
import styles from "../app.module.css"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  let initialSkills: any[] = []
  try {
    const res = await fetch(`${API_URL}/api/skills`, {
      method: "GET",
      // Cache SSR: 1 hora (ajustable)
      next: { revalidate: 3600 },
    })

    const data = await res.json()
    if (res.ok && data?.success && Array.isArray(data.skills)) {
      initialSkills = data.skills
    } else {
      initialSkills = []
    }
  } catch (e) {
    // No bloqueamos la app si la DB no está accesible en runtime.
    console.error("No se pudieron cargar skills en SSR:", e)
    initialSkills = []
  }

  return (
    <div className={styles.appLayout}>
      <SkillsHydrator initialSkills={initialSkills} />
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
        <Footer />
      </main>
      <FloatingWhatsApp phoneNumber="5491112345678" />
    </div>
  )
}
