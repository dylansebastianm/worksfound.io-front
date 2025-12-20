"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { Alert } from "@/components/UI/Alert/Alert"
import type { User } from "@/lib/auth"

interface AdminRouteProtectionProps {
  children: React.ReactNode
}

/**
 * Componente para proteger rutas de administrador
 * Verifica que el usuario esté autenticado y sea administrador
 * Si no cumple los requisitos, muestra un error y redirige al dashboard
 */
export function AdminRouteProtection({ children }: AdminRouteProtectionProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    const checkAdminAccess = () => {
      const currentUser = getCurrentUser()

      if (!currentUser) {
        // Usuario no autenticado, redirigir a login
        router.push("/login")
        return
      }

      if (!isAdmin()) {
        // Usuario no es administrador
        setShowError(true)
        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
        return
      }

      // Usuario es administrador, permitir acceso
      setUser(currentUser)
      setIsChecking(false)
    }

    checkAdminAccess()
  }, [router])

  if (isChecking) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <div>Verificando permisos...</div>
      </div>
    )
  }

  if (showError) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          gap: "1rem",
        }}
      >
        <Alert
          status="error"
          message="Acceso denegado: No tienes permisos de administrador. Redirigiendo al dashboard..."
          onClose={() => {}}
        />
      </div>
    )
  }

  if (!user || !isAdmin()) {
    return null
  }

  return <>{children}</>
}

