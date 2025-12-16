"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/Input/Input"
import { Select } from "@/components/ui/Select/Select"
import { FileUpload } from "@/components/ui/FileUpload/FileUpload"
import { Button } from "@/components/ui/Button/Button"
import styles from "./profile.module.css"

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    experienceYears: "",
    currentSalary: "",
    expectedSalary: "",
    degreeTitle: "",
    institution: "",
    englishLevel: "",
    country: "",
    city: "",
    phone: "",
  })

  const [curriculum, setCurriculum] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState<File | null>(null)

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Profile data:", formData)
    console.log("[v0] Curriculum:", curriculum)
    console.log("[v0] Cover Letter:", coverLetter)
  }

  const genderOptions = [
    { value: "male", label: "Masculino" },
    { value: "female", label: "Femenino" },
    { value: "other", label: "Otro" },
    { value: "prefer-not-say", label: "Prefiero no decir" },
  ]

  const educationOptions = [
    { value: "high-school", label: "Secundario" },
    { value: "technical", label: "Técnico" },
    { value: "bachelor", label: "Universitario" },
    { value: "master", label: "Maestría" },
    { value: "phd", label: "Doctorado" },
  ]

  const englishLevelOptions = [
    { value: "a1", label: "A1 - Principiante" },
    { value: "a2", label: "A2 - Elemental" },
    { value: "b1", label: "B1 - Intermedio" },
    { value: "b2", label: "B2 - Intermedio Alto" },
    { value: "c1", label: "C1 - Avanzado" },
    { value: "c2", label: "C2 - Dominio" },
    { value: "native", label: "Nativo" },
  ]

  return (
    <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Perfil</h1>
          <p className={styles.subtitle}>Configura tu información personal para mejorar las aplicaciones</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Información Personal</h2>
            <div className={styles.grid}>
              <Input
                label="Edad"
                type="number"
                value={formData.age}
                onChange={(e) => handleChange("age", e.target.value)}
                placeholder="Ej: 28"
              />

              <Select
                label="Género"
                options={genderOptions}
                value={formData.gender}
                onChange={(value) => handleChange("gender", value)}
                placeholder="Selecciona tu género"
              />

              <Input
                label="Teléfono"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+54 11 1234-5678"
              />

              <Input
                label="País"
                type="text"
                value={formData.country}
                onChange={(e) => handleChange("country", e.target.value)}
                placeholder="Ej: Argentina"
              />

              <Input
                label="Ciudad"
                type="text"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Ej: Buenos Aires"
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Experiencia y Educación</h2>
            <div className={styles.grid}>
              <Input
                label="Años de Experiencia"
                type="number"
                value={formData.experienceYears}
                onChange={(e) => handleChange("experienceYears", e.target.value)}
                placeholder="Ej: 5"
              />

              <Input
                label="Título"
                type="text"
                value={formData.degreeTitle}
                onChange={(e) => handleChange("degreeTitle", e.target.value)}
                placeholder="Ej: Ingeniero en Sistemas"
              />

              <Input
                label="Institución"
                type="text"
                value={formData.institution}
                onChange={(e) => handleChange("institution", e.target.value)}
                placeholder="Ej: Universidad de Buenos Aires"
              />

              <Select
                label="Nivel de Inglés"
                options={englishLevelOptions}
                value={formData.englishLevel}
                onChange={(value) => handleChange("englishLevel", value)}
                placeholder="Selecciona tu nivel"
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Información Salarial</h2>
            <div className={styles.grid}>
              <Input
                label="Salario Actual"
                type="number"
                value={formData.currentSalary}
                onChange={(e) => handleChange("currentSalary", e.target.value)}
                placeholder="Ej: 50000"
              />

              <Input
                label="Salario Pretendido"
                type="number"
                value={formData.expectedSalary}
                onChange={(e) => handleChange("expectedSalary", e.target.value)}
                placeholder="Ej: 60000"
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Documentos</h2>
            <div className={styles.uploads}>
              <FileUpload
                label="Curriculum Vitae (CV)"
                accept=".pdf,.doc,.docx"
                value={curriculum}
                onChange={setCurriculum}
                placeholder="Sube tu CV en formato PDF o DOC"
              />

              <FileUpload
                label="Carta de Presentación"
                accept=".pdf,.doc,.docx"
                value={coverLetter}
                onChange={setCoverLetter}
                placeholder="Sube tu carta de presentación"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="submit" variant="primary" size="large">
              Guardar Cambios
            </Button>
          </div>
        </form>
    </div>
  )
}
