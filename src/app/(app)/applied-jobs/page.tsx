"use client"

import { useState } from "react"
import { FiSearch, FiX, FiCalendar, FiChevronDown } from "react-icons/fi"
import { BsLinkedin } from "react-icons/bs"
import { Button } from "@/components/ui/Button/Button"
import { Select } from "@/components/ui/Select/Select"
import { Pagination } from "@/components/ui/Pagination/Pagination"
import { DateRangePicker } from "@/components/ui/DateRangePicker/DateRangePicker"
import styles from "./applied-jobs.module.css"

interface JobApplication {
  id: number
  title: string
  company: string
  portal: "LinkedIn" | "Bumeran" | "Zonajobs" | "Glassdoor"
  country: string
  countryFlag: string
  date: string
  status: "Postulados" | "En revisión" | "Entrevista" | "Rechazado" | "Aceptado"
}

// Mock data de 30 ofertas
const mockJobs: JobApplication[] = [
  {
    id: 1,
    title: "Senior Developer Technology Engineer",
    company: "Nvidia",
    portal: "LinkedIn",
    country: "USA",
    countryFlag: "🇺🇸",
    date: "02/10/2025 12:39",
    status: "Postulados",
  },
  {
    id: 2,
    title: "Senior Software Engineer - AV Infrastructure",
    company: "Nvidia",
    portal: "LinkedIn",
    country: "España",
    countryFlag: "🇪🇸",
    date: "02/10/2025 12:13",
    status: "Postulados",
  },
  {
    id: 3,
    title: "Data Center Electrical Cx Provider",
    company: "Salas O'Brien",
    portal: "LinkedIn",
    country: "Colombia",
    countryFlag: "🇨🇴",
    date: "02/10/2025 11:56",
    status: "Postulados",
  },
  {
    id: 4,
    title: "Frontend Developer React",
    company: "Mercado Libre",
    portal: "Bumeran",
    country: "Argentina",
    countryFlag: "🇦🇷",
    date: "02/10/2025 10:23",
    status: "En revisión",
  },
  {
    id: 5,
    title: "Full Stack Developer",
    company: "Globant",
    portal: "LinkedIn",
    country: "Uruguay",
    countryFlag: "🇺🇾",
    date: "02/10/2025 09:15",
    status: "Postulados",
  },
  {
    id: 6,
    title: "Backend Engineer Node.js",
    company: "Auth0",
    portal: "Zonajobs",
    country: "Argentina",
    countryFlag: "🇦🇷",
    date: "01/10/2025 18:45",
    status: "Entrevista",
  },
  {
    id: 7,
    title: "DevOps Engineer",
    company: "Google",
    portal: "LinkedIn",
    country: "USA",
    countryFlag: "🇺🇸",
    date: "01/10/2025 17:30",
    status: "Postulados",
  },
  {
    id: 8,
    title: "Mobile Developer iOS",
    company: "Apple",
    portal: "Glassdoor",
    country: "USA",
    countryFlag: "🇺🇸",
    date: "01/10/2025 16:20",
    status: "Rechazado",
  },
  {
    id: 9,
    title: "UX/UI Designer",
    company: "Adobe",
    portal: "LinkedIn",
    country: "México",
    countryFlag: "🇲🇽",
    date: "01/10/2025 15:10",
    status: "Postulados",
  },
  {
    id: 10,
    title: "Data Scientist",
    company: "Amazon",
    portal: "LinkedIn",
    country: "Brasil",
    countryFlag: "🇧🇷",
    date: "01/10/2025 14:05",
    status: "En revisión",
  },
  {
    id: 11,
    title: "Cloud Architect",
    company: "Microsoft",
    portal: "Bumeran",
    country: "Chile",
    countryFlag: "🇨🇱",
    date: "01/10/2025 13:00",
    status: "Postulados",
  },
  {
    id: 12,
    title: "QA Automation Engineer",
    company: "Tesla",
    portal: "LinkedIn",
    country: "USA",
    countryFlag: "🇺🇸",
    date: "01/10/2025 11:50",
    status: "Aceptado",
  },
  {
    id: 13,
    title: "Product Manager",
    company: "Spotify",
    portal: "Zonajobs",
    country: "España",
    countryFlag: "🇪🇸",
    date: "01/10/2025 10:40",
    status: "Postulados",
  },
  {
    id: 14,
    title: "Scrum Master",
    company: "IBM",
    portal: "LinkedIn",
    country: "Argentina",
    countryFlag: "🇦🇷",
    date: "01/10/2025 09:30",
    status: "En revisión",
  },
  {
    id: 15,
    title: "Security Engineer",
    company: "Cisco",
    portal: "Glassdoor",
    country: "USA",
    countryFlag: "🇺🇸",
    date: "30/09/2025 18:20",
    status: "Postulados",
  },
  {
    id: 16,
    title: "Machine Learning Engineer",
    company: "OpenAI",
    portal: "LinkedIn",
    country: "USA",
    countryFlag: "🇺🇸",
    date: "30/09/2025 17:15",
    status: "Entrevista",
  },
  {
    id: 17,
    title: "Site Reliability Engineer",
    company: "Netflix",
    portal: "Bumeran",
    country: "Brasil",
    countryFlag: "🇧🇷",
    date: "30/09/2025 16:10",
    status: "Postulados",
  },
  {
    id: 18,
    title: "Technical Lead",
    company: "Uber",
    portal: "LinkedIn",
    country: "Argentina",
    countryFlag: "🇦🇷",
    date: "30/09/2025 15:05",
    status: "Rechazado",
  },
  {
    id: 19,
    title: "iOS Developer",
    company: "Airbnb",
    portal: "Zonajobs",
    country: "México",
    countryFlag: "🇲🇽",
    date: "30/09/2025 14:00",
    status: "Postulados",
  },
  {
    id: 20,
    title: "Android Developer",
    company: "Twitter",
    portal: "LinkedIn",
    country: "Chile",
    countryFlag: "🇨🇱",
    date: "30/09/2025 12:55",
    status: "En revisión",
  },
  {
    id: 21,
    title: "Systems Engineer",
    company: "Intel",
    portal: "Glassdoor",
    country: "USA",
    countryFlag: "🇺🇸",
    date: "30/09/2025 11:50",
    status: "Postulados",
  },
  {
    id: 22,
    title: "Database Administrator",
    company: "Oracle",
    portal: "LinkedIn",
    country: "España",
    countryFlag: "🇪🇸",
    date: "30/09/2025 10:45",
    status: "Postulados",
  },
  {
    id: 23,
    title: "Network Engineer",
    company: "Juniper",
    portal: "Bumeran",
    country: "Colombia",
    countryFlag: "🇨🇴",
    date: "30/09/2025 09:40",
    status: "Aceptado",
  },
  {
    id: 24,
    title: "Blockchain Developer",
    company: "Coinbase",
    portal: "LinkedIn",
    country: "USA",
    countryFlag: "🇺🇸",
    date: "29/09/2025 18:35",
    status: "Postulados",
  },
  {
    id: 25,
    title: "Game Developer",
    company: "Unity",
    portal: "Zonajobs",
    country: "Argentina",
    countryFlag: "🇦🇷",
    date: "29/09/2025 17:30",
    status: "En revisión",
  },
  {
    id: 26,
    title: "AR/VR Developer",
    company: "Meta",
    portal: "LinkedIn",
    country: "USA",
    countryFlag: "🇺🇸",
    date: "29/09/2025 16:25",
    status: "Postulados",
  },
  {
    id: 27,
    title: "Infrastructure Engineer",
    company: "Digital Ocean",
    portal: "Glassdoor",
    country: "Brasil",
    countryFlag: "🇧🇷",
    date: "29/09/2025 15:20",
    status: "Entrevista",
  },
  {
    id: 28,
    title: "Technical Writer",
    company: "MongoDB",
    portal: "LinkedIn",
    country: "Uruguay",
    countryFlag: "🇺🇾",
    date: "29/09/2025 14:15",
    status: "Postulados",
  },
  {
    id: 29,
    title: "Release Manager",
    company: "Atlassian",
    portal: "Bumeran",
    country: "México",
    countryFlag: "🇲🇽",
    date: "29/09/2025 13:10",
    status: "Rechazado",
  },
  {
    id: 30,
    title: "Solutions Architect",
    company: "Salesforce",
    portal: "LinkedIn",
    country: "Chile",
    countryFlag: "🇨🇱",
    date: "29/09/2025 12:05",
    status: "Postulados",
  },
]

