"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  FiSearch,
  FiMapPin,
  FiClock,
  FiBriefcase,
  FiUsers,
  FiExternalLink,
  FiDollarSign,
  FiGlobe,
  FiChevronRight,
  FiX,
  FiFilter,
  FiMonitor,
} from "react-icons/fi"
import { FaLinkedin } from "react-icons/fa"
import { SiIndeed, SiGlassdoor, SiTeamviewer } from "react-icons/si"
import { IoLogoGoogle } from "react-icons/io5"
import { Button } from "@/components/UI/Button/Button"
import styles from "./job-offers.module.css"

interface JobOffer {
  id: number
  title: string
  company: string
  company_logo: string | null
  company_industry: string
  company_employees_count: string
  company_followers: number
  company_url: string
  offer_location: string
  countryFlag: string
  modality: string
  work_schedule_type: string
  salary: string
  posted_time_ago: string
  applications_count: number
  easy_apply: boolean
  portal: string
  redirect_portal: string | null
  offer_url: string
  job_description: string
  skills: string[]
  tech_stack: string[]
  hiring_team: Array<{ name: string; profile_url?: string }>
  scraped_at: string
}

const portalConfig: Record<string, { icon: ReactNode; color: string; bg: string }> = {
  LinkedIn: { icon: <FaLinkedin size={16} />, color: "#0077B5", bg: "#E8F4FD" },
  Indeed: { icon: <SiIndeed size={16} />, color: "#2164F3", bg: "#E8EFFE" },
  Glassdoor: { icon: <SiGlassdoor size={16} />, color: "#0CAA41", bg: "#E6F9ED" },
  "Google Jobs": { icon: <IoLogoGoogle size={16} />, color: "#4285F4", bg: "#E8F0FE" },
  Teamtailor: { icon: <SiTeamviewer size={14} />, color: "#E91E63", bg: "#FCE4EC" },
}

