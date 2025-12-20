"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { FaLinkedin, FaBriefcase } from "react-icons/fa"
import { IoPlay, IoPause } from "react-icons/io5"
import { Button } from "@/components/UI/Button/Button"
import { PortalConnectionModal } from "@/components/UI/PortalConnectionModal/PortalConnectionModal"
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

  const handleLinkedInConnect = async (email: string, password: string) => {
    if (!userId) {
      throw new Error("Debes iniciar sesión primero")
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await startLinkedInLogin(email, password, userId)

      if (result.success && result.session_id) {
        setLoginSessionId(result.session_id)
        // No cerramos el modal todavía, esperamos a que el polling complete
        // El modal se cerrará cuando el polling detecte que el login fue exitoso
        // Iniciar polling para verificar estado
        startPollingLoginStatus(result.session_id)
        // No lanzamos error, pero tampoco resolvemos inmediatamente
        // El modal permanecerá abierto mostrando el loading mientras esperamos
      } else {
        setIsLoading(false)
        throw new Error(result.error || "Error iniciando login de LinkedIn")
      }
    } catch (err) {
      setIsLoading(false)
      const errorMessage = err instanceof Error ? err.message : "Error conectando con el servidor"
      setError(errorMessage)
      throw err // Re-lanzar para que el modal maneje el error
    }
  }

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  const startPollingLoginStatus = (sessionId: string) => {
    // Limpiar polling anterior si existe
    stopPolling()

    const maxPollingTime = 600000 // 10 minutos máximo de polling total
    const maxErrorTime = 60000 // 1 minuto máximo de errores continuos
    const startTime = Date.now()
    let lastSuccessTime = Date.now()
    let firstErrorTime: number | null = null

    // Polling cada 2 segundos
    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Verificar timeout máximo total
        if (Date.now() - startTime > maxPollingTime) {
          console.warn("Timeout máximo de polling alcanzado")
          stopPolling()
          setError("Tiempo de espera agotado. Por favor, intenta de nuevo.")
          setIsLoading(false)
          setLoginSessionId(null)
          return
        }

        const status = await checkLinkedInLoginStatus(sessionId)

        // Si el backend devuelve error, verificar tiempo de errores continuos
        if (!status.success && status.error) {
          const now = Date.now()
          
          // Marcar el inicio del primer error si no estaba marcado
          if (firstErrorTime === null) {
            firstErrorTime = now
            console.warn("Primer error detectado, iniciando contador de tiempo:", status.error)
          }
          
          // Verificar si llevamos más de 1 minuto con errores
          if (firstErrorTime !== null && now - firstErrorTime > maxErrorTime) {
            console.warn("Demasiado tiempo con errores continuos, deteniendo polling")
            stopPolling()
            setError("La sesión de login expiró o no se encontró. Por favor, intenta de nuevo.")
            setIsLoading(false)
            setLoginSessionId(null)
            return
          }
          
          // Continuar polling si no hemos alcanzado el tiempo máximo de errores
          return
        }

        // Si la petición fue exitosa, resetear el contador de errores
        if (status.success) {
          firstErrorTime = null
          lastSuccessTime = Date.now()
        }

        if (status.status === "completed") {
          // Login exitoso
          stopPolling()
          setIsLinkedInConnected(true)
          setShowLinkedInForm(false) // Esto cerrará el modal
          setLoginSessionId(null)
          setIsLoading(false)
          setError("")
          // Verificar estado de conexión y auto-apply
          if (userId) {
            checkConnectionStatus(userId)
            checkAutoApplyStatus(userId)
          }
        } else if (status.status === "timeout" || status.status === "error") {
          // Error o timeout definitivo
          stopPolling()
          setError(status.error || "Tiempo de espera agotado")
          setIsLoading(false)
          setLoginSessionId(null)
        }
        // Si está 'waiting', 'pending' o 'in_progress', seguir esperando
      } catch (err) {
        const now = Date.now()
        
        // Marcar el inicio del primer error si no estaba marcado
        if (firstErrorTime === null) {
          firstErrorTime = now
          console.error("Primer error de conexión detectado, iniciando contador de tiempo:", err)
        }
        
        // Verificar si llevamos más de 1 minuto con errores
        if (firstErrorTime !== null && now - firstErrorTime > maxErrorTime) {
          console.error("Demasiado tiempo con errores de conexión, deteniendo polling")
          stopPolling()
          setError("Error conectando con el servidor. Por favor, intenta de nuevo.")
        setIsLoading(false)
        setLoginSessionId(null)
          return
        }
        
        // Continuar polling si no hemos alcanzado el tiempo máximo de errores
      }
    }, 2000)
  }

  const handleDisconnect = async () => {
    if (!userId) {
      setError("No se encontró el ID de usuario")
      return
    }

    // Detener polling si está activo
    stopPolling()
    setLoginSessionId(null)

    setIsLoading(true)
    setError("")

    try {
      const result = await disconnectLinkedIn(userId)

      if (result.success) {
        setIsLinkedInConnected(false)
        setShowLinkedInForm(false)
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

      <PortalConnectionModal
        isOpen={showLinkedInForm && !isLinkedInConnected}
        onClose={() => {
          if (!isLoading && loginSessionId === null) {
            stopPolling()
            setShowLinkedInForm(false)
            setLoginSessionId(null)
            setIsLoading(false)
            setError("")
          }
        }}
        portalName="LinkedIn"
        portalIcon={<FaLinkedin size={32} />}
        portalColor="#0077B5"
        onConnect={handleLinkedInConnect}
        keepOpenOnSuccess={true}
            />

            {loginSessionId && (
        <div style={{ padding: "12px", background: "#e3f2fd", borderRadius: "4px", marginBottom: "16px", fontSize: "14px", maxWidth: "400px", margin: "0 auto 24px" }}>
                ⏳ Esperando a que completes el login en la ventana del navegador...
        </div>
      )}

      <div className={styles.grid}>
        {/* LinkedIn - Activo */}
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

        {/* Bumeran - Deshabilitado */}
        <div className={`${styles.card} ${styles.disabled}`}>
          <div className={styles.cardContent}>
            <div className={styles.portalInfo}>
              <div className={styles.iconWrapper} style={{ color: "#999" }}>
                <FaBriefcase size={48} />
              </div>
              <div className={styles.portalDetails}>
                <h3 className={styles.portalName} style={{ color: "#999" }}>Bumeran</h3>
                <span className={`${styles.statusBadge} ${styles.disabled}`}>
                  Próximamente
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" size="small" disabled>
                Vincular
              </Button>
            </div>
          </div>
        </div>

        {/* Zonajobs - Deshabilitado */}
        <div className={`${styles.card} ${styles.disabled}`}>
          <div className={styles.cardContent}>
            <div className={styles.portalInfo}>
              <div className={styles.iconWrapper} style={{ color: "#999" }}>
                <FaBriefcase size={48} />
              </div>
              <div className={styles.portalDetails}>
                <h3 className={styles.portalName} style={{ color: "#999" }}>Zonajobs</h3>
                <span className={`${styles.statusBadge} ${styles.disabled}`}>
                  Próximamente
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" size="small" disabled>
                Vincular
              </Button>
            </div>
          </div>
        </div>

        {/* Glassdoor - Deshabilitado */}
        <div className={`${styles.card} ${styles.disabled}`}>
          <div className={styles.cardContent}>
            <div className={styles.portalInfo}>
              <div className={styles.iconWrapper} style={{ color: "#999" }}>
                <FaBriefcase size={48} />
              </div>
              <div className={styles.portalDetails}>
                <h3 className={styles.portalName} style={{ color: "#999" }}>Glassdoor</h3>
                <span className={`${styles.statusBadge} ${styles.disabled}`}>
                  Próximamente
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" size="small" disabled>
                Vincular
              </Button>
            </div>
          </div>
        </div>

        {/* Teamtailor - Deshabilitado */}
        <div className={`${styles.card} ${styles.disabled}`}>
          <div className={styles.cardContent}>
            <div className={styles.portalInfo}>
              <div className={styles.iconWrapper} style={{ color: "#999" }}>
                <FaBriefcase size={48} />
              </div>
              <div className={styles.portalDetails}>
                <h3 className={styles.portalName} style={{ color: "#999" }}>Teamtailor</h3>
                <span className={`${styles.statusBadge} ${styles.disabled}`}>
                  Próximamente
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" size="small" disabled>
                Vincular
              </Button>
            </div>
          </div>
        </div>

        {/* Workday - Deshabilitado */}
        <div className={`${styles.card} ${styles.disabled}`}>
          <div className={styles.cardContent}>
            <div className={styles.portalInfo}>
              <div className={styles.iconWrapper} style={{ color: "#999" }}>
                <FaBriefcase size={48} />
              </div>
              <div className={styles.portalDetails}>
                <h3 className={styles.portalName} style={{ color: "#999" }}>Workday</h3>
                <span className={`${styles.statusBadge} ${styles.disabled}`}>
                  Próximamente
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" size="small" disabled>
                Vincular
              </Button>
            </div>
          </div>
        </div>

        {/* AshbyHQ - Deshabilitado */}
        <div className={`${styles.card} ${styles.disabled}`}>
          <div className={styles.cardContent}>
            <div className={styles.portalInfo}>
              <div className={styles.iconWrapper} style={{ color: "#999" }}>
                <FaBriefcase size={48} />
              </div>
              <div className={styles.portalDetails}>
                <h3 className={styles.portalName} style={{ color: "#999" }}>AshbyHQ</h3>
                <span className={`${styles.statusBadge} ${styles.disabled}`}>
                  Próximamente
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" size="small" disabled>
                Vincular
              </Button>
            </div>
          </div>
        </div>

        {/* Indeed - Deshabilitado */}
        <div className={`${styles.card} ${styles.disabled}`}>
          <div className={styles.cardContent}>
            <div className={styles.portalInfo}>
              <div className={styles.iconWrapper} style={{ color: "#999" }}>
                <FaBriefcase size={48} />
              </div>
              <div className={styles.portalDetails}>
                <h3 className={styles.portalName} style={{ color: "#999" }}>Indeed</h3>
                <span className={`${styles.statusBadge} ${styles.disabled}`}>
                  Próximamente
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" size="small" disabled>
                Vincular
              </Button>
            </div>
          </div>
        </div>

        {/* Google Jobs - Deshabilitado */}
        <div className={`${styles.card} ${styles.disabled}`}>
          <div className={styles.cardContent}>
            <div className={styles.portalInfo}>
              <div className={styles.iconWrapper} style={{ color: "#999" }}>
                <FaBriefcase size={48} />
              </div>
              <div className={styles.portalDetails}>
                <h3 className={styles.portalName} style={{ color: "#999" }}>Google Jobs</h3>
                <span className={`${styles.statusBadge} ${styles.disabled}`}>
                  Próximamente
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" size="small" disabled>
                Vincular
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
