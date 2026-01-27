"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { FiX, FiAlertCircle, FiMail, FiShield, FiCheck } from "react-icons/fi"
import { Input } from "@/components/UI/Input/Input"
import { Button } from "@/components/UI/Button/Button"
import { PortalConnectionAlert } from "@/components/UI/PortalConnectionAlert/PortalConnectionAlert"
import styles from "./PortalConnectionModal.module.css"

interface PortalConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  portalName: string
  portalIcon: React.ReactNode
  portalColor: string
  onConnect: (email: string, password: string) => Promise<void>
  onVerifyCode?: (code: string) => Promise<void>
  keepOpenOnSuccess?: boolean // Si es true, no cierra el modal automáticamente cuando onConnect se resuelve
  requiresVerification?: boolean // Si es true, muestra directamente el paso de verificación
  userEmail?: string // Email del usuario para mostrar en el paso de verificación
  isProcessingPin?: boolean // Si es true, muestra el estado "verifying" (PIN siendo procesado)
  showSuccess?: boolean // Si es true, muestra el estado "success" antes de cerrar
  showError?: boolean // Si es true, muestra el estado "error" con el mismo estilo que success pero rojo
}

type ConnectionStep = 'credentials' | 'connecting' | 'verification' | 'verifying' | 'success' | 'error'

