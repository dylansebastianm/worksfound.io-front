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
import styles from "./users.module.css"

interface User {
  id: number
  name: string
  email: string
  autoApplyEnabled: boolean
  totalApplications: number
  startDate: string
  daysRemaining: number
  status: "Activo" | "Finalizado" | "Contratado"
  sector: string
  phone: string
  // Profile data
  profile: {
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
  // Search config
  searchConfig: {
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

const mockUsers: User[] = [
  {
    id: 1,
    name: "Dylan Martínez",
    email: "dylan@email.com",
    autoApplyEnabled: true,
    totalApplications: 847,
    startDate: "15/09/2025",
    daysRemaining: 44,
    status: "Activo",
    sector: "IT",
    phone: "+5491112345678",
    profile: {
      age: "28",
      gender: "male",
      experienceYears: "5",
      currentSalary: "85000",
      expectedSalary: "110000",
      degreeTitle: "Ingeniero en Sistemas",
      institution: "Universidad de Buenos Aires",
      englishLevel: "c1",
      country: "Argentina",
      city: "Buenos Aires",
      phone: "+54 11 5555-1234",
    },
    searchConfig: {
      searchGroups: [
        {
          id: "1",
          jobTitle: "Frontend Developer",
          positiveKeywords: ["React", "TypeScript", "Next.js"],
          negativeKeywords: ["Angular", "Vue"],
          cvFile: "cv1",
        },
      ],
      requiresEnglish: true,
      techStackFilter: "70",
      countryFilter: "all",
      workType: "fulltime",
      acceptUnpaidInternships: false,
    },
  },
  {
    id: 2,
    name: "María González",
    email: "maria@email.com",
    autoApplyEnabled: false,
    totalApplications: 523,
    startDate: "20/09/2025",
    daysRemaining: 49,
    status: "Activo",
    sector: "IT",
    phone: "+5491123456789",
    profile: {
      age: "32",
      gender: "female",
      experienceYears: "7",
      currentSalary: "100000",
      expectedSalary: "130000",
      degreeTitle: "Licenciada en Computación",
      institution: "Universidad Autónoma de Madrid",
      englishLevel: "b2",
      country: "España",
      city: "Madrid",
      phone: "+34 91 1234-5678",
    },
    searchConfig: {
      searchGroups: [
        {
          id: "2",
          jobTitle: "Backend Developer",
          positiveKeywords: ["Python", "Django", "AWS"],
          negativeKeywords: ["Node.js"],
          cvFile: "cv2",
        },
      ],
      requiresEnglish: true,
      techStackFilter: "70",
      countryFilter: "hispanic",
      workType: "fulltime",
      acceptUnpaidInternships: false,
    },
  },
  {
    id: 3,
    name: "Carlos Pérez",
    email: "carlos@email.com",
    autoApplyEnabled: true,
    totalApplications: 1205,
    startDate: "01/09/2025",
    daysRemaining: 30,
    status: "Contratado",
    sector: "IT",
    phone: "+5491134567890",
    profile: {
      age: "35",
      gender: "male",
      experienceYears: "10",
      currentSalary: "120000",
      expectedSalary: "150000",
      degreeTitle: "Ingeniero en Informática",
      institution: "Universidad de Chile",
      englishLevel: "native",
      country: "Chile",
      city: "Santiago",
      phone: "+56 2 1234-5678",
    },
    searchConfig: {
      searchGroups: [
        {
          id: "3",
          jobTitle: "Tech Lead",
          positiveKeywords: ["Java", "Spring", "Microservices"],
          negativeKeywords: ["React"],
          cvFile: "cv3",
        },
      ],
      requiresEnglish: false,
      techStackFilter: "none",
      countryFilter: "hispanic",
      workType: "both",
      acceptUnpaidInternships: true,
    },
  },
  {
    id: 4,
    name: "Ana Silva",
    email: "ana@email.com",
    autoApplyEnabled: true,
    totalApplications: 678,
    startDate: "10/09/2025",
    daysRemaining: 39,
    status: "Activo",
    sector: "IT",
    phone: "+5491145678901",
    profile: {
      age: "26",
      gender: "female",
      experienceYears: "3",
      currentSalary: "70000",
      expectedSalary: "95000",
      degreeTitle: "Ingeniera en Software",
      institution: "Universidade de São Paulo",
      englishLevel: "b1",
      country: "Brasil",
      city: "São Paulo",
      phone: "+55 11 1234-5678",
    },
    searchConfig: {
      searchGroups: [
        {
          id: "4",
          jobTitle: "Mobile Developer",
          positiveKeywords: ["React Native", "Mobile", "Flutter"],
          negativeKeywords: ["iOS"],
          cvFile: "cv4",
        },
      ],
      requiresEnglish: true,
      techStackFilter: "70",
      countryFilter: "hispanic",
      workType: "fulltime",
      acceptUnpaidInternships: false,
    },
  },
  {
    id: 5,
    name: "Luis Rodríguez",
    email: "luis@email.com",
    autoApplyEnabled: false,
    totalApplications: 234,
    startDate: "25/09/2025",
    daysRemaining: 54,
    status: "Finalizado",
    sector: "IT",
    phone: "+5491156789012",
    profile: {
      age: "30",
      gender: "male",
      experienceYears: "8",
      currentSalary: "90000",
      expectedSalary: "120000",
      degreeTitle: "Ingeniero en Telecomunicaciones",
      institution: "Universidad de la República",
      englishLevel: "c2",
      country: "Uruguay",
      city: "Montevideo",
      phone: "+598 2 1234-5678",
    },
    searchConfig: {
      searchGroups: [
        {
          id: "5",
          jobTitle: "DevOps Engineer",
          positiveKeywords: ["DevOps", "Docker", "Kubernetes"],
          negativeKeywords: ["AWS"],
          cvFile: "cv5",
        },
      ],
      requiresEnglish: false,
      techStackFilter: "none",
      countryFilter: "all",
      workType: "fulltime",
      acceptUnpaidInternships: true,
    },
  },
  {
    id: 6,
    name: "Sofía Torres",
    email: "sofia@email.com",
    autoApplyEnabled: true,
    totalApplications: 923,
    startDate: "05/09/2025",
    daysRemaining: 34,
    status: "Activo",
    sector: "IT",
    phone: "+5491167890123",
    profile: {
      age: "29",
      gender: "female",
      experienceYears: "4",
      currentSalary: "75000",
      expectedSalary: "100000",
      degreeTitle: "Licenciada en Ingeniería de Sistemas",
      institution: "Universidad Nacional de Colombia",
      englishLevel: "b2",
      country: "Colombia",
      city: "Bogotá",
      phone: "+57 1 1234-5678",
    },
    searchConfig: {
      searchGroups: [
        {
          id: "6",
          jobTitle: "Frontend Developer",
          positiveKeywords: ["Angular", "TypeScript", "RxJS"],
          negativeKeywords: ["React"],
          cvFile: "cv6",
        },
      ],
      requiresEnglish: true,
      techStackFilter: "70",
      countryFilter: "hispanic",
      workType: "fulltime",
      acceptUnpaidInternships: false,
    },
  },
]

const statusOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "Activo", label: "Activo" },
  { value: "Finalizado", label: "Finalizado" },
  { value: "Contratado", label: "Contratado" },
]

const sectorOptions = [
  { value: "all", label: "Todos los sectores" },
  { value: "IT", label: "IT" },
  { value: "Marketing", label: "Marketing" },
  { value: "Ventas", label: "Ventas" },
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
  const [users, setUsers] = useState(mockUsers)
  const [editedUser, setEditedUser] = useState<User | null>(null)

  const itemsPerPage = 10

  const handleSort = (field: "startDate" | "totalApplications") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const parseDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split("/")
    return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
  }

