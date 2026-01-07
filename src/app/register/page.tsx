"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/UI/Button/Button"
import { Input } from "@/components/UI/Input/Input"
import { Select } from "@/components/UI/Select/Select"
import { register } from "@/lib/auth"
import styles from "./register.module.css"

type RegisterType = "candidate" | "recruiter"

export default function RegisterPage() {
  const router = useRouter()
  const [registerType, setRegisterType] = useState<RegisterType>("candidate")
  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    email: "",
    recruiter_role: "",
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
    if (registerType === "recruiter" && !formData.recruiter_role) {
      newErrors.recruiter_role = "El rol es requerido"
    }

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

        <div className={styles.registerTypeToggle} role="tablist" aria-label="Tipo de registro">
          <button
            type="button"
            role="tab"
            aria-selected={registerType === "candidate"}
            className={`${styles.registerTypeButton} ${registerType === "candidate" ? styles.active : ""}`}
            onClick={() => setRegisterType("candidate")}
          >
            Candidato
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={registerType === "recruiter"}
            className={`${styles.registerTypeButton} ${registerType === "recruiter" ? styles.active : ""}`}
            onClick={() => setRegisterType("recruiter")}
          >
            Reclutador
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {errors.general && (
            <div style={{ color: "red", fontSize: "14px", marginBottom: "16px" }}>
              {errors.general}
            </div>
          )}

          <div className={`${styles.nameRow} ${registerType === "recruiter" ? styles.nameRowTwoCols : ""}`}>
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

          {registerType === "recruiter" && (
            <Select
              label="Rol"
              value={formData.recruiter_role}
              onChange={(value: string) => handleChange("recruiter_role", value)}
              error={errors.recruiter_role}
              fullWidth
              placeholder="Selecciona tu rol"
              options={[
                { value: "hr_generalist", label: "HR Generalist" },
                { value: "hr_manager", label: "HR Manager" },
                { value: "hrbp", label: "HRBP" },
                { value: "talent_acquisition", label: "Talent Acquisition" },
                { value: "recruiter", label: "Recruiter" },
                { value: "head_of_people", label: "Head of People" },
                { value: "ceo", label: "CEO" },
              ]}
              disabled={isLoading}
            />
          )}

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
            {registerType === "recruiter" ? "Crear cuenta de reclutador" : "Crear cuenta"}
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
