"use client"

import { create } from "zustand"
import type { Skill } from "@/types/skills"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

type SkillsState = {
  skills: Skill[]
  loaded: boolean
  loading: boolean
  error?: string
  setSkills: (skills: Skill[]) => void
  loadSkills: () => Promise<void>
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: [],
  loaded: false,
  loading: false,
  error: undefined,

  setSkills: (skills) => set({ skills, loaded: true, loading: false, error: undefined }),

  loadSkills: async () => {
    const { loaded, loading } = get()
    if (loaded || loading) return

    set({ loading: true, error: undefined })

    try {
      const res = await fetch(`${API_URL}/api/skills`, { method: "GET" })
      const data = await res.json()

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "No se pudo cargar skills")
      }

      set({ skills: Array.isArray(data.skills) ? data.skills : [], loaded: true, loading: false })
    } catch (e: any) {
      set({ loading: false, error: e?.message || "Error cargando skills" })
    }
  },
}))


