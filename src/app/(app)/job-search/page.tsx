"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/UI/Button/Button"
import { Select } from "@/components/UI/Select/Select"
import { Switch } from "@/components/UI/Switch/Switch"
import { TagInput } from "@/components/UI/TagInput/TagInput"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { Alert } from "@/components/UI/Alert/Alert"
import {
  getGlobalSearch,
  updateGlobalSearch,
  getSearchGroups,
  createSearchGroup,
  updateSearchGroup as updateSearchGroupAPI,
  deleteSearchGroup,
  JobSearchGroup as ApiJobSearchGroup,
} from "@/lib/searchConfig"
import { IoAdd, IoTrash } from "react-icons/io5"
import styles from "./job-search.module.css"

interface JobSearchGroup {
  id: number | string // string para grupos nuevos (temporal), number para grupos del API
  jobTitle: string
  positiveKeywords: string[]
  negativeKeywords: string[]
  cvFile: string
  sector: "IT" | "Sales" | "Customer Experience" | null
}

// Función para generar placeholders dinámicos basados en el puesto
const getPlaceholderExamples = (jobTitle: string, isPositive: boolean): string[] => {
  if (isPositive) {
    // Palabras clave positivas: variables del puesto (modalidad, nivel, tipo de empresa, etc.)
    return ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Software Engineer"]
  } else {
    // Palabras clave negativas (excluir)
    return ["junior", "intern", "trainee", "sin experiencia", "estudiante"]
  }
}

