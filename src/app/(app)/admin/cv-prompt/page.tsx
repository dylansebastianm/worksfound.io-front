"use client"

import { useState } from "react"
import {
  FiEdit2,
  FiCheck,
  FiX,
  FiChevronUp,
  FiChevronDown,
  FiRefreshCw,
  FiLoader,
  FiArrowRight,
  FiArrowLeft,
} from "react-icons/fi"
import { SiOpenai } from "react-icons/si"
import { Button } from "@/components/UI/Button/Button"
import styles from "./cv-prompt.module.css"

interface PromptVersion {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  status: "active" | "inactive"
  content: string
}

export default function CVPromptPage() {
  const [prompts, setPrompts] = useState<PromptVersion[]>([
    {
      id: "1",
      name: "Prompt Principal v1",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
      status: "active",
      content:
        "Eres un experto en redacción de CVs profesionales. Tu tarea es mejorar y optimizar CVs para que sean ATS-friendly y destaquen las habilidades del candidato de manera efectiva.",
    },
    {
      id: "2",
      name: "Prompt Experimental v2",
      createdAt: new Date("2024-01-22"),
      updatedAt: new Date("2024-01-22"),
      status: "inactive",
      content:
        "Actúa como un headhunter senior con 15 años de experiencia. Redacta CVs que maximicen las oportunidades de entrevista del candidato, enfocándote en logros cuantificables.",
    },
    {
      id: "3",
      name: "Prompt Tech Focus v1",
      createdAt: new Date("2024-01-25"),
      updatedAt: new Date("2024-01-26"),
      status: "inactive",
      content:
        "Especialízate en CVs para el sector tecnológico. Enfatiza habilidades técnicas, proyectos open source, y contribuciones a la comunidad tech.",
    },
  ])

  const [selectedPrompt, setSelectedPrompt] = useState<PromptVersion | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const [reformulateInput, setReformulateInput] = useState("")
  const [isReformulating, setIsReformulating] = useState(false)
  const [reformulatedResult, setReformulatedResult] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: "name" | "createdAt" | "updatedAt"
    direction: "asc" | "desc"
  }>({
    key: "updatedAt",
    direction: "desc",
  })

  const handleSort = (key: "name" | "createdAt" | "updatedAt") => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
    })
  }

  const sortedPrompts = [...prompts].sort((a, b) => {
    const aValue = sortConfig.key === "name" ? a.name : a[sortConfig.key].getTime()
    const bValue = sortConfig.key === "name" ? b.name : b[sortConfig.key].getTime()

    if (sortConfig.direction === "asc") {
      return aValue > bValue ? 1 : -1
    }
    return aValue < bValue ? 1 : -1
  })

  const handleEditPrompt = (prompt: PromptVersion) => {
    setSelectedPrompt(prompt)
    setEditedContent(prompt.content)
    setReformulateInput("")
    setReformulatedResult("")
  }

  const handleSavePrompt = () => {
    if (!selectedPrompt) return

    setPrompts(
      prompts.map((p) =>
        p.id === selectedPrompt.id
          ? {
              ...p,
              content: editedContent,
              updatedAt: new Date(),
            }
          : p,
      ),
    )
    setSelectedPrompt(null)
    setReformulatedResult("")
  }

  const handleToggleStatus = (id: string) => {
    setPrompts(
      prompts.map((p) => ({
        ...p,
        status: p.id === id ? "active" : "inactive",
      })),
    )
  }

  const handleReformulate = async () => {
    setIsReformulating(true)
    setReformulatedResult("")

    // Simulate API call with progressive text generation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const mockReformulation = `Eres un experto redactor de CVs con certificación CPRW (Certified Professional Resume Writer). Tu objetivo principal es transformar currículums convencionales en documentos estratégicos que maximicen las posibilidades de entrevista del candidato.

Directrices clave:
1. Optimización ATS: Asegura que el CV supere los sistemas de seguimiento de candidatos utilizando palabras clave relevantes del sector.
2. Enfoque en logros: Transforma responsabilidades en logros cuantificables usando métricas específicas (%, $, #).
3. Formato profesional: Mantén una estructura clara y jerárquica que facilite la lectura rápida (6 segundos promedio).
4. Personalización sectorial: Adapta el lenguaje y énfasis según la industria objetivo del candidato.

Resultado esperado: Un CV que destaque inmediatamente las propuestas de valor únicas del candidato y genere interés genuino en reclutadores.`

    // Simulate typing effect
    let currentText = ""
    const words = mockReformulation.split(" ")

    for (let i = 0; i < words.length; i++) {
      currentText += words[i] + " "
      setReformulatedResult(currentText)
      await new Promise((resolve) => setTimeout(resolve, 30))
    }

    setIsReformulating(false)
  }

  const handleAcceptReformulation = () => {
    setEditedContent(reformulatedResult)
    setReformulateInput("")
    setReformulatedResult("")
  }

  const handleRejectReformulation = () => {
    setReformulateInput("")
    setReformulatedResult("")
  }

  const SortIcon = ({ column }: { column: "name" | "createdAt" | "updatedAt" }) => {
    if (sortConfig.key === column) {
      return sortConfig.direction === "asc" ? (
        <FiChevronUp className={styles.sortIconActive} />
      ) : (
        <FiChevronDown className={styles.sortIconActive} />
      )
    }
    return <FiChevronDown className={styles.sortIconInactive} />
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>CV Prompt</h1>
        <p className={styles.subtitle}>Gestiona las versiones del prompt para generación de CVs</p>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.sortableHeader} onClick={() => handleSort("name")}>
            Nombre
            <SortIcon column="name" />
          </div>
          <div className={styles.sortableHeader} onClick={() => handleSort("createdAt")}>
            Fecha Creación
            <SortIcon column="createdAt" />
          </div>
          <div className={styles.sortableHeader} onClick={() => handleSort("updatedAt")}>
            Última Actualización
            <SortIcon column="updatedAt" />
          </div>
          <div>Estado</div>
          <div>Acciones</div>
        </div>

        <div className={styles.tableBody}>
          {sortedPrompts.map((prompt) => (
            <div key={prompt.id} className={styles.tableRow}>
              <div className={styles.columnName}>{prompt.name}</div>
              <div className={styles.columnDate}>{prompt.createdAt.toLocaleDateString("es-ES")}</div>
              <div className={styles.columnDate}>{prompt.updatedAt.toLocaleDateString("es-ES")}</div>
              <div className={styles.columnStatus}>
                <button
                  className={`${styles.statusBadge} ${prompt.status === "active" ? styles.statusActive : styles.statusInactive}`}
                  onClick={() => handleToggleStatus(prompt.id)}
                  title={prompt.status === "active" ? "Versión activa (click para desactivar)" : "Click para activar esta versión"}
                >
                  <span className={styles.radioIndicator}>
                    {prompt.status === "active" && <span className={styles.radioDot} />}
                  </span>
                  {prompt.status === "active" ? "Activo" : "Activar"}
                </button>
              </div>
              <div className={styles.columnActions}>
                <button className={styles.actionButton} onClick={() => handleEditPrompt(prompt)} title="Editar prompt">
                  <FiEdit2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPrompt && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPrompt(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Editar Prompt: {selectedPrompt.name}</h2>
              <button className={styles.closeButton} onClick={() => setSelectedPrompt(null)}>
                <FiX size={24} />
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.editorRow}>
                <div className={styles.editorColumn}>
                  <label className={styles.sectionTitle}>Contenido del Prompt</label>
                  <textarea
                    className={styles.promptTextarea}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={12}
                    placeholder="Escribe el prompt aquí..."
                  />
                </div>

                <div className={styles.arrowsContainer}>
                  <button
                    className={styles.arrowButton}
                    onClick={handleAcceptReformulation}
                    disabled={!reformulatedResult}
                    title="Transferir reformulación al prompt"
                  >
                    <FiArrowLeft size={24} />
                  </button>
                  <div className={styles.arrowDivider} />
                  <button
                    className={styles.arrowButton}
                    onClick={() => setReformulateInput(editedContent)}
                    disabled={!editedContent.trim()}
                    title="Transferir prompt a reformulador"
                  >
                    <FiArrowRight size={24} />
                  </button>
                </div>

                <div className={styles.editorColumn}>
                  <div className={styles.reformulateHeader}>
                    <SiOpenai className={styles.openaiIcon} />
                    <label className={styles.sectionTitle}>Reformular con IA</label>
                  </div>

                  {!reformulatedResult ? (
                    <>
                      <textarea
                        className={styles.reformulateInput}
                        value={reformulateInput}
                        onChange={(e) => setReformulateInput(e.target.value)}
                        rows={8}
                        placeholder="Escribe un prompt básico que quieras mejorar..."
                        disabled={isReformulating}
                      />

                      <Button
                        variant="secondary"
                        onClick={handleReformulate}
                        disabled={!reformulateInput.trim() || isReformulating}
                        className={styles.reformulateButton}
                      >
                        {isReformulating ? (
                          <>
                            <FiLoader className={styles.spinning} />
                            Reformulando...
                          </>
                        ) : (
                          <>
                            <FiRefreshCw />
                            Reformular con IA
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className={styles.reformulatedResult}>
                      <div className={styles.resultHeader}>
                        <SiOpenai className={styles.resultIcon} />
                        <span className={styles.resultLabel}>Resultado Reformulado</span>
                      </div>
                      <div className={styles.resultContent}>{reformulatedResult}</div>
                      <div className={styles.resultActions}>
                        <Button variant="outline" onClick={handleRejectReformulation}>
                          <FiX />
                          Descartar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="outline" onClick={() => setSelectedPrompt(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePrompt}>
                <FiCheck />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
