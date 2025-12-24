"use client"

import { useState, useEffect } from "react"
import { FiSearch, FiX, FiCalendar, FiChevronDown } from "react-icons/fi"
import { BsLinkedin } from "react-icons/bs"
import { SiIndeed, SiGlassdoor } from "react-icons/si"
import { FcGoogle } from "react-icons/fc"
import { Button } from "@/components/UI/Button/Button"
import { Select } from "@/components/UI/Select/Select"
import { Pagination } from "@/components/UI/Pagination/Pagination"
import { DateRangePicker } from "@/components/UI/DateRangePicker/DateRangePicker"
import JobDetailModal from "@/components/UI/JobDetailModal/JobDetailModal"
import { LoadingSpinner } from "@/components/UI/LoadingSpinner/LoadingSpinner"
import { getAppliedJobs, getAppliedJobDetail } from "@/lib/jobs"
import { getCurrentUser } from "@/lib/auth"
import type { AppliedJobOffer } from "@/types/jobs"
import styles from "./applied-jobs.module.css"

// Función auxiliar para extraer el país de offer_location
const extractCountryFromLocation = (location: string | null | undefined): string | null => {
  if (!location) return null
  
  // Intentar extraer el país (último elemento después de la última coma)
  const parts = location.split(',').map(p => p.trim())
  if (parts.length > 1) {
    // Tomar el último elemento como país
    return parts[parts.length - 1]
  } else if (parts.length === 1) {
    // Si solo hay un elemento, puede ser el país directamente
    return parts[0]
  }
  return null
}

// Función auxiliar para obtener el emoji de bandera del país
// Genera el código de país tomando las primeras letras de cada palabra
const getCountryFlag = (country: string | null): string => {
  if (!country) return "🌍"
  
  // Limpiar y normalizar el texto
  const cleanCountry = country.trim()
  
  // Si el país tiene 2 o 3 caracteres y son mayúsculas, probablemente ya es un código
  if (cleanCountry.length <= 3 && /^[A-Z]+$/.test(cleanCountry)) {
    return getFlagEmoji(cleanCountry)
  }
  
  // Dividir en palabras y tomar la primera letra de cada palabra
  const words = cleanCountry.split(/\s+/).filter(word => word.length > 0)
  
  if (words.length === 0) return "🌍"
  
  // Si es una sola palabra, tomar las primeras 2 letras
  if (words.length === 1) {
    const code = words[0].substring(0, 2).toUpperCase()
    return getFlagEmoji(code)
  }
  
  // Si son múltiples palabras, tomar la primera letra de cada palabra
  const code = words.map(word => word[0]).join('').toUpperCase().substring(0, 2)
  return getFlagEmoji(code)
}

// Función auxiliar para convertir código de país a emoji de bandera
const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length < 2) return "🌍"
  
  // Convertir código de país a emoji de bandera usando Regional Indicator Symbols
  // Cada letra se convierte a su equivalente en Regional Indicator
  const codePoints = countryCode
    .toUpperCase()
    .substring(0, 2)
    .split('')
    .map(char => 127397 + char.charCodeAt(0)) // Regional Indicator Symbol base
  
  if (codePoints.length === 2) {
    return String.fromCodePoint(codePoints[0], codePoints[1])
  }
  
  return "🌍"
}

// Función auxiliar para formatear fecha
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Fecha no disponible"
  
  try {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return dateString
  }
}

// Función auxiliar para limpiar y sanitizar HTML básico
// Mantiene el formato pero limpia etiquetas peligrosas
const sanitizeHtml = (html: string | null | undefined): string => {
  if (!html) return ""
  
  // Limpiar comentarios HTML
  let cleaned = html.replace(/<!---->/g, "")
  
  // Limpiar atributos peligrosos pero mantener estructura básica
  // Permitir: p, br, strong, b, em, i, ul, ol, li, h1-h6, span, div
  // Remover: script, style, iframe, object, embed, form, input, etc.
  const tmp = document.createElement("DIV")
  tmp.innerHTML = cleaned
  
  // Remover elementos peligrosos
  const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button']
  dangerousTags.forEach(tag => {
    const elements = tmp.getElementsByTagName(tag)
    while (elements.length > 0) {
      elements[0].parentNode?.removeChild(elements[0])
    }
  })
  
  // Remover atributos peligrosos pero mantener href en links
  const allElements = tmp.getElementsByTagName('*')
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i]
    const attrs = Array.from(el.attributes)
    attrs.forEach(attr => {
      // Mantener href, pero remover onclick, onerror, etc.
      if (attr.name.startsWith('on') || 
          (attr.name !== 'href' && attr.name !== 'target' && attr.name !== 'rel' && 
           !['class', 'id', 'dir'].includes(attr.name))) {
        el.removeAttribute(attr.name)
      }
    })
  }
  
  return tmp.innerHTML
}