export default function JobSearchPage() {
  const [searchGroups, setSearchGroups] = useState<JobSearchGroup[]>([])
  const [requiresEnglish, setRequiresEnglish] = useState(false)
  const [techStackFilter, setTechStackFilter] = useState<"none" | "100" | "70">("none")
  const [countryFilter, setCountryFilter] = useState<"all" | "hispanic">("all")
  const [workType, setWorkType] = useState<"fulltime" | "parttime" | "both">("fulltime")
  const [acceptUnpaidInternships, setAcceptUnpaidInternships] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)

  // Cargar configuración al montar el componente
  useEffect(() => {
    const loadConfiguration = async () => {
      setIsLoading(true)
      try {
        // Cargar filtros globales
        const globalSearchResponse = await getGlobalSearch()
        if (globalSearchResponse.success && globalSearchResponse.globalSearch) {
          const config = globalSearchResponse.globalSearch
          setRequiresEnglish(config.requiresEnglish)
          setTechStackFilter(config.techStackFilter)
          setCountryFilter(config.countryFilter)
          setWorkType(config.workType)
          setAcceptUnpaidInternships(config.acceptUnpaidInternships)
        }

        // Cargar grupos de búsqueda
        const groupsResponse = await getSearchGroups()
        if (groupsResponse.success && groupsResponse.searchGroups && groupsResponse.searchGroups.length > 0) {
          const groups = groupsResponse.searchGroups.map((group) => ({
            id: group.id,
            jobTitle: group.jobTitle,
            positiveKeywords: group.positiveKeywords,
            negativeKeywords: group.negativeKeywords,
            cvFile: group.cvFile || "",
            sector: group.sector || null,
          }))
          setSearchGroups(groups)
        } else {
          // Si no hay grupos, crear uno vacío por defecto
          setSearchGroups([
            {
              id: `temp-${Date.now()}`,
              jobTitle: "",
              positiveKeywords: [],
              negativeKeywords: [],
              cvFile: "",
              sector: null,
            },
          ])
        }
      } catch (error) {
        console.error("Error loading configuration:", error)
        setAlert({
          status: "error",
          message: "Error al cargar la configuración",
        })
        // Crear grupo vacío por defecto en caso de error
        setSearchGroups([
          {
            id: `temp-${Date.now()}`,
            jobTitle: "",
            positiveKeywords: [],
            negativeKeywords: [],
            cvFile: "",
            sector: null,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadConfiguration()
  }, [])

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

  const sectorOptions = [
    { value: "", label: "Seleccionar sector" },
    { value: "IT", label: "IT" },
    { value: "Sales", label: "Sales" },
    { value: "Customer Experience", label: "Customer Experience" },
  ]

  const addSearchGroup = () => {
    setSearchGroups([
      ...searchGroups,
      {
        id: `temp-${Date.now()}`,
        jobTitle: "",
        positiveKeywords: [],
        negativeKeywords: [],
        cvFile: "",
        sector: null,
      },
    ])
  }

  const removeSearchGroup = async (id: number | string) => {
    // Si es un grupo temporal (string), solo eliminarlo del estado
    if (typeof id === "string" && id.startsWith("temp-")) {
      if (searchGroups.length > 1) {
        setSearchGroups(searchGroups.filter((group) => group.id !== id))
      }
      return
    }

    // Si es un grupo del API (number), eliminarlo del servidor
    if (typeof id === "number") {
      try {
        const response = await deleteSearchGroup(id)
        if (response.success) {
          setSearchGroups(searchGroups.filter((group) => group.id !== id))
          setAlert({
            status: "success",
            message: "Grupo eliminado exitosamente",
          })
        } else {
          setAlert({
            status: "error",
            message: response.error || "Error al eliminar el grupo",
          })
        }
      } catch (error) {
        console.error("Error deleting group:", error)
        setAlert({
          status: "error",
          message: "Error al eliminar el grupo",
        })
      }
    }
  }

  const updateSearchGroup = (id: number | string, field: keyof JobSearchGroup, value: any) => {
    setSearchGroups(searchGroups.map((group) => (group.id === id ? { ...group, [field]: value } : group)))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setAlert(null)

    try {
      // Guardar filtros globales
      const globalSearchResponse = await updateGlobalSearch({
        requiresEnglish,
        techStackFilter,
        countryFilter,
        workType,
        acceptUnpaidInternships,
      })

      if (!globalSearchResponse.success) {
        setAlert({
          status: "error",
          message: globalSearchResponse.error || "Error al guardar filtros globales",
        })
        setIsSaving(false)
        return
      }

      // Guardar/actualizar grupos de búsqueda
      const groupsToSave = searchGroups.filter((group) => group.jobTitle.trim() !== "") // Solo guardar grupos con título

      if (groupsToSave.length === 0) {
        setAlert({
          status: "error",
          message: "Debes tener al menos un grupo de búsqueda con título",
        })
        setIsSaving(false)
        return
      }

      const savePromises = groupsToSave.map(async (group) => {
        // Si es un grupo temporal (string), crearlo
        if (typeof group.id === "string" && group.id.startsWith("temp-")) {
          const response = await createSearchGroup({
            jobTitle: group.jobTitle,
            cvFile: group.cvFile || undefined,
            positiveKeywords: group.positiveKeywords,
            negativeKeywords: group.negativeKeywords,
            sector: group.sector || null,
          })
          return response
        } else {
          // Si es un grupo existente (number), actualizarlo
          const response = await updateSearchGroupAPI(group.id as number, {
            jobTitle: group.jobTitle,
            cvFile: group.cvFile || undefined,
            positiveKeywords: group.positiveKeywords,
            negativeKeywords: group.negativeKeywords,
            sector: group.sector || null,
          })
          return response
        }
      })

      const results = await Promise.all(savePromises)
      const hasErrors = results.some((result) => result && !result.success)


      if (hasErrors) {
        setAlert({
          status: "error",
          message: "Error al guardar algunos grupos de búsqueda",
        })
      } else {
        setAlert({
          status: "success",
          message: "Configuración guardada exitosamente",
        })

        // Recargar grupos para obtener los IDs reales
        const groupsResponse = await getSearchGroups()
        if (groupsResponse.success && groupsResponse.searchGroups) {
          const groups = groupsResponse.searchGroups.map((group) => ({
            id: group.id,
            jobTitle: group.jobTitle,
            positiveKeywords: group.positiveKeywords,
            negativeKeywords: group.negativeKeywords,
            cvFile: group.cvFile || "",
            sector: group.sector || null,
          }))
          setSearchGroups(groups)
        }
      }
    } catch (error) {
      console.error("Error saving configuration:", error)
      setAlert({
        status: "error",
        message: "Error al guardar la configuración",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {isSaving && <LoadingSpinner />}
      {alert && <Alert status={alert.status} message={alert.message} onClose={() => setAlert(null)} />}

      <div className={styles.header}>
        <h1 className={styles.title}>Configuración de Búsqueda</h1>
        <p className={styles.subtitle}>Define los parámetros para automatizar tu búsqueda laboral</p>
      </div>

        <div className={styles.layoutGrid}>
        {/* Left Column - Search Groups */}
          <section className={styles.mainColumn}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Puestos Objetivo</h2>
            <Button variant="outline" size="small" onClick={addSearchGroup} disabled={isSaving}>
              <IoAdd /> Agregar
            </Button>
          </div>

          <div className={styles.groupsList}>
            {searchGroups.map((group, index) => (
              <div key={group.id} className={styles.groupCard}>
                {searchGroups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSearchGroup(group.id)}
                    className={styles.deleteButton}
                    aria-label="Eliminar grupo"
                    disabled={isSaving}
                  >
                    <IoTrash />
                  </button>
                )}
                <div className={styles.groupSector}>
                  <Select
                    label="Sector"
                    options={sectorOptions}
                    value={group.sector || ""}
                    onChange={(value) => updateSearchGroup(group.id, "sector", value || null)}
                    fullWidth
                  />
                </div>
                <div className={styles.groupHeader}>
                  <div className={styles.jobTitleWrapper}>
                    <label htmlFor={`job-title-${group.id}`} className={styles.jobTitleLabel}>
                      Título del Puesto
                    </label>
                    <input
                      id={`job-title-${group.id}`}
                      type="text"
                      placeholder="Frontend Developer"
                      value={group.jobTitle}
                      onChange={(e) => updateSearchGroup(group.id, "jobTitle", e.target.value)}
                      className={styles.jobTitleInput}
                    />
                  </div>
                </div>

                <div className={styles.groupContent}>
                  <TagInput
                    label="Palabras Clave Positivas"
                    placeholderExamples={getPlaceholderExamples(group.jobTitle, true)}
                    helpText="Escribe y presiona Enter"
                    tags={group.positiveKeywords}
                    onTagsChange={(tags) => updateSearchGroup(group.id, "positiveKeywords", tags)}
                  />

                  <TagInput
                    label="Palabras Clave Negativas (excluir)"
                    placeholderExamples={getPlaceholderExamples(group.jobTitle, false)}
                    helpText="Escribe y presiona Enter"
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
                onChange={(value) => setCountryFilter(value as "all" | "hispanic")}
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
                onChange={(value) => setWorkType(value as "fulltime" | "parttime" | "both")}
                fullWidth
              />
            </div>

            <div className={styles.filterItem}>
              <Select
                label="Stack Tecnológico"
                options={techStackOptions}
                value={techStackFilter}
                onChange={(value) => setTechStackFilter(value as "none" | "100" | "70")}
                fullWidth
              />
            </div>

            <div className={styles.switchItem}>
              <Switch
                id="requiresEnglish"
                label="Incluir ofertas que requieran inglés"
                description="Se aplicará a ofertas que requieran ingles conversacional|"
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
            <Button variant="primary" size="large" onClick={handleSave} fullWidth disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </div>
          </aside>
        </div>
      </div>
  )
}
