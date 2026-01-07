"use client"

import { useState, useEffect } from "react"
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
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { Alert } from "@/components/UI/Alert/Alert"
import { getAuthHeaders } from "@/lib/auth"
import styles from "./cv-prompt.module.css"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface PromptVersion {
  id: number
  name: string
  createdAt: string | null
  updatedAt: string | null
  isActive: boolean
  promptText: string
}

export default function CVPromptPage() {
  const [prompts, setPrompts] = useState<PromptVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)

  const [selectedPrompt, setSelectedPrompt] = useState<PromptVersion | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const [editedName, setEditedName] = useState("")
  const [reformulateInput, setReformulateInput] = useState("")
  const [isReformulating, setIsReformulating] = useState(false)
  const [reformulatedResult, setReformulatedResult] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: "name" | "createdAt" | "updatedAt"
    direction: "asc" | "desc"
  }>({
    key: "updatedAt",
    direction: "desc",
  })

  // Cargar prompts desde el backend
  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/cv-prompts`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (response.status === 401) {
        setAlert({
          status: "error",
          message: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.',
        })
        return
      }

      if (response.status === 403) {
        setAlert({
          status: "error",
          message: 'Acceso denegado: Se requieren permisos de administrador.',
        })
        return
      }

      const data = await response.json()
      if (data.success && data.prompts) {
        setPrompts(data.prompts)
      } else {
        setAlert({
          status: "error",
          message: data.error || 'Error al cargar los prompts',
        })
      }
    } catch (error) {
      console.error('Error cargando prompts:', error)
      setAlert({
        status: "error",
        message: 'Error conectando con el servidor',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (key: "name" | "createdAt" | "updatedAt") => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
    })
  }

  const sortedPrompts = [...prompts].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    if (sortConfig.key === "name") {
      aValue = a.name
      bValue = b.name
    } else {
      // Para fechas, convertir a timestamps para comparar
      const aDate = sortConfig.key === "createdAt" ? a.createdAt : a.updatedAt
      const bDate = sortConfig.key === "createdAt" ? b.createdAt : b.updatedAt
      
      if (!aDate || !bDate) {
        // Si alguna fecha es null, tratarla como menor
        if (!aDate && !bDate) return 0
        if (!aDate) return 1
        return -1
      }
      
      // Parsear fecha en formato DD/MM/YYYY
      const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('/').map(Number)
        return new Date(year, month - 1, day).getTime()
      }
      
      aValue = parseDate(aDate)
      bValue = parseDate(bDate)
    }

    if (sortConfig.direction === "asc") {
      return aValue > bValue ? 1 : -1
    }
    return aValue < bValue ? 1 : -1
  })

  const handleEditPrompt = (prompt: PromptVersion) => {
    setSelectedPrompt(prompt)
    setEditedContent(prompt.promptText)
    setEditedName(prompt.name)
    setReformulateInput("")
    setReformulatedResult("")
  }

  const handleSavePrompt = async () => {
    if (!selectedPrompt) return

    setIsSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/cv-prompts/${selectedPrompt.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editedName,
          promptText: editedContent,
          isActive: selectedPrompt.isActive, // Mantener el estado actual
        }),
      })

      if (response.status === 401) {
        setAlert({
          status: "error",
          message: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.',
        })
        return
      }

      if (response.status === 403) {
        setAlert({
          status: "error",
          message: 'Acceso denegado: Se requieren permisos de administrador.',
        })
        return
      }

      const data = await response.json()
      if (data.success) {
        setAlert({
          status: "success",
          message: 'Prompt actualizado correctamente',
        })
        setSelectedPrompt(null)
        setReformulatedResult("")
        // Recargar prompts
        await loadPrompts()
      } else {
        setAlert({
          status: "error",
          message: data.error || 'Error al actualizar el prompt',
        })
      }
    } catch (error) {
      console.error('Error guardando prompt:', error)
      setAlert({
        status: "error",
        message: 'Error conectando con el servidor',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (id: number) => {
    const prompt = prompts.find(p => p.id === id)
    if (!prompt) return

    try {
      const response = await fetch(`${API_URL}/api/admin/cv-prompts/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          isActive: !prompt.isActive, // Toggle del estado
        }),
      })

      if (response.status === 401) {
        setAlert({
          status: "error",
          message: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.',
        })
        return
      }

      if (response.status === 403) {
        setAlert({
          status: "error",
          message: 'Acceso denegado: Se requieren permisos de administrador.',
        })
        return
      }

      const data = await response.json()
      if (data.success) {
        // Recargar prompts
        await loadPrompts()
      } else {
        setAlert({
          status: "error",
          message: data.error || 'Error al actualizar el estado del prompt',
        })
      }
    } catch (error) {
      console.error('Error actualizando estado:', error)
      setAlert({
        status: "error",
        message: 'Error conectando con el servidor',
      })
    }
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
      {isLoading && <LoadingSpinner />}
      {alert && <Alert status={alert.status} message={alert.message} onClose={() => setAlert(null)} />}

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
          {sortedPrompts.length === 0 && !isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No hay prompts disponibles. Ejecuta el script SQL para insertar el prompt inicial.
            </div>
          ) : (
            sortedPrompts.map((prompt) => (
              <div key={prompt.id} className={styles.tableRow}>
                <div className={styles.columnName}>{prompt.name}</div>
                <div className={styles.columnDate}>{prompt.createdAt || 'N/A'}</div>
                <div className={styles.columnDate}>{prompt.updatedAt || 'N/A'}</div>
                <div className={styles.columnStatus}>
                  <button
                    className={`${styles.statusBadge} ${prompt.isActive ? styles.statusActive : styles.statusInactive}`}
                    onClick={() => handleToggleStatus(prompt.id)}
                    title={prompt.isActive ? "Versión activa (click para desactivar)" : "Click para activar esta versión"}
                  >
                    <span className={styles.radioIndicator}>
                      {prompt.isActive && <span className={styles.radioDot} />}
                    </span>
                    {prompt.isActive ? "Activo" : "Activar"}
                  </button>
                </div>
                <div className={styles.columnActions}>
                  <button className={styles.actionButton} onClick={() => handleEditPrompt(prompt)} title="Editar prompt">
                    <FiEdit2 />
                  </button>
                </div>
              </div>
            ))
          )}
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
              <div className={styles.section}>
                <label className={styles.sectionTitle} style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre del Prompt</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.95rem',
                    marginBottom: '1.5rem',
                  }}
                  placeholder="Nombre del prompt"
                />
              </div>
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
              <Button variant="outline" onClick={() => setSelectedPrompt(null)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSavePrompt} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <FiLoader className={styles.spinning} />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FiCheck />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
