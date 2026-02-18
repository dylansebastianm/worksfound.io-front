export interface HiringTeamMember {
  name: string
  profile_url?: string
}

export interface JobOffer {
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
  redirect_url?: string | null
  offer_url: string
  job_description: string
  skills: string[]
  tech_stack: string[]
  hiring_team: HiringTeamMember[]
  scraped_at: string | null
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface JobOffersResponse {
  success: boolean
  offers?: JobOffer[]
  pagination?: PaginationInfo
  error?: string
}

