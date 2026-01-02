/**
 * Tipos globales para el módulo de administración
 */

export interface PortalStatistics {
  name: string;
  count: number;
}

export interface AdminStatistics {
  users: {
    total: number;
    active: number;
    contracted: number;
    cancelled: number;
    contractedPercentage: number;
    avgContractDays: number;
  };
  offers: {
    total: number;
    byPortal: PortalStatistics[];
    redirectsOffers?: PortalStatistics[];
  };
  applications: {
    total: number;
    byPortal: PortalStatistics[];
  };
  ai?: {
    responsesTotal: number;
  };
}

export interface GetAdminStatisticsResponse {
  success: boolean;
  statistics?: AdminStatistics;
  error?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RunnerIncident {
  id: number;
  user_id: number;
  user_email?: string | null;
  user_name?: string | null;
  incident_type: string;
  severity: "info" | "warning" | "blocker" | string;
  started_at: string | null;
  detected_at: string | null;
  cooldown_until: string | null;
  resolved_at: string | null;
  last_error?: string | null;
  metadata?: any;
  resolved_by_job_application_id?: number | null;
  resolved_by_offer_url?: string | null;
  resolved_by_linkedin_job_id?: string | null;
}

export interface JobApplicationAttempt {
  id: number;
  user_id: number;
  user_email?: string | null;
  user_name?: string | null;
  offer_url?: string | null;
  linkedin_job_id?: string | null;
  portal?: string | null;
  easy_apply?: boolean | null;
  redirect_page_name?: string | null;
  error_type: "job_closed" | "other" | string;
  failure_code?: string | null;
  error_log?: string | null;
  step?: string | null;
  created_at: string | null;
}

export interface GetRunnerIncidentsParams {
  page?: number;
  limit?: number;
  userId?: number;
  incidentType?: string;
  activeOnly?: boolean;
  sortField?: "detected_at" | "started_at" | "cooldown_until";
  sortDirection?: "asc" | "desc";
}

export interface GetRunnerIncidentsResponse {
  success: boolean;
  incidents?: RunnerIncident[];
  pagination?: PaginationInfo;
  error?: string;
}

export interface GetJobApplicationAttemptsParams {
  page?: number;
  limit?: number;
  userId?: number;
  failureType?: "job_closed" | "other";
  failureCode?: string;
  easyApply?: boolean;
  sortField?: "created_at";
  sortDirection?: "asc" | "desc";
}

export interface GetJobApplicationAttemptsResponse {
  success: boolean;
  attempts?: JobApplicationAttempt[];
  pagination?: PaginationInfo;
  error?: string;
}

