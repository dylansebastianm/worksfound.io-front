"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button/Button"
import { Input } from "@/components/ui/Input/Input"
import { register } from "@/lib/auth"
import styles from "./register.module.css"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validación básica
    const newErrors: { [key: string]: string } = {}

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }

    // Validar campos requeridos mínimos
    if (!formData.name) newErrors.name = "El nombre es requerido"
    if (!formData.last_name) newErrors.last_name = "El apellido es requerido"
    if (!formData.email) newErrors.email = "El email es requerido"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      const result = await register(formData.name, formData.last_name, formData.email, formData.password)

      if (result.success) {
        // Redirigir a login después de 2 segundos
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setErrors({ general: result.error || "Error al registrar usuario" })
      }
    } catch (err) {
      setErrors({ general: "Error conectando con el servidor" })
      console.error("Error en registro:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>worksfound.io</h1>
          <p className={styles.subtitle}>Crea tu cuenta</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {errors.general && (
            <div style={{ color: "red", fontSize: "14px", marginBottom: "16px" }}>
              {errors.general}
            </div>
          )}

          <div className={styles.nameRow}>
            <Input
              type="text"
              label="Nombre"
              placeholder="Juan"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
              fullWidth
              required
            />
            <Input
              type="text"
              label="Apellido"
              placeholder="Pérez"
              value={formData.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              error={errors.last_name}
              fullWidth
              required
            />
          </div>

          <Input
            type="email"
            label="Correo electrónico"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
            fullWidth
            required
          />

          <Input
            type="password"
            label="Contraseña"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password}
            fullWidth
            required
          />

          <Input
            type="password"
            label="Confirmar contraseña"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            fullWidth
            required
          />

          <Button type="submit" fullWidth loading={isLoading} disabled={isLoading}>
            Crear cuenta
          </Button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            {"¿Ya tienes una cuenta? "}
            <Link href="/" className={styles.link}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