  const filteredAndSortedUsers = users
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = selectedStatus === "all" || user.status === selectedStatus
      const matchesSector = selectedSector === "all" || user.sector === selectedSector

      let matchesDate = true
      if (dateRange.start || dateRange.end) {
        const userDate = parseDate(user.startDate)
        if (dateRange.start) {
          matchesDate = matchesDate && userDate >= dateRange.start
        }
        if (dateRange.end) {
          matchesDate = matchesDate && userDate <= dateRange.end
        }
      }

      return matchesSearch && matchesStatus && matchesSector && matchesDate
    })
    .sort((a, b) => {
      if (!sortField) return 0

      if (sortField === "startDate") {
        const dateA = parseDate(a.startDate)
        const dateB = parseDate(b.startDate)
        return sortDirection === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
      }

      if (sortField === "totalApplications") {
        return sortDirection === "asc"
          ? a.totalApplications - b.totalApplications
          : b.totalApplications - a.totalApplications
      }

      return 0
    })

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId)
      }
      return [...prev, userId]
    })
  }

  const toggleSelectAll = () => {
    const currentUserIds = filteredAndSortedUsers
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      .map((u) => u.id)
    if (selectedUserIds.length === currentUserIds.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(currentUserIds)
    }
  }

  const handleBulkAutoApply = (enable: boolean) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (selectedUserIds.includes(user.id)) {
          return { ...user, autoApplyEnabled: enable }
        }
        return user
      }),
    )
    setSelectedUserIds([])
    setShowBulkActions(false)
  }

  useEffect(() => {
    setShowBulkActions(selectedUserIds.length > 0)
  }, [selectedUserIds])

  const toggleAutoApply = (userId: number) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === userId ? { ...user, autoApplyEnabled: !user.autoApplyEnabled } : user)),
    )
  }

  const handleWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Hola ${name}, te contacto desde worksfound.io`)
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditedUser(JSON.parse(JSON.stringify(user)))
    setShowModal(true)
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
      default:
        return styles.statusActive
    }
  }

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredAndSortedUsers.slice(startIndex, endIndex)

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

          <DateRangePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={(start, end) => setDateRange({ start, end })}
            placeholder="Fecha de alta"
          />

          <button
            className={styles.clearButton}
            onClick={() => {
              setSearchTerm("")
              setSelectedStatus("all")
              setSelectedSector("all")
              setDateRange({ start: null, end: null })
              setSortField(null)
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
        <div className={styles.tableHeader}>
          <div className={styles.columnCheckbox}>
            <Checkbox
              checked={selectedUserIds.length === currentUsers.length && currentUsers.length > 0}
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
          {currentUsers.map((user) => (
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
                <span className={styles.daysCount}>{user.daysRemaining}</span>
              </div>

              <div className={styles.columnStatus}>
                <div className={`${styles.statusBadge} ${getStatusClass(user.status)}`}>{user.status}</div>
              </div>

              <div className={styles.columnSector}>
                <span className={styles.sector}>{user.sector}</span>
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
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

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
