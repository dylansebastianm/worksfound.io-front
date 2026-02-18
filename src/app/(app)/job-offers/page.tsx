"use client"

import { useEffect, useMemo, useState } from "react"
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
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { Alert } from "@/components/UI/Alert/Alert"
import { Pagination } from "@/components/UI/Pagination/Pagination"
import { getJobOffers } from "@/lib/jobOffers"
import type { JobOffer } from "@/types/jobOffers"
import styles from "./job-offers.module.css"

type ApplyPortalKey = "Teamtailor" | "AshbyHQ" | "BreezyHR" | "JobDiva" | "Greenhouse"

const applyPortalImageMap: Record<ApplyPortalKey, { src: string; alt: string }> = {
  Teamtailor: { src: "/Images/ATS/teamtailor.png", alt: "Teamtailor" },
  AshbyHQ: { src: "/Images/ATS/ashbyhq.png", alt: "AshbyHQ" },
  BreezyHR: { src: "/Images/ATS/breezyhr.png", alt: "BreezyHR" },
  JobDiva: { src: "/Images/ATS/jobdiva.png", alt: "JobDiva" },
  Greenhouse: { src: "/Images/ATS/greenhouse.png", alt: "Greenhouse" },
}

// Orden fijo: son los ATS donde hoy podemos postular (aunque haya 0 ofertas en la vista).
const APPLY_PORTAL_ORDER: ApplyPortalKey[] = ["BreezyHR", "Greenhouse", "JobDiva", "Teamtailor", "AshbyHQ"]

const normalizeApplyPortal = (offer: JobOffer): ApplyPortalKey | null => {
  // Preferimos el portal donde realmente se aplica (redirect).
  const p = (offer.redirect_portal || "").trim()
  if (!p) return null
  const k = p.toLowerCase().replace(/\s+/g, "")
  if (k.includes("teamtailor")) return "Teamtailor"
  if (k.includes("ashby")) return "AshbyHQ"
  if (k.includes("breezy")) return "BreezyHR"
  if (k.includes("jobdiva")) return "JobDiva"
  if (k.includes("greenhouse")) return "Greenhouse"
  return null
}

const portalConfig: Record<string, { icon: ReactNode; color: string; bg: string }> = {
  LinkedIn: { icon: <FaLinkedin size={16} />, color: "#0077B5", bg: "#E8F4FD" },
  Indeed: { icon: <SiIndeed size={16} />, color: "#2164F3", bg: "#E8EFFE" },
  Glassdoor: { icon: <SiGlassdoor size={16} />, color: "#0CAA41", bg: "#E6F9ED" },
  "Google Jobs": { icon: <IoLogoGoogle size={16} />, color: "#4285F4", bg: "#E8F0FE" },
  Teamtailor: { icon: <SiTeamviewer size={14} />, color: "#E91E63", bg: "#FCE4EC" },
}

const portalBadgeStyle: Record<string, { color: string; bg: string; border?: string }> = {
  LinkedIn: { color: "#0077B5", bg: "#E8F4FD", border: "#CFE8FA" },
  Indeed: { color: "#2164F3", bg: "#E8EFFE", border: "#C9D9FD" },
  Glassdoor: { color: "#0CAA41", bg: "#E6F9ED", border: "#C7F1D6" },
  "Google Jobs": { color: "#4285F4", bg: "#E8F0FE", border: "#C8DAFD" },
  Teamtailor: { color: "#E91E63", bg: "#FCE4EC", border: "#F8BBD0" },
  AshbyHQ: { color: "#111827", bg: "#F3F4F6", border: "#E5E7EB" },
  BreezyHR: { color: "#6D28D9", bg: "#EDE9FE", border: "#D9D6FE" },
  JobDiva: { color: "#2563EB", bg: "#EFF6FF", border: "#CFE2FF" },
  Greenhouse: { color: "#16A34A", bg: "#ECFDF5", border: "#CFF7E5" },
}

