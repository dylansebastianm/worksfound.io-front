"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Select } from "@/components/UI/Select/Select"
import { Input } from "@/components/UI/Input/Input"
import { Button } from "@/components/UI/Button/Button"
import { FileCard } from "@/components/UI/FileCard/FileCard"
import { FiUpload, FiCheck, FiFileText } from "react-icons/fi"
import { SiOpenai } from "react-icons/si"
import styles from "./curriculum-generator.module.css"

export default function CurriculumGeneratorPage() {
  const router = useRouter()
  const [sector, setSector] = useState("")
  const [puesto, setPuesto] = useState("")
  const [cvFile, setCvFile] = useState<File | null>(
    new File([""], "CV_Felipe_Alvarez.pdf", { type: "application/pdf" }),
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

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
    if (!sector || !puesto || !cvFile) {
      alert("Por favor, completa todos los campos")
      return
    }

    setIsGenerating(true)
    setCurrentStep(0)

    // Simular proceso de generación
    for (let i = 0; i < generationSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setCurrentStep(i + 1)
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsGenerating(false)
    router.push("/edit-cv")
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
          <Input
            label="Puesto al que quieres aplicar"
            type="text"
            placeholder="Ej: Full Stack Developer, Account Executive..."
            value={puesto}
            onChange={(e) => setPuesto(e.target.value)}
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

        <Button onClick={handleGenerate} disabled={!sector || !puesto || !cvFile}>
          <FiFileText />
          Generar CV Optimizado
        </Button>
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