export function PortalConnectionModal({
  isOpen,
  onClose,
  portalName,
  portalIcon,
  portalColor,
  onConnect,
  onVerifyCode,
  keepOpenOnSuccess = false,
  requiresVerification = false,
  userEmail = "",
  isProcessingPin = false,
  showSuccess = false,
  showError = false,
}: PortalConnectionModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [step, setStep] = useState<ConnectionStep>(requiresVerification ? 'verification' : 'credentials')
  const [error, setError] = useState("")
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [countdown, setCountdown] = useState(300) // 5 min en segundos; solo visual para tranquilizar al usuario

  // Calcular isLoading antes de usarlo en useEffect
  const isLoading = step === 'connecting' || step === 'verifying'

  // Contador regresivo 5 min solo en "Conectando..." (no bloquea nada; informativo)
  useEffect(() => {
    if (step !== 'connecting') return
    setCountdown(300)
    const t = setInterval(() => {
      setCountdown((s) => (s <= 0 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [step])

  // Reset step when requiresVerification changes
  // PRIORIDAD ALTA: Este efecto debe ejecutarse ANTES que otros para forzar el cambio
  useEffect(() => {
    console.log('🔵 [Modal] useEffect requiresVerification - requiresVerification:', requiresVerification, 'step:', step, 'isOpen:', isOpen, 'isProcessingPin:', isProcessingPin, 'showSuccess:', showSuccess)
    
    if (requiresVerification && isOpen) {
      // Cuando se requiere verificación, cambiar al paso de verificación
      // IMPORTANTE: Cambiar SIEMPRE cuando requiresVerification es true, incluso si estamos en 'connecting' o 'verifying'
      // porque el backend ya detectó el PIN y debemos mostrar el formulario inmediatamente
      // PERO no cambiar si estamos en 'success' o 'error' o 'verifying' (procesando PIN)
      if (step !== 'verification' && step !== 'success' && step !== 'error' && step !== 'verifying') {
        console.log('   ✅ Cambiando step a verification porque requiresVerification=true')
        console.log('   📋 Step anterior:', step)
        // Forzar cambio inmediato, incluso desde 'connecting'
        setStep('verification')
        setError("") // Limpiar errores previos
        console.log('   ✅ Step cambiado a verification')
      } else if (step === 'verification') {
        console.log('   ℹ️ Ya estamos en verification, no hay que cambiar')
      }
    } else if (isOpen && step === 'verification' && !requiresVerification && !isProcessingPin && !showSuccess) {
      // Si la verificación ya no es requerida y estamos en verification, volver a credentials
      // PERO solo si no estamos procesando PIN o mostrando success
      console.log('   ⚠️ Cambiando step a credentials porque requiresVerification=false')
      setStep('credentials')
    }
  }, [requiresVerification, isOpen, step, isProcessingPin, showSuccess])

  // Manejar isProcessingPin - mostrar verifying cuando el PIN está siendo procesado
  // PRIORIDAD: Este efecto debe ejecutarse DESPUÉS de requiresVerification para evitar conflictos
  useEffect(() => {
    if (isProcessingPin) {
      // Si está procesando PIN, mostrar verifying (no cambiar si ya estamos en success o error)
      if (step !== 'success' && step !== 'error') {
        console.log('   🔄 [Modal] Cambiando step a verifying porque isProcessingPin=true')
        console.log('   📋 Step anterior:', step)
        setStep('verifying')
        console.log('   ✅ Step cambiado a verifying')
      }
    }
    // NO cambiar el step cuando isProcessingPin se desactiva - esperar a showSuccess
  }, [isProcessingPin, step])

  // Manejar showSuccess - mostrar success cuando el login se completa
  // PRIORIDAD ALTA: Este efecto debe ejecutarse para mostrar success
  useEffect(() => {
    if (showSuccess) {
      console.log('   ✅ [Modal] Cambiando step a success porque showSuccess=true')
      console.log('   📋 Step anterior:', step)
      setStep('success')
      setError("") // Limpiar errores al mostrar success
      console.log('   ✅ Step cambiado a success')
    }
    // NO cambiar el step cuando showSuccess se desactiva - el modal se cerrará desde el parent
  }, [showSuccess, step])

  // Manejar showError - mostrar error cuando hay un problema
  useEffect(() => {
    if (showError) {
      setStep('error')
      // No limpiar el error aquí, se mostrará el mensaje genérico
    }
    // NO cambiar el step cuando showError se desactiva - el modal se cerrará desde el parent
  }, [showError])

  // Log para verificar que el componente se renderiza
  useEffect(() => {
    if (isOpen) {
      console.log('🔵 PortalConnectionModal renderizado - step:', step, 'isLoading:', isLoading, 'requiresVerification:', requiresVerification, 'userEmail:', userEmail)
    }
  }, [isOpen, step, isLoading, requiresVerification, userEmail])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📝 handleSubmit llamado - email:', email, 'password:', password ? '***' : '')
    setError("")
    setStep('connecting')
    console.log('📝 Step cambiado a connecting, llamando onConnect...')

    try {
      console.log('📝 Ejecutando onConnect...')
      await onConnect(email, password)
      console.log('📝 onConnect completado exitosamente')
      // Success - close modal solo si keepOpenOnSuccess es false
      if (!keepOpenOnSuccess) {
        setEmail("")
        setPassword("")
        setStep('credentials')
        setVerificationCode(['', '', '', '', '', ''])
        onClose()
      }
      // Si keepOpenOnSuccess es true, el loading permanecerá activo
      // y el modal se cerrará cuando se llame explícitamente a onClose
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar con el portal")
      setStep('credentials')
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1)
    }
    
    if (!/^\d*$/.test(value)) return

    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...verificationCode]
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i]
    }
    setVerificationCode(newCode)
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerifyCode = async () => {
    const code = verificationCode.join('')
    if (code.length !== 6) {
      setError('Por favor ingresa el código completo de 6 dígitos')
      return
    }

    if (!onVerifyCode) {
      setError('Función de verificación no disponible')
      return
    }

    setError('')
    // NO cambiar step aquí - esperar a que el parent active isProcessingPin
    // Esto evita el flash de contenido vacío
    // El parent establecerá isProcessingPin=true, lo que activará el useEffect que cambia a 'verifying'

    try {
      await onVerifyCode(code)
      // El parent manejará el estado (isProcessingPin, showSuccess) y el cierre del modal
      // No cambiar step aquí - el parent lo controla vía props
      // El step se mantendrá en 'verifying' hasta que isProcessingPin esté activo
      // y luego cambiará a 'success' cuando showSuccess esté activo
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido. Intenta nuevamente.")
      // Solo volver a verification si hay error - no cambiar si está procesando
      if (step !== 'verifying' && !isProcessingPin) {
        setStep('verification')
      }
    }
  }

  const resetAndClose = () => {
    setEmail("")
    setPassword("")
    setError("")
    setStep('credentials')
    setVerificationCode(['', '', '', '', '', ''])
    onClose()
  }

  const handleClose = () => {
    // No permitir cerrar mientras está conectando, verificando, mostrando success o error
    if (step !== 'connecting' && step !== 'verifying' && step !== 'success' && step !== 'error') {
      resetAndClose()
    }
  }

  const displayEmail = userEmail || email

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Loading/Connecting State - Reemplaza todo el contenido */}
        {(step === 'connecting' || step === 'verifying') && (
          <div className={styles.statusContent}>
            <div className={styles.statusHeader}>
              <div className={styles.portalIcon} style={{ color: portalColor }}>
                {portalIcon}
              </div>
              <h2 className={styles.title}>Vincular {portalName}</h2>
              <button className={styles.closeButton} onClick={handleClose} disabled={true}>
                <FiX size={24} />
              </button>
            </div>
            <div className={styles.statusCard}>
              <div className={styles.spinnerContainer}>
                <div className={styles.spinner} style={{ borderTopColor: portalColor }}></div>
                <div className={styles.spinnerIcon} style={{ color: portalColor }}>
                  {portalIcon}
                </div>
              </div>
              <h3 className={styles.statusTitle}>
                {step === 'connecting' ? (
                  <span className={styles.statusTitleRow} style={{ color: portalColor }}>
                    Conectando con {portalName}
                    <span className={styles.countdown}>
                      {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                    </span>
                  </span>
                ) : (
                  'Verificando código...'
                )}
              </h3>
              <p className={styles.statusText} style={step === 'connecting' ? { color: portalColor } : undefined}>
                {step === 'connecting' 
                  ? `Puede tardar hasta 5 minutos. Estableciendo conexión segura...`
                  : 'Validando tu código de verificación'
                }
              </p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ backgroundColor: portalColor }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Error State - usando PortalConnectionAlert */}
        {step === 'error' && (
          <div className={styles.statusContent}>
            <div className={styles.statusHeader}>
              <div className={styles.portalIcon} style={{ color: portalColor }}>
                {portalIcon}
              </div>
              <h2 className={styles.title}>Vincular {portalName}</h2>
              <button className={styles.closeButton} onClick={handleClose} disabled={true}>
                <FiX size={24} />
              </button>
            </div>
            <div className={styles.statusCard}>
              <PortalConnectionAlert
                variant="error"
                title="Ha ocurrido un error"
                message="Intente nuevamente"
              />
            </div>
          </div>
        )}

        {/* Normal Content - Credentials, Verification, Success, Error, etc. */}
        {step !== 'connecting' && step !== 'verifying' && step !== 'error' && (
          <>
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <div className={styles.portalIcon} style={{ color: portalColor }}>
                  {portalIcon}
                </div>
                <h2 className={styles.title}>Vincular {portalName}</h2>
              </div>
              <button className={styles.closeButton} onClick={handleClose} disabled={isLoading}>
                <FiX size={24} />
              </button>
            </div>

            {error && (
              <div className={styles.errorBanner}>
                <FiAlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Credentials Form */}
            {step === 'credentials' && (
          <form 
            onSubmit={(e) => {
              console.log('🎯 Form onSubmit disparado!')
              handleSubmit(e)
            }} 
            className={styles.form}
          >
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email de {portalName}
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`tu@email.com`}
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.actions}>
              <Button type="submit" variant="primary" disabled={isLoading}>
                Vincular cuenta
              </Button>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {/* Verification Code Form */}
        {step === 'verification' && (
          <div className={styles.verificationContainer}>
            <div className={styles.verificationHeader}>
              <div className={styles.verificationIconWrapper}>
                <FiMail size={28} />
              </div>
              <h3 className={styles.verificationTitle}>Verificación requerida</h3>
              <p className={styles.verificationText}>
                {portalName} ha enviado un código de 6 dígitos a tu email <strong>{displayEmail}</strong>
              </p>
            </div>

            <div className={styles.codeInputContainer} onPaste={handleCodePaste}>
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className={styles.codeInput}
                  autoFocus={index === 0}
                  disabled={isLoading}
                />
              ))}
            </div>

            <div className={styles.verificationActions}>
              <Button 
                variant="primary" 
                onClick={handleVerifyCode}
                disabled={verificationCode.join('').length !== 6 || isLoading}
              >
                <FiShield size={18} />
                Verificar código
              </Button>
              <button className={styles.resendLink} disabled={isLoading}>
                ¿No recibiste el código? <span>Reenviar</span>
              </button>
            </div>
          </div>
            )}

            {/* Success State - usando PortalConnectionAlert */}
            {step === 'success' && (
              <PortalConnectionAlert
                variant="success"
                title="Conexión exitosa"
                message="Tu cuenta ha sido vinculada correctamente"
              />
            )}

            <p className={styles.securityNote}>
              <FiShield size={14} />
              Tus credenciales son encriptadas y almacenadas de forma segura
            </p>
          </>
        )}
      </div>
    </div>
  )
}
