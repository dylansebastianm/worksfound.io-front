"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Select } from "@/components/UI/Select/Select"
import { Input } from "@/components/UI/Input/Input"
import { Button } from "@/components/UI/Button/Button"
import { FileCard } from "@/components/UI/FileCard/FileCard"
import { FiUpload, FiCheck, FiFileText } from "react-icons/fi"
import { SiOpenai } from "react-icons/si"
import { generateCVWithOpenAI } from "@/lib/cv"
import { getUserProfile, UserProfile } from "@/lib/users"
import styles from "./curriculum-generator.module.css"

export default function CurriculumGeneratorPage() {
  const router = useRouter()
  const [sector, setSector] = useState("")
  const [puesto, setPuesto] = useState("")
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Cargar perfil del usuario al montar el componente
  useEffect(() => {
    const loadProfile = async () => {
      const response = await getUserProfile()
      if (response.success && response.profile) {
        setUserProfile(response.profile)
      }
    }
    loadProfile()
  }, [])

  const generationSteps = [
    "Leyendo tu CV actual",
    "Mejorando redacción",
    "Aplicando ATS optimizaciones",
    `Personalizando para el puesto ${puesto || "objetivo"}`,
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (
        file.type === "application/pdf" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "application/msword"
      ) {
        setCvFile(file)
      } else {
        alert("Por favor, sube un archivo PDF o DOCX")
      }
    }
  }

  const handleGenerate = async () => {
    if (!puesto || !cvFile) {
      alert("Por favor, completa el puesto y sube tu CV")
      return
    }

    if (!userProfile) {
      alert("No se pudo cargar tu perfil. Por favor, recarga la página.")
      return
    }

    setError(null)
    setIsGenerating(true)
    setCurrentStep(0)

    try {
      // Paso 1: Leyendo tu CV actual
      setCurrentStep(1)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Paso 2: Mejorando redacción
      setCurrentStep(2)
      
      // Llamar a OpenAI
      const result = await generateCVWithOpenAI({
        cvFile,
        jobTitle: puesto,
        userProfile: {
          name: userProfile.name,
          lastName: userProfile.lastName,
          email: userProfile.email,
          phone: userProfile.phone,
          country: userProfile.country,
          city: userProfile.city,
          age: userProfile.age,
          gender: userProfile.gender,
          experienceYears: userProfile.experienceYears,
          englishLevel: userProfile.englishLevel,
          currentSalary: userProfile.currentSalary,
          expectedSalary: userProfile.expectedSalary,
          institution: userProfile.institution,
          degreeTitle: userProfile.degreeTitle,
          preferredWorkModality: userProfile.preferredWorkModality,
          jobChangeReason: userProfile.jobChangeReason,
          skills: userProfile.skills,
        },
      })

      if (!result.success) {
        setError(result.error || "Error generando CV")
        setIsGenerating(false)
        return
      }

      // Paso 3: Aplicando ATS optimizaciones
      setCurrentStep(3)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Paso 4: Personalizando para el puesto
      setCurrentStep(4)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Guardar el CV generado en sessionStorage para que esté disponible en edit-cv
      if (result.cvContent) {
        sessionStorage.setItem("generatedCV", result.cvContent)
      }

      setIsGenerating(false)
      router.push("/edit-cv2")
    } catch (err) {
      console.error("Error generando CV:", err)
      setError(err instanceof Error ? err.message : "Error desconocido al generar CV")
      setIsGenerating(false)
    }
  }

  const handleRemoveFile = () => {
    setCvFile(null)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Generador de CV</h1>
        <p className={styles.subtitle}>Crea currículums optimizados con IA para destacar en el proceso de selección</p>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formGroup}>
          <Select
            label="Sector"
            options={[
              { value: "", label: "Selecciona un sector" },
              { value: "IT", label: "IT" },
              { value: "Sales", label: "Sales" },
              { value: "Customer Experience", label: "Customer Experience" },
            ]}
            value={sector}
            onChange={(value) => setSector(value)}
            placeholder="Selecciona un sector"
          />
        </div>

        <div className={styles.formGroup}>
          <Select
            label="Puesto al que quieres aplicar"
            options={[
              { value: "", label: "Selecciona un puesto" },
              { value: "Frontend Developer", label: "Frontend Developer" },
              { value: "Backend Developer", label: "Backend Developer" },
              { value: "Full Stack Developer", label: "Full Stack Developer" },
            ]}
            value={puesto}
            onChange={(value) => setPuesto(value)}
            placeholder="Selecciona un puesto"
          />
          <p className={styles.hint}>Se destacará tu experiencia acorde al rol que deseas</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>CV Actual</label>
          {!cvFile ? (
            <div className={styles.uploadArea}>
              <input
                type="file"
                id="cv-upload"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              <label htmlFor="cv-upload" className={styles.uploadLabel}>
                <FiUpload className={styles.uploadIcon} />
                <div>
                  <p className={styles.uploadText}>Sube tu CV en formato PDF o DOC</p>
                  <p className={styles.uploadHint}>Formatos aceptados: .pdf, .doc, .docx</p>
                </div>
              </label>
            </div>
          ) : (
            <FileCard
              fileName={cvFile.name}
              file={cvFile}
              onDelete={handleRemoveFile}
              showDownload={true}
            />
          )}
        </div>

        <Button onClick={handleGenerate} disabled={!puesto || !cvFile || !userProfile || isGenerating}>
          <FiFileText />
          Generar CV Optimizado
        </Button>

        {error && (
          <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: "8px", color: "#c33" }}>
            {error}
          </div>
        )}
      </div>

      {isGenerating && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <SiOpenai className={styles.aiIconTop} />
            <h2 className={styles.modalTitle}>Generando tu CV...</h2>

            <div className={styles.timelineContainer}>
              <div className={styles.timelineSteps}>
                {generationSteps.map((step, index) => (
                  <div key={index} className={styles.timelineItem}>
                    <div className={styles.timelineNode}>
                      <div
                        className={`${styles.stepIndicator} ${index < currentStep ? styles.stepCompleted : index === currentStep ? styles.stepLoading : ""}`}
                      >
                        {index < currentStep ? (
                          <FiCheck className={styles.checkIcon} />
                        ) : index === currentStep ? (
                          <div className={styles.spinner} />
                        ) : null}
                      </div>
                      {index < generationSteps.length - 1 && (
                        <div
                          className={`${styles.timelineLine} ${index < currentStep ? styles.timelineLineCompleted : ""}`}
                        />
                      )}
                    </div>
                    <p className={`${styles.stepText} ${index <= currentStep ? styles.stepTextActive : ""}`}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
