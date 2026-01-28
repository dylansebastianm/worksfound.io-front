"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { FaLinkedin, FaBriefcase } from "react-icons/fa"
import { IoPlay, IoPause } from "react-icons/io5"
import { Button } from "@/components/UI/Button/Button"
import { PortalConnectionModal } from "@/components/UI/PortalConnectionModal/PortalConnectionModal"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import {
  checkLinkedInConnection,
  startLinkedInLogin,
  checkLinkedInLoginStatus,
  disconnectLinkedIn,
  toggleAutoApply,
  getAutoApplyStatus,
  submitLinkedInPin,
} from "@/lib/linkedin"
import styles from "./portals.module.css"

export default function PortalsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false)
  const [isAutoApplyRunning, setIsAutoApplyRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoApplyLoading, setIsAutoApplyLoading] = useState(false)
  const [isLoadingConnectionStatus, setIsLoadingConnectionStatus] = useState(true)
  const [error, setError] = useState("")
  const [showLinkedInForm, setShowLinkedInForm] = useState(false)
  const [loginSessionId, setLoginSessionId] = useState<string | null>(null)
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [isProcessingPin, setIsProcessingPin] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoApplyPollingRef = useRef<NodeJS.Timeout | null>(null)

  // Obtener user_id del sessionStorage al cargar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = sessionStorage.getItem("user_id")
      if (storedUserId) {
        setUserId(storedUserId)
        checkConnectionStatus(storedUserId)
        checkAutoApplyStatus(storedUserId)
      } else {
        setIsLoadingConnectionStatus(false)
      }
    }
  }, [])

  // Limpiar polling al desmontar
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      if (autoApplyPollingRef.current) {
        clearInterval(autoApplyPollingRef.current)
      }
    }
  }, [])

  // Polling automático del estado de auto-apply cuando está corriendo
  useEffect(() => {
    // Si el auto-apply está corriendo y tenemos userId, iniciar polling
    if (isAutoApplyRunning && userId && isLinkedInConnected) {
      // Limpiar polling anterior si existe
      if (autoApplyPollingRef.current) {
        clearInterval(autoApplyPollingRef.current)
      }

      // Iniciar polling cada 3 segundos
      autoApplyPollingRef.current = setInterval(async () => {
        try {
          const status = await getAutoApplyStatus(userId)
          // Si el estado cambió a no corriendo, actualizar el estado
          if (!status.is_running && isAutoApplyRunning) {
            setIsAutoApplyRunning(false)
            // Detener el polling ya que el auto-apply se detuvo
            if (autoApplyPollingRef.current) {
              clearInterval(autoApplyPollingRef.current)
              autoApplyPollingRef.current = null
            }
          }
        } catch (err) {
          console.error("Error en polling de auto-apply:", err)
          // No detener el polling por errores temporales, solo loguear
        }
      }, 3000) // Polling cada 3 segundos
    } else {
      // Si el auto-apply no está corriendo, detener el polling
      if (autoApplyPollingRef.current) {
        clearInterval(autoApplyPollingRef.current)
        autoApplyPollingRef.current = null
      }
    }

    // Cleanup cuando cambia el estado
    return () => {
      if (autoApplyPollingRef.current) {
        clearInterval(autoApplyPollingRef.current)
        autoApplyPollingRef.current = null
      }
    }
  }, [isAutoApplyRunning, userId, isLinkedInConnected])

  const checkConnectionStatus = async (uid: string) => {
    setIsLoadingConnectionStatus(true)
    try {
      const status = await checkLinkedInConnection(uid)
      setIsLinkedInConnected(status.is_connected || false)
      
      // Si no está conectado, limpiar estados de modal (evita que queden estados previos)
      if (!status.is_connected) {
        setShowSuccess(false)
        setShowError(false)
        setIsProcessingPin(false)
        setRequiresVerification(false)
        setUserEmail("")
        setShowLinkedInForm(false)
        setLoginSessionId(null)
        setError("")
      }
    } catch (err) {
      console.error("Error verificando conexión:", err)
      // En caso de error, limpiar estados para evitar estados inconsistentes
      setShowSuccess(false)
      setShowError(false)
    } finally {
      setIsLoadingConnectionStatus(false)
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
        // Mostrar formulario de vinculación - limpiar todos los estados previos
        setShowLinkedInForm(true)
        setError("")
        setShowError(false)
        setShowSuccess(false)
        setIsProcessingPin(false)
        setRequiresVerification(false)
        setUserEmail("")
        setIsLoading(false)
      }
    }
  }

  const handleLinkedInConnect = async (email: string, password: string) => {
    console.log('🔵 handleLinkedInConnect llamado - email:', email, 'userId:', userId)
    
    if (!userId) {
      console.error('❌ No hay userId, lanzando error')
      throw new Error("Debes iniciar sesión primero")
    }

    console.log('🔵 Configurando loading state...')
    setIsLoading(true)
    setError("")
    setShowError(false) // CRÍTICO: Resetear estado de error al iniciar nuevo login
    setShowSuccess(false) // También resetear success por si acaso
    setIsProcessingPin(false)
    setRequiresVerification(false)
    setUserEmail("")
    console.log('🔵 Llamando startLinkedInLogin...')

    try {
      console.log('🔵 Haciendo fetch a startLinkedInLogin...')
      const result = await startLinkedInLogin(email, password, userId)
      console.log('🔵 Resultado de startLinkedInLogin:', result)

      if (result.success && result.session_id) {
        console.log('✅ Login iniciado con sessionId:', result.session_id)
        setLoginSessionId(result.session_id)
        
        // Si hay URL interactiva (Browserless), intentar abrirla
        // Si da 429, el usuario debe usar el dashboard de Browserless
        if (result.interactive_url) {
          console.log("🌐 Abriendo sesión interactiva de Browserless:", result.interactive_url)
          
          // Intentar abrir la URL interactiva
          const popup = window.open(
            result.interactive_url,
            'linkedin-browserless',
            'width=1200,height=800,scrollbars=yes,resizable=yes'
          )
          
          if (!popup) {
            setIsLoading(false)
            throw new Error("El popup fue bloqueado. Por favor, permite popups para este sitio.")
          }
          
          // Si hay dashboard_url, también abrirla como alternativa
          if (result.dashboard_url) {
            console.log("📋 Dashboard alternativo disponible:", result.dashboard_url)
            // Abrir dashboard en otra pestaña después de 2 segundos
            setTimeout(() => {
              window.open(result.dashboard_url, '_blank')
            }, 2000)
          }
          
          // Monitorear si el popup se cierra
          const checkPopupClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkPopupClosed)
              console.log("Popup cerrado, iniciando polling...")
              startPollingLoginStatus(result.session_id!)
            }
          }, 1000)
          
          // También iniciar polling en caso de que el popup no se cierre
          console.log('🚀 Iniciando polling desde handleLinkedInConnect (con interactive_url)')
          startPollingLoginStatus(result.session_id)
        } else {
          // Modo local (Playwright) - comportamiento anterior
          console.log('🚀 Iniciando polling desde handleLinkedInConnect (modo local)')
          startPollingLoginStatus(result.session_id)
        }
        
        console.log('✅ handleLinkedInConnect completado - polling debería estar ejecutándose')
        // No cerramos el modal todavía, esperamos a que el polling complete
        // El modal se cerrará cuando el polling detecte que el login fue exitoso
        // La función async resuelve aquí automáticamente
      } else {
        setIsLoading(false)
        throw new Error(result.error || "Error iniciando login de LinkedIn")
      }
    } catch (err) {
      // Error al iniciar el login - NO mostrar error aquí, solo mostrar en el banner
      // El error solo se muestra cuando se cumple timeout de 6 minutos o error que mata Playwright
      console.error('❌ Error en handleLinkedInConnect:', err)
      setIsLoading(false)
      const errorMessage = err instanceof Error ? err.message : "Error conectando con el servidor"
      setError(errorMessage)  // Mostrar error en el banner, NO usar setShowError
      throw err // Re-lanzar para que el modal maneje el error
    }
  }

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    // Resetear estados de procesamiento cuando se detiene el polling
    setIsProcessingPin(false)
  }

  const startPollingLoginStatus = (sessionId: string) => {
    // Limpiar polling anterior si existe
    stopPolling()

    console.log('🔄 Iniciando polling para sessionId:', sessionId)

    const maxPollingTime = 600000 // 10 minutos máximo de polling total
    const maxErrorTime = 60000 // 1 minuto máximo de errores continuos
    const maxConsecutiveErrors = 5 // Máximo de errores consecutivos antes de considerar backend caído
    const startTime = Date.now()
    let lastSuccessTime = Date.now()
    let firstErrorTime: number | null = null
    let consecutiveErrors = 0 // Contador de errores consecutivos de conexión
    let pollCount = 0

    // Función que hace el check
    const performCheck = async () => {
      pollCount++
      console.log(`🔄 Polling #${pollCount} - Verificando estado del login...`)
      
      try {
        // Verificar timeout máximo total - esto corta el proceso
        if (Date.now() - startTime > maxPollingTime) {
          console.warn("Timeout máximo de polling alcanzado")
          stopPolling()
          setShowError(true)  // Mostrar error con mensaje genérico (no mencionar "timeout")
          setError("")  // Limpiar error del banner, se mostrará en el estado de error
          setIsLoading(false)
          // Cerrar después de mostrar error
          setTimeout(() => {
            setShowLinkedInForm(false)
            setLoginSessionId(null)
            setShowError(false)
            setShowSuccess(false)
            setIsProcessingPin(false)
            setRequiresVerification(false)
            setUserEmail("")
            setError("")
            setIsLoading(false)
          }, 3000)
          return
        }

        const status = await checkLinkedInLoginStatus(sessionId)
        
        // Backend respondió correctamente → resetear contador de errores consecutivos
        consecutiveErrors = 0
        
        console.log(`📊 Status recibido del backend (poll #${pollCount}):`, {
          success: status.success,
          status: status.status,
          message: status.message,
          email: status.email,
          error: status.error
        })
        console.log(`   🔍 Estado actual del frontend: requiresVerification=${requiresVerification}, showLinkedInForm=${showLinkedInForm}`)

        // PRIORIDAD 1: Verificar estados de proceso activo PRIMERO
        // Durante estos estados (in_progress, pending, waiting_for_pin, processing),
        // NUNCA mostrar error, incluso si success es false o hay errores temporales
        // Esto incluye la resolución del CAPTCHA que puede tomar 20-120 segundos
        const isActiveProcess = status.status === 'in_progress' || status.status === 'pending' || 
                                status.status === 'waiting_for_pin' || status.status === 'processing'
        
        if (isActiveProcess) {
          // Resetear contador de errores cuando estamos en proceso activo
          firstErrorTime = null
          lastSuccessTime = Date.now()
          // Continuar con la lógica normal de estos estados (manejada más abajo)
          // NO procesar errores aquí, solo continuar
        }
        
        // Si la petición fue exitosa, resetear el contador de errores
        if (status.success) {
          firstErrorTime = null
          lastSuccessTime = Date.now()
          consecutiveErrors = 0 // Resetear contador de errores consecutivos
        }
        
        // IMPORTANTE: NO procesar errores aquí a menos que sean:
        // 1. status.status === 'error' (error que mata Playwright - manejado más abajo)
        // 2. status.status === 'timeout' (timeout explícito - manejado más abajo)
        // 3. Timeout de 6 minutos del polling (manejado más abajo)
        // Cualquier otro error temporal se ignora y se continúa el polling

        if (status.status === "completed") {
          // Login exitoso - mostrar success ANTES de cerrar
          // CRÍTICO: NO llamar setIsLinkedInConnected(true) ni checkConnectionStatus aquí.
          // checkConnectionStatus hace setIsLinkedInConnected(true) al recibir is_connected,
          // lo que cierra el modal al instante y nunca se ve el success.
          console.log('✅ Login completado - mostrando success')
          stopPolling()
          setIsProcessingPin(false)
          setRequiresVerification(false)
          setShowSuccess(true)
          // IMPORTANTE: Esperar 3s mostrando PortalConnectionAlert success, LUEGO cerrar
          // NO llamar checkConnectionStatus aquí: pone isLoadingConnectionStatus(true),
          // la página devuelve solo <LoadingSpinner /> y se desmonta el modal al instante.
          setTimeout(() => {
            setIsLinkedInConnected(true)
            setShowLinkedInForm(false)
            setLoginSessionId(null)
            setIsLoading(false)
            setError("")
            setRequiresVerification(false)
            setUserEmail("")
            setShowSuccess(false)
            if (userId) {
              checkAutoApplyStatus(userId)
            }
          }, 3000)
        } else if (status.status === "processing") {
          // PIN siendo procesado - mostrar verifying
          console.log('⏳ PIN siendo procesado - mostrando verifying')
          setIsProcessingPin(true)
        } else if (status.status === "waiting_for_pin") {
          // Esperando que el usuario ingrese el PIN - mostrar formulario
          console.log('🔐 Esperando código PIN - mostrando formulario (polling continúa)')
          console.log('   📧 Email recibido:', status.email)
          
          // IMPORTANTE: NO detener el polling - debe continuar para detectar cuando se procesa el PIN
          // PRIMERO: Desactivar todos los estados de carga/procesamiento
          setIsProcessingPin(false)
          setShowSuccess(false)
          setIsLoading(false)  // Esto es crítico - debe estar en false para que el modal pueda cambiar de step
          
          // Asegurar que el modal esté abierto
          if (!showLinkedInForm) {
            console.log('   ⚠️ Modal no estaba abierto, abriéndolo...')
            setShowLinkedInForm(true)
            // Limpiar estados de error/success al abrir el modal
            setShowError(false)
            setShowSuccess(false)
          }
          
          // Establecer email PRIMERO
          if (status.email) {
            setUserEmail(status.email)
            console.log('   ✅ userEmail establecido a:', status.email)
          }
          
          // IMPORTANTE: Establecer requiresVerification para forzar el cambio de step
          // El modal debe cambiar de 'connecting' a 'verification' cuando requiresVerification es true
          console.log('   🔄 Estado actual de requiresVerification:', requiresVerification)
          
          // SIEMPRE forzar actualización para asegurar que el useEffect se ejecute
          // Esto es necesario porque si requiresVerification ya era true, el useEffect no se ejecutaría
          setRequiresVerification(false)
          // Usar setTimeout con 0 para asegurar que React procese el cambio
          setTimeout(() => {
            console.log('   ✅ Estableciendo requiresVerification a TRUE')
            setRequiresVerification(true)
          }, 0)
          
          // No cerramos el modal, mostramos el paso de verificación
          // El polling continuará para detectar cuando el PIN se procesa y cuando el login se completa
        } else if (status.status === "in_progress" || status.status === "pending") {
          // Login en curso (puede estar resolviendo CAPTCHA o conectando)
          console.log(`⏳ Login en curso - status: ${status.status}`)
          setIsProcessingPin(false)
          setShowSuccess(false)
          setRequiresVerification(false)
          setIsLoading(true)
          // El modal mostrará "Conectando..." mientras está en este estado
        } else if (status.status === "timeout") {
          // Timeout explícito del backend - mostrar error
          console.log('⏰ Timeout del backend - mostrando error')
          stopPolling()
          setIsProcessingPin(false)
          setShowSuccess(false)
          setShowError(true)  // Mostrar estado de error
          setError("")  // Limpiar error del banner, el error se mostrará en el estado
          setIsLoading(false)
          setRequiresVerification(false)
          // Cerrar después de mostrar error
          setTimeout(() => {
            setShowLinkedInForm(false)
            setLoginSessionId(null)
            setUserEmail("")
            setShowError(false)
            setShowSuccess(false)
            setIsProcessingPin(false)
            setRequiresVerification(false)
            setError("")
            setIsLoading(false)
          }, 3000) // Mostrar error por 3 segundos antes de cerrar
        } else if (status.status === "error") {
          // Error que mata Playwright (proceso finalizado) - mostrar error inmediatamente
          console.log('❌ Error que finaliza el proceso (Playwright cerrado) - mostrando error')
          stopPolling()
          setIsProcessingPin(false)
          setShowSuccess(false)
          setShowError(true)  // Mostrar estado de error
          setError("")  // Limpiar error del banner, el error se mostrará en el estado
          setIsLoading(false)
          setRequiresVerification(false)
          // Cerrar después de mostrar error
          setTimeout(() => {
            setShowLinkedInForm(false)
            setLoginSessionId(null)
            setUserEmail("")
            setShowError(false)
            setShowSuccess(false)
            setIsProcessingPin(false)
            setRequiresVerification(false)
            setError("")
            setIsLoading(false)
          }, 3000) // Mostrar error por 3 segundos antes de cerrar
        } else {
          // Estados desconocidos o no manejados → seguir esperando
          console.log(`⏳ Estado no manejado: ${status.status} - Continuando polling... (próxima verificación en 2s)`)
        }
      } catch (err) {
        // Errores de conexión (backend caído, red, etc.)
        consecutiveErrors++
        console.error(`⚠️ Error de conexión en polling #${pollCount} (${consecutiveErrors}/${maxConsecutiveErrors} consecutivos):`, err)
        
        // Si hay muchos errores consecutivos, el backend probablemente está caído
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error(`❌ Backend no responde después de ${maxConsecutiveErrors} intentos - deteniendo polling y mostrando error`)
          stopPolling()
          setIsProcessingPin(false)
          setShowSuccess(false)
          setShowError(true) // Mostrar estado de error
          setError("") // Limpiar error del banner, el error se mostrará en el estado
          setIsLoading(false)
          setRequiresVerification(false)
          // Cerrar después de mostrar error
          setTimeout(() => {
            setShowLinkedInForm(false)
            setLoginSessionId(null)
            setUserEmail("")
            setShowError(false)
            setShowSuccess(false)
            setIsProcessingPin(false)
            setRequiresVerification(false)
            setError("")
            setIsLoading(false)
          }, 3000) // Mostrar error por 3 segundos antes de cerrar
          return
        }
        // Si no alcanzamos el máximo, continuar polling (puede ser un error temporal)
      }
    }

    // Ejecutar el primer check inmediatamente, luego continuar cada 2 segundos
    console.log('🚀 Ejecutando primer check inmediatamente...')
    performCheck()
    
    // Continuar con polling cada 2 segundos
    pollingIntervalRef.current = setInterval(performCheck, 2000)
    console.log('✅ Polling configurado - se ejecutará cada 2 segundos')
  }

  const handleVerifyCode = async (code: string) => {
    if (!loginSessionId) {
      throw new Error("No hay una sesión de login activa")
    }

    try {
      const result = await submitLinkedInPin(loginSessionId, code)

      if (result.success) {
        // Si el PIN fue correcto, reanudar el polling para verificar que el login se complete
        // IMPORTANTE: Establecer isProcessingPin PRIMERO para evitar el flash
        setIsProcessingPin(true) // Mostrar verifying mientras se procesa
        // NO cambiar requiresVerification todavía - mantenerlo para evitar flash
        if (result.status === "completed") {
          // Login completo inmediatamente
          // CRÍTICO: NO llamar setIsLinkedInConnected(true) ni checkConnectionStatus aquí.
          // checkConnectionStatus pone isLinkedInConnected=true y cierra el modal al instante.
          stopPolling()
          setIsProcessingPin(false)
          setRequiresVerification(false)
          setShowSuccess(true)
          setTimeout(() => {
            setIsLinkedInConnected(true)
            setShowLinkedInForm(false)
            setLoginSessionId(null)
            setUserEmail("")
            setShowSuccess(false)
            if (userId) {
              checkAutoApplyStatus(userId)
            }
          }, 3000)
        } else {
          // Continuar polling (mostrará verifying mientras espera)
          // El polling detectará cuando status sea "completed" y mostrará success
          // NO cambiar requiresVerification todavía - mantenerlo para evitar flash
          startPollingLoginStatus(loginSessionId)
        }
      } else {
        // PIN incorrecto - NO mostrar error aquí, solo mostrar en el banner
        // El error solo se muestra cuando se cumple timeout de 6 minutos o error que mata Playwright
        setIsProcessingPin(false)
        const errorMessage = result.error || "Código PIN incorrecto"
        setError(errorMessage)  // Mostrar error en el banner, NO usar setShowError
        throw new Error(errorMessage)
      }
    } catch (err) {
      // Error al procesar PIN - NO mostrar error aquí, solo mostrar en el banner
      // El error solo se muestra cuando se cumple timeout de 6 minutos o error que mata Playwright
      setIsProcessingPin(false)
      setShowSuccess(false)
      const errorMessage = err instanceof Error ? err.message : "Error procesando código"
      setError(errorMessage)  // Mostrar error en el banner, NO usar setShowError
      throw err
    }
  }

  const handleDisconnect = async () => {
    if (!userId) {
      setError("No se encontró el ID de usuario")
      return
    }

    // Detener polling si está activo
    stopPolling()
    setLoginSessionId(null)
    setRequiresVerification(false)
    setUserEmail("")

    setIsLoading(true)
    setError("")
    // CRÍTICO: Limpiar estados de éxito/error al desvincular
    setShowSuccess(false)
    setShowError(false)
    setIsProcessingPin(false)

    try {
      const result = await disconnectLinkedIn(userId)

      if (result.success) {
        setIsLinkedInConnected(false)
        setShowLinkedInForm(false)
        setError("")
        // Asegurar que todos los estados estén limpios después de desvincular
        setShowSuccess(false)
        setShowError(false)
        setIsProcessingPin(false)
        setRequiresVerification(false)
        setUserEmail("")
        setLoginSessionId(null)
        // Verificar estado real del backend para asegurar consistencia
        checkConnectionStatus(userId)
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

  if (isLoadingConnectionStatus) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
      </div>
    )
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
            setRequiresVerification(false)
            setUserEmail("")
            setIsProcessingPin(false)
            setShowSuccess(false)
            setShowError(false)
          }
        }}
        portalName="LinkedIn"
        portalIcon={<FaLinkedin size={32} />}
        portalColor="#0077B5"
        onConnect={handleLinkedInConnect}
        onVerifyCode={requiresVerification ? handleVerifyCode : undefined}
        requiresVerification={requiresVerification}
        userEmail={userEmail}
        isProcessingPin={isProcessingPin}
        showSuccess={showSuccess}
        showError={showError}
        keepOpenOnSuccess={true}
            />

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