// TODO: reemplazar por API real cuando el backend esté listo.
const mockOffers: JobOffer[] = [
  {
    id: 1,
    title: "Junior Software Engineer (LATAM)",
    company: "Sezzle",
    company_logo: null,
    company_industry: "Servicios financieros",
    company_employees_count: "201-500 empleados",
    company_followers: 80545,
    company_url: "https://www.linkedin.com/company/sezzle",
    offer_location: "America Latina",
    countryFlag: "🌎",
    modality: "Remoto",
    work_schedule_type: "Jornada completa",
    salary: "$1,500 - $2,700/mes",
    posted_time_ago: "Hace 4 horas",
    applications_count: 100,
    easy_apply: true,
    portal: "LinkedIn",
    redirect_portal: null,
    offer_url: "https://www.linkedin.com/jobs/view/4229334006/",
    job_description:
      "Con la mision de empoderar financieramente a la proxima generacion, Sezzle esta revolucionando la experiencia de compra. Buscamos un Junior Software Engineer talentoso y motivado para unirse a nuestro equipo de desarrollo. Responsabilidades incluyen disenar, desarrollar y mantener software de alta calidad, participar en revisiones de codigo y colaborar con equipos multifuncionales.",
    skills: ["Python", "AWS", "PostgreSQL", "Django"],
    tech_stack: ["Python", "Django", "PostgreSQL", "AWS", "Docker"],
    hiring_team: [{ name: "Fernando Sanches", profile_url: "https://linkedin.com/in/fernandosanches" }],
    scraped_at: "2025-12-20",
  },
  {
    id: 2,
    title: "Senior Frontend Developer - React",
    company: "Spotify",
    company_logo: null,
    company_industry: "Entretenimiento / Streaming",
    company_employees_count: "5,001-10,000 empleados",
    company_followers: 11000000,
    company_url: "https://www.linkedin.com/company/spotify",
    offer_location: "Espana",
    countryFlag: "🇪🇸",
    modality: "Hibrido",
    work_schedule_type: "Jornada completa",
    salary: "$4,000 - $6,500/mes",
    posted_time_ago: "Hace 2 dias",
    applications_count: 340,
    easy_apply: false,
    portal: "LinkedIn",
    redirect_portal: "Teamtailor",
    offer_url: "https://www.linkedin.com/jobs/view/4229334007/",
    job_description:
      "Estamos buscando un Senior Frontend Developer para unirse a nuestro equipo de producto. Seras responsable de disenar e implementar interfaces de usuario de alta calidad utilizando React y TypeScript. Trabajaras en colaboracion con disenadores, product managers e ingenieros backend para crear experiencias musicales de clase mundial.",
    skills: ["React", "TypeScript", "GraphQL", "CSS-in-JS"],
    tech_stack: ["React", "TypeScript", "Next.js", "GraphQL", "Styled Components"],
    hiring_team: [
      { name: "Elena Martinez", profile_url: "https://linkedin.com/in/elenamartinez" },
      { name: "James Wilson" },
    ],
    scraped_at: "2025-12-19",
  },
  {
    id: 3,
    title: "Full Stack Engineer",
    company: "Stripe",
    company_logo: null,
    company_industry: "Tecnologia financiera",
    company_employees_count: "1,001-5,000 empleados",
    company_followers: 950000,
    company_url: "https://stripe.com",
    offer_location: "Estados Unidos",
    countryFlag: "🇺🇸",
    modality: "Remoto",
    work_schedule_type: "Jornada completa",
    salary: "$8,000 - $12,000/mes",
    posted_time_ago: "Hace 1 dia",
    applications_count: 520,
    easy_apply: false,
    portal: "Indeed",
    redirect_portal: null,
    offer_url: "https://indeed.com/jobs/view/stripe-fullstack",
    job_description:
      "Stripe busca un Full Stack Engineer para construir las APIs de pago del futuro. Trabajaras con Ruby, JavaScript y Go para crear sistemas distribuidos de alta disponibilidad. Se requiere experiencia en sistemas de pagos, APIs REST y bases de datos distribuidas.",
    skills: ["Ruby", "JavaScript", "Go", "Distributed Systems"],
    tech_stack: ["Ruby", "Go", "React", "PostgreSQL", "Redis", "Kafka"],
    hiring_team: [{ name: "David Park" }],
    scraped_at: "2025-12-21",
  },
  {
    id: 4,
    title: "DevOps Engineer - Cloud Infrastructure",
    company: "Mercado Libre",
    company_logo: null,
    company_industry: "Comercio electronico",
    company_employees_count: "10,001+ empleados",
    company_followers: 5000000,
    company_url: "https://mercadolibre.com",
    offer_location: "Argentina",
    countryFlag: "🇦🇷",
    modality: "Hibrido",
    work_schedule_type: "Jornada completa",
    salary: "$3,500 - $5,500/mes",
    posted_time_ago: "Hace 6 horas",
    applications_count: 78,
    easy_apply: true,
    portal: "LinkedIn",
    redirect_portal: null,
    offer_url: "https://linkedin.com/jobs/view/meli-devops",
    job_description:
      "Sumate al equipo de infraestructura de Mercado Libre. Buscamos un DevOps Engineer con experiencia en AWS, Kubernetes y CI/CD para escalar nuestra plataforma que atiende a millones de usuarios en Latinoamerica.",
    skills: ["AWS", "Kubernetes", "Terraform", "CI/CD"],
    tech_stack: ["AWS", "Kubernetes", "Terraform", "Jenkins", "Docker", "Go"],
    hiring_team: [{ name: "Martin Gonzalez", profile_url: "https://linkedin.com/in/martingonzalez" }],
    scraped_at: "2025-12-22",
  },
  {
    id: 5,
    title: "Backend Developer - Node.js",
    company: "Globant",
    company_logo: null,
    company_industry: "Consultoria IT",
    company_employees_count: "10,001+ empleados",
    company_followers: 2000000,
    company_url: "https://globant.com",
    offer_location: "Colombia",
    countryFlag: "🇨🇴",
    modality: "Remoto",
    work_schedule_type: "Jornada completa",
    salary: "$2,800 - $4,200/mes",
    posted_time_ago: "Hace 3 dias",
    applications_count: 210,
    easy_apply: true,
    portal: "Glassdoor",
    redirect_portal: null,
    offer_url: "https://glassdoor.com/jobs/view/globant-backend",
    job_description:
      "Globant busca un Backend Developer con experiencia en Node.js para trabajar en proyectos de clientes Fortune 500. El candidato ideal tiene experiencia con APIs REST, microservicios y bases de datos NoSQL.",
    skills: ["Node.js", "Express", "MongoDB", "Microservices"],
    tech_stack: ["Node.js", "Express", "MongoDB", "Redis", "RabbitMQ"],
    hiring_team: [{ name: "Sofia Reyes" }],
    scraped_at: "2025-12-18",
  },
  {
    id: 6,
    title: "React Native Developer",
    company: "Rappi",
    company_logo: null,
    company_industry: "Delivery / Logistica",
    company_employees_count: "5,001-10,000 empleados",
    company_followers: 800000,
    company_url: "https://rappi.com",
    offer_location: "Mexico",
    countryFlag: "🇲🇽",
    modality: "Hibrido",
    work_schedule_type: "Jornada completa",
    salary: "$3,000 - $4,800/mes",
    posted_time_ago: "Hace 1 semana",
    applications_count: 165,
    easy_apply: false,
    portal: "Google Jobs",
    redirect_portal: "Teamtailor",
    offer_url: "https://careers.google.com/jobs/rappi-rn",
    job_description:
      "Buscamos un React Native Developer experimentado para desarrollar y mantener nuestras aplicaciones moviles que millones de usuarios utilizan diariamente. Trabajaras en features de real-time tracking, pagos y experiencia de usuario.",
    skills: ["React Native", "TypeScript", "Redux", "Mobile"],
    tech_stack: ["React Native", "TypeScript", "Redux", "Firebase", "GraphQL"],
    hiring_team: [{ name: "Carlos Mendoza", profile_url: "https://linkedin.com/in/carlosmendoza" }],
    scraped_at: "2025-12-15",
  },
  {
    id: 7,
    title: "Data Engineer - Big Data",
    company: "Nubank",
    company_logo: null,
    company_industry: "Fintech / Banca digital",
    company_employees_count: "5,001-10,000 empleados",
    company_followers: 1200000,
    company_url: "https://nubank.com.br",
    offer_location: "Brasil",
    countryFlag: "🇧🇷",
    modality: "Remoto",
    work_schedule_type: "Jornada completa",
    salary: "$4,500 - $7,000/mes",
    posted_time_ago: "Hace 5 horas",
    applications_count: 92,
    easy_apply: true,
    portal: "LinkedIn",
    redirect_portal: null,
    offer_url: "https://linkedin.com/jobs/view/nubank-data",
    job_description:
      "Nubank esta buscando un Data Engineer para disenar y construir pipelines de datos escalables. Trabajaras con Spark, Kafka y nuestro data lake en AWS para procesar millones de transacciones diarias y alimentar modelos de machine learning.",
    skills: ["Spark", "Kafka", "Python", "SQL", "AWS"],
    tech_stack: ["Apache Spark", "Kafka", "Python", "AWS", "Airflow", "dbt"],
    hiring_team: [{ name: "Lucas Oliveira" }],
    scraped_at: "2025-12-22",
  },
  {
    id: 8,
    title: "Senior iOS Developer",
    company: "Pedidos Ya",
    company_logo: null,
    company_industry: "Delivery / Tecnologia",
    company_employees_count: "1,001-5,000 empleados",
    company_followers: 450000,
    company_url: "https://pedidosya.com",
    offer_location: "Uruguay",
    countryFlag: "🇺🇾",
    modality: "Hibrido",
    work_schedule_type: "Jornada completa",
    salary: "$3,200 - $5,000/mes",
    posted_time_ago: "Hace 12 horas",
    applications_count: 45,
    easy_apply: false,
    portal: "Indeed",
    redirect_portal: "Teamtailor",
    offer_url: "https://indeed.com/jobs/view/pedidosya-ios",
    job_description:
      "Estamos buscando un Senior iOS Developer para liderar el desarrollo de nuestra app de delivery. El candidato ideal tiene experiencia con Swift, SwiftUI y arquitectura limpia. Seras parte del equipo mobile que impacta a millones de usuarios en Latinoamerica.",
    skills: ["Swift", "SwiftUI", "UIKit", "CI/CD"],
    tech_stack: ["Swift", "SwiftUI", "Combine", "CoreData", "Fastlane"],
    hiring_team: [
      { name: "Valentina Perez", profile_url: "https://linkedin.com/in/valentinaperez" },
      { name: "Diego Fernandez" },
    ],
    scraped_at: "2025-12-21",
  },
]

