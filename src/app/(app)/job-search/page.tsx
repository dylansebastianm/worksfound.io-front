"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button/Button"
import { Select } from "@/components/ui/Select/Select"
import { Switch } from "@/components/ui/Switch/Switch"
import { TagInput } from "@/components/ui/TagInput/TagInput"
import { IoAdd, IoTrash } from "react-icons/io5"
import styles from "./job-search.module.css"

interface JobSearchGroup {
  id: string
  jobTitle: string
  positiveKeywords: string[]
  negativeKeywords: string[]
  cvFile: string
}

export default function JobSearchPage() {
  const [searchGroups, setSearchGroups] = useState<JobSearchGroup[]>([
    {
      id: "1",
      jobTitle: "",
      positiveKeywords: [],
      negativeKeywords: [],
      cvFile: "",
    },
  ])

  const [requiresEnglish, setRequiresEnglish] = useState(false)
  const [techStackFilter, setTechStackFilter] = useState("none")
  const [countryFilter, setCountryFilter] = useState("all")
  const [workType, setWorkType] = useState("fulltime")
  const [acceptUnpaidInternships, setAcceptUnpaidInternships] = useState(false)

  const cvOptions = [
    { value: "", label: "Seleccionar CV" },
    { value: "cv1", label: "CV Principal" },
    { value: "cv2", label: "CV Desarrollador" },
    { value: "cv3", label: "CV Internacional" },
  ]

  const techStackOptions = [
    { value: "none", label: "No considerar" },
    { value: "100", label: "100% - Coincidencia exacta" },
    { value: "70", label: "70% - Coincidencia parcial" },
  ]

  const countryOptions = [
    { value: "all", label: "Todo el mundo (requiere inglés B2+)" },
    { value: "hispanic", label: "Países Hispanos" },
  ]

  const workTypeOptions = [
    { value: "fulltime", label: "Full Time" },
    { value: "parttime", label: "Part Time" },
    { value: "both", label: "Ambos" },
  ]

  const addSearchGroup = () => {
    setSearchGroups([
      ...searchGroups,
      {
        id: Date.now().toString(),
        jobTitle: "",
        positiveKeywords: [],
        negativeKeywords: [],
        cvFile: "",
      },
    ])
  }

  const removeSearchGroup = (id: string) => {
    if (searchGroups.length > 1) {
      setSearchGroups(searchGroups.filter((group) => group.id !== id))
    }
  }

  const updateSearchGroup = (id: string, field: keyof JobSearchGroup, value: any) => {
    setSearchGroups(searchGroups.map((group) => (group.id === id ? { ...group, [field]: value } : group)))
  }

  const handleSave = () => {
    console.log("Saving configuration:", {
      searchGroups,
      requiresEnglish,
      techStackFilter,
      countryFilter,
      workType,
      acceptUnpaidInternships,
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configuración de Búsqueda</h1>
        <p className={styles.subtitle}>Define los parámetros para automatizar tu búsqueda laboral</p>
      </div>

        <div className={styles.layoutGrid}>
        {/* Left Column - Search Groups */}
          <section className={styles.mainColumn}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Puestos Objetivo</h2>
            <Button variant="outline" size="small" onClick={addSearchGroup}>
              <IoAdd /> Agregar
            </Button>
          </div>

          <div className={styles.groupsList}>
            {searchGroups.map((group, index) => (
              <div key={group.id} className={styles.groupCard}>
                <div className={styles.groupHeader}>
                  <input
                    type="text"
                    placeholder="Ej: Frontend Developer"
                    value={group.jobTitle}
                    onChange={(e) => updateSearchGroup(group.id, "jobTitle", e.target.value)}
                    className={styles.jobTitleInput}
                  />
                  {searchGroups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSearchGroup(group.id)}
                      className={styles.deleteButton}
                      aria-label="Eliminar grupo"
                    >
                      <IoTrash />
                    </button>
                  )}
                </div>

                <div className={styles.groupContent}>
                  <TagInput
                    label="Palabras Clave Positivas"
                    placeholder="Escribe y presiona Enter"
                    tags={group.positiveKeywords}
                    onTagsChange={(tags) => updateSearchGroup(group.id, "positiveKeywords", tags)}
                  />

                  <TagInput
                    label="Palabras Clave Negativas (excluir)"
                    placeholder="Escribe y presiona Enter"
                    tags={group.negativeKeywords}
                    onTagsChange={(tags) => updateSearchGroup(group.id, "negativeKeywords", tags)}
                  />

                  <Select
                    label="CV a utilizar"
                    options={cvOptions}
                    value={group.cvFile}
                    onChange={(value) => updateSearchGroup(group.id, "cvFile", value)}
                    fullWidth
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column - Filters */}
          <aside className={styles.sideColumn}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Filtros Globales</h2>
          </div>

          <div className={styles.filtersList}>
            <div className={styles.filterItem}>
              <Select
                label="Países"
                options={countryOptions}
                value={countryFilter}
                onChange={setCountryFilter}
                fullWidth
              />
              <p className={styles.filterHint}>
                {countryFilter === "all"
                  ? "Incluye ofertas que requieran inglés B2+"
                  : "Países de habla hispana en todo el mundo"}
              </p>
            </div>

            <div className={styles.filterItem}>
              <Select
                label="Tipo de Empleo"
                options={workTypeOptions}
                value={workType}
                onChange={setWorkType}
                fullWidth
              />
            </div>

            <div className={styles.filterItem}>
              <Select
                label="Stack Tecnológico"
                options={techStackOptions}
                value={techStackFilter}
                onChange={(value) => setTechStackFilter(value)}
                fullWidth
              />
            </div>

            <div className={styles.switchItem}>
              <Switch
                id="requiresEnglish"
                label="Filtrar por inglés"
                description="Solo ofertas que requieran inglés"
                checked={requiresEnglish}
                onChange={(e) => setRequiresEnglish(e.target.checked)}
              />
            </div>

            <div className={styles.switchItem}>
              <Switch
                id="acceptUnpaidInternships"
                label="Pasantías no pagas"
                description="Incluir ofertas sin remuneración"
                checked={acceptUnpaidInternships}
                onChange={(e) => setAcceptUnpaidInternships(e.target.checked)}
              />
            </div>
          </div>

          <div className={styles.sideActions}>
            <Button variant="primary" size="large" onClick={handleSave} fullWidth>
              Guardar Configuración
            </Button>
          </div>
          </aside>
        </div>
      </div>
  )
}
