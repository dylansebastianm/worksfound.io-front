import type React from "react"
import { Sidebar } from "@/components/Layout/Sidebar/Sidebar"
import styles from "../app.module.css"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.appLayout}>
      <Sidebar />
      <main className={styles.mainContent}>{children}</main>
    </div>
  )
}

