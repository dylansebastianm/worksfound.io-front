"use client"

import type React from "react"

import { IoLogoWhatsapp } from "react-icons/io5"
import styles from "./FloatingWhatsApp.module.css"

interface FloatingWhatsAppProps {
  phoneNumber: string
  message?: string
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  phoneNumber,
  message = "Hola, necesito soporte con worksfound.io",
}) => {
  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <button className={styles.floatingButton} onClick={handleClick} aria-label="Contactar por WhatsApp">
      <IoLogoWhatsapp className={styles.icon} />
    </button>
  )
}