const allPortals = ["Todos", "LinkedIn", "Indeed", "Glassdoor", "Google Jobs"]
const allModalities = ["Todas", "Remoto", "Hibrido", "Presencial"]

export default function JobOffersPage() {
  const [search, setSearch] = useState("")
  const [selectedPortal, setSelectedPortal] = useState("Todos")
  const [selectedModality, setSelectedModality] = useState("Todas")
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(mockOffers[0] || null)
  const [showFilters, setShowFilters] = useState(false)

  const filteredOffers = useMemo(() => {
    return mockOffers.filter((offer) => {
      const matchesSearch =
        search === "" ||
        offer.title.toLowerCase().includes(search.toLowerCase()) ||
        offer.company.toLowerCase().includes(search.toLowerCase()) ||
        offer.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
      const matchesPortal = selectedPortal === "Todos" || offer.portal === selectedPortal
      const matchesModality = selectedModality === "Todas" || offer.modality === selectedModality
      return matchesSearch && matchesPortal && matchesModality
    })
  }, [search, selectedPortal, selectedModality])

  const portalCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const offer of mockOffers) {
      counts[offer.portal] = (counts[offer.portal] || 0) + 1
    }
    return counts
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Ofertas Laborales</h1>
          <p className={styles.heroSubtitle}>Todas tus ofertas centralizadas desde multiples portales en un solo lugar</p>
        </div>
        <div className={styles.portalLogos}>
          {Object.entries(portalConfig).map(([name, config]) => (
            <div key={name} className={styles.portalLogoChip} style={{ background: config.bg, color: config.color }}>
              {config.icon}
              <span>{name}</span>
              {portalCounts[name] ? <span className={styles.portalCount}>{portalCounts[name]}</span> : null}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <FiSearch size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por puesto, empresa o tecnologia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search ? (
            <button type="button" className={styles.clearSearch} onClick={() => setSearch("")}>
              <FiX size={16} />
            </button>
          ) : null}
        </div>

        <div className={styles.filterChips}>
          {allPortals.map((portal) => (
            <button
              key={portal}
              type="button"
              className={`${styles.filterChip} ${selectedPortal === portal ? styles.filterChipActive : ""}`}
              onClick={() => setSelectedPortal(portal)}
              style={
                selectedPortal === portal && portal !== "Todos"
                  ? {
                      background: portalConfig[portal]?.bg,
                      color: portalConfig[portal]?.color,
                      borderColor: portalConfig[portal]?.color,
                    }
                  : undefined
              }
            >
              {portal !== "Todos" ? portalConfig[portal]?.icon : null}
              {portal}
            </button>
          ))}
        </div>

        <button type="button" className={styles.moreFiltersBtn} onClick={() => setShowFilters((v) => !v)}>
          <FiFilter size={16} />
          Filtros
        </button>
      </div>

      {showFilters ? (
        <div className={styles.expandedFilters}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Modalidad</span>
            <div className={styles.filterOptions}>
              {allModalities.map((mod) => (
                <button
                  key={mod}
                  type="button"
                  className={`${styles.filterOption} ${selectedModality === mod ? styles.filterOptionActive : ""}`}
                  onClick={() => setSelectedModality(mod)}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.resultsInfo}>
        <span className={styles.resultsCount}>{filteredOffers.length} ofertas encontradas</span>
      </div>

      <div className={styles.splitPanel}>
        <div className={styles.listPanel}>
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className={`${styles.offerCard} ${selectedOffer?.id === offer.id ? styles.offerCardActive : ""}`}
              onClick={() => setSelectedOffer(offer)}
            >
              <div className={styles.offerCardHeader}>
                <div className={styles.companyAvatar}>{offer.company.charAt(0)}</div>
                <div className={styles.offerCardMeta}>
                  <h3 className={styles.offerCardTitle}>{offer.title}</h3>
                  <p className={styles.offerCardCompany}>{offer.company}</p>
                </div>
                <FiChevronRight size={18} className={styles.chevron} />
              </div>

              <div className={styles.offerCardTags}>
                <span className={styles.offerLocation}>
                  <FiMapPin size={12} />
                  {offer.offer_location} {offer.countryFlag}
                </span>
                <span className={styles.offerModality}>
                  <FiMonitor size={12} />
                  {offer.modality}
                </span>
                {offer.salary !== "No disponible" ? (
                  <span className={styles.offerSalary}>
                    <FiDollarSign size={12} />
                    {offer.salary}
                  </span>
                ) : null}
              </div>

              <div className={styles.offerCardFooter}>
                <div
                  className={styles.portalBadge}
                  style={{ background: portalConfig[offer.portal]?.bg, color: portalConfig[offer.portal]?.color }}
                >
                  {portalConfig[offer.portal]?.icon}
                  <span>{offer.portal}</span>
                </div>
                {offer.redirect_portal ? (
                  <>
                    <span className={styles.redirectArrow}>{">"}</span>
                    <div
                      className={styles.portalBadge}
                      style={{
                        background: portalConfig[offer.redirect_portal]?.bg || "#f3f4f6",
                        color: portalConfig[offer.redirect_portal]?.color || "#666",
                      }}
                    >
                      {portalConfig[offer.redirect_portal]?.icon}
                      <span>{offer.redirect_portal}</span>
                    </div>
                  </>
                ) : null}
                <span className={styles.offerTime}>
                  <FiClock size={12} />
                  {offer.posted_time_ago}
                </span>
              </div>
            </div>
          ))}

          {filteredOffers.length === 0 ? (
            <div className={styles.emptyList}>
              <FiBriefcase size={40} />
              <p>No se encontraron ofertas con los filtros seleccionados</p>
            </div>
          ) : null}
        </div>

        <div className={styles.detailPanel}>
          {selectedOffer ? (
            <>
              <div className={styles.detailHeader}>
                <div className={styles.detailHeaderTop}>
                  <div className={styles.detailAvatar}>{selectedOffer.company.charAt(0)}</div>
                  <div className={styles.detailHeaderInfo}>
                    <h2 className={styles.detailTitle}>{selectedOffer.title}</h2>
                    <a
                      href={selectedOffer.company_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.detailCompanyLink}
                    >
                      {selectedOffer.company}
                      <FiExternalLink size={14} />
                    </a>
                  </div>
                </div>

                <div className={styles.detailActions}>
                  <a href={selectedOffer.offer_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="primary" size="small">
                      <FiExternalLink size={16} />
                      Ver en {selectedOffer.redirect_portal || selectedOffer.portal}
                    </Button>
                  </a>
                  {selectedOffer.easy_apply ? <span className={styles.easyApplyBadge}>Easy Apply</span> : null}
                </div>
              </div>

              {selectedOffer.redirect_portal ? (
                <div className={styles.portalFlow}>
                  <FiGlobe size={14} />
                  <span>Encontrada en</span>
                  <strong style={{ color: portalConfig[selectedOffer.portal]?.color }}>{selectedOffer.portal}</strong>
                  <span className={styles.flowArrow}>{">"}</span>
                  <span>Se aplica en</span>
                  <strong style={{ color: portalConfig[selectedOffer.redirect_portal]?.color || "#666" }}>
                    {selectedOffer.redirect_portal}
                  </strong>
                </div>
              ) : null}

              <div className={styles.detailBody}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <FiMapPin size={16} className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>Ubicacion</span>
                      <span className={styles.infoValue}>
                        {selectedOffer.offer_location} {selectedOffer.countryFlag}
                      </span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <FiMonitor size={16} className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>Modalidad</span>
                      <span className={styles.infoValue}>{selectedOffer.modality}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <FiBriefcase size={16} className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>Jornada</span>
                      <span className={styles.infoValue}>{selectedOffer.work_schedule_type}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <FiDollarSign size={16} className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>Salario</span>
                      <span className={styles.infoValue}>{selectedOffer.salary}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <FiUsers size={16} className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>Postulantes</span>
                      <span className={styles.infoValue}>{selectedOffer.applications_count} aplicaciones</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <FiClock size={16} className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>Publicada</span>
                      <span className={styles.infoValue}>{selectedOffer.posted_time_ago}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Empresa</h3>
                  <div className={styles.companyDetail}>
                    <div className={styles.companyDetailRow}>
                      <span className={styles.companyDetailLabel}>Industria</span>
                      <span>{selectedOffer.company_industry}</span>
                    </div>
                    <div className={styles.companyDetailRow}>
                      <span className={styles.companyDetailLabel}>Tamano</span>
                      <span>{selectedOffer.company_employees_count}</span>
                    </div>
                    <div className={styles.companyDetailRow}>
                      <span className={styles.companyDetailLabel}>Seguidores</span>
                      <span>{selectedOffer.company_followers.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {selectedOffer.skills?.length ? (
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Skills requeridas</h3>
                    <div className={styles.skillTags}>
                      {selectedOffer.skills.map((skill) => (
                        <span key={skill} className={styles.skillTag}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedOffer.tech_stack?.length ? (
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Stack tecnologico</h3>
                    <div className={styles.techTags}>
                      {selectedOffer.tech_stack.map((tech) => (
                        <span key={tech} className={styles.techTag}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Descripcion del puesto</h3>
                  <p className={styles.description}>{selectedOffer.job_description}</p>
                </div>

                {selectedOffer.hiring_team?.length ? (
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Equipo de contratacion</h3>
                    <div className={styles.hiringTeam}>
                      {selectedOffer.hiring_team.map((member) => (
                        <div key={member.name} className={styles.teamMember}>
                          <div className={styles.teamMemberAvatar}>{member.name.charAt(0)}</div>
                          <div>
                            <span className={styles.teamMemberName}>{member.name}</span>
                            {member.profile_url ? (
                              <a
                                href={member.profile_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.teamMemberLink}
                              >
                                Ver perfil
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              <FiBriefcase size={48} />
              <h3>Selecciona una oferta</h3>
              <p>Haz click en una oferta de la lista para ver su detalle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

