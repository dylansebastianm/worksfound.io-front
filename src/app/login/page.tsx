"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/UI/Button/Button"
import { Input } from "@/components/UI/Input/Input"
import { login } from "@/lib/auth"
import styles from "./login.module.css"
import { TermsModal } from "@/components/UI/TermsModal/TermsModal"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showTermsModal, setShowTermsModal] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    login(email, password)
    setShowTermsModal(true)
  }

  const handleAcceptTerms = () => {
    setShowTermsModal(false)
    router.push("/dashboard")
  }

  return (
    <>
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

            <Button type="submit" fullWidth>
              Iniciar sesión
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
