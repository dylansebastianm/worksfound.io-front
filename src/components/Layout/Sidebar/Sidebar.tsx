"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  IoPersonOutline,
  IoSearchOutline,
  IoBriefcaseOutline,
  IoLogOutOutline,
  IoGridOutline,
  IoDocumentTextOutline,
  IoLinkOutline,
  IoChatbubblesOutline,
} from "react-icons/io5"
import { logout } from "@/lib/auth"
import styles from "./Sidebar.module.css"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  disabled?: boolean
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <IoGridOutline />,
  },
  {
    label: "Perfil",
    href: "/profile",
    icon: <IoPersonOutline />,
  },
  {
    label: "Búsqueda",
    href: "/job-search",
    icon: <IoSearchOutline />,
  },
  {
    label: "Ofertas Aplicadas",
    href: "/applied-jobs",
    icon: <IoBriefcaseOutline />,
  },
  {
    label: "Portales",
    href: "/portals",
    icon: <IoLinkOutline />,
  },
  {
    label: "Feedback",
    href: "/feedback",
    icon: <IoChatbubblesOutline />,
  },
  {
    label: "Generador de CV",
    href: "/curriculum-generator",
    icon: <IoDocumentTextOutline />,
    disabled: true,
  },
]

export const Sidebar: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          <img
            src="/Images/Logos/wf (2).png"
            alt="worksfound.io"
            className={styles.logo}
          />
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          if (item.disabled) {
            return (
              <div key={item.href} className={`${styles.navItem} ${styles.disabled}`}>
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
              </div>
            )
          }

          return (
            <Link key={item.href} href={item.href} className={`${styles.navItem} ${isActive ? styles.active : ""}`}>
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          <IoLogOutOutline />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
