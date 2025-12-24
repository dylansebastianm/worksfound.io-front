"use client"

import {
  FiX,
  FiUsers,
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiClock,
  FiCalendar,
  FiExternalLink,
  FiGlobe,
  FiTrendingUp,
  FiMessageSquare,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi"
import { HiOfficeBuilding } from "react-icons/hi"
import { BsLinkedin } from "react-icons/bs"
import { SiOpenai } from "react-icons/si"
import styles from "./JobDetailModal.module.css"

interface JobDetailModalProps {
  job: {
    id: number
    title: string
    company: string
    portal: string
    country: string
    countryFlag: string
    date: string
    status: string
    applicants?: number
    workMode?: string
    workType?: string
    salary?: string
    description?: string
    jobUrl?: string
    companyUrl?: string
    companyFollowers?: number
    companyCountry?: string
    evaluationTime?: string
    postedAgo?: string
    applications?: number
    recruiterTeam?: Array<{
      name: string
      position: string
      profileUrl?: string
    }>
    industry?: string
    companySize?: string
    skills?: string[]
    techStack?: string[]
    englishRequired?: boolean
    questionsAndAnswers?: Array<{
      question: string
      answer: string
    }>
  }
  onClose: () => void
}

export default function JobDetailModal({ job, onClose }: JobDetailModalProps) {
  const userPreferences = {
    positiveKeywords: ["React", "TypeScript", "Frontend", "Remote"],
    negativeKeywords: ["PHP", "WordPress"],
    countries: ["Estados Unidos", "Argentina", "España"],
    workType: "Full Time",
    workMode: "Remoto",
    techStack: ["React", "TypeScript", "Node.js", "Next.js"],
    englishLevel: "C1",
    requiresEnglish: true,
  }

  const calculateMatches = () => {
    const matches = {
      keywords: {
        positive: [] as string[],
        negative: [] as string[],
      },
      country: false,
      workType: false,
      workMode: false,
      techStack: [] as string[],
      englishRequirement: false,
    }

    // Check positive keywords in job title and description
    const jobText = `${job.title} ${job.description || ""}`.toLowerCase()
    matches.keywords.positive = userPreferences.positiveKeywords.filter((keyword) =>
      jobText.includes(keyword.toLowerCase()),
    )

    // Check negative keywords (should NOT be present)
    matches.keywords.negative = userPreferences.negativeKeywords.filter((keyword) =>
      jobText.includes(keyword.toLowerCase()),
    )

    // Check country match
    matches.country = userPreferences.countries.some(
      (country) => country.toLowerCase() === (job.companyCountry || job.country).toLowerCase(),
    )

    // Check work type match
    matches.workType = job.workType?.toLowerCase().includes(userPreferences.workType.toLowerCase()) || false

    // Check work mode match
    matches.workMode = job.workMode?.toLowerCase().includes(userPreferences.workMode.toLowerCase()) || false

    // Check tech stack overlap
    if (job.techStack) {
      matches.techStack = job.techStack.filter((tech) =>
        userPreferences.techStack.some((userTech) => userTech.toLowerCase() === tech.toLowerCase()),
      )
    }

    // Check english requirement
    matches.englishRequirement =
      (job.englishRequired && userPreferences.englishLevel >= "B2") ||
      (!job.englishRequired && !userPreferences.requiresEnglish) ||
      !job.englishRequired

    return matches
  }

  const matches = calculateMatches()

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{job.title}</h2>
          <button className={styles.modalClose} onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <section className={styles.modalSection}>
            <h3 className={styles.sectionTitle}>Coincidencias con tu Perfil</h3>
            <div className={styles.matchesGrid}>
              {/* Positive Keywords Match */}
              <div className={styles.matchItem}>
                <div className={styles.matchHeader}>
                  {matches.keywords.positive.length > 0 ? (
                    <FiCheckCircle className={styles.matchIconSuccess} />
                  ) : (
                    <FiXCircle className={styles.matchIconWarning} />
                  )}
                  <span className={styles.matchLabel}>Palabras Clave Positivas</span>
                </div>
                <div className={styles.matchValue}>
                  {matches.keywords.positive.length > 0 ? (
                    <div className={styles.tagsList}>
                      {matches.keywords.positive.map((keyword, index) => (
                        <span key={index} className={styles.tagMatch}>
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className={styles.matchNoMatch}>No se encontraron coincidencias</span>
                  )}
                </div>
              </div>

              {/* Negative Keywords Check */}
              {matches.keywords.negative.length > 0 && (
                <div className={styles.matchItem}>
                  <div className={styles.matchHeader}>
                    <FiXCircle className={styles.matchIconError} />
                    <span className={styles.matchLabel}>Palabras Clave Negativas Detectadas</span>
                  </div>
                  <div className={styles.matchValue}>
                    <div className={styles.tagsList}>
                      {matches.keywords.negative.map((keyword, index) => (
                        <span key={index} className={styles.tagNegative}>
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Country Match */}
              <div className={styles.matchItem}>
                <div className={styles.matchHeader}>
                  {matches.country ? (
                    <FiCheckCircle className={styles.matchIconSuccess} />
                  ) : (
                    <FiXCircle className={styles.matchIconWarning} />
                  )}
                  <span className={styles.matchLabel}>País</span>
                </div>
                <div className={styles.matchValue}>
                  {matches.country ? (
                    <span className={styles.matchSuccess}>
                      {job.companyCountry || job.country} está en tu lista de preferencias
                    </span>
                  ) : (
                    <span className={styles.matchWarning}>
                      {job.companyCountry || job.country} No está en tu lista de preferencias
                    </span>
                  )}
                </div>
              </div>

              {/* Work Type Match */}
              <div className={styles.matchItem}>
                <div className={styles.matchHeader}>
                  {matches.workType ? (
                    <FiCheckCircle className={styles.matchIconSuccess} />
                  ) : (
                    <FiXCircle className={styles.matchIconWarning} />
                  )}
                  <span className={styles.matchLabel}>Tipo de Empleo</span>
                </div>
                <div className={styles.matchValue}>
                  {matches.workType ? (
                    <span className={styles.matchSuccess}>Coincide con tu preferencia ({job.workType})</span>
                  ) : (
                    <span className={styles.matchWarning}>
                      No coincide (buscas {userPreferences.workType}, oferta: {job.workType || "No especificado"})
                    </span>
                  )}
                </div>
              </div>

              {/* Work Mode Match */}
              <div className={styles.matchItem}>
                <div className={styles.matchHeader}>
                  {matches.workMode ? (
                    <FiCheckCircle className={styles.matchIconSuccess} />
                  ) : (
                    <FiXCircle className={styles.matchIconWarning} />
                  )}
                  <span className={styles.matchLabel}>Modalidad de Trabajo</span>
                </div>
                <div className={styles.matchValue}>
                  {matches.workMode ? (
                    <span className={styles.matchSuccess}>Coincide con tu preferencia ({job.workMode})</span>
                  ) : (
                    <span className={styles.matchWarning}>
                      No coincide (buscas {userPreferences.workMode}, oferta: {job.workMode || "No especificado"})
                    </span>
                  )}
                </div>
              </div>

              {/* Tech Stack Match */}
              {job.techStack && job.techStack.length > 0 && (
                <div className={styles.matchItem}>
                  <div className={styles.matchHeader}>
                    {matches.techStack.length > 0 ? (
                      <FiCheckCircle className={styles.matchIconSuccess} />
                    ) : (
                      <FiXCircle className={styles.matchIconWarning} />
                    )}
                    <span className={styles.matchLabel}>Stack Tecnológico</span>
                  </div>
                  <div className={styles.matchValue}>
                    {matches.techStack.length > 0 ? (
                      <div className={styles.tagsList}>
                        {matches.techStack.map((tech, index) => (
                          <span key={index} className={styles.tagMatch}>
                            {tech}
                          </span>
                        ))}
                        <span className={styles.matchPercentage}>
                          {Math.round((matches.techStack.length / job.techStack!.length) * 100)}% de coincidencia
                        </span>
                      </div>
                    ) : (
                      <span className={styles.matchNoMatch}>No se encontraron tecnologías en común</span>
                    )}
                  </div>
                </div>
              )}

              {/* English Requirement Match */}
              <div className={styles.matchItem}>
                <div className={styles.matchHeader}>
                  {matches.englishRequirement ? (
                    <FiCheckCircle className={styles.matchIconSuccess} />
                  ) : (
                    <FiXCircle className={styles.matchIconWarning} />
                  )}
                  <span className={styles.matchLabel}>Requisito de Inglés</span>
                </div>
                <div className={styles.matchValue}>
                  {job.englishRequired ? (
                    matches.englishRequirement ? (
                      <span className={styles.matchSuccess}>
                        Tu nivel ({userPreferences.englishLevel}) cumple con el requisito
                      </span>
                    ) : (
                      <span className={styles.matchWarning}>Se requiere inglés avanzado (B2+)</span>
                    )
                  ) : (
                    <span className={styles.matchSuccess}>No se requiere inglés</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.modalSection}>
            <h3 className={styles.sectionTitle}>Información de la Oferta</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <FiUsers className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>Personas que Solicitaron</div>
                  <div className={styles.detailValue}>
                    {job.applicants ? `${job.applicants} postulantes` : "No disponible"}
                  </div>
                </div>
              </div>

              <div className={styles.detailItem}>
                <FiMapPin className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>Modalidad</div>
                  <div className={styles.detailValue}>{job.workMode || "No disponible"}</div>
                </div>
              </div>

              <div className={styles.detailItem}>
                <FiBriefcase className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>Tipo de Jornada</div>
                  <div className={styles.detailValue}>{job.workType || "No disponible"}</div>
                </div>
              </div>

              <div className={styles.detailItem}>
                <FiDollarSign className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>Salario</div>
                  <div className={styles.detailValue}>{job.salary || "No disponible"}</div>
                </div>
              </div>

              <div className={styles.detailItem}>
                <FiClock className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>Tiempo de Evaluación</div>
                  <div className={styles.detailValue}>{job.evaluationTime || "No disponible"}</div>
                </div>
              </div>

              <div className={styles.detailItem}>
                <FiCalendar className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>Publicado Hace</div>
                  <div className={styles.detailValue}>{job.postedAgo || "No disponible"}</div>
                </div>
              </div>

              {job.jobUrl && (
                <div className={styles.detailItem}>
                  <FiExternalLink className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>URL de Oferta</div>
                    <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" className={styles.detailLink}>
                      Ver oferta original
                    </a>
                  </div>
                </div>
              )}

              <div className={styles.detailItem}>
                <FiGlobe className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>Inglés Requerido</div>
                  <div className={styles.detailValue}>
                    {job.englishRequired !== undefined ? (job.englishRequired ? "Sí" : "No") : "No disponible"}
                  </div>
                </div>
              </div>
            </div>

            {job.description && (
              <div className={styles.descriptionBlock}>
                <div className={styles.detailLabel}>Descripción del Puesto</div>
                <div 
                  className={styles.description} 
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </div>
            )}

            {job.skills && job.skills.length > 0 && (
              <div className={styles.tagsBlock}>
                <div className={styles.detailLabel}>Aptitudes</div>
                <div className={styles.tagsList}>
                  {job.skills.map((skill, index) => (
                    <span key={index} className={styles.tag}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.techStack && job.techStack.length > 0 && (
              <div className={styles.tagsBlock}>
                <div className={styles.detailLabel}>Stack Solicitado</div>
                <div className={styles.tagsList}>
                  {job.techStack.map((tech, index) => (
                    <span key={index} className={styles.tag}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className={styles.modalSection}>
            <h3 className={styles.sectionTitle}>Información de la Empresa</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <HiOfficeBuilding className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>Nombre de Empresa</div>
                  <div className={styles.detailValue}>{job.company}</div>
                </div>
              </div>

              <div className={styles.detailItem}>
                <FiGlobe className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>País de la Empresa</div>
                  <div className={styles.detailValue}>
                    {job.companyCountry ? `${job.countryFlag} ${job.companyCountry}` : job.country}
                  </div>
                </div>
              </div>

              <div className={styles.detailItem}>
                <FiUsers className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>Seguidores</div>
                  <div className={styles.detailValue}>
                    {job.companyFollowers ? job.companyFollowers.toLocaleString() : "No disponible"}
                  </div>
                </div>
              </div>

              <div className={styles.detailItem}>
                <FiBriefcase className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>Industria</div>
                  <div className={styles.detailValue}>{job.industry || "No disponible"}</div>
                </div>
              </div>

              <div className={styles.detailItem}>
                <FiTrendingUp className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>Cantidad de Empleados</div>
                  <div className={styles.detailValue}>{job.companySize || "No disponible"}</div>
                </div>
              </div>

              {job.companyUrl && (
                <div className={styles.detailItem}>
                  <FiExternalLink className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>URL de Empresa</div>
                    <a href={job.companyUrl} target="_blank" rel="noopener noreferrer" className={styles.detailLink}>
                      Visitar sitio web
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className={styles.modalSection}>
            <h3 className={styles.sectionTitle}>Equipo de Reclutamiento</h3>
            {job.recruiterTeam && job.recruiterTeam.length > 0 ? (
              <div className={styles.recruiterList}>
                {job.recruiterTeam.map((recruiter, index) => (
                  <div key={index} className={styles.recruiterCard}>
                    <div className={styles.recruiterAvatar}>{recruiter.name.charAt(0)}</div>
                    <div className={styles.recruiterInfo}>
                      <div className={styles.recruiterName}>{recruiter.name}</div>
                      <div className={styles.recruiterPosition}>{recruiter.position}</div>
                      {recruiter.profileUrl && (
                        <a
                          href={recruiter.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.recruiterLink}
                        >
                          <BsLinkedin size={16} />
                          Ver perfil
                        </a>
                      )}
                      {!recruiter.profileUrl && (
                        <div className={styles.detailValueDisabled}>URL de perfil no disponible</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No hay información disponible del equipo de reclutamiento</div>
            )}
          </section>

          {job.questionsAndAnswers && job.questionsAndAnswers.length > 0 && (
            <section className={styles.modalSection}>
              <h3 className={styles.sectionTitle}>Preguntas y Respuestas de la Aplicación</h3>
              <div className={styles.qaList}>
                {job.questionsAndAnswers.map((qa, index) => (
                  <div key={index} className={styles.qaItem}>
                    <div className={styles.qaQuestion}>
                      <FiMessageSquare className={styles.qaIcon} />
                      <div>
                        <div className={styles.qaLabel}>Pregunta {index + 1}</div>
                        <div className={styles.qaText}>{qa.question}</div>
                      </div>
                    </div>
                    <div className={styles.qaAnswer}>
                      <SiOpenai className={styles.qaIcon} />
                      <div>
                        <div className={styles.qaLabel}>Respuesta Generada por IA</div>
                        <div className={styles.qaText}>{qa.answer}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
