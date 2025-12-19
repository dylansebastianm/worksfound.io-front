"use client"

import type React from "react"
import { useState } from "react"
import { FiX, FiAlertCircle } from "react-icons/fi"
import { Input } from "@/components/UI/Input/Input"
import { Button } from "@/components/UI/Button/Button"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import styles from "./PortalConnectionModal.module.css"

interface PortalConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  portalName: string
  portalIcon: React.ReactNode
  portalColor: string
  onConnect: (email: string, password: string) => Promise<void>
  keepOpenOnSuccess?: boolean // Si es true, no cierra el modal automáticamente cuando onConnect se resuelve
}

export function PortalConnectionModal({
  isOpen,
  onClose,
  portalName,
  portalIcon,
  portalColor,
  onConnect,
  keepOpenOnSuccess = false,
}: PortalConnectionModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await onConnect(email, password)
      // Success - close modal solo si keepOpenOnSuccess es false
      if (!keepOpenOnSuccess) {
        setEmail("")
        setPassword("")
        onClose()
      }
      // Si keepOpenOnSuccess es true, el loading permanecerá activo
      // y el modal se cerrará cuando se llame explícitamente a onClose
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar con el portal")
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setEmail("")
      setPassword("")
      setError("")
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <LoadingSpinner />
            <p className={styles.loadingText}>
              {keepOpenOnSuccess
                ? `Esperando a que completes el login en la ventana del navegador...`
                : `Estableciendo conexión con ${portalName}...`}
            </p>
          </div>
        )}

        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.portalIcon} style={{ color: portalColor }}>
              {portalIcon}
            </div>
            <h2 className={styles.title}>Vincular {portalName}</h2>
          </div>
          <button className={styles.closeButton} onClick={handleClose} disabled={loading}>
            <FiX size={24} />
          </button>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <FiAlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
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
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Contraseña de {portalName}
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={loading}>
              Vincular
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>

        <p className={styles.securityNote}>🔒 Tus credenciales son encriptadas y almacenadas de forma segura</p>
      </div>
    </div>
  )
}
