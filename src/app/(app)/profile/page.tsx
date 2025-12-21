"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/UI/Input/Input"
import { Select } from "@/components/UI/Select/Select"
import { FileUpload } from "@/components/UI/FileUpload/FileUpload"
import { Button } from "@/components/UI/Button/Button"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { Alert } from "@/components/UI/Alert/Alert"
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/users"
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
    jobChangeReason: "",
  })

  const [editMode, setEditMode] = useState({
    personal: false,
    additional: false,
    experience: false,
    salary: false,
    documents: false,
  })

  const [curriculum, setCurriculum] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState<File | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)

  // Cargar perfil al montar el componente
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoadingProfile(true)
      try {
        const response = await getUserProfile()
        if (response.success && response.profile) {
          const profile = response.profile
          setFormData({
            age: profile.age || "",
            gender: profile.gender || "",
            experienceYears: profile.experienceYears || "",
            currentSalary: profile.currentSalary || "",
            expectedSalary: profile.expectedSalary || "",
            degreeTitle: profile.degreeTitle || "",
            institution: profile.institution || "",
            englishLevel: profile.englishLevel || "",
            country: profile.country || "",
            city: profile.city || "",
            phone: profile.phone || "",
            jobChangeReason: profile.jobChangeReason || "",
          })
        } else {
          setAlert({
            status: "error",
            message: response.error || "Error al cargar el perfil",
          })
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        setAlert({
          status: "error",
          message: "Error al cargar el perfil",
        })
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()
  }, [])

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleEditMode = (section: keyof typeof editMode) => {
    setEditMode((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAlert(null)

    try {
      const response = await updateUserProfile({
        age: formData.age,
        gender: formData.gender,
        experienceYears: formData.experienceYears,
        currentSalary: formData.currentSalary,
        expectedSalary: formData.expectedSalary,
        degreeTitle: formData.degreeTitle,
        institution: formData.institution,
        englishLevel: formData.englishLevel,
        country: formData.country,
        city: formData.city,
        phone: formData.phone,
        jobChangeReason: formData.jobChangeReason,
      })

      if (response.success) {
        setAlert({
          status: "success",
          message: response.message || "Los datos han sido actualizados correctamente",
        })

        // Reset all edit modes
        setEditMode({
          personal: false,
          additional: false,
          experience: false,
          salary: false,
          documents: false,
        })
      } else {
        setAlert({
          status: "error",
          message: response.error || "Error al actualizar el perfil",
        })
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setAlert({
        status: "error",
        message: "Error al actualizar el perfil",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const genderOptions = [
    { value: "male", label: "Masculino" },
    { value: "female", label: "Femenino" },
    { value: "other", label: "Otro" },
    { value: "prefer-not-say", label: "Prefiero no decir" },
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

  const jobChangeReasonOptions = [
    { value: "unemployed", label: "Estoy desempleado/a" },
    { value: "work-environment", label: "Ambiente laboral" },
    { value: "schedules", label: "Horarios" },
    { value: "modality", label: "Modalidad (Presencial/Híbrido a remoto o viceversa)" },
    { value: "benefits", label: "Beneficios" },
    { value: "salary", label: "Salario" },
    {
      value: "currency",
      label: "Moneda (Cobro mi salario en monedas con mucha diferencia frente a EUR o USD)",
    },
    { value: "no-growth", label: "Sin posibilidad de crecimiento" },
    { value: "contract-termination", label: "Finalización de contrato sin renovación" },
  ]

  if (isLoadingProfile) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {isLoading && <LoadingSpinner />}

      {alert && <Alert status={alert.status} message={alert.message} onClose={() => setAlert(null)} />}

      <div className={styles.header}>
        <h1 className={styles.title}>Perfil</h1>
        <p className={styles.subtitle}>Configura tu información personal para mejorar las aplicaciones</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Información Personal</h2>
            <button type="button" className={styles.editButton} onClick={() => toggleEditMode("personal")}>
              {editMode.personal ? "Cancelar" : "Editar"}
            </button>
          </div>
          <div className={styles.grid}>
            <Input
              label="Edad"
              type="number"
              value={formData.age}
              onChange={(e) => handleChange("age", e.target.value)}
              placeholder="Ej: 28"
              disabled={!editMode.personal}
            />

            <Select
              label="Género"
              options={genderOptions}
              value={formData.gender}
              onChange={(value) => handleChange("gender", value)}
              placeholder="Selecciona tu género"
              disabled={!editMode.personal}
            />

            <Input
              label="Teléfono"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+54 11 1234-5678"
              disabled={!editMode.personal}
            />

            <Input
              label="País"
              type="text"
              value={formData.country}
              onChange={(e) => handleChange("country", e.target.value)}
              placeholder="Ej: Argentina"
              disabled={!editMode.personal}
            />

            <Input
              label="Ciudad"
              type="text"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="Ej: Buenos Aires"
              disabled={!editMode.personal}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Información Adicional</h2>
            <button type="button" className={styles.editButton} onClick={() => toggleEditMode("additional")}>
              {editMode.additional ? "Cancelar" : "Editar"}
            </button>
          </div>
          <div className={styles.grid}>
            <Select
              label="¿Por qué quieres cambiar de trabajo? *"
              options={jobChangeReasonOptions}
              value={formData.jobChangeReason}
              onChange={(value) => handleChange("jobChangeReason", value)}
              placeholder="Selecciona una opción"
              disabled={!editMode.additional}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Experiencia y Educación</h2>
            <button type="button" className={styles.editButton} onClick={() => toggleEditMode("experience")}>
              {editMode.experience ? "Cancelar" : "Editar"}
            </button>
          </div>
          <div className={styles.grid}>
            <Input
              label="Años de Experiencia"
              type="number"
              value={formData.experienceYears}
              onChange={(e) => handleChange("experienceYears", e.target.value)}
              placeholder="Ej: 5"
              disabled={!editMode.experience}
            />

            <Input
              label="Título"
              type="text"
              value={formData.degreeTitle}
              onChange={(e) => handleChange("degreeTitle", e.target.value)}
              placeholder="Ej: Ingeniero en Sistemas"
              disabled={!editMode.experience}
            />

            <Input
              label="Institución"
              type="text"
              value={formData.institution}
              onChange={(e) => handleChange("institution", e.target.value)}
              placeholder="Ej: Universidad de Buenos Aires"
              disabled={!editMode.experience}
            />

            <Select
              label="Nivel de Inglés"
              options={englishLevelOptions}
              value={formData.englishLevel}
              onChange={(value) => handleChange("englishLevel", value)}
              placeholder="Selecciona tu nivel"
              disabled={!editMode.experience}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Información Salarial</h2>
            <button type="button" className={styles.editButton} onClick={() => toggleEditMode("salary")}>
              {editMode.salary ? "Cancelar" : "Editar"}
            </button>
          </div>
          <div className={styles.grid}>
            <Input
              label="Salario Actual (USD/año)"
              type="number"
              value={formData.currentSalary}
              onChange={(e) => handleChange("currentSalary", e.target.value)}
              placeholder="Ej: 50000"
              disabled={!editMode.salary}
            />

            <Input
              label="Salario Pretendido (USD/año)"
              type="number"
              value={formData.expectedSalary}
              onChange={(e) => handleChange("expectedSalary", e.target.value)}
              placeholder="Ej: 60000"
              disabled={!editMode.salary}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Documentos</h2>
            <button type="button" className={styles.editButton} onClick={() => toggleEditMode("documents")}>
              {editMode.documents ? "Cancelar" : "Editar"}
            </button>
          </div>
          <div className={styles.uploads}>
            <FileUpload
              label="Curriculum Vitae (CV)"
              accept=".pdf,.doc,.docx"
              value={curriculum}
              onChange={setCurriculum}
              placeholder="Sube tu CV en formato PDF o DOC"
              disabled={!editMode.documents}
            />

            <FileUpload
              label="Carta de Presentación"
              accept=".pdf,.doc,.docx"
              value={coverLetter}
              onChange={setCoverLetter}
              placeholder="Sube tu carta de presentación"
              disabled={!editMode.documents}
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
