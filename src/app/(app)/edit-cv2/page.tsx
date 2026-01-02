"use client"

import { useState, useEffect } from "react"
import styles from "./edit-cv2.module.css"
import { FiEdit2, FiDownload, FiSave } from "react-icons/fi"
import { Button } from "@/components/UI/Button/Button"
import TranslateButton from "@/components/UI/TranslateButton/TranslateButton"

interface ExperienceBlock {
  position: string;
  company: string;
  dates: string;
  bullets: string[];
}

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
  strengths: string[]
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

// Función para parsear el CV de OpenAI con marcadores de sección
function parseCVFromOpenAI(cvText: string): CVData {
  const sections: Record<string, string> = {};
  
  // Extraer cada sección usando los marcadores
  const sectionPattern = /===SECTION_START:(\w+)===\s*([\s\S]*?)\s*===SECTION_END:\1===/g;
  let match;
  
  while ((match = sectionPattern.exec(cvText)) !== null) {
    const sectionName = match[1];
    const sectionContent = match[2].trim();
    sections[sectionName] = sectionContent;
  }

  // Parsear HEADER
  const headerText = sections['HEADER'] || '';
  const headerLines = headerText.split('\n').filter(l => l.trim());
  
  // Formato esperado: Campo: Valor (una línea por campo)
  const header: CVData['header'] = {
    name: '',
    title: '',
    location: '',
    phone: '',
    email: '',
    linkedin: '',
  };
  
  headerLines.forEach(line => {
    const trimmed = line.trim();
    // Buscar formato "Campo: Valor"
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const field = trimmed.substring(0, colonIndex).trim().toLowerCase();
      const value = trimmed.substring(colonIndex + 1).trim();
      
      if (field === 'name') {
        header.name = value;
      } else if (field === 'title') {
        header.title = value;
      } else if (field === 'location') {
        header.location = value;
      } else if (field === 'phone') {
        header.phone = value;
      } else if (field === 'email') {
        header.email = value;
      } else if (field === 'linkedin') {
        // Si el valor es "null" (case insensitive), usar string vacío
        header.linkedin = value.toLowerCase() === 'null' ? '' : value;
      }
    } else {
      // Formato alternativo: si no hay ":", intentar parsear formato antiguo
      // Primera línea sin ":" = nombre
      if (!header.name && !trimmed.includes('@') && !trimmed.includes('linkedin.com') && !trimmed.match(/\+?\d/)) {
        header.name = trimmed;
      }
      // Línea con pipes = información de contacto
      if (trimmed.includes('|')) {
        const parts = trimmed.split('|').map(p => p.trim());
        parts.forEach(part => {
          if (part.includes('@') && !header.email) {
            header.email = part;
          } else if (part.match(/\+?\d/) && !header.phone) {
            header.phone = part;
          } else if (part.includes('linkedin.com') && !header.linkedin) {
            header.linkedin = part;
          }
        });
      }
    }
  });

  // Parsear PROFESSIONAL_SUMMARY
  const profile = sections['PROFESSIONAL_SUMMARY']?.trim() || '';

  // Parsear ACHIEVEMENTS
  const achievementsText = sections['ACHIEVEMENTS'] || '';
  const achievements: string[] = [];
  if (achievementsText) {
    achievementsText.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.match(/^[A-Z]/))) {
        achievements.push(trimmed.replace(/^[•\-]\s*/, '').trim());
      }
    });
  }

  // Parsear STRENGTHS
  const strengthsText = sections['STRENGTHS'] || '';
  const strengths: string[] = [];
  if (strengthsText) {
    strengthsText.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.match(/^[A-Z]/))) {
        strengths.push(trimmed.replace(/^[•\-]\s*/, '').trim());
      }
    });
  }

  // Parsear SKILLS
  const skillsText = sections['SKILLS'] || '';
  const skillsLines = skillsText.split('\n').filter(l => l.trim());
  const skills: CVData['skills'] = {
    frontend: '',
    backend: '',
    languages: '',
    databases: '',
    cloud: '',
    specialties: '',
  };
  
  skillsLines.forEach(line => {
    const trimmed = line.trim();
    // Buscar cada categoría por su nombre exacto (case insensitive)
    if (trimmed.toLowerCase().startsWith('frontend:')) {
      skills.frontend = trimmed.replace(/^frontend:\s*/i, '').trim();
    } else if (trimmed.toLowerCase().startsWith('backend:')) {
      skills.backend = trimmed.replace(/^backend:\s*/i, '').trim();
    } else if (trimmed.toLowerCase().startsWith('languages:')) {
      skills.languages = trimmed.replace(/^languages:\s*/i, '').trim();
    } else if (trimmed.toLowerCase().startsWith('databases:')) {
      skills.databases = trimmed.replace(/^databases:\s*/i, '').trim();
    } else if (trimmed.toLowerCase().startsWith('cloud:')) {
      skills.cloud = trimmed.replace(/^cloud:\s*/i, '').trim();
    } else if (trimmed.toLowerCase().startsWith('specialties:')) {
      skills.specialties = trimmed.replace(/^specialties:\s*/i, '').trim();
    }
  });

  // Parsear PROFESSIONAL_EXPERIENCE
  const experienceText = sections['PROFESSIONAL_EXPERIENCE'] || '';
  const experience: CVData['experience'] = [];
  
  // El formato esperado es:
  // Position Name
  // Company Name | Dates
  // • bullet point 1
  // • bullet point 2
  
  // Remover el título "Professional Experience" si está presente
  let cleanText = experienceText.replace(/^Professional Experience\s*/i, '').trim();
  
  // Dividir por bloques de experiencia
  // Cada bloque empieza con un título de puesto (línea que no tiene | y no empieza con •)
  const lines = cleanText.split('\n').filter(l => l.trim());
  
  let currentExp: ExperienceBlock | null = null;
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Si la línea tiene |, es Company | Dates
    if (trimmed.includes('|')) {
      const parts = trimmed.split('|').map(p => p.trim());
      if (currentExp !== null && parts.length >= 2) {
        currentExp.company = parts[0] || '';
        currentExp.dates = parts[1] || '';
      }
    }
    // Si la línea empieza con •, es un bullet point
    else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      if (currentExp !== null) {
        currentExp.bullets.push(trimmed.replace(/^[•\-]\s*/, '').trim());
      }
    }
    // Si la línea no tiene | ni empieza con •, puede ser un Position Name
    else if (trimmed.length > 0 && !trimmed.includes('|')) {
      // Verificar si la siguiente línea tiene | para saber si es un nuevo position
      const nextLine = index < lines.length - 1 ? lines[index + 1].trim() : '';
      
      if (nextLine.includes('|')) {
        // Es un nuevo Position Name - guardar el bloque anterior si existe
        if (currentExp !== null && currentExp.company && currentExp.position && currentExp.dates) {
          experience.push({
            company: currentExp.company,
            position: currentExp.position,
            dates: currentExp.dates,
            bullets: currentExp.bullets,
          });
        }
        // Crear nuevo bloque
        currentExp = {
          position: trimmed,
          company: '',
          dates: '',
          bullets: [],
        };
      } else if (currentExp === null) {
        // Primera línea sin formato claro, asumir que es position
        currentExp = {
          position: trimmed,
          company: '',
          dates: '',
          bullets: [],
        };
      }
      // Si ya tenemos currentExp y no es un nuevo position, ignorar (puede ser texto suelto)
    }
  });
  
  // Guardar el último bloque
  if (currentExp !== null) {
    const exp = currentExp as ExperienceBlock;
    if (exp.company && exp.position && exp.dates) {
      experience.push({
        company: exp.company,
        position: exp.position,
        dates: exp.dates,
        bullets: exp.bullets,
      });
    }
  }

  // Parsear EDUCATION
  const educationText = sections['EDUCATION'] || '';
  const education: CVData['education'] = [];
  
  // El formato esperado es:
  // Degree Title
  // Institution Name | Dates
  // Description (opcional - puede ser múltiples líneas)
  
  if (educationText.trim()) {
    const lines = educationText.split('\n').filter(l => l.trim());
    
    // Procesar línea por línea de forma más simple y robusta
    let currentEdu: { degree: string; institution: string; dates: string; description?: string } | null = null;
    let lineIndex = 0;
    
    while (lineIndex < lines.length) {
      const line = lines[lineIndex].trim();
      
      // Si la línea tiene |, es Institution | Dates
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        if (currentEdu && parts.length >= 2) {
          currentEdu.institution = parts[0] || '';
          currentEdu.dates = parts[1] || '';
        }
        lineIndex++;
      }
      // Si la línea no tiene |, verificar si es un nuevo degree o descripción
      else {
        // Verificar si la siguiente línea tiene | para saber si es un nuevo degree
        const nextLine = lineIndex < lines.length - 1 ? lines[lineIndex + 1].trim() : '';
        
        if (nextLine.includes('|')) {
          // Es un nuevo Degree Title - guardar la educación anterior si está completa
          if (currentEdu && currentEdu.degree && currentEdu.institution && currentEdu.dates) {
            education.push({
              degree: currentEdu.degree,
              institution: currentEdu.institution,
              dates: currentEdu.dates,
              description: currentEdu.description?.trim() || undefined,
            });
          }
          
          // Crear nuevo bloque
          currentEdu = {
            degree: line,
            institution: '',
            dates: '',
            description: undefined,
          };
          lineIndex++;
        } else if (!currentEdu) {
          // Primera línea sin formato claro, asumir que es degree
          currentEdu = {
            degree: line,
            institution: '',
            dates: '',
            description: undefined,
          };
          lineIndex++;
        } else {
          // Es parte de la descripción (solo si ya tenemos degree, institution y dates completos)
          if (currentEdu && currentEdu.degree && currentEdu.institution && currentEdu.dates) {
            if (!currentEdu.description) {
              currentEdu.description = line;
            } else {
              currentEdu.description += ' ' + line;
            }
          }
          lineIndex++;
        }
      }
    }
    
    // Guardar la última educación solo una vez y solo si está completa
    if (currentEdu && currentEdu.degree && currentEdu.institution && currentEdu.dates) {
      // Verificar que no sea duplicado comparando con todas las entradas existentes
      const isDuplicate = education.some(edu => 
        edu.degree === currentEdu!.degree && 
        edu.institution === currentEdu!.institution && 
        edu.dates === currentEdu!.dates
      );
      
      if (!isDuplicate) {
        education.push({
          degree: currentEdu.degree,
          institution: currentEdu.institution,
          dates: currentEdu.dates,
          description: currentEdu.description?.trim() || undefined,
        });
      }
    }
  }

  // Parsear CERTIFICATIONS
  const certText = sections['CERTIFICATIONS'] || '';
  const certifications: CVData['certifications'] = [];
  const certLines = certText.split('\n').filter(l => l.trim());
  certLines.forEach(line => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 2) {
      certifications.push({
        title: parts[0] || '',
        institution: parts[1] || '',
        date: parts[2] || '',
      });
    }
  });

  return {
    header,
    profile,
    achievements,
    strengths,
    experience,
    skills,
    certifications,
    education,
  };
}

