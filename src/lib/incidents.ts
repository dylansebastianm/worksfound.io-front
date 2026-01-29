import { getAuthHeaders } from "./auth"
import type {
  GetJobApplicationAttemptsParams,
  GetJobApplicationAttemptsResponse,
  GetConnectionsParams,
  GetConnectionsResponse,
  GetRunnerIncidentsParams,
  GetRunnerIncidentsResponse,
} from "@/types/admin"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function getRunnerIncidents(params: GetRunnerIncidentsParams = {}): Promise<GetRunnerIncidentsResponse> {
  try {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.userId) queryParams.append("user_id", params.userId.toString())
    if (params.incidentType) queryParams.append("incident_type", params.incidentType)
    if (typeof params.activeOnly === "boolean") queryParams.append("active_only", params.activeOnly ? "true" : "false")
    if (params.sortField) queryParams.append("sort_field", params.sortField)
    if (params.sortDirection) queryParams.append("sort_direction", params.sortDirection)

    const url = `${API_URL}/api/admin/runner-incidents${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    const response = await fetch(url, { method: "GET", headers: getAuthHeaders() })

    if (response.status === 401) {
      return { success: false, error: "Token inválido o expirado. Por favor, inicia sesión nuevamente." }
    }
    if (response.status === 403) {
      return { success: false, error: "Acceso denegado: Se requieren permisos de administrador." }
    }

    return await response.json()
  } catch (error) {
    console.error("Error obteniendo runner incidents:", error)
    return { success: false, error: "Error conectando con el servidor" }
  }
}

export async function getJobApplicationAttempts(
  params: GetJobApplicationAttemptsParams = {},
): Promise<GetJobApplicationAttemptsResponse> {
  try {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.userId) queryParams.append("user_id", params.userId.toString())
    if (params.failureType) queryParams.append("failure_type", params.failureType)
    if (params.failureCode) queryParams.append("failure_code", params.failureCode)
    if (typeof params.easyApply === "boolean") queryParams.append("easy_apply", params.easyApply ? "true" : "false")
    if (params.sortField) queryParams.append("sort_field", params.sortField)
    if (params.sortDirection) queryParams.append("sort_direction", params.sortDirection)

    const url = `${API_URL}/api/admin/job-application-attempts${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    const response = await fetch(url, { method: "GET", headers: getAuthHeaders() })

    if (response.status === 401) {
      return { success: false, error: "Token inválido o expirado. Por favor, inicia sesión nuevamente." }
    }
    if (response.status === 403) {
      return { success: false, error: "Acceso denegado: Se requieren permisos de administrador." }
    }

    return await response.json()
  } catch (error) {
    console.error("Error obteniendo job application attempts:", error)
    return { success: false, error: "Error conectando con el servidor" }
  }
}

export async function getConnections(params: GetConnectionsParams = {}): Promise<GetConnectionsResponse> {
  try {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.success && params.success !== "all") queryParams.append("success", params.success)
    if (params.portal) queryParams.append("portal", params.portal)
    if (params.sortField) queryParams.append("sort_field", params.sortField)
    if (params.sortDirection) queryParams.append("sort_direction", params.sortDirection)

    const url = `${API_URL}/api/admin/connections${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    const response = await fetch(url, { method: "GET", headers: getAuthHeaders() })

    if (response.status === 401) {
      return { success: false, error: "Token inválido o expirado. Por favor, inicia sesión nuevamente." }
    }
    if (response.status === 403) {
      return { success: false, error: "Acceso denegado: Se requieren permisos de administrador." }
    }

    return await response.json()
  } catch (error) {
    console.error("Error obteniendo conexiones:", error)
    return { success: false, error: "Error conectando con el servidor" }
  }
}


