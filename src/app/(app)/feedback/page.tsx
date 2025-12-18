"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/UI/Input/Input"
import { Checkbox } from "@/components/UI/Checkbox/Checkbox"
import { Button } from "@/components/UI/Button/Button"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpiner"
import { Alert } from "@/components/UI/Alert/Alert"
import styles from "./feedback.module.css"

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simular envío
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    setAlert({
      status: "success",
      message: "Tu mensaje ha sido enviado correctamente. Te responderemos pronto.",
    })

    // Limpiar formulario
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    })
    setIsAnonymous(false)

    // Ocultar alerta después de 5 segundos
    setTimeout(() => setAlert(null), 5000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className={styles.container}>
      {isLoading && <LoadingSpinner />}
      {alert && <Alert status={alert.status} message={alert.message} onClose={() => setAlert(null)} />}

      <div className={styles.header}>
        <h1 className={styles.title}>Feedback</h1>
        <p className={styles.subtitle}>Envíanos tus recomendaciones o solicita nuevas funcionalidades</p>
      </div>

      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Nombre</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Tu nombre completo"
                required={!isAnonymous}
                disabled={isAnonymous}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required={!isAnonymous}
                disabled={isAnonymous}
              />
            </div>
          </div>

          <Checkbox
            label="Quiero enviar mi recomendación de forma anónima"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />

          <div className={styles.field}>
            <label className={styles.label}>Asunto</label>
            <Input
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Breve descripción del tema"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Mensaje</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Cuéntanos más sobre tu sugerencia o solicitud..."
              className={styles.textarea}
              rows={6}
              required
            />
          </div>

          <div className={styles.actions}>
            <Button type="submit" variant="primary">
              Enviar mensaje
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
