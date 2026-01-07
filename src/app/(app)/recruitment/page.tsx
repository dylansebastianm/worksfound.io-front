"use client"

import { useState } from "react"
import {
  IoCloseOutline,
  IoGlobeOutline,
  IoBriefcaseOutline,
  IoCodeSlashOutline,
  IoTimeOutline,
  IoCashOutline,
} from "react-icons/io5"
import { SiOpenai } from "react-icons/si"
import { Input } from "@/components/UI/Input/Input"
import { Switch } from "@/components/UI/Switch/Switch"
import { Button } from "@/components/UI/Button/Button"
import TagInputWithSearch from "@/components/UI/TagInputWithSearch/TagInputWithSearch"
import { Checkbox } from "@/components/UI/Checkbox/Checkbox"
import { useSkillsStore } from "@/store/skillsStore"
import styles from "./recruitment.module.css"

interface Skill {
  name: string
  years: number
}

interface Candidate {
  id: string
  country: string
  flag: string
  desiredRole: string
  skills: Skill[]
  totalExperience: number
  salaryRange: {
    min: number
    max: number
    currency: string
  }
  englishLevel: string
  modality: string[]
}

const mockCandidates: Candidate[] = [
  {
    id: "C001",
    country: "Argentina",
    flag: "🇦🇷",
    desiredRole: "Senior Frontend Developer",
    skills: [
      { name: "React", years: 5 },
      { name: "TypeScript", years: 4 },
      { name: "Next.js", years: 3 },
      { name: "TailwindCSS", years: 3 },
    ],
    totalExperience: 6,
    salaryRange: { min: 4000, max: 6000, currency: "USD" },
    englishLevel: "Avanzado",
    modality: ["Remoto Global", "Remoto Local"],
  },
  {
    id: "C002",
    country: "México",
    flag: "🇲🇽",
    desiredRole: "Fullstack Developer",
    skills: [
      { name: "Node.js", years: 4 },
      { name: "React", years: 4 },
      { name: "PostgreSQL", years: 3 },
      { name: "AWS", years: 2 },
    ],
    totalExperience: 5,
    salaryRange: { min: 3500, max: 5500, currency: "USD" },
    englishLevel: "Intermedio-Avanzado",
    modality: ["Remoto Global", "Híbrido"],
  },
  {
    id: "C003",
    country: "España",
    flag: "🇪🇸",
    desiredRole: "Backend Developer",
    skills: [
      { name: "Python", years: 6 },
      { name: "Django", years: 5 },
      { name: "Docker", years: 4 },
      { name: "MongoDB", years: 3 },
    ],
    totalExperience: 8,
    salaryRange: { min: 5000, max: 7000, currency: "EUR" },
    englishLevel: "Nativo",
    modality: ["Remoto Global", "Presencial"],
  },
  {
    id: "C004",
    country: "Colombia",
    flag: "🇨🇴",
    desiredRole: "DevOps Engineer",
    skills: [
      { name: "Kubernetes", years: 3 },
      { name: "Terraform", years: 3 },
      { name: "CI/CD", years: 4 },
      { name: "AWS", years: 4 },
    ],
    totalExperience: 5,
    salaryRange: { min: 4000, max: 6500, currency: "USD" },
    englishLevel: "Avanzado",
    modality: ["Remoto Global"],
  },
  {
    id: "C005",
    country: "Chile",
    flag: "🇨🇱",
    desiredRole: "Mobile Developer",
    skills: [
      { name: "React Native", years: 4 },
      { name: "TypeScript", years: 4 },
      { name: "iOS", years: 3 },
      { name: "Android", years: 3 },
    ],
    totalExperience: 5,
    salaryRange: { min: 3000, max: 5000, currency: "USD" },
    englishLevel: "Intermedio",
    modality: ["Remoto Local", "Híbrido"],
  },
  {
    id: "C006",
    country: "Brasil",
    flag: "🇧🇷",
    desiredRole: "Data Engineer",
    skills: [
      { name: "Python", years: 5 },
      { name: "Apache Spark", years: 3 },
      { name: "SQL", years: 6 },
      { name: "Airflow", years: 2 },
    ],
    totalExperience: 7,
    salaryRange: { min: 4500, max: 6500, currency: "USD" },
    englishLevel: "Avanzado",
    modality: ["Remoto Global", "Remoto Local"],
  },
]

