/**
 * Tipos globales para ofertas de trabajo
 */

export type JobPortal = "LinkedIn" | "Bumeran" | "Zonajobs" | "Glassdoor" | "Indeed" | "Google Jobs";

export type JobStatus = "applied" | "reviewing" | "interview" | "rejected" | "accepted" | "Postulados" | "En revisión" | "Entrevista" | "Rechazado" | "Aceptado";

export interface RecruiterTeamMember {
  name: string;
  position?: string;
  profileUrl?: string;
}

export interface QuestionAndAnswer {
  question: string;
  answer: string;
  order?: number;
}

/**
 * Tipo base para una oferta de trabajo
 * Contiene los campos mínimos necesarios para mostrar una oferta en una tabla
 */
export interface JobOffer {
  id: number;
  title: string;
  company_name: string;
  portal: JobPortal | string;
  offer_location?: string | null;
  country: string | null;
  applied_at?: string | null;
  status: JobStatus | string;
}

/**
 * Tipo extendido para una oferta aplicada
 * Incluye información adicional de la oferta y la aplicación
 */
export interface AppliedJobOffer extends JobOffer {
  // Información básica adicional
  user_id?: number;
  offer_url?: string;
  company?: string; // Alias de company_name para compatibilidad
  company_url?: string | null;
  linkedin_job_id?: string | null;
  redirect_page_id?: number[] | null;
  
  // Ubicación y modalidad
  offer_location?: string | null;
  modality?: string | null;
  workMode?: string; // Alias de modality
  work_schedule_type?: string | null;
  workType?: string; // Alias de work_schedule_type
  
  // Información de la empresa
  company_logo?: string | null;
  company_followers?: number | null;
  companyFollowers?: number | null; // Alias
  companyCountry?: string | null;
  company_industry?: string | null;
  industry?: string; // Alias de company_industry
  company_employees_count?: string | null;
  companySize?: string; // Alias de company_employees_count
  
  // Información de la oferta
  salary?: string | null;
  job_description?: string | null;
  description?: string; // Alias de job_description
  jobUrl?: string; // Alias de offer_url
  
  // Fechas y tiempos
  date?: string; // Formato legible de applied_at
  scraped_at?: string | null;
  posted_time_ago?: string | null;
  postedAgo?: string; // Alias de posted_time_ago
  evaluation_time?: string | null;
  evaluationTime?: string; // Alias de evaluation_time
  created_at?: string | null;
  updated_at?: string | null;
  
  // Estadísticas
  applicants_count?: number | null;
  applicants?: number; // Alias de applicants_count
  applications_count?: number | null;
  applications?: number; // Alias de applications_count
  
  // Equipo de contratación
  hiring_team?: RecruiterTeamMember[] | null;
  recruiterTeam?: RecruiterTeamMember[]; // Alias de hiring_team
  
  // Tecnologías y habilidades (JSONB en DB, arrays en TypeScript)
  skills?: string[] | null;
  tech_stack?: string[] | null;
  techStack?: string[] | null; // Alias de tech_stack
  
  // Requisitos
  englishRequired?: boolean;
  
  // Información adicional de la aplicación
  easy_apply?: boolean;
  is_redirect?: boolean;
  redirect_page_name?: string | null;
  notes?: string | null;
  questionsAndAnswers?: QuestionAndAnswer[];
  
  // UI helpers (para compatibilidad con componentes existentes)
  countryFlag?: string; // Emoji de bandera del país
}

/**
 * Parámetros para obtener ofertas aplicadas
 */
export interface GetAppliedJobsParams {
  user_id?: number;
  page?: number;
  limit?: number;
  status?: string;
  portal?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Respuesta de la API para obtener ofertas aplicadas
 */
export interface GetAppliedJobsResponse {
  success: boolean;
  applications?: AppliedJobOffer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  error?: string;
}

