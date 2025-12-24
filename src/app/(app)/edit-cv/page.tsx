"use client"

import { useState, useEffect } from "react"
import styles from "./edit-cv.module.css"
import { FiEdit2, FiDownload, FiGlobe, FiSave, FiTrash2, FiUpload } from "react-icons/fi"
import { Button } from "@/components/UI/Button/Button"
import { FileUpload } from "@/components/UI/FileUpload/FileUpload"
import { FileCard } from "@/components/UI/FileCard/FileCard"
import { Input } from "@/components/UI/Input/Input"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { Alert } from "@/components/UI/Alert/Alert"
import { getUserCVs, createUserCV, deleteUserCV, UserCV } from "@/lib/cv"

interface CVData {
  header: {
    name: string
    title: string
    location: string
    phone: string
    email: string
    linkedin: string
  }
  profile: string
  achievements: string[]
  experience: Array<{
    company: string
    position: string
    dates: string
    description?: string
    bullets: string[]
  }>
  skills: {
    frontend: string
    backend: string
    languages: string
    databases: string
    cloud: string
    specialties: string
  }
  certifications: Array<{
    title: string
    institution: string
    date?: string
  }>
  education: Array<{
    degree: string
    institution: string
    dates: string
    description?: string
  }>
}

export default function EditCvPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [cvs, setCvs] = useState<UserCV[]>([])
  const [isLoadingCVs, setIsLoadingCVs] = useState(true)
  const [uploadingCV, setUploadingCV] = useState(false)
  const [newCVFile, setNewCVFile] = useState<File | null>(null)
  const [newCVName, setNewCVName] = useState("")
  const [alert, setAlert] = useState<{ status: "success" | "error"; message: string } | null>(null)

  const [cvData, setCvData] = useState<CVData>({
    header: {
      name: "DYLAN SEBASTIAN",
      title: "Full Stack Developer / Head of IT",
      location: "Argentina",
      phone: "+54 9 11 5175-9666",
      email: "dylan.sebastianmte@gmail.com",
      linkedin: "https://www.linkedin.com/in/dylan-sebastian-03706316b/",
    },
    profile:
      "Full Stack Developer and Head of IT with extensive experience building, scaling, and modernizing SaaS platforms, marketplaces, and CRM systems, with a strong focus on frontend architecture, product development, performance, and user experience, supported by solid backend and cloud expertise. I work end-to-end and in parallel across frontend and backend, ensuring smooth communication between layers, technical consistency, and high development velocity. While my primary inclination is toward frontend architecture and product design, I actively develop backend logic, manage databases, and design cloud infrastructure to build scalable and maintainable systems.",
    achievements: [
      "Performance optimization (34 → 98): improved production platform performance by developing a new Next.js marketplace, achieving 30% faster load times, major technical SEO improvements, and a significantly better user experience.",
      "Fast time-to-market: designed, developed, and launched a complete marketplace in under 60 days.",
      "B2B automation at scale: implemented AI-based normalization and automatic categorization for bulk uploads, reducing operational processing times from weeks to less than 14 days.",
      "Revenue impact: achieved a 50% increase in sales in the month following technical and performance optimizations.",
      "Conversion improvement: reduced cart abandonment by 20% through UX-driven purchase-flow redesign.",
      "Data-driven product decisions: implemented custom frontend events to analyze user behavior, identify friction points, and reduce churn.",
    ],
    experience: [
      {
        company: "Alaska Circular",
        position: "Head of IT / Full Stack Developer",
        dates: "Febrero 2025 – Diciembre 2026",
        bullets: [
          "Led the end-to-end technical strategy for a marketplace and an internal SaaS platform, with strong focus on product architecture, performance, and scalability.",
          "Developed and evolved the frontend architecture, working on a legacy Vue.js platform while executing a parallel migration.",
          "Led the greenfield development of a new marketplace and SaaS platform using Next.js, redefining frontend architecture, rendering strategy, performance, and deployment workflows.",
          "Designed and implemented backend business logic for e-commerce operations, inventory management, orders, payments, and operational workflows.",
          "Full ownership of MySQL databases, including data modeling, queries, indexing, migrations, backups, and production performance optimization.",
          "Extensive use of Docker for application containerization and environment standardization.",
          "Maintained and evolved CI/CD pipelines (GitHub Actions) deployed on Google Cloud Platform.",
          "Resolved a critical infrastructure blocker when GCP dropped support for Node.js 16, implementing a Docker + Cloud Run solution that ensured platform continuity.",
          "Deployed and operated containerized services on Cloud Run, optimizing costs, stability, and scalability.",
          "Coordinated technical decisions with product and business teams, aligning technology with company growth.",
        ],
      },
      {
        company: "Equipzilla – Machinery and Tools Rental",
        position: "Frontend Developer / Full Stack Developer",
        dates: "Agosto 2023 – Presente",
        bullets: [
          "Developed a complete platform from scratch using React.js and TypeScript, with strong focus on frontend architecture, performance, and user experience.",
          "Designed and implemented an optimized purchase flow, significantly reducing cart abandonment and improving conversion.",
          "Built a SaaS platform for fleet and inventory management, used by industrial companies.",
          "Developed an internal CRM integrated with Pipedrive, improving operational efficiency for order management and commercial workflows.",
          "Built interactive dashboards with real-time metrics to support operational decision-making.",
          "Implemented real-time geolocation panels for machinery and asset tracking.",
          "Developed automated security and operational alert systems via SMS and email, triggered by critical system events.",
          "Developed backend services using Express.js and REST APIs to support frontend business logic.",
          "Managed MySQL databases, including queries and backend data operations.",
          "Integrated and deployed services on Google Cloud Platform.",
        ],
      },
      {
        company: "WorksFound",
        position: "Full Stack Developer",
        dates: "Enero 2023 – Septiembre 2023",
        bullets: [
          "Founded and developed a SaaS platform focused on process automation and opportunity management.",
          "Implemented web scraping and automation workflows using Python, processing large volumes of data from multiple external sources.",
          "Developed backend services and REST APIs using Java and Spring Boot, handling the platform's core business logic.",
          "Designed a decoupled architecture, using Python for data collection and Java for the backend core, improving maintainability and scalability.",
          "Managed PostgreSQL databases, including data modeling, queries, and performance optimization.",
          "Developed the frontend using Next.js and TypeScript, focusing on performance and user experience.",
          "Deployed and operated services on Google Cloud Platform.",
          "Maintained full ownership of the product, including architecture, development, and infrastructure.",
        ],
      },
      {
        company: "IQSocial",
        position: "Backend Engineer",
        dates: "Octubre 2020 – Enero 2023",
        bullets: [
          "Contributed to the development of a big data platform for socio-political analysis based on social media behavior.",
          "Developed backend microservices using Java and Spring Boot.",
          "Implemented REST APIs to expose analytical data.",
          "Worked on microservices architecture, focusing on scalability and system decoupling.",
          "Managed databases in AWS environments, contributing to data modeling and query optimization.",
          "Participated in backend deployments and cloud-based service maintenance.",
          "Collaborated closely with data analysis and product teams.",
        ],
      },
    ],
    skills: {
      frontend: "React.js, Next.js, Vue.js",
      backend: "Java (Spring Boot), Python, Express.js, REST APIs, Microservices",
      languages: "TypeScript, JavaScript, Java, Python, SQL",
      databases: "MySQL, PostgreSQL",
      cloud: "Google Cloud Platform, AWS, Docker, Cloud Run",
      specialties:
        "Frontend development, full stack development, SaaS platforms, marketplaces, CRMs, performance and scalability",
    },
    certifications: [
      {
        title: "Full Stack Developer",
        institution: "Henry",
        date: "Abril 2022 – Mayo 2023",
      },
    ],
    education: [
      {
        degree: "Full Stack Developer",
        institution: "Henry",
        dates: "Abril 2022 – Mayo 2023",
        description:
          "Intensive 700+ hour program focused on frontend and backend development, REST APIs, relational databases, and full stack applications.",
      },
    ],
  })

  const handleDownloadPDF = () => {
    window.print()
  }

  const handleTranslate = () => {
    // Placeholder for future translation functionality
    alert("Funcionalidad de traducción próximamente disponible")
  }

  const toggleEdit = () => {
    setIsEditing(!isEditing)
  }

  const updateField = (path: string, value: string) => {
    setCvData((prev) => {
      const keys = path.split(".")
      const newData = JSON.parse(JSON.stringify(prev))
      let current: any = newData

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return newData
    })
  }

  const updateArrayItem = (path: string, index: number, value: string) => {
    setCvData((prev) => {
      const keys = path.split(".")
      const newData = JSON.parse(JSON.stringify(prev))
      let current: any = newData

      for (let i = 0; i < keys.length; i++) {
        if (i === keys.length - 1) {
          current[keys[i]][index] = value
        } else {
          current = current[keys[i]]
        }
      }

      return newData
    })
  }

  // Cargar CVs al montar el componente
  useEffect(() => {
    const loadCVs = async () => {
      setIsLoadingCVs(true)
      try {
        const response = await getUserCVs()
        if (response.success && response.cvs) {
          setCvs(response.cvs)
        } else {
          setAlert({
            status: "error",
            message: response.error || "Error al cargar los CVs",
          })
        }
      } catch (error) {
        console.error("Error loading CVs:", error)
        setAlert({
          status: "error",
          message: "Error al cargar los CVs",
        })
      } finally {
        setIsLoadingCVs(false)
      }
    }

    loadCVs()
  }, [])

  const handleUploadCV = async () => {
    if (!newCVFile) {
      setAlert({
        status: "error",
        message: "Por favor selecciona un archivo",
      })
      return
    }

    setUploadingCV(true)
    setAlert(null)

    try {
      const response = await createUserCV(newCVFile, newCVName || undefined)
      if (response.success && response.cv) {
        setCvs([...cvs, response.cv])
        setNewCVFile(null)
        setNewCVName("")
        setAlert({
          status: "success",
          message: "CV subido exitosamente",
        })
      } else {
        setAlert({
          status: "error",
          message: response.error || "Error al subir el CV",
        })
      }
    } catch (error) {
      console.error("Error uploading CV:", error)
      setAlert({
        status: "error",
        message: "Error al subir el CV",
      })
    } finally {
      setUploadingCV(false)
    }
  }

  const handleDeleteCV = async (cvId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este CV?")) {
      return
    }

    try {
      const response = await deleteUserCV(cvId)
      if (response.success) {
        setCvs(cvs.filter((cv) => cv.id !== cvId))
        setAlert({
          status: "success",
          message: "CV eliminado exitosamente",
        })
      } else {
        setAlert({
          status: "error",
          message: response.error || "Error al eliminar el CV",
        })
      }
    } catch (error) {
      console.error("Error deleting CV:", error)
      setAlert({
        status: "error",
        message: "Error al eliminar el CV",
      })
    }
  }

  return (
    <div className={styles.pageContainer}>
      {alert && <Alert status={alert.status} message={alert.message} onClose={() => setAlert(null)} />}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h1 className={styles.toolbarTitle}>Editor de CV</h1>
        </div>
        <div className={styles.toolbarActions}>
          <Button onClick={toggleEdit} variant={isEditing ? "primary" : "secondary"}>
            {isEditing ? (
              <>
                <FiSave /> Guardar
              </>
            ) : (
              <>
                <FiEdit2 /> Editar
              </>
            )}
          </Button>
          <Button onClick={handleTranslate} variant="secondary">
            <FiGlobe /> Traducir
          </Button>
          <Button onClick={handleDownloadPDF} variant="primary">
            <FiDownload /> Descargar PDF
          </Button>
        </div>
      </div>

      {/* Sección de Documentos */}
      <div className={styles.documentsSection}>
        <div className={styles.documentsHeader}>
          <h2 className={styles.documentsTitle}>Documentos</h2>
          <p className={styles.documentsSubtitle}>Gestiona tus CVs. Puedes tener múltiples CVs y asociarlos a diferentes grupos de búsqueda.</p>
        </div>

        {isLoadingCVs ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Lista de CVs existentes */}
            <div className={styles.cvsList}>
              {cvs.length > 0 ? (
                cvs.map((cv) => (
                  <div key={cv.id} className={styles.cvItem}>
                    <FileCard
                      fileName={cv.file_name || cv.cv_name}
                      fileUrl={cv.cv_url}
                      showDownload={true}
                      onDelete={() => handleDeleteCV(cv.id)}
                    />
                    <div className={styles.cvName}>{cv.cv_name}</div>
                    {cv.file_size && (
                      <div className={styles.cvSize}>
                        {(cv.file_size / 1024).toFixed(2)} KB
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p>No tienes CVs subidos aún. Sube tu primer CV para comenzar.</p>
                </div>
              )}
            </div>

            {/* Formulario para subir nuevo CV */}
            <div className={styles.uploadSection}>
              <h3 className={styles.uploadTitle}>Subir nuevo CV</h3>
              <div className={styles.uploadForm}>
                <div className={styles.uploadFileInput}>
                  <FileUpload
                    label="Seleccionar archivo"
                    accept=".pdf,.doc,.docx,.rtf,.txt"
                    value={newCVFile}
                    onChange={(file) => setNewCVFile(file)}
                    disabled={uploadingCV}
                  />
                </div>
                <div className={styles.uploadNameInput}>
                  <Input
                    label="Nombre del CV (opcional)"
                    type="text"
                    placeholder="Ej: CV Frontend Developer, CV Inglés..."
                    value={newCVName}
                    onChange={(e) => setNewCVName(e.target.value)}
                    disabled={uploadingCV}
                  />
                  <p className={styles.uploadHint}>
                    Si no especificas un nombre, se usará el nombre del archivo
                  </p>
                </div>
                <Button
                  onClick={handleUploadCV}
                  variant="primary"
                  disabled={!newCVFile || uploadingCV}
                  fullWidth
                >
                  {uploadingCV ? (
                    <>
                      <LoadingSpinner /> Subiendo...
                    </>
                  ) : (
                    <>
                      <FiUpload /> Subir CV
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.cvContainer}>
        <div className={styles.cvPage}>
          {/* HEADER */}
          <header className={styles.header}>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={cvData.header.name}
                  onChange={(e) => updateField("header.name", e.target.value)}
                  className={styles.nameInput}
                />
                <input
                  type="text"
                  value={cvData.header.title}
                  onChange={(e) => updateField("header.title", e.target.value)}
                  className={styles.titleInput}
                />
              </>
            ) : (
              <>
                <h1 className={styles.name}>{cvData.header.name}</h1>
                <p className={styles.title}>{cvData.header.title}</p>
              </>
            )}

            <div className={styles.contactInfo}>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={cvData.header.location}
                    onChange={(e) => updateField("header.location", e.target.value)}
                    className={styles.contactInput}
                  />
                  <input
                    type="text"
                    value={cvData.header.phone}
                    onChange={(e) => updateField("header.phone", e.target.value)}
                    className={styles.contactInput}
                  />
                  <input
                    type="text"
                    value={cvData.header.email}
                    onChange={(e) => updateField("header.email", e.target.value)}
                    className={styles.contactInput}
                  />
                  <input
                    type="text"
                    value={cvData.header.linkedin}
                    onChange={(e) => updateField("header.linkedin", e.target.value)}
                    className={styles.contactInput}
                  />
                </>
              ) : (
                <>
                  <span>{cvData.header.location}</span>
                  <span>{cvData.header.phone}</span>
                  <span>{cvData.header.email}</span>
                  <a href={cvData.header.linkedin} target="_blank" rel="noopener noreferrer">
                    {cvData.header.linkedin}
                  </a>
                </>
              )}
            </div>
          </header>

          {/* PERFIL PROFESIONAL */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>PERFIL PROFESIONAL</h2>
            {isEditing ? (
              <textarea
                value={cvData.profile}
                onChange={(e) => updateField("profile", e.target.value)}
                className={styles.profileTextarea}
                rows={6}
              />
            ) : (
              <p className={styles.profileText}>{cvData.profile}</p>
            )}
          </section>

          {/* LOGROS DESTACADOS */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>LOGROS DESTACADOS</h2>
            <ul className={styles.bulletList}>
              {cvData.achievements.map((achievement, index) => (
                <li key={index} className={styles.bulletItem}>
                  {isEditing ? (
                    <textarea
                      value={achievement}
                      onChange={(e) => updateArrayItem("achievements", index, e.target.value)}
                      className={styles.bulletTextarea}
                      rows={2}
                    />
                  ) : (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: achievement
                          .replace(/$$([^)]+)$$/g, "<strong>($1)</strong>")
                          .replace(/(\d+%)/g, "<strong>$1</strong>"),
                      }}
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* EXPERIENCIA PROFESIONAL */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>EXPERIENCIA PROFESIONAL</h2>
            {cvData.experience.map((exp, expIndex) => (
              <div key={expIndex} className={styles.experienceItem}>
                <div className={styles.experienceHeader}>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...cvData.experience]
                          newExp[expIndex].company = e.target.value
                          setCvData({ ...cvData, experience: newExp })
                        }}
                        className={styles.companyInput}
                      />
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => {
                          const newExp = [...cvData.experience]
                          newExp[expIndex].position = e.target.value
                          setCvData({ ...cvData, experience: newExp })
                        }}
                        className={styles.positionInput}
                      />
                      <input
                        type="text"
                        value={exp.dates}
                        onChange={(e) => {
                          const newExp = [...cvData.experience]
                          newExp[expIndex].dates = e.target.value
                          setCvData({ ...cvData, experience: newExp })
                        }}
                        className={styles.datesInput}
                      />
                    </>
                  ) : (
                    <>
                      <h3 className={styles.company}>{exp.company}</h3>
                      <p className={styles.position}>{exp.position}</p>
                      <p className={styles.dates}>{exp.dates}</p>
                    </>
                  )}
                </div>
                <ul className={styles.bulletList}>
                  {exp.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex} className={styles.bulletItem}>
                      {isEditing ? (
                        <textarea
                          value={bullet}
                          onChange={(e) => {
                            const newExp = [...cvData.experience]
                            newExp[expIndex].bullets[bulletIndex] = e.target.value
                            setCvData({ ...cvData, experience: newExp })
                          }}
                          className={styles.bulletTextarea}
                          rows={2}
                        />
                      ) : (
                        bullet
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* SKILLS */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>SKILLS</h2>
            <div className={styles.skillsGrid}>
              {Object.entries(cvData.skills).map(([category, value]) => (
                <div key={category} className={styles.skillCategory}>
                  <strong className={styles.skillLabel}>{category.charAt(0).toUpperCase() + category.slice(1)}:</strong>
                  {isEditing ? (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateField(`skills.${category}`, e.target.value)}
                      className={styles.skillInput}
                    />
                  ) : (
                    <span className={styles.skillValue}>{value}</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* CERTIFICACIONES */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>CERTIFICACIONES</h2>
            <ul className={styles.certificationList}>
              {cvData.certifications.map((cert, index) => (
                <li key={index} className={styles.certificationItem}>
                  {isEditing ? (
                    <div className={styles.certificationInputs}>
                      <input
                        type="text"
                        value={cert.title}
                        onChange={(e) => {
                          const newCerts = [...cvData.certifications]
                          newCerts[index].title = e.target.value
                          setCvData({ ...cvData, certifications: newCerts })
                        }}
                        className={styles.certTitleInput}
                        placeholder="Título"
                      />
                      <input
                        type="text"
                        value={cert.institution}
                        onChange={(e) => {
                          const newCerts = [...cvData.certifications]
                          newCerts[index].institution = e.target.value
                          setCvData({ ...cvData, certifications: newCerts })
                        }}
                        className={styles.certInstInput}
                        placeholder="Institución"
                      />
                      <input
                        type="text"
                        value={cert.date || ""}
                        onChange={(e) => {
                          const newCerts = [...cvData.certifications]
                          newCerts[index].date = e.target.value
                          setCvData({ ...cvData, certifications: newCerts })
                        }}
                        className={styles.certDateInput}
                        placeholder="Fecha"
                      />
                    </div>
                  ) : (
                    <>
                      <strong>{cert.title}</strong> — {cert.institution}
                      {cert.date && ` — ${cert.date}`}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* EDUCACIÓN */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>EDUCACIÓN</h2>
            {cvData.education.map((edu, index) => (
              <div key={index} className={styles.educationItem}>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const newEdu = [...cvData.education]
                        newEdu[index].degree = e.target.value
                        setCvData({ ...cvData, education: newEdu })
                      }}
                      className={styles.degreeInput}
                    />
                    <input
                      type="text"
                      value={`${edu.institution} — ${edu.dates}`}
                      onChange={(e) => {
                        const [inst, dates] = e.target.value.split(" — ")
                        const newEdu = [...cvData.education]
                        newEdu[index].institution = inst
                        newEdu[index].dates = dates || ""
                        setCvData({ ...cvData, education: newEdu })
                      }}
                      className={styles.eduDetailsInput}
                    />
                    {edu.description && (
                      <textarea
                        value={edu.description}
                        onChange={(e) => {
                          const newEdu = [...cvData.education]
                          newEdu[index].description = e.target.value
                          setCvData({ ...cvData, education: newEdu })
                        }}
                        className={styles.eduDescTextarea}
                        rows={2}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <h3 className={styles.degree}>{edu.degree}</h3>
                    <p className={styles.eduDetails}>
                      {edu.institution} — {edu.dates}
                    </p>
                    {edu.description && <p className={styles.eduDescription}>{edu.description}</p>}
                  </>
                )}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}
