"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button/Button"
import { Input } from "@/components/ui/Input/Input"
import { login } from "@/lib/auth"
import styles from "./login.module.css"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await login(email, password)
      
      if (result.success && result.user_id) {
        // Guardar user_id en localStorage o sessionStorage para uso futuro
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('user_id', result.user_id.toString())
          sessionStorage.setItem('user_email', email)
        }
        router.push("/dashboard")
      } else {
        setError(result.error || "Correo o contraseña incorrectos")
      }
    } catch (err) {
      setError("Error conectando con el servidor")
      console.error("Error en login:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
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

          <Button type="submit" fullWidth loading={isLoading} disabled={isLoading}>
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
  )
}
