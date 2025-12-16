"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { FaLinkedin } from "react-icons/fa"
import { IoPlay, IoPause } from "react-icons/io5"
import { Button } from "@/components/UI/Button/Button"
import { Input } from "@/components/UI/Input/Input"
import {
  checkLinkedInConnection,
  startLinkedInLogin,
  checkLinkedInLoginStatus,
  disconnectLinkedIn,
  toggleAutoApply,
  getAutoApplyStatus,
} from "@/lib/linkedin"
import styles from "./portals.module.css"

export default function PortalsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false)
  const [isAutoApplyRunning, setIsAutoApplyRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoApplyLoading, setIsAutoApplyLoading] = useState(false)
  const [error, setError] = useState("")
  const [showLinkedInForm, setShowLinkedInForm] = useState(false)
  const [linkedInEmail, setLinkedInEmail] = useState("")
  const [linkedInPassword, setLinkedInPassword] = useState("")
  const [loginSessionId, setLoginSessionId] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Obtener user_id del sessionStorage al cargar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = sessionStorage.getItem("user_id")
      if (storedUserId) {
        setUserId(storedUserId)
        checkConnectionStatus(storedUserId)
        checkAutoApplyStatus(storedUserId)
      }
    }
  }, [])

  // Limpiar polling al desmontar
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const checkConnectionStatus = async (uid: string) => {
    try {
      const status = await checkLinkedInConnection(uid)
      setIsLinkedInConnected(status.is_connected || false)
    } catch (err) {
      console.error("Error verificando conexión:", err)
    }
  }

  const checkAutoApplyStatus = async (uid: string) => {
    try {
      const status = await getAutoApplyStatus(uid)
      setIsAutoApplyRunning(status.is_running || false)
    } catch (err) {
      console.error("Error verificando estado de auto-apply:", err)
    }
  }

  const handleToggleAutoApply = async () => {
    if (!userId) {
      setError("Debes iniciar sesión primero")
      return
    }

    if (!isLinkedInConnected) {
      setError("Debes conectar LinkedIn primero")
      return
    }

    setIsAutoApplyLoading(true)
    setError("")

    try {
      const result = await toggleAutoApply(userId, !isAutoApplyRunning)

      if (result.success) {
        setIsAutoApplyRunning(!isAutoApplyRunning)
        setError("")
      } else {
        setError(result.error || "Error al cambiar el estado de auto-apply")
      }
    } catch (err) {
      setError("Error conectando con el servidor")
      console.error("Error en toggle auto-apply:", err)
    } finally {
      setIsAutoApplyLoading(false)
    }
  }

  const handleConnect = (id: string) => {
    if (id === "linkedin") {
      if (!userId) {
        setError("Debes iniciar sesión primero")
        return
      }
      if (isLinkedInConnected) {
        // Desconectar
        handleDisconnect()
      } else {
        // Mostrar formulario de vinculación
        setShowLinkedInForm(true)
        setError("")
      }
    }
  }

  const handleLinkedInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !linkedInEmail || !linkedInPassword) {
      setError("Por favor completa todos los campos")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await startLinkedInLogin(linkedInEmail, linkedInPassword, userId)

      if (result.success && result.session_id) {
        setLoginSessionId(result.session_id)
        // Iniciar polling para verificar estado
        startPollingLoginStatus(result.session_id)
      } else {
        setError(result.error || "Error iniciando login de LinkedIn")
        setIsLoading(false)
      }
    } catch (err) {
      setError("Error conectando con el servidor")
      setIsLoading(false)
      console.error("Error en login de LinkedIn:", err)
    }
  }

  const startPollingLoginStatus = (sessionId: string) => {
    // Limpiar polling anterior si existe
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Polling cada 2 segundos
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const status = await checkLinkedInLoginStatus(sessionId)

        if (status.status === "completed") {
          // Login exitoso
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          setIsLinkedInConnected(true)
          setShowLinkedInForm(false)
          setLinkedInEmail("")
          setLinkedInPassword("")
          setLoginSessionId(null)
          setIsLoading(false)
          setError("")
          // Verificar estado de conexión y auto-apply
          if (userId) {
            checkConnectionStatus(userId)
            checkAutoApplyStatus(userId)
          }
        } else if (status.status === "timeout" || status.status === "error") {
          // Error o timeout
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          setError(status.error || "Tiempo de espera agotado")
          setIsLoading(false)
          setLoginSessionId(null)
        }
        // Si está 'waiting', 'pending' o 'in_progress', seguir esperando
      } catch (err) {
        console.error("Error verificando estado de login:", err)
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        setError("Error conectando con el servidor")
        setIsLoading(false)
        setLoginSessionId(null)
      }
    }, 2000)
  }

  const handleDisconnect = async () => {
    if (!userId) {
      setError("No se encontró el ID de usuario")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await disconnectLinkedIn(userId)

      if (result.success) {
        setIsLinkedInConnected(false)
        setError("")
      } else {
        setError(result.error || "Error desconectando LinkedIn")
      }
    } catch (err) {
      setError("Error conectando con el servidor")
      console.error("Error desconectando LinkedIn:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Portales de Empleo</h1>
        <p className={styles.subtitle}>Conecta tus portales favoritos y activa la aplicación automática</p>
      </div>

      {error && (
        <div style={{ padding: "12px", background: "#ffebee", color: "#c62828", borderRadius: "4px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {showLinkedInForm && !isLinkedInConnected && (
        <div style={{ maxWidth: "400px", margin: "0 auto 24px", padding: "24px", background: "white", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginBottom: "16px" }}>Vincular LinkedIn</h3>
          <form onSubmit={handleLinkedInSubmit}>
            <Input
              type="email"
              label="Email de LinkedIn"
              placeholder="tu@email.com"
              value={linkedInEmail}
              onChange={(e) => setLinkedInEmail(e.target.value)}
              fullWidth
              required
              disabled={isLoading || loginSessionId !== null}
            />
            <Input
              type="password"
              label="Contraseña de LinkedIn"
              placeholder="••••••••"
              value={linkedInPassword}
              onChange={(e) => setLinkedInPassword(e.target.value)}
              fullWidth
              required
              disabled={isLoading || loginSessionId !== null}
            />
            {loginSessionId && (
              <div style={{ padding: "12px", background: "#e3f2fd", borderRadius: "4px", marginBottom: "16px", fontSize: "14px" }}>
                ⏳ Esperando a que completes el login en la ventana del navegador...
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <Button type="submit" disabled={isLoading || loginSessionId !== null} loading={isLoading || loginSessionId !== null}>
                Vincular
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLinkedInForm(false)
                  setLinkedInEmail("")
                  setLinkedInPassword("")
                  setError("")
                }}
                disabled={isLoading || loginSessionId !== null}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardContent}>
            <div className={styles.portalInfo}>
              <div className={styles.iconWrapper} style={{ color: "#0077B5" }}>
                <FaLinkedin size={48} />
              </div>
              <div className={styles.portalDetails}>
                <h3 className={styles.portalName}>LinkedIn</h3>
                <span
                  className={`${styles.statusBadge} ${isLinkedInConnected ? styles.connected : styles.disconnected}`}
                >
                  {isLinkedInConnected ? "Conectado" : "No conectado"}
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              {isLinkedInConnected ? (
                <>
                  <Button
                    variant={isAutoApplyRunning ? "outline" : "primary"}
                    size="small"
                    onClick={handleToggleAutoApply}
                    disabled={isAutoApplyLoading || isLoading}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    {isAutoApplyRunning ? (
                      <>
                        <IoPause size={16} />
                        Pausar
                      </>
                    ) : (
                      <>
                        <IoPlay size={16} />
                        Iniciar
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="small" onClick={() => handleConnect("linkedin")} disabled={isLoading}>
                    Desvincular
                  </Button>
                </>
              ) : (
                <Button variant="primary" size="small" onClick={() => handleConnect("linkedin")} disabled={isLoading}>
                  Vincular
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
