import type React from "react"
import { Sidebar } from "@/components/Layout/Sidebar/Sidebar"
import { Footer } from "@/components/Layout/Footer/Footer"
import { FloatingWhatsApp } from "@/components/UI/FloatingWhatsApp/FloatingWhatsApp"
import styles from "../app.module.css"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.appLayout}>
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
        <Footer />
      </main>
      <FloatingWhatsApp phoneNumber="5491112345678" />
    </div>
  )
}