// Función auxiliar para capitalizar y limpiar modality/workMode
const formatWorkMode = (mode: string | null | undefined): string => {
  if (!mode) return "No disponible"
  
  // Limpiar y capitalizar
  const cleaned = mode.trim()
  if (cleaned.toLowerCase() === "remoto" || cleaned.toLowerCase().includes("remoto")) {
    return "Remoto"
  }
  if (cleaned.toLowerCase() === "presencial" || cleaned.toLowerCase().includes("presencial")) {
    return "Presencial"
  }
  if (cleaned.toLowerCase() === "híbrido" || cleaned.toLowerCase().includes("híbrido") || cleaned.toLowerCase().includes("hibrido")) {
    return "Híbrido"
  }
  
  // Capitalizar primera letra
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase()
}

// Función auxiliar para mapear status del backend al formato del frontend
const mapStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    "applied": "Postulados",
    "reviewing": "En revisión",
    "interview": "Entrevista",
    "rejected": "Rechazado",
    "accepted": "Aceptado",
  }
  return statusMap[status] || status
}

// Función auxiliar para convertir AppliedJobOffer a formato compatible con JobDetailModal
const convertToJobApplication = (job: AppliedJobOffer) => {
  // Convertir hiring_team de JSONB a array si es necesario y mapear profile_url a profileUrl
  let recruiterTeam: Array<{ name: string; position?: string; profileUrl?: string }> | undefined = undefined;
  if (job.hiring_team) {
    let rawTeam: any = null;
    if (Array.isArray(job.hiring_team)) {
      rawTeam = job.hiring_team;
    } else if (typeof job.hiring_team === 'string') {
      try {
        rawTeam = JSON.parse(job.hiring_team);
      } catch {
        rawTeam = null;
      }
    }
    
    if (rawTeam && Array.isArray(rawTeam)) {
      recruiterTeam = rawTeam.map((recruiter: any) => ({
        name: recruiter.name || '',
        position: recruiter.position,
        profileUrl: recruiter.profile_url || recruiter.profileUrl, // Mapear profile_url a profileUrl
      }));
    }
  } else if (job.recruiterTeam) {
    recruiterTeam = job.recruiterTeam.map((recruiter: any) => ({
      name: recruiter.name || '',
      position: recruiter.position,
      profileUrl: recruiter.profile_url || recruiter.profileUrl,
    }));
  }

  // Convertir skills y tech_stack de JSONB a array si es necesario
  let skillsArray: string[] | undefined = undefined;
  if (job.skills) {
    if (Array.isArray(job.skills)) {
      skillsArray = job.skills;
    } else if (typeof job.skills === 'string') {
      try {
        skillsArray = JSON.parse(job.skills);
      } catch {
        skillsArray = undefined;
      }
    }
  }

  let techStackArray: string[] | undefined = undefined;
  if (job.tech_stack || job.techStack) {
    const techStackData = job.tech_stack || job.techStack;
    if (Array.isArray(techStackData)) {
      techStackArray = techStackData;
    } else if (typeof techStackData === 'string') {
      try {
        techStackArray = JSON.parse(techStackData);
      } catch {
        techStackArray = undefined;
      }
    }
  }

  // Extraer país de offer_location si no viene en country
  const country = job.country || extractCountryFromLocation(job.offer_location) || ""
  const countryFlag = getCountryFlag(country)
  
  return {
    id: job.id,
    title: job.title,
    company: job.company_name || job.company || "",
    portal: job.portal as "LinkedIn" | "Bumeran" | "Zonajobs" | "Glassdoor",
    country: country,
    countryFlag: countryFlag,
    date: formatDate(job.applied_at || null),
    status: mapStatus(job.status) as "Postulados" | "En revisión" | "Entrevista" | "Rechazado" | "Aceptado",
    applicants: job.applicants_count || job.applicants,
    workMode: formatWorkMode(job.modality || job.workMode),
    workType: job.work_schedule_type || job.workType,
    salary: job.salary || undefined,
    description: sanitizeHtml(job.job_description || job.description),
    jobUrl: job.offer_url || job.jobUrl,
    companyUrl: job.company_url || undefined,
    companyFollowers: job.company_followers || job.companyFollowers,
    companyCountry: country, // Usar el país extraído de offer_location
    evaluationTime: job.evaluation_time || job.evaluationTime,
    postedAgo: job.posted_time_ago || job.postedAgo,
    applications: job.applications_count || job.applications,
    recruiterTeam: recruiterTeam,
    industry: job.company_industry || job.industry,
    companySize: job.company_employees_count || job.companySize,
    skills: skillsArray,
    techStack: techStackArray,
    englishRequired: job.englishRequired,
  }
}