export default function RecruitmentPage() {
  const [showAIMatchModal, setShowAIMatchModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(mockCandidates)

  const catalogSkills = useSkillsStore((s) => s.skills)
  const loadSkills = useSkillsStore((s) => s.loadSkills)
  // Carga lazy (si no se hidrató en SSR) - no hace nada si ya está loaded
  // Nota: no usamos useEffect para evitar import extra; el store ya previene doble carga
  if (catalogSkills.length === 0) {
    // fire-and-forget
    void loadSkills()
  }

  const skillOptions = catalogSkills.map((s) => ({ value: s.skill_key, label: s.name }))

  // Filter states
  const [roleFilter, setRoleFilter] = useState("")
  const [skillsFilter, setSkillsFilter] = useState<string[]>([])
  const [englishRequired, setEnglishRequired] = useState(false)
  const [minSalary, setMinSalary] = useState("")
  const [maxSalary, setMaxSalary] = useState("")
  const [modalities, setModalities] = useState<string[]>([])

  const handleAIMatch = () => {
    // Apply filters
    let filtered = mockCandidates

    if (roleFilter) {
      filtered = filtered.filter((c) => c.desiredRole.toLowerCase().includes(roleFilter.toLowerCase()))
    }

    if (skillsFilter.length > 0) {
      const byKey = new Map(catalogSkills.map((s) => [s.skill_key.toLowerCase(), s]))
      const byName = new Map(catalogSkills.map((s) => [s.name.toLowerCase(), s]))

      filtered = filtered.filter((c) =>
        skillsFilter.some((skillKeyOrLabel) => {
          const needle = (skillKeyOrLabel || "").toLowerCase()
          const resolved = byKey.get(needle) || byName.get(needle)
          const candidateSkillNames = c.skills.map((s) => s.name.toLowerCase())

          if (resolved) {
            const n1 = resolved.name.toLowerCase()
            const n2 = resolved.skill_key.toLowerCase()
            return candidateSkillNames.some((cs) => cs.includes(n1) || cs.includes(n2))
          }

          return candidateSkillNames.some((cs) => cs.includes(needle))
        }),
      )
    }

    if (englishRequired) {
      filtered = filtered.filter((c) => c.englishLevel === "Avanzado" || c.englishLevel === "Nativo")
    }

    if (minSalary) {
      filtered = filtered.filter((c) => c.salaryRange.min >= Number(minSalary))
    }

    if (maxSalary) {
      filtered = filtered.filter((c) => c.salaryRange.max <= Number(maxSalary))
    }

    if (modalities.length > 0) {
      filtered = filtered.filter((c) => modalities.some((mod) => c.modality.includes(mod)))
    }

    setFilteredCandidates(filtered)
    setShowAIMatchModal(false)
  }

  const handleResetFilters = () => {
    setRoleFilter("")
    setSkillsFilter([])
    setEnglishRequired(false)
    setMinSalary("")
    setMaxSalary("")
    setModalities([])
    setFilteredCandidates(mockCandidates)
  }

  const toggleModality = (modality: string) => {
    if (modalities.includes(modality)) {
      setModalities(modalities.filter((m) => m !== modality))
    } else {
      setModalities([...modalities, modality])
    }
  }

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidate(candidateId)
    // Aquí iría la lógica para reclutar al candidato
    alert(`Candidato ${candidateId} seleccionado para reclutar`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reclutamiento</h1>
        <p className={styles.subtitle}>Encuentra candidatos calificados de manera anónima</p>
      </div>

      <div className={styles.aiMatchSection}>
        <button className={styles.aiMatchButton} onClick={() => setShowAIMatchModal(true)}>
          <SiOpenai className={styles.aiIcon} />
          <span>Match AI</span>
        </button>
      </div>

      <div className={styles.candidatesGrid}>
        {filteredCandidates.map((candidate) => (
          <div key={candidate.id} className={styles.candidateCard}>
            <div className={styles.cardHeader}>
              <div className={styles.candidateId}>ID: {candidate.id}</div>
              <div className={styles.countryBadge}>
                <span className={styles.flag}>{candidate.flag}</span>
                <span>{candidate.country}</span>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <IoBriefcaseOutline className={styles.infoIcon} />
                  Puesto Deseado
                </div>
                <div className={styles.infoValue}>{candidate.desiredRole}</div>
              </div>

              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <IoCodeSlashOutline className={styles.infoIcon} />
                  Habilidades
                </div>
                <div className={styles.skillsList}>
                  {candidate.skills.map((skill, idx) => (
                    <div key={idx} className={styles.skillItem}>
                      <span className={styles.skillName}>{skill.name}</span>
                      <span className={styles.skillYears}>{skill.years} años</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <IoTimeOutline className={styles.infoIcon} />
                  Experiencia Total
                </div>
                <div className={styles.infoValue}>{candidate.totalExperience} años</div>
              </div>

              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <IoCashOutline className={styles.infoIcon} />
                  Rango Salarial
                </div>
                <div className={styles.infoValue}>
                  {candidate.salaryRange.min.toLocaleString()} - {candidate.salaryRange.max.toLocaleString()}{" "}
                  {candidate.salaryRange.currency}
                </div>
              </div>

              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <IoGlobeOutline className={styles.infoIcon} />
                  Nivel de Inglés
                </div>
                <div className={styles.infoValue}>{candidate.englishLevel}</div>
              </div>

              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <IoGlobeOutline className={styles.infoIcon} />
                  Modalidad
                </div>
                <div className={styles.modalityList}>
                  {candidate.modality.map((mod, idx) => (
                    <span key={idx} className={styles.modalityBadge}>
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button className={styles.selectButton} onClick={() => handleSelectCandidate(candidate.id)}>
              Seleccionar para Reclutar
            </button>
          </div>
        ))}
      </div>

      {filteredCandidates.length === 0 && (
        <div className={styles.emptyState}>
          <p>No se encontraron candidatos con los filtros aplicados</p>
        </div>
      )}

      {/* AI Match Modal */}
      {showAIMatchModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAIMatchModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Filtros de Match AI</h2>
              <button className={styles.closeButton} onClick={() => setShowAIMatchModal(false)}>
                <IoCloseOutline size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.filterSection}>
                <Input
                  label="Stack tecnológico - Rol"
                  type="text"
                  placeholder="Ej: Fullstack Developer"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  fullWidth
                />
              </div>

              <div className={styles.filterSection}>
                <TagInputWithSearch
                  label="Habilidades"
                  options={skillOptions}
                  selectedValues={skillsFilter}
                  onChange={setSkillsFilter}
                  placeholder="Buscar y agregar..."
                />
              </div>

              <div className={styles.filterSection}>
                <div className={styles.switchItem}>
                  <Switch
                    id="englishRequired"
                    label="El candidato debe tener inglés conversacional"
                    description="Se buscaran candidatos que tengan un nivel de ingles conversacional o superior|"
                    checked={englishRequired}
                    onChange={(e) => setEnglishRequired(e.target.checked)}
                  />
                </div>
              </div>

              <div className={styles.filterSection}>
                <label className={styles.filterLabel}>Rango salarial</label>
                <div className={styles.salaryRow}>
                  <Input
                    label="Mínimo"
                    type="number"
                    placeholder="3000"
                    value={minSalary}
                    onChange={(e) => setMinSalary(e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="Máximo"
                    type="number"
                    placeholder="5000"
                    value={maxSalary}
                    onChange={(e) => setMaxSalary(e.target.value)}
                    fullWidth
                  />
                </div>
              </div>

              <div className={styles.filterSection}>
                <label className={styles.filterLabel}>Modalidad</label>
                <div className={styles.checkboxGroup}>
                  {["Remoto Global", "Remoto local", "Presencial", "Híbrido"].map((mod) => (
                    <Checkbox
                      key={mod}
                      id={`modality-${mod.toLowerCase().replace(/\s+/g, "-")}`}
                      label={mod}
                      checked={modalities.includes(mod)}
                      onChange={() => toggleModality(mod)}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.modalActions}>
                <Button variant="primary" onClick={handleAIMatch} fullWidth>
                  Aplicar filtros
                </Button>
                <Button variant="secondary" onClick={handleResetFilters} fullWidth>
                  Reiniciar filtros
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
