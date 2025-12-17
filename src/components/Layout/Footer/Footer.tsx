import type React from "react"
import styles from "./Footer.module.css"

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <p className={styles.copyright}>worksfound llc - Todos los derechos reservados 2026</p>
    </footer>
  )
}
