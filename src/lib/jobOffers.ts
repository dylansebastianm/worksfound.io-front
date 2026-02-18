import { getAuthHeaders } from "@/lib/auth"
import type { JobOffersResponse } from "@/types/jobOffers"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function getJobOffers(params: {
  q?: string
  portal?: string
  modality?: string
  easy_apply?: boolean
  status?: string
  page?: number
  limit?: number
}): Promise<JobOffersResponse> {
  try {
    const qs = new URLSearchParams()
    if (params.q) qs.set("q", params.q)
    if (params.portal) qs.set("portal", params.portal)
    if (params.modality) qs.set("modality", params.modality)
    if (typeof params.easy_apply === "boolean") qs.set("easy_apply", String(params.easy_apply))
    if (params.status) qs.set("status", params.status)
    if (params.page) qs.set("page", String(params.page))
    if (params.limit) qs.set("limit", String(params.limit))

    const res = await fetch(`${API_URL}/api/job-offers?${qs.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    if (res.status === 401) return { success: false, error: "Token inválido o expirado. Por favor, inicia sesión nuevamente." }
    if (res.status === 403) return { success: false, error: "Acceso denegado." }
    if (!res.ok) return { success: false, error: "Error obteniendo ofertas." }

    const data = (await res.json()) as JobOffersResponse
    if (!data || typeof data !== "object") return { success: false, error: "Respuesta inválida del servidor." }
    if (!data.success) return { success: false, error: data.error || "Error obteniendo ofertas." }
    if (!Array.isArray(data.offers)) return { success: false, error: "Respuesta inválida: offers no es array." }
    return data
  } catch (e) {
    console.error("Error obteniendo job offers:", e)
    return { success: false, error: "Error conectando con el servidor" }
  }
}