const mockJobs: any[] = [ // Mantener para referencia, pero no se usará
  {
    id: 1,
    title: "Senior Developer Technology Engineer",
    company: "Nvidia",
    portal: "LinkedIn",
    country: "USA",
    countryFlag: "🇺🇸",
    date: "02/10/2025 12:39",
    status: "Postulados",
    applicants: 247,
    workMode: "Remoto",
    workType: "Full-Time",
    salary: "$120,000 - $180,000/año",
    description:
      "Buscamos un Senior Developer Technology Engineer con experiencia en arquitecturas de GPU y desarrollo de drivers. Responsabilidades incluyen optimización de rendimiento, desarrollo de APIs y colaboración con equipos de producto.",
    jobUrl: "https://linkedin.com/jobs/view/123456",
    companyUrl: "https://nvidia.com",
    companyFollowers: 3500000,
    companyCountry: "Estados Unidos",
    evaluationTime: "2-3 semanas",
    postedAgo: "Hace 3 días",
    applications: 247,
    recruiterTeam: [
      { name: "Sarah Johnson", position: "Technical Recruiter", profileUrl: "https://linkedin.com/in/sarahjohnson" },
      { name: "Michael Chen", position: "Engineering Manager" },
    ],
    industry: "Tecnología de semiconductores",
    companySize: "10,000+ empleados",
    skills: ["CUDA", "C++", "GPU Architecture", "Performance Optimization"],
    techStack: ["C++", "Python", "CUDA", "OpenGL", "Vulkan"],
    englishRequired: true,
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
    applicants: 189,
    workMode: "Híbrido",
    workType: "Full-Time",
    description:
      "Desarrollo de infraestructura para sistemas de vehículos autónomos. No disponemos de información salarial completa para esta posición.",
    jobUrl: "https://linkedin.com/jobs/view/123457",
    companyUrl: "https://nvidia.com",
    companyFollowers: 3500000,
    companyCountry: "Estados Unidos",
    evaluationTime: "2-3 semanas",
    postedAgo: "Hace 1 semana",
    applications: 189,
    industry: "Tecnología de semiconductores",
    companySize: "10,000+ empleados",
    techStack: ["C++", "Python", "ROS", "Docker"],
    englishRequired: true,
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
    applicants: 120,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$80,000 - $120,000/año",
    description:
      "Responsabilidades incluyen la supervisión y el mantenimiento de los sistemas eléctricos de los centros de datos.",
    jobUrl: "https://linkedin.com/jobs/view/123458",
    companyUrl: "https://salasobrien.com",
    companyFollowers: 150000,
    companyCountry: "Colombia",
    evaluationTime: "1-2 semanas",
    postedAgo: "Hace 5 días",
    applications: 120,
    recruiterTeam: [{ name: "Ana Martinez", position: "Recruiter" }],
    industry: "Servicios de TI",
    companySize: "500-1000 empleados",
    skills: ["Electrical Engineering", "Data Center Management"],
    techStack: ["Python", "PowerShell", "Networking"],
    englishRequired: false,
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
    applicants: 300,
    workMode: "Híbrido",
    workType: "Full-Time",
    salary: "$70,000 - $100,000/año",
    description: "Desarrollar interfaces de usuario modernas y eficientes utilizando React y otras tecnologías web.",
    jobUrl: "https://bumeran.com/jobs/view/123459",
    companyUrl: "https://mercadolibre.com",
    companyFollowers: 5000000,
    companyCountry: "Argentina",
    evaluationTime: "1 semana",
    postedAgo: "Hace 2 semanas",
    applications: 300,
    recruiterTeam: [
      { name: "Juan Lopez", position: "Frontend Developer", profileUrl: "https://bumeran.com/in/juanlopez" },
    ],
    industry: "Comercio electrónico",
    companySize: "10,000+ empleados",
    skills: ["React", "JavaScript", "CSS"],
    techStack: ["React", "Node.js", "MongoDB"],
    englishRequired: true,
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
    applicants: 150,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$90,000 - $150,000/año",
    description: "Desarrollar aplicaciones web completas utilizando tecnologías front-end y back-end.",
    jobUrl: "https://linkedin.com/jobs/view/123460",
    companyUrl: "https://globant.com",
    companyFollowers: 2000000,
    companyCountry: "Uruguay",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 4 semanas",
    applications: 150,
    recruiterTeam: [
      {
        name: "Maria Rodriguez",
        position: "Technical Recruiter",
        profileUrl: "https://linkedin.com/in/mariorodriguez",
      },
      { name: "Carlos Garcia", position: "Project Manager" },
    ],
    industry: "Consultoría de TI",
    companySize: "5000-10000 empleados",
    skills: ["JavaScript", "Node.js", "Express"],
    techStack: ["React", "Node.js", "MongoDB", "AWS"],
    englishRequired: true,
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
    applicants: 200,
    workMode: "Remoto",
    workType: "Full-Time",
    salary: "$100,000 - $140,000/año",
    description: "Desarrollar y mantener servicios back-end utilizando Node.js y otras tecnologías.",
    jobUrl: "https://zonajobs.com/jobs/view/123461",
    companyUrl: "https://auth0.com",
    companyFollowers: 1000000,
    companyCountry: "Argentina",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 1 mes",
    applications: 200,
    recruiterTeam: [
      { name: "Pedro Ramirez", position: "Backend Developer", profileUrl: "https://zonajobs.com/in/pedroramirez" },
    ],
    industry: "Seguridad en la nube",
    companySize: "500-1000 empleados",
    skills: ["Node.js", "REST APIs", "Database Management"],
    techStack: ["Node.js", "Express", "PostgreSQL"],
    englishRequired: true,
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
    applicants: 350,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$110,000 - $170,000/año",
    description: "Implementar y mantener procesos de integración y despliegue continuos.",
    jobUrl: "https://linkedin.com/jobs/view/123462",
    companyUrl: "https://google.com",
    companyFollowers: 15000000,
    companyCountry: "Estados Unidos",
    evaluationTime: "3 semanas",
    postedAgo: "Hace 3 meses",
    applications: 350,
    recruiterTeam: [
      { name: "Laura Fernandez", position: "DevOps Engineer", profileUrl: "https://linkedin.com/in/laurafe Fernandez" },
    ],
    industry: "Tecnología",
    companySize: "100,000+ empleados",
    skills: ["CI/CD", "Infrastructure Management"],
    techStack: ["Docker", "Kubernetes", "Jenkins"],
    englishRequired: true,
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
    applicants: 400,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$130,000 - $200,000/año",
    description: "Desarrollar aplicaciones móviles para iOS utilizando Swift y otras tecnologías.",
    jobUrl: "https://glassdoor.com/jobs/view/123463",
    companyUrl: "https://apple.com",
    companyFollowers: 20000000,
    companyCountry: "Estados Unidos",
    evaluationTime: "4 semanas",
    postedAgo: "Hace 6 meses",
    applications: 400,
    recruiterTeam: [{ name: "John Doe", position: "iOS Developer", profileUrl: "https://glassdoor.com/in/johndoe" }],
    industry: "Electrónica",
    companySize: "100,000+ empleados",
    skills: ["Swift", "iOS Development"],
    techStack: ["Swift", "Xcode", "UIKit"],
    englishRequired: true,
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
    applicants: 280,
    workMode: "Híbrido",
    workType: "Full-Time",
    salary: "$85,000 - $125,000/año",
    description: "Diseñar experiencias de usuario y interfaces de usuario atractivas y funcionales.",
    jobUrl: "https://linkedin.com/jobs/view/123464",
    companyUrl: "https://adobe.com",
    companyFollowers: 12000000,
    companyCountry: "México",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 2 meses",
    applications: 280,
    recruiterTeam: [
      { name: "Emily White", position: "UI/UX Designer", profileUrl: "https://linkedin.com/in/emilywhite" },
    ],
    industry: "Diseño",
    companySize: "10,000+ empleados",
    skills: ["UI/UX", "Sketch", "Figma"],
    techStack: ["React", "Angular", "Vue"],
    englishRequired: true,
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
    applicants: 320,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$95,000 - $155,000/año",
    description: "Analizar datos y desarrollar modelos predictivos utilizando herramientas de análisis de datos.",
    jobUrl: "https://linkedin.com/jobs/view/123465",
    companyUrl: "https://amazon.com",
    companyFollowers: 18000000,
    companyCountry: "Brasil",
    evaluationTime: "3 semanas",
    postedAgo: "Hace 1 mes",
    applications: 320,
    recruiterTeam: [
      { name: "David Brown", position: "Data Scientist", profileUrl: "https://linkedin.com/in/davidbrown" },
    ],
    industry: "Retail",
    companySize: "100,000+ empleados",
    skills: ["Python", "R", "Machine Learning"],
    techStack: ["Python", "TensorFlow", "Pandas"],
    englishRequired: true,
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
    applicants: 260,
    workMode: "Remoto",
    workType: "Full-Time",
    salary: "$105,000 - $165,000/año",
    description: "Diseñar y implementar arquitecturas de nube escalables y eficientes.",
    jobUrl: "https://bumeran.com/jobs/view/123466",
    companyUrl: "https://microsoft.com",
    companyFollowers: 13000000,
    companyCountry: "Chile",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 3 meses",
    applications: 260,
    recruiterTeam: [
      { name: "Sophia Green", position: "Cloud Architect", profileUrl: "https://bumeran.com/in/sophiagreen" },
    ],
    industry: "Software",
    companySize: "5000-10000 empleados",
    skills: ["Cloud Architecture", "AWS", "Azure"],
    techStack: ["AWS", "Azure", "Google Cloud"],
    englishRequired: true,
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
    applicants: 380,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$115,000 - $175,000/año",
    description: "Automatizar pruebas de calidad utilizando herramientas de automatización.",
    jobUrl: "https://linkedin.com/jobs/view/123467",
    companyUrl: "https://tesla.com",
    companyFollowers: 14000000,
    companyCountry: "Estados Unidos",
    evaluationTime: "3 semanas",
    postedAgo: "Hace 4 meses",
    applications: 380,
    recruiterTeam: [
      { name: "Michael Black", position: "QA Engineer", profileUrl: "https://linkedin.com/in/michaelblack" },
    ],
    industry: "Automóviles eléctricos",
    companySize: "100,000+ empleados",
    skills: ["QA Automation", "Test Driven Development"],
    techStack: ["Selenium", "JUnit", "Jenkins"],
    englishRequired: true,
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
    applicants: 220,
    workMode: "Híbrido",
    workType: "Full-Time",
    salary: "$90,000 - $150,000/año",
    description: "Gestionar el ciclo de vida de productos y asegurar su éxito en el mercado.",
    jobUrl: "https://zonajobs.com/jobs/view/123468",
    companyUrl: "https://spotify.com",
    companyFollowers: 11000000,
    companyCountry: "España",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 5 meses",
    applications: 220,
    recruiterTeam: [
      { name: "Jessica White", position: "Product Manager", profileUrl: "https://zonajobs.com/in/jessicawhite" },
    ],
    industry: "Streaming",
    companySize: "10,000+ empleados",
    skills: ["Product Management", "Agile Methodologies"],
    techStack: ["Jira", "Confluence", "Trello"],
    englishRequired: true,
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
    applicants: 270,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$80,000 - $120,000/año",
    description: "Facilitar la implementación de metodologías Scrum y asegurar la eficiencia del equipo.",
    jobUrl: "https://linkedin.com/jobs/view/123469",
    companyUrl: "https://ibm.com",
    companyFollowers: 10000000,
    companyCountry: "Argentina",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 6 meses",
    applications: 270,
    recruiterTeam: [
      { name: "Carlos Lopez", position: "Scrum Master", profileUrl: "https://linkedin.com/in/carloslopez" },
    ],
    industry: "Consultoría",
    companySize: "5000-10000 empleados",
    skills: ["Scrum", "Agile", "Project Management"],
    techStack: ["Jira", "Confluence", "Trello"],
    englishRequired: true,
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
    applicants: 300,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$95,000 - $155,000/año",
    description: "Implementar y mantener medidas de seguridad para proteger sistemas y redes.",
    jobUrl: "https://glassdoor.com/jobs/view/123470",
    companyUrl: "https://cisco.com",
    companyFollowers: 13000000,
    companyCountry: "Estados Unidos",
    evaluationTime: "3 semanas",
    postedAgo: "Hace 7 meses",
    applications: 300,
    recruiterTeam: [
      { name: "Laura Brown", position: "Security Engineer", profileUrl: "https://glassdoor.com/in/laurabrown" },
    ],
    industry: "Telecomunicaciones",
    companySize: "100,000+ empleados",
    skills: ["Network Security", "Cybersecurity"],
    techStack: ["Cisco ASA", "Firewall", "VPN"],
    englishRequired: true,
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
    applicants: 250,
    workMode: "Remoto",
    workType: "Full-Time",
    salary: "$120,000 - $180,000/año",
    description: "Desarrollar y implementar modelos de aprendizaje automático utilizando herramientas de IA.",
    jobUrl: "https://linkedin.com/jobs/view/123471",
    companyUrl: "https://openai.com",
    companyFollowers: 8000000,
    companyCountry: "Estados Unidos",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 8 meses",
    applications: 250,
    recruiterTeam: [{ name: "James Green", position: "ML Engineer", profileUrl: "https://linkedin.com/in/jamesgreen" }],
    industry: "Inteligencia artificial",
    companySize: "10,000+ empleados",
    skills: ["Machine Learning", "Deep Learning"],
    techStack: ["TensorFlow", "PyTorch", "Keras"],
    englishRequired: true,
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
    applicants: 230,
    workMode: "Híbrido",
    workType: "Full-Time",
    salary: "$90,000 - $150,000/año",
    description: "Asegurar la disponibilidad y confiabilidad de sistemas y servicios.",
    jobUrl: "https://bumeran.com/jobs/view/123472",
    companyUrl: "https://netflix.com",
    companyFollowers: 12000000,
    companyCountry: "Brasil",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 9 meses",
    applications: 230,
    recruiterTeam: [{ name: "Sophia Black", position: "SRE", profileUrl: "https://bumeran.com/in/sophiablack" }],
    industry: "Entretenimiento",
    companySize: "100,000+ empleados",
    skills: ["Site Reliability", "Monitoring"],
    techStack: ["Prometheus", "Grafana", "Kubernetes"],
    englishRequired: true,
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
    applicants: 280,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$110,000 - $170,000/año",
    description: "Liderar equipos técnicos y asegurar la entrega de proyectos de alta calidad.",
    jobUrl: "https://linkedin.com/jobs/view/123473",
    companyUrl: "https://uber.com",
    companyFollowers: 11000000,
    companyCountry: "Argentina",
    evaluationTime: "3 semanas",
    postedAgo: "Hace 10 meses",
    applications: 280,
    recruiterTeam: [
      { name: "Michael White", position: "Technical Lead", profileUrl: "https://linkedin.com/in/michaelwhite" },
    ],
    industry: "Transporte",
    companySize: "100,000+ empleados",
    skills: ["Technical Leadership", "Agile Methodologies"],
    techStack: ["Java", "Python", "Docker"],
    englishRequired: true,
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
    applicants: 240,
    workMode: "Híbrido",
    workType: "Full-Time",
    salary: "$100,000 - $160,000/año",
    description: "Desarrollar aplicaciones móviles para iOS utilizando Swift y otras tecnologías.",
    jobUrl: "https://zonajobs.com/jobs/view/123474",
    companyUrl: "https://airbnb.com",
    companyFollowers: 10000000,
    companyCountry: "México",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 11 meses",
    applications: 240,
    recruiterTeam: [
      { name: "Jessica Lopez", position: "iOS Developer", profileUrl: "https://zonajobs.com/in/jessicalopez" },
    ],
    industry: "Alquileres",
    companySize: "100,000+ empleados",
    skills: ["iOS Development", "Swift"],
    techStack: ["Swift", "Xcode", "UIKit"],
    englishRequired: true,
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
    applicants: 290,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$95,000 - $155,000/año",
    description: "Desarrollar aplicaciones móviles para Android utilizando Kotlin y otras tecnologías.",
    jobUrl: "https://linkedin.com/jobs/view/123475",
    companyUrl: "https://twitter.com",
    companyFollowers: 9000000,
    companyCountry: "Chile",
    evaluationTime: "3 semanas",
    postedAgo: "Hace 12 meses",
    applications: 290,
    recruiterTeam: [
      { name: "Carlos Green", position: "Android Developer", profileUrl: "https://linkedin.com/in/carlosgreen" },
    ],
    industry: "Redes sociales",
    companySize: "100,000+ empleados",
    skills: ["Android Development", "Kotlin"],
    techStack: ["Kotlin", "Android Studio", "Java"],
    englishRequired: true,
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
    applicants: 260,
    workMode: "Remoto",
    workType: "Full-Time",
    salary: "$105,000 - $165,000/año",
    description: "Diseñar y mantener sistemas de alta performance utilizando tecnologías Intel.",
    jobUrl: "https://glassdoor.com/jobs/view/123476",
    companyUrl: "https://intel.com",
    companyFollowers: 10000000,
    companyCountry: "Estados Unidos",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 1 mes",
    applications: 260,
    recruiterTeam: [
      { name: "Laura Black", position: "Systems Engineer", profileUrl: "https://glassdoor.com/in/laurablack" },
    ],
    industry: "Tecnología de semiconductores",
    companySize: "100,000+ empleados",
    skills: ["System Design", "Performance Optimization"],
    techStack: ["Linux", "Docker", "Kubernetes"],
    englishRequired: true,
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
    applicants: 270,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$85,000 - $125,000/año",
    description: "Administrar y mantener bases de datos Oracle de alta disponibilidad.",
    jobUrl: "https://linkedin.com/jobs/view/123477",
    companyUrl: "https://oracle.com",
    companyFollowers: 9000000,
    companyCountry: "España",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 2 meses",
    applications: 270,
    recruiterTeam: [{ name: "Michael Green", position: "DBA", profileUrl: "https://linkedin.com/in/michaelgreen" }],
    industry: "Base de datos",
    companySize: "100,000+ empleados",
    skills: ["Database Administration", "SQL"],
    techStack: ["Oracle", "MySQL", "PostgreSQL"],
    englishRequired: true,
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
    applicants: 280,
    workMode: "Híbrido",
    workType: "Full-Time",
    salary: "$90,000 - $150,000/año",
    description: "Diseñar y mantener redes de alta performance utilizando tecnologías Juniper.",
    jobUrl: "https://bumeran.com/jobs/view/123478",
    companyUrl: "https://juniper.com",
    companyFollowers: 8000000,
    companyCountry: "Colombia",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 3 meses",
    applications: 280,
    recruiterTeam: [
      { name: "Jessica White", position: "Network Engineer", profileUrl: "https://bumeran.com/in/jessicawhite" },
    ],
    industry: "Telecomunicaciones",
    companySize: "10,000+ empleados",
    skills: ["Network Engineering", "Routing"],
    techStack: ["Juniper", "Cisco", "Aruba"],
    englishRequired: true,
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
    applicants: 290,
    workMode: "Remoto",
    workType: "Full-Time",
    salary: "$110,000 - $170,000/año",
    description: "Desarrollar y mantener aplicaciones blockchain utilizando tecnologías Coinbase.",
    jobUrl: "https://linkedin.com/jobs/view/123479",
    companyUrl: "https://coinbase.com",
    companyFollowers: 7000000,
    companyCountry: "Estados Unidos",
    evaluationTime: "3 semanas",
    postedAgo: "Hace 4 meses",
    applications: 290,
    recruiterTeam: [
      { name: "Carlos Green", position: "Blockchain Developer", profileUrl: "https://linkedin.com/in/carlosgreen" },
    ],
    industry: "Criptomonedas",
    companySize: "10,000+ empleados",
    skills: ["Blockchain Development", "Smart Contracts"],
    techStack: ["Solidity", "Ethereum", "Hyperledger"],
    englishRequired: true,
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
    applicants: 250,
    workMode: "Híbrido",
    workType: "Full-Time",
    salary: "$100,000 - $160,000/año",
    description: "Desarrollar juegos utilizando Unity y otras tecnologías de desarrollo de juegos.",
    jobUrl: "https://zonajobs.com/jobs/view/123480",
    companyUrl: "https://unity.com",
    companyFollowers: 6000000,
    companyCountry: "Argentina",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 5 meses",
    applications: 250,
    recruiterTeam: [
      { name: "Sophia Black", position: "Game Developer", profileUrl: "https://zonajobs.com/in/sophiablack" },
    ],
    industry: "Juegos",
    companySize: "10,000+ empleados",
    skills: ["Game Development", "Unity"],
    techStack: ["Unity", "C#", "Shader"],
    englishRequired: true,
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
    applicants: 240,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$115,000 - $175,000/año",
    description: "Desarrollar experiencias AR/VR utilizando tecnologías Meta.",
    jobUrl: "https://linkedin.com/jobs/view/123481",
    companyUrl: "https://meta.com",
    companyFollowers: 7000000,
    companyCountry: "Estados Unidos",
    evaluationTime: "3 semanas",
    postedAgo: "Hace 6 meses",
    applications: 240,
    recruiterTeam: [
      { name: "Michael Green", position: "AR/VR Developer", profileUrl: "https://linkedin.com/in/michaelgreen" },
    ],
    industry: "Realidad aumentada/virtual",
    companySize: "100,000+ empleados",
    skills: ["AR/VR Development", "Unity"],
    techStack: ["Unity", "C#", "Oculus SDK"],
    englishRequired: true,
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
    applicants: 230,
    workMode: "Híbrido",
    workType: "Full-Time",
    salary: "$90,000 - $150,000/año",
    description: "Administrar y mantener infraestructuras de TI utilizando tecnologías Digital Ocean.",
    jobUrl: "https://glassdoor.com/jobs/view/123482",
    companyUrl: "https://digitalocean.com",
    companyFollowers: 6000000,
    companyCountry: "Brasil",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 7 meses",
    applications: 230,
    recruiterTeam: [
      {
        name: "Jessica White",
        position: "Infrastructure Engineer",
        profileUrl: "https://glassdoor.com/in/jessicawhite",
      },
    ],
    industry: "Cloud computing",
    companySize: "5000-10000 empleados",
    skills: ["Infrastructure Management", "Cloud Computing"],
    techStack: ["Digital Ocean", "AWS", "Azure"],
    englishRequired: true,
  },
  {
    id: 28,
    title: "Release Manager",
    company: "Atlassian",
    portal: "LinkedIn",
    country: "Uruguay",
    countryFlag: "🇺🇾",
    date: "29/09/2025 14:15",
    status: "Postulados",
    applicants: 220,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$85,000 - $125,000/año",
    description: "Gestionar el ciclo de lanzamiento de productos utilizando herramientas Atlassian.",
    jobUrl: "https://linkedin.com/jobs/view/123483",
    companyUrl: "https://atlassian.com",
    companyFollowers: 5000000,
    companyCountry: "Uruguay",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 8 meses",
    applications: 220,
    recruiterTeam: [
      { name: "Carlos Green", position: "Release Manager", profileUrl: "https://linkedin.com/in/carlosgreen" },
    ],
    industry: "Software",
    companySize: "10,000+ empleados",
    skills: ["Release Management", "Agile Methodologies"],
    techStack: ["Jira", "Confluence", "Bitbucket"],
    englishRequired: true,
  },
  {
    id: 29,
    title: "Solutions Architect",
    company: "Salesforce",
    portal: "LinkedIn",
    country: "Chile",
    countryFlag: "🇨🇱",
    date: "29/09/2025 12:05",
    status: "Postulados",
    applicants: 210,
    workMode: "Híbrido",
    workType: "Full-Time",
    salary: "$100,000 - $160,000/año",
    description: "Diseñar soluciones de TI personalizadas utilizando tecnologías Salesforce.",
    jobUrl: "https://linkedin.com/jobs/view/123484",
    companyUrl: "https://salesforce.com",
    companyFollowers: 4000000,
    companyCountry: "Chile",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 9 meses",
    applications: 210,
    recruiterTeam: [
      { name: "Sophia Black", position: "Solutions Architect", profileUrl: "https://linkedin.com/in/sophiablack" },
    ],
    industry: "CRM",
    companySize: "100,000+ empleados",
    skills: ["Solution Architecture", "Salesforce"],
    techStack: ["Salesforce", "Apex", "Visualforce"],
    englishRequired: true,
  },
  {
    id: 30,
    title: "Technical Writer",
    company: "MongoDB",
    portal: "LinkedIn",
    country: "Chile",
    countryFlag: "🇨🇱",
    date: "29/09/2025 11:00",
    status: "Postulados",
    applicants: 200,
    workMode: "Presencial",
    workType: "Full-Time",
    salary: "$80,000 - $120,000/año",
    description: "Redactar documentación técnica y guías de usuario para MongoDB.",
    jobUrl: "https://linkedin.com/jobs/view/123485",
    companyUrl: "https://mongodb.com",
    companyFollowers: 3000000,
    companyCountry: "Chile",
    evaluationTime: "2 semanas",
    postedAgo: "Hace 10 meses",
    applications: 200,
    recruiterTeam: [
      { name: "Michael Green", position: "Technical Writer", profileUrl: "https://linkedin.com/in/michaelgreen" },
    ],
    industry: "Base de datos",
    companySize: "5000-10000 empleados",
    skills: ["Technical Writing", "Documentation"],
    techStack: ["MongoDB", "Markdown", "Confluence"],
    englishRequired: true,
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
  const [selectedJob, setSelectedJob] = useState<any | null>(null)
  const [jobs, setJobs] = useState<AppliedJobOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const itemsPerPage = 20

  // Cargar ofertas aplicadas al montar el componente
  useEffect(() => {
    const loadAppliedJobs = async () => {
      setLoading(true)
      try {
        const user = getCurrentUser()
        if (!user) {
          console.error("Usuario no autenticado")
          setLoading(false)
          return
        }

        const response = await getAppliedJobs({
          user_id: user.id,
          page: currentPage,
          limit: itemsPerPage,
          portal: selectedPortal !== "all" ? selectedPortal : undefined,
        })

        if (response.success && response.applications) {
          setJobs(response.applications)
          if (response.pagination) {
            setTotalPages(response.pagination.total_pages)
            setTotalJobs(response.pagination.total)
          }
        } else {
          console.error("Error cargando ofertas aplicadas:", response.error)
          setJobs([])
        }
      } catch (error) {
        console.error("Error en loadAppliedJobs:", error)
        setJobs([])
      } finally {
        setLoading(false)
      }
    }

    loadAppliedJobs()
  }, [currentPage, selectedPortal]) // Recargar cuando cambie la página o el portal

  const getPortalIcon = (portal: string) => {
    // The original code only had BsLinkedin, this is a placeholder for others.
    // In a real app, you'd map portal names to their respective icons.
    switch (portal.toLowerCase()) {
      case "linkedin":
        return <BsLinkedin size={24} color="#0077B5" />
      case "indeed":
        return <SiIndeed size={24} color="#0077B5" /> // Placeholder color
      case "glassdoor":
        return <SiGlassdoor size={24} color="#0077B5" /> // Placeholder color
      case "zonajobs":
        return <FcGoogle size={24} /> // Placeholder icon and color
      case "bumeran":
        return <FcGoogle size={24} /> // Placeholder icon and color
      default:
        return <BsLinkedin size={24} color="#0077B5" />
    }
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

  const filterJobs = (jobsToFilter: AppliedJobOffer[]) => {
    return jobsToFilter.filter((job) => {
      const matchesSearch =
        searchTerm.toLowerCase() === "" ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.company_name || job.company || "").toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPortal = selectedPortal === "all" || job.portal.toLowerCase() === selectedPortal.toLowerCase()
      const matchesType = selectedType === "all" || job.workType?.toLowerCase() === selectedType.toLowerCase()
      
      // Filtrar por rango de fechas
      let matchesDateRange = true
      if (job.applied_at) {
        try {
          const jobDate = new Date(job.applied_at)
          if (startDate && jobDate < startDate) matchesDateRange = false
          if (endDate && jobDate > endDate) matchesDateRange = false
        } catch {
          // Si hay error parseando la fecha, no filtrar
        }
      }
      
      return matchesSearch && matchesPortal && matchesType && matchesDateRange
    })
  }

  // Aplicar filtros locales (búsqueda, tipo, fecha) a los datos del servidor
  const filteredJobs = filterJobs(jobs)
  const currentJobs = filteredJobs.map(convertToJobApplication)

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
            onChange={(value) => {
              setSelectedPortal(value)
              setCurrentPage(1) // Resetear a la primera página cuando cambie el filtro
            }}
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

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.columnCompany}>Empresa</div>
          <div className={styles.columnPortal}>Portal</div>
          <div className={styles.columnCountry}>País</div>
          <div className={styles.columnDate}>Fecha</div>
          <div className={styles.columnStatus}>Estado</div>
        </div>

        <div className={styles.tableBody}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <LoadingSpinner />
            </div>
          ) : currentJobs.length === 0 ? (
            <div className={styles.emptyMessage}>No se encontraron ofertas aplicadas</div>
          ) : (
            currentJobs.map((job) => (
            <div 
              key={job.id} 
              className={styles.tableRow} 
              onClick={async () => {
                setLoadingDetail(true)
                try {
                  const response = await getAppliedJobDetail(job.id)
                  if (response.success && response.application) {
                    const fullJob = convertToJobApplication(response.application)
                    setSelectedJob(fullJob)
                  } else {
                    console.error("Error cargando detalle:", response.error)
                    // Fallback: usar los datos que ya tenemos
                    setSelectedJob(job)
                  }
                } catch (error) {
                  console.error("Error cargando detalle:", error)
                  // Fallback: usar los datos que ya tenemos
                  setSelectedJob(job)
                } finally {
                  setLoadingDetail(false)
                }
              }}
            >
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
            ))
          )}
        </div>

        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={(page) => {
            setCurrentPage(page)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }} 
        />
      </div>

      {loadingDetail && <LoadingSpinner />}
      {selectedJob && !loadingDetail && <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  )
}
