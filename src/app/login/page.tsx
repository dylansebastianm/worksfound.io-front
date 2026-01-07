"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/UI/Button/Button"
import { Input } from "@/components/UI/Input/Input"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { login } from "@/lib/auth"
import styles from "./login.module.css"
import { TermsModal } from "@/components/UI/TermsModal/TermsModal"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await login(email, password)

      if (response.success && response.token && response.user) {
        // El token y los datos del usuario ya se guardan automáticamente en la función login
        // Mostrar modal de términos
        setShowTermsModal(true)
      } else {
        setError(response.error || "Error al iniciar sesión")
      }
    } catch (err) {
      setError("Error conectando con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptTerms = async () => {
    setShowTermsModal(false)
    setIsAcceptingTerms(true)

    // Esperar 2 segundos antes de redirigir
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsAcceptingTerms(false)
    router.push("/dashboard")
  }

  return (
    <>
      {isAcceptingTerms && <LoadingSpinner />}
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.logo}>worksfound.io</h1>
            <p className={styles.subtitle}>Automatiza tu búsqueda laboral</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              type="email"
              label="Correo electrónico"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />

            <Input
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              error={error}
            />

            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              {"¿No tienes una cuenta? "}
              <Link href="/register" className={styles.link}>
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>

      <TermsModal isOpen={showTermsModal} onAccept={handleAcceptTerms} />
    </>
  )
}