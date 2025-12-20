"use client"

import { useState, useEffect } from "react"
import { FiX, FiEdit2, FiChevronUp, FiChevronDown } from "react-icons/fi"
import { IoLogoWhatsapp, IoPlay, IoStop, IoAdd, IoTrash } from "react-icons/io5"
import { Button } from "@/components/UI/Button/Button"
import { Input } from "@/components/UI/Input/Input"
import { Select } from "@/components/UI/Select/Select"
import { Checkbox } from "@/components/UI/Checkbox/Checkbox"
import { SearchInput } from "@/components/UI/SearchInput/SearchInput"
import { TagInput } from "@/components/UI/TagInput/TagInput"
import { Switch } from "@/components/UI/Switch/Switch"
import { Pagination } from "@/components/UI/Pagination/Pagination"
import { DateRangePicker } from "@/components/UI/DateRangePicker/DateRangePicker"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { getUsers, User as ApiUser } from "@/lib/users"
import styles from "./users.module.css"

interface User {
  id: number
  name: string
  email: string
  autoApplyEnabled: boolean
  totalApplications: number
  startDate: string
  daysRemaining: number | null
  status: "Activo" | "Finalizado" | "Contratado" | "Cancelled"
  sector: string | null
  phone: string | null
  // Profile data (opcional, para edición)
  profile?: {
    age: string
    gender: string
    experienceYears: string
    currentSalary: string
    expectedSalary: string
    degreeTitle: string
    institution: string
    englishLevel: string
    country: string
    city: string
    phone: string
  }
  // Search config (opcional, para edición)
  searchConfig?: {
    searchGroups: JobSearchGroup[]
    requiresEnglish: boolean
    techStackFilter: string
    countryFilter: string
    workType: string
    acceptUnpaidInternships: boolean
  }
}

interface JobSearchGroup {
  id: string
  jobTitle: string
  positiveKeywords: string[]
  negativeKeywords: string[]
  cvFile: string
}

// Mapear estado del backend al frontend
const mapStatus = (status: string): "Activo" | "Finalizado" | "Contratado" | "Cancelled" => {
  switch (status) {
    case "active":
      return "Activo"
    case "contracted":
      return "Contratado"
    case "cancelled":
      return "Cancelled"
    case "inactive":
    default:
      return "Finalizado"
  }
}

// Mapear usuario del API al formato del componente
const mapApiUserToComponent = (apiUser: ApiUser): User => {
  // Formatear fecha de inicio
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  return {
    id: apiUser.id,
    name: apiUser.fullname,
    email: apiUser.email,
    autoApplyEnabled: apiUser.auto_apply,
    totalApplications: apiUser.total_applications,
    startDate: formatDate(apiUser.start_date),
    daysRemaining: apiUser.days_remaining,
    status: mapStatus(apiUser.status),
    sector: apiUser.sector || "IT",
    phone: apiUser.phone,
  }
}


const statusOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "active", label: "Activo" },
  { value: "contracted", label: "Contratado" },
  { value: "cancelled", label: "Cancelled" },
  { value: "inactive", label: "Finalizado" },
]