const resolveBadgeRender = (
  name: string,
): { label: string; icon?: ReactNode; imgSrc?: string; style?: { color?: string; background?: string; border?: string } } => {
  const label = name || "Portal"
  const applyKey = (["Teamtailor", "AshbyHQ", "BreezyHR", "JobDiva", "Greenhouse"] as string[]).includes(label)
    ? (label as ApplyPortalKey)
    : null
  if (applyKey) {
    const s = portalBadgeStyle[applyKey] || { color: "#666", bg: "#f3f4f6", border: "#e5e7eb" }
    return { label: applyPortalImageMap[applyKey].alt, imgSrc: applyPortalImageMap[applyKey].src, style: { color: s.color, background: s.bg, border: s.border } }
  }
  const cfg = portalConfig[label]
  const s = portalBadgeStyle[label] || (cfg ? { color: cfg.color, bg: cfg.bg, border: "#e5e7eb" } : { color: "#666", bg: "#f3f4f6", border: "#e5e7eb" })
  return { label, icon: cfg?.icon, style: { color: s.color, background: s.bg, border: s.border } }
}

const allModalities = ["Todas", "Remoto", "Hibrido", "Presencial"]

export default function JobOffersPage() {
  const [offers, setOffers] = useState<JobOffer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20

  const [search, setSearch] = useState("")
  const [selectedPortal, setSelectedPortal] = useState("Todos")
  const [selectedModality, setSelectedModality] = useState("Todas")
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setAlert(null)
      const res = await getJobOffers({
        q: search || undefined,
        portal: selectedPortal !== "Todos" ? selectedPortal : undefined,
        modality: selectedModality !== "Todas" ? selectedModality : undefined,
        page: currentPage,
        limit: itemsPerPage,
      })
      const offersArr: JobOffer[] = res.success && Array.isArray(res.offers) ? res.offers : []
      if (res.success && Array.isArray(res.offers)) {
        setOffers(offersArr)
        setTotalPages(res.pagination?.total_pages || 0)
        setTotalCount(res.pagination?.total || 0)
        setSelectedOffer((prev) => {
          if (prev && offersArr.some((o) => o.id === prev.id)) return prev
          return offersArr[0] || null
        })
      } else {
        setOffers([])
        setTotalPages(0)
        setTotalCount(0)
        setSelectedOffer(null)
        setAlert({ status: "error", message: res.error || "Error al cargar ofertas" })
      }
      setIsLoading(false)
    }
    load()
  }, [search, selectedPortal, selectedModality, currentPage])

  const filteredOffers = useMemo(() => {
    // El backend ya filtra por q/portal/modality. En el cliente solo usamos el resultado paginado.
    return offers
  }, [offers])

  const portalCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const offer of offers) {
      const k = normalizeApplyPortal(offer)
      if (!k) continue
      counts[k] = (counts[k] || 0) + 1
    }
    return counts
  }, [offers])

  return (
    <div className={styles.container}>
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Ofertas Laborales</h1>
          <p className={styles.heroSubtitle}>Todas tus ofertas centralizadas desde multiples portales en un solo lugar</p>
        </div>
        <div className={styles.portalLogos}>
          {APPLY_PORTAL_ORDER.map((name) => {
            const img = applyPortalImageMap[name]
            const count = portalCounts[name] || 0
            return (
              <div key={name} className={styles.portalLogoChip}>
                <img className={styles.portalLogoImg} src={img.src} alt={img.alt} title={img.alt} />
                <span>{img.alt}</span>
                {count ? <span className={styles.portalCount}>{count}</span> : null}
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <FiSearch size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por puesto, empresa o tecnologia..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.searchInput}
          />
          {search ? (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => {
                setSearch("")
                setCurrentPage(1)
              }}
            >
              <FiX size={16} />
            </button>
          ) : null}
        </div>

        <div className={styles.filterChips}>
          {(["Todos", ...APPLY_PORTAL_ORDER] as Array<string | ApplyPortalKey>).map((portal) => (
            <button
              key={portal}
              type="button"
              className={`${styles.filterChip} ${selectedPortal === portal ? styles.filterChipActive : ""}`}
              onClick={() => {
                setSelectedPortal(portal)
                setCurrentPage(1)
              }}
            >
              {portal !== "Todos" ? (
                <img
                  className={styles.filterPortalImg}
                  src={applyPortalImageMap[portal as ApplyPortalKey].src}
                  alt={applyPortalImageMap[portal as ApplyPortalKey].alt}
                />
              ) : null}
              {portal === "Todos" ? "Todos" : applyPortalImageMap[portal as ApplyPortalKey].alt}
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
                  onClick={() => {
                    setSelectedModality(mod)
                    setCurrentPage(1)
                  }}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.resultsInfo}>
        <span className={styles.resultsCount}>{totalCount || filteredOffers.length} ofertas encontradas</span>
      </div>

      {alert ? <Alert status={alert.status} message={alert.message} onClose={() => setAlert(null)} /> : null}
      {isLoading ? (
        <div style={{ padding: "1rem" }}>
          <LoadingSpinner />
        </div>
      ) : null}

      <div className={styles.splitPanel}>
        <div className={styles.listColumn}>
          <div className={styles.listPanel}>
          {filteredOffers.map((offer) => (
              // Badges: usar estilos/logos por portal como "Ofertas aplicadas".
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
                {(() => {
                  const b = resolveBadgeRender(offer.portal)
                  return (
                    <div
                      className={styles.portalBadge}
                      style={{ background: b.style?.background, color: b.style?.color, border: b.style?.border ? `1px solid ${b.style?.border}` : undefined }}
                    >
                      {b.imgSrc ? <img className={styles.portalBadgeImg} src={b.imgSrc} alt={b.label} /> : null}
                      {b.icon}
                      <span>{b.label}</span>
                    </div>
                  )
                })()}
                {offer.redirect_portal && offer.redirect_portal !== offer.portal ? (
                  <>
                    <span className={styles.redirectArrow}>{">"}</span>
                    {(() => {
                      const b = resolveBadgeRender(offer.redirect_portal || "")
                      return (
                        <div
                          className={styles.portalBadge}
                          style={{ background: b.style?.background, color: b.style?.color, border: b.style?.border ? `1px solid ${b.style?.border}` : undefined }}
                        >
                          {b.imgSrc ? <img className={styles.portalBadgeImg} src={b.imgSrc} alt={b.label} /> : null}
                          {b.icon}
                          <span>{b.label}</span>
                        </div>
                      )
                    })()}
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

          {totalPages > 1 ? (
            <div className={styles.paginationWrap}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => {
                  const next = Math.max(1, Math.min(totalPages, p))
                  setCurrentPage(next)
                }}
              />
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
                  <a
                    href={(selectedOffer.redirect_url || selectedOffer.offer_url) as string}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="primary" size="small">
                      <FiExternalLink size={16} />
                      Ver en{" "}
                      {selectedOffer.redirect_portal && selectedOffer.redirect_portal !== selectedOffer.portal
                        ? selectedOffer.redirect_portal
                        : selectedOffer.portal}
                    </Button>
                  </a>
                  {selectedOffer.easy_apply ? <span className={styles.easyApplyBadge}>Easy Apply</span> : null}
                </div>
              </div>

              {selectedOffer.redirect_portal && selectedOffer.redirect_portal !== selectedOffer.portal ? (
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
                  <div className={styles.descriptionBlock}>
                    <div className={styles.detailLabel}>Descripción del Puesto</div>
                    <div
                      className={styles.description}
                      // Mantener consistencia con "Ofertas aplicadas": render del HTML tal cual.
                      dangerouslySetInnerHTML={{ __html: selectedOffer.job_description || "" }}
                    />
                  </div>
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