const portalOptions = [
  { value: "all", label: "Todos los portales" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "bumeran", label: "Bumeran" },
  { value: "zonajobs", label: "Zonajobs" },
  { value: "glassdoor", label: "Glassdoor" },
]

const employmentTypeOptions = [
  { value: "all", label: "Todos los tipos" },
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contrato" },
]

const statusOptions = [
  { value: "Postulados", label: "Postulados" },
  { value: "En revisión", label: "En revisión" },
  { value: "Entrevista", label: "Entrevista" },
  { value: "Rechazado", label: "Rechazado" },
  { value: "Aceptado", label: "Aceptado" },
]

export default function AppliedJobsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPortal, setSelectedPortal] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const getPortalIcon = (portal: string) => {
    return <BsLinkedin size={24} color="#0077B5" />
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Postulados":
        return styles.statusPosted
      case "En revisión":
        return styles.statusReview
      case "Entrevista":
        return styles.statusInterview
      case "Rechazado":
        return styles.statusRejected
      case "Aceptado":
        return styles.statusAccepted
      default:
        return styles.statusPosted
    }
  }

  // Paginación
  const totalPages = Math.ceil(mockJobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentJobs = mockJobs.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start)
    setEndDate(end)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Ofertas Aplicadas</h1>
      </div>

      {/* Filtros */}
      <div className={styles.filtersCard}>
        <div className={styles.filters}>
          <div className={styles.searchInput}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.search}
            />
          </div>

          <Select
            options={portalOptions}
            value={selectedPortal}
            onChange={setSelectedPortal}
            placeholder="Portal de empleo"
          />

          <Select
            options={employmentTypeOptions}
            value={selectedType}
            onChange={setSelectedType}
            placeholder="Tipo de empleo"
          />

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateRangeChange}
            placeholder="dd/mm/aaa"
          />

          <Button variant="primary" size="medium">
            Filtrar
          </Button>

          <button className={styles.clearButton}>
            <FiX size={20} />
          </button>
        </div>
      </div>

      {/* Tabla */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
          <div className={styles.columnCompany}>Empresa</div>
          <div className={styles.columnPortal}>Portal</div>
          <div className={styles.columnCountry}>País</div>
          <div className={styles.columnDate}>Fecha</div>
          <div className={styles.columnStatus}>Estado</div>
        </div>

          <div className={styles.tableBody}>
            {currentJobs.map((job) => (
              <div key={job.id} className={styles.tableRow}>
                <div className={styles.columnCompany}>
                <div className={styles.companyInfo}>
                  <div className={styles.companyIcon}>
                    <FiSearch size={20} />
                  </div>
                  <div>
                    <div className={styles.jobTitle}>{job.title}</div>
                    <div className={styles.companyName}>{job.company}</div>
                  </div>
                </div>
              </div>

              <div className={styles.columnPortal}>{getPortalIcon(job.portal)}</div>

              <div className={styles.columnCountry}>
                <span className={styles.flag}>{job.countryFlag}</span>
              </div>

              <div className={styles.columnDate}>
                <FiCalendar size={16} className={styles.dateIconSmall} />
                <span>{job.date}</span>
              </div>

              <div className={styles.columnStatus}>
                <div className={`${styles.statusBadge} ${getStatusClass(job.status)}`}>
                  {job.status}
                  <FiChevronDown size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </div>
  )
}