const sectorOptions = [
  { value: "all", label: "Todos los sectores" },
  { value: "IT", label: "IT" },
  { value: "Sales", label: "Sales" },
  { value: "Customer Experience", label: "Customer Experience" },
]

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedSector, setSelectedSector] = useState("all")
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  })
  const [sortField, setSortField] = useState<"startDate" | "totalApplications" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [editedUser, setEditedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  const itemsPerPage = 10

  // Cargar usuarios desde el API
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const params: any = {
          page: currentPage,
          limit: itemsPerPage,
        }
        
        if (selectedStatus !== "all") {
          params.status = selectedStatus
        }
        
        if (selectedSector !== "all") {
          params.sector = selectedSector
        }
        
        if (searchTerm) {
          params.search = searchTerm
        }

        const response = await getUsers(params)
        
        if (response.success && response.users) {
          const mappedUsers = response.users.map(mapApiUserToComponent)
          setUsers(mappedUsers)
          
          if (response.pagination) {
            setTotalPages(response.pagination.total_pages)
            setTotalUsers(response.pagination.total)
          }
        } else {
          setError(response.error || "Error al cargar usuarios")
          setUsers([])
        }
      } catch (err) {
        console.error("Error loading users:", err)
        setError("Error al conectar con el servidor")
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [currentPage, selectedStatus, selectedSector, searchTerm])

  const handleSort = (field: "startDate" | "totalApplications") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
    // TODO: Implementar ordenamiento en el backend si es necesario
  }

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId)
      }
      return [...prev, userId]
    })
  }

  const toggleSelectAll = () => {
    const currentUserIds = users.map((u) => u.id)
    if (selectedUserIds.length === currentUserIds.length && currentUserIds.length > 0) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(currentUserIds)
    }
  }

  const handleBulkAutoApply = async (enable: boolean) => {
    // TODO: Implementar endpoint para actualizar auto-apply en lote
    console.log("Bulk auto-apply:", enable, selectedUserIds)
    setSelectedUserIds([])
    setShowBulkActions(false)
    // Recargar usuarios después de actualizar
    // await loadUsers()
  }

  useEffect(() => {
    setShowBulkActions(selectedUserIds.length > 0)
  }, [selectedUserIds])

  const toggleAutoApply = async (userId: number) => {
    // TODO: Implementar endpoint para actualizar auto-apply de un usuario
    console.log("Toggle auto-apply for user:", userId)
    // Recargar usuarios después de actualizar
    // await loadUsers()
  }

  const handleWhatsApp = (phone: string | null, name: string) => {
    if (!phone) {
      alert("El usuario no tiene teléfono registrado")
      return
    }
    // Limpiar el teléfono (remover espacios, guiones, etc.)
    const cleanPhone = phone.replace(/\D/g, "")
    const message = encodeURIComponent(`Hola ${name}, te contacto desde worksfound.io`)
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank")
  }

  const handleEditUser = (user: User) => {
    // Por ahora solo mostramos un mensaje, ya que no tenemos los datos completos del perfil
    alert("La edición de usuarios completos aún no está implementada. Solo tenemos datos básicos desde el API.")
    // setSelectedUser(user)
    // setEditedUser(JSON.parse(JSON.stringify(user)))
    // setShowModal(true)
  }

  const updateEditedUserProfile = (field: string, value: any) => {
    if (editedUser) {
      setEditedUser({
        ...editedUser,
        profile: {
          ...editedUser.profile,
          [field]: value,
        },
      })
    }
  }

  const updateEditedUserSearchGroup = (groupId: string, field: keyof JobSearchGroup, value: any) => {
    if (editedUser) {
      setEditedUser({
        ...editedUser,
        searchConfig: {
          ...editedUser.searchConfig,
          searchGroups: editedUser.searchConfig.searchGroups.map((group) =>
            group.id === groupId ? { ...group, [field]: value } : group,
          ),
        },
      })
    }
  }

  const updateEditedUserSearchConfig = (field: string, value: any) => {
    if (editedUser) {
      setEditedUser({
        ...editedUser,
        searchConfig: {
          ...editedUser.searchConfig,
          [field]: value,
        },
      })
    }
  }

  const addSearchGroupToEditedUser = () => {
    if (editedUser) {
      setEditedUser({
        ...editedUser,
        searchConfig: {
          ...editedUser.searchConfig,
          searchGroups: [
            ...editedUser.searchConfig.searchGroups,
            {
              id: Date.now().toString(),
              jobTitle: "",
              positiveKeywords: [],
              negativeKeywords: [],
              cvFile: "",
            },
          ],
        },
      })
    }
  }

  const removeSearchGroupFromEditedUser = (groupId: string) => {
    if (editedUser && editedUser.searchConfig.searchGroups.length > 1) {
      setEditedUser({
        ...editedUser,
        searchConfig: {
          ...editedUser.searchConfig,
          searchGroups: editedUser.searchConfig.searchGroups.filter((group) => group.id !== groupId),
        },
      })
    }
  }

  const handleSaveUser = () => {
    if (editedUser) {
      setUsers((prevUsers) => prevUsers.map((user) => (user.id === editedUser.id ? editedUser : user)))
      setShowModal(false)
      setSelectedUser(null)
      setEditedUser(null)
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Activo":
        return styles.statusActive
      case "Finalizado":
        return styles.statusFinished
      case "Contratado":
        return styles.statusHired
      case "Cancelled":
        return styles.statusFinished
      default:
        return styles.statusActive
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Activo":
        return "Activo"
      case "Finalizado":
        return "Finalizado"
      case "Contratado":
        return "Contratado"
      case "Cancelled":
        return "Cancelled"
      default:
        return status
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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

  const accountStatusOptions = [
    { value: "Activo", label: "Activo" },
    { value: "Finalizado", label: "Finalizado" },
    { value: "Contratado", label: "Contratado" },
  ]

  const sectorSelectOptions = [
    { value: "IT", label: "IT" },
    { value: "Marketing", label: "Marketing" },
    { value: "Ventas", label: "Ventas" },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestión de Usuarios</h1>
        <p className={styles.subtitle}>Panel de administración</p>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.filters}>
          <SearchInput
              placeholder="Buscar por nombre o email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

          <Select options={statusOptions} value={selectedStatus} onChange={setSelectedStatus} placeholder="Estado" />

          <Select options={sectorOptions} value={selectedSector} onChange={setSelectedSector} placeholder="Sector" />

          <button
            className={styles.clearButton}
            onClick={() => {
              setSearchTerm("")
              setSelectedStatus("all")
              setSelectedSector("all")
              setCurrentPage(1)
            }}
          >
            <FiX size={20} />
          </button>
        </div>
      </div>

      {showBulkActions && (
        <div className={styles.bulkActionsBar}>
          <span className={styles.bulkActionsText}>{selectedUserIds.length} usuario(s) seleccionado(s)</span>
          <div className={styles.bulkActionsButtons}>
            <Button variant="secondary" size="small" onClick={() => handleBulkAutoApply(true)}>
              <IoPlay size={18} />
              Activar Auto-Apply
            </Button>
            <Button variant="secondary" size="small" onClick={() => handleBulkAutoApply(false)}>
              <IoStop size={18} />
              Desactivar Auto-Apply
            </Button>
          </div>
        </div>
      )}

      <div className={styles.tableCard}>
        {loading && <LoadingSpinner />}
        
        {error && !loading && (
          <div className={styles.errorState}>
            <p>Error: {error}</p>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className={styles.emptyState}>
            <p>No se encontraron usuarios</p>
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <>
        <div className={styles.tableHeader}>
          <div className={styles.columnCheckbox}>
            <Checkbox
              checked={selectedUserIds.length === users.length && users.length > 0}
              onChange={toggleSelectAll}
            />
          </div>
          <div className={styles.columnName}>Usuario</div>
          <div className={styles.columnAutoApply}>Auto-Apply</div>
          <div className={styles.columnApplications} onClick={() => handleSort("totalApplications")}>
            <span className={styles.sortableHeader}>
              Ofertas
              <span className={sortField === "totalApplications" ? styles.sortIconActive : styles.sortIconInactive}>
                {sortDirection === "asc" ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </span>
            </span>
          </div>
          <div className={styles.columnStartDate} onClick={() => handleSort("startDate")}>
            <span className={styles.sortableHeader}>
              Inicio
              <span className={sortField === "startDate" ? styles.sortIconActive : styles.sortIconInactive}>
                {sortDirection === "asc" ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </span>
            </span>
          </div>
          <div className={styles.columnDays}>Días (90)</div>
          <div className={styles.columnStatus}>Estado</div>
          <div className={styles.columnSector}>Sector</div>
          <div className={styles.columnActions}>Acciones</div>
        </div>

        <div className={styles.tableBody}>
          {users.map((user) => (
            <div key={user.id} className={styles.tableRow}>
              <div className={styles.columnCheckbox}>
                <Checkbox
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleUserSelection(user.id)}
                />
              </div>
              <div className={styles.columnName}>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user.name}</div>
                  <div className={styles.userEmail}>{user.email}</div>
                </div>
              </div>

              <div className={styles.columnAutoApply}>
                <button
                  className={`${styles.autoApplyToggle} ${user.autoApplyEnabled ? styles.enabled : ""}`}
                  onClick={() => toggleAutoApply(user.id)}
                  title={user.autoApplyEnabled ? "Desactivar Auto-Apply" : "Activar Auto-Apply"}
                >
                  {user.autoApplyEnabled ? <IoPlay size={24} /> : <IoStop size={24} />}
                </button>
              </div>

              <div className={styles.columnApplications}>
                <span className={styles.applicationsCount}>{user.totalApplications}</span>
              </div>

              <div className={styles.columnStartDate}>
                <span className={styles.date}>{user.startDate}</span>
              </div>

              <div className={styles.columnDays}>
                <span className={styles.daysCount}>{user.daysRemaining ?? "-"}</span>
              </div>

              <div className={styles.columnStatus}>
                <div className={`${styles.statusBadge} ${getStatusClass(user.status)}`}>
                  {getStatusLabel(user.status)}
                </div>
              </div>

              <div className={styles.columnSector}>
                <span className={styles.sector}>{user.sector || "-"}</span>
              </div>

              <div className={styles.columnActions}>
                <button
                  className={styles.actionButton}
                  onClick={() => handleWhatsApp(user.phone, user.name)}
                  title="Enviar mensaje por WhatsApp"
                >
                  <IoLogoWhatsapp size={20} />
                </button>
                <button className={styles.actionButton} onClick={() => handleEditUser(user)} title="Editar usuario">
                  <FiEdit2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
        )}
      </div>

      {!loading && !error && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {showModal && selectedUser && editedUser && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Editar Usuario: {selectedUser.name}</h2>
              <button className={styles.closeButton} onClick={() => setShowModal(false)}>
                <FiX size={24} />
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Información Personal</h3>
                <div className={styles.formGrid}>
                  <Input
                    label="Edad"
                    type="number"
                    value={editedUser.profile.age}
                    onChange={(e) => updateEditedUserProfile("age", e.target.value)}
                    placeholder="Ej: 28"
                  />

                  <Select
                    label="Género"
                    options={genderOptions}
                    value={editedUser.profile.gender}
                    onChange={(value) => updateEditedUserProfile("gender", value)}
                    placeholder="Selecciona tu género"
                  />

                  <Input
                    label="Teléfono"
                    type="tel"
                    value={editedUser.profile.phone}
                    onChange={(e) => updateEditedUserProfile("phone", e.target.value)}
                    placeholder="+54 11 1234-5678"
                  />

                  <Input
                    label="País"
                    type="text"
                    value={editedUser.profile.country}
                    onChange={(e) => updateEditedUserProfile("country", e.target.value)}
                    placeholder="Ej: Argentina"
                  />

                  <Input
                    label="Ciudad"
                    type="text"
                    value={editedUser.profile.city}
                    onChange={(e) => updateEditedUserProfile("city", e.target.value)}
                    placeholder="Ej: Buenos Aires"
                  />
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Experiencia y Educación</h3>
                <div className={styles.formGrid}>
                  <Input
                    label="Años de Experiencia"
                    type="number"
                    value={editedUser.profile.experienceYears}
                    onChange={(e) => updateEditedUserProfile("experienceYears", e.target.value)}
                    placeholder="Ej: 5"
                  />

                  <Input
                    label="Título"
                    type="text"
                    value={editedUser.profile.degreeTitle}
                    onChange={(e) => updateEditedUserProfile("degreeTitle", e.target.value)}
                    placeholder="Ej: Ingeniero en Sistemas"
                  />

                  <Input
                    label="Institución"
                    type="text"
                    value={editedUser.profile.institution}
                    onChange={(e) => updateEditedUserProfile("institution", e.target.value)}
                    placeholder="Ej: Universidad de Buenos Aires"
                  />

                  <Select
                    label="Nivel de Inglés"
                    options={englishLevelOptions}
                    value={editedUser.profile.englishLevel}
                    onChange={(value) => updateEditedUserProfile("englishLevel", value)}
                    placeholder="Selecciona tu nivel"
                  />
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Información Salarial</h3>
                <div className={styles.formGrid}>
                  <Input
                    label="Salario Actual (USD/año)"
                    type="number"
                    value={editedUser.profile.currentSalary}
                    onChange={(e) => updateEditedUserProfile("currentSalary", e.target.value)}
                    placeholder="Ej: 50000"
                  />

                  <Input
                    label="Salario Pretendido (USD/año)"
                    type="number"
                    value={editedUser.profile.expectedSalary}
                    onChange={(e) => updateEditedUserProfile("expectedSalary", e.target.value)}
                    placeholder="Ej: 60000"
                  />
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.searchConfigHeader}>
                  <h3 className={styles.sectionTitle}>Búsqueda</h3>
                </div>

                <div className={styles.searchConfigLayout}>
                  <div className={styles.searchConfigMain}>
                    <div className={styles.sectionHeader2}>
                      <h4 className={styles.subsectionTitle}>Puestos Objetivo</h4>
                      <Button variant="outline" size="small" onClick={addSearchGroupToEditedUser}>
                        <IoAdd /> Agregar
                      </Button>
                    </div>

                    <div className={styles.groupsList}>
                      {editedUser.searchConfig.searchGroups.map((group, index) => (
                        <div key={group.id} className={styles.groupCard}>
                          <div className={styles.groupHeader}>
                            <input
                              type="text"
                              placeholder="Ej: Frontend Developer"
                              value={group.jobTitle}
                              onChange={(e) => updateEditedUserSearchGroup(group.id, "jobTitle", e.target.value)}
                              className={styles.jobTitleInput}
                            />
                            {editedUser.searchConfig.searchGroups.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSearchGroupFromEditedUser(group.id)}
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
                              onTagsChange={(tags) => updateEditedUserSearchGroup(group.id, "positiveKeywords", tags)}
                            />

                            <TagInput
                              label="Palabras Clave Negativas (excluir)"
                              placeholder="Escribe y presiona Enter"
                              tags={group.negativeKeywords}
                              onTagsChange={(tags) => updateEditedUserSearchGroup(group.id, "negativeKeywords", tags)}
                            />

                            <Select
                              label="CV a utilizar"
                              options={cvOptions}
                              value={group.cvFile}
                              onChange={(value) => updateEditedUserSearchGroup(group.id, "cvFile", value)}
                              fullWidth
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.searchConfigSide}>
                    <h4 className={styles.subsectionTitle}>Filtros Globales</h4>

                    <div className={styles.filtersList}>
                      <Select
                        label="Países"
                        options={countryOptions}
                        value={editedUser.searchConfig.countryFilter}
                        onChange={(value) => updateEditedUserSearchConfig("countryFilter", value)}
                        fullWidth
                      />

                      <Select
                        label="Tipo de Empleo"
                        options={workTypeOptions}
                        value={editedUser.searchConfig.workType}
                        onChange={(value) => updateEditedUserSearchConfig("workType", value)}
                        fullWidth
                      />

                      <Select
                        label="Stack Tecnológico"
                        options={techStackOptions}
                        value={editedUser.searchConfig.techStackFilter}
                        onChange={(value) => updateEditedUserSearchConfig("techStackFilter", value)}
                        fullWidth
                      />

                      <div className={styles.switchItem}>
                        <Switch
                          id="requiresEnglish"
                          label="Filtrar por inglés"
                          description="Solo ofertas que requieran inglés"
                          checked={editedUser.searchConfig.requiresEnglish}
                          onChange={(e) => updateEditedUserSearchConfig("requiresEnglish", e.target.checked)}
                        />
                      </div>

                      <div className={styles.switchItem}>
                        <Switch
                          id="acceptUnpaidInternships"
                          label="Pasantías no pagas"
                          description="Incluir ofertas sin remuneración"
                          checked={editedUser.searchConfig.acceptUnpaidInternships}
                          onChange={(e) => updateEditedUserSearchConfig("acceptUnpaidInternships", e.target.checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Estado de Cuenta</h3>
                <div className={styles.formGrid}>
                  <Input
                    label="Días Restantes"
                    type="number"
                    value={editedUser.daysRemaining.toString()}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser, daysRemaining: Number.parseInt(e.target.value) || 0 })
                    }
                    placeholder="Ej: 44"
                  />

                  <Select
                    label="Estado"
                    options={accountStatusOptions}
                    value={editedUser.status}
                    onChange={(value) =>
                      setEditedUser({ ...editedUser, status: value as "Activo" | "Finalizado" | "Contratado" })
                    }
                    placeholder="Selecciona el estado"
                  />

                  <Select
                    label="Sector"
                    options={sectorSelectOptions}
                    value={editedUser.sector}
                    onChange={(value) => setEditedUser({ ...editedUser, sector: value })}
                    placeholder="Selecciona el sector"
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="outline" size="medium" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="medium" onClick={handleSaveUser}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
