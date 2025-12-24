"use client"

import type React from "react"
import { useState } from "react"
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
  IoChevronDownOutline,
  IoSettingsOutline,
} from "react-icons/io5"
import { logout, isAdmin } from "@/lib/auth"
import styles from "./Sidebar.module.css"

interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  disabled?: boolean
  submenu?: NavItem[]
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
    label: "Reclutamiento",
    href: "/recruitment",
    icon: <IoPersonOutline />,
  },
  {
    label: "Admin",
    icon: <IoSettingsOutline />,
    submenu: [
      {
        label: "Dashboard Admin",
        href: "/admin/dashboard",
        icon: <IoGridOutline />,
      },
      {
        label: "Usuarios",
        href: "/admin/users",
        icon: <IoPersonOutline />,
      },
      {
        label: "Logs",
        href: "/admin/logs",
        icon: <IoDocumentTextOutline />,
      },
    ],
  },
  {
    label: "Generador de CV",
    href: "/curriculum-generator",
    icon: <IoDocumentTextOutline />,
  },
]

export const Sidebar: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["Admin"])
  const userIsAdmin = isAdmin()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]))
  }

  const isSubmenuActive = (submenu?: NavItem[]) => {
    if (!submenu) return false
    return submenu.some((item) => item.href === pathname)
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
          // Ocultar menú Admin si el usuario no es administrador
          if (item.label === "Admin" && !userIsAdmin) {
            return null
          }

          if (item.submenu) {
            const isExpanded = expandedMenus.includes(item.label)
            const hasActiveSubmenu = isSubmenuActive(item.submenu)

            return (
              <div key={item.label}>
                <div
                  className={`${styles.navItem} ${hasActiveSubmenu ? styles.active : ""}`}
                  onClick={() => toggleSubmenu(item.label)}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.label}>{item.label}</span>
                  <IoChevronDownOutline className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ""}`} />
                </div>
                {isExpanded && (
                  <div className={styles.submenu}>
                    {item.submenu.map((subitem) => {
                      const isActive = pathname === subitem.href
                      return (
                        <Link
                          key={subitem.href}
                          href={subitem.href || "#"}
                          className={`${styles.submenuItem} ${isActive ? styles.active : ""}`}
                        >
                          <span className={styles.icon}>{subitem.icon}</span>
                          <span className={styles.label}>{subitem.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

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
            <Link
              key={item.href}
              href={item.href || "#"}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            >
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
