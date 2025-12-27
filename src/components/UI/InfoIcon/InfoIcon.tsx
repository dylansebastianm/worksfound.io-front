"use client"

import React from "react"
import { FaInfoCircle } from "react-icons/fa"
import styles from "./InfoIcon.module.css"

interface InfoIconProps {
  tooltip: string
  className?: string
}

export const InfoIcon: React.FC<InfoIconProps> = ({ tooltip, className }) => {
  return (
    <div className={`${styles.infoIcon} ${className || ""}`} title={tooltip}>
      <FaInfoCircle size={12} />
    </div>
  )
}