export default function EditCvPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [currentLanguage, setCurrentLanguage] = useState<"es" | "en">("en") // El CV se genera en inglés por defecto

  // Cargar CV desde sessionStorage al montar
  useEffect(() => {
    const generatedCV = sessionStorage.getItem('generatedCV');
    if (generatedCV) {
      try {
        const parsed = parseCVFromOpenAI(generatedCV);
        setCvData(parsed);
      } catch (error) {
        console.error('Error parseando CV:', error);
        // Si falla el parseo, usar datos vacíos
        setCvData({
    header: {
            name: '',
            title: '',
            location: '',
            phone: '',
            email: '',
            linkedin: '',
          },
          profile: '',
          achievements: [],
          strengths: [],
          experience: [],
          skills: {
            frontend: '',
            backend: '',
            languages: '',
            databases: '',
            cloud: '',
            specialties: '',
          },
          certifications: [],
          education: [],
        });
      }
    } else {
      // Si no hay CV generado, usar datos vacíos
      setCvData({
        header: {
          name: '',
          title: '',
          location: '',
          phone: '',
          email: '',
          linkedin: '',
        },
        profile: '',
        achievements: [],
        strengths: [],
        experience: [],
    skills: {
          frontend: '',
          backend: '',
          languages: '',
          databases: '',
          cloud: '',
          specialties: '',
        },
        certifications: [],
        education: [],
      });
    }
  }, []);

  if (!cvData) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Cargando CV...</p>
        </div>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  const handleTranslate = () => {
    // Cambiar entre español e inglés
    setCurrentLanguage(currentLanguage === "es" ? "en" : "es")
    // TODO: Implementar la traducción real del CV
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

  return (
    <div className={styles.pageContainer}>
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
          <TranslateButton
            currentLanguage={currentLanguage}
            onClick={handleTranslate}
            variant="secondary"
          />
          <Button onClick={handleDownloadPDF} variant="primary">
            <FiDownload /> Descargar PDF
          </Button>
        </div>
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

          {/* FORTALEZAS */}
          {cvData.strengths && cvData.strengths.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>FORTALEZAS</h2>
              <ul className={styles.bulletList}>
                {cvData.strengths.map((strength, index) => (
                  <li key={index} className={styles.bulletItem}>
                    {isEditing ? (
                      <textarea
                        value={strength}
                        onChange={(e) => updateArrayItem("strengths", index, e.target.value)}
                        className={styles.bulletTextarea}
                        rows={2}
                      />
                    ) : (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: strength
                            .replace(/$$([^)]+)$$/g, "<strong>($1)</strong>")
                            .replace(/(\d+%)/g, "<strong>$1</strong>"),
                        }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

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
