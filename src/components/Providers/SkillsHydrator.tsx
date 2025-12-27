"use client"

import { useEffect } from "react"
import type { Skill } from "@/types/skills"
import { useSkillsStore } from "@/store/skillsStore"

export default function SkillsHydrator({ initialSkills }: { initialSkills: Skill[] }) {
  const loaded = useSkillsStore((s) => s.loaded)
  const setSkills = useSkillsStore((s) => s.setSkills)

  useEffect(() => {
    if (!loaded && Array.isArray(initialSkills) && initialSkills.length > 0) {
      setSkills(initialSkills)
    }
  }, [loaded, initialSkills, setSkills])

  return null
}


