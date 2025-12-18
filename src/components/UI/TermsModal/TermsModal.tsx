"use client"
import styles from "./TermsModal.module.css"

interface TermsModalProps {
  isOpen: boolean
  onAccept: () => void
}

export function TermsModal({ isOpen, onAccept }: TermsModalProps) {
  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Confirmación de Términos y Condiciones</h2>
        </div>

        <div className={styles.content}>
          <p className={styles.intro}>
            Antes de utilizar nuestros servicios, es importante que confirmes haber leído y aceptado nuestros{" "}
            <a
              href="https://www.worksfound.com/terminos-y-condiciones"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Términos y Condiciones
            </a>
            .
          </p>

          <div className={styles.highlights}>
            <h3 className={styles.subtitle}>Puntos importantes a tener en cuenta:</h3>

            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>🚫 Política de No Reembolso</h4>
              <p className={styles.text}>
                Todas las tarifas pagadas son <strong>no reembolsables</strong>, sin excepción, salvo obligación legal o
                acuerdo expreso por escrito. La eliminación de la cuenta no implica reembolso.
              </p>
            </div>

            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>⚠️ No Garantizamos Resultados</h4>
              <p className={styles.text}>
                WorksFound <strong>NO garantiza</strong>:
              </p>
              <ul className={styles.list}>
                <li>Entrevistas o respuestas de empresas</li>
                <li>Ofertas laborales</li>
                <li>Resultados específicos o tiempos de contratación</li>
              </ul>
              <p className={styles.text}>
                Garantizamos el funcionamiento del servicio de Auto-Apply, pero no los resultados laborales.
              </p>
            </div>

            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>💰 AIC - Acuerdo de Ingresos Compartidos</h4>
              <p className={styles.text}>En caso de conseguir empleo con ayuda de WorksFound, aplica el AIC:</p>
              <ul className={styles.list}>
                <li>
                  <strong>10% del salario neto mensual</strong> durante 12 meses
                </li>
                <li>
                  Máximo de <strong>333 USD por mes</strong>
                </li>
                <li>
                  Tope de <strong>4,000 USD por año</strong>
                </li>
              </ul>
              <p className={styles.textSmall}>
                <em>Si no consigues empleo, no pagas AIC.</em>
              </p>
            </div>
          </div>

          <div className={styles.warning}>
            <p className={styles.warningText}>
              <strong>⚠️ Importante:</strong> Si no aceptas estos términos, no podrás utilizar el servicio de WorksFound.
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" onClick={onAccept} className={styles.acceptButton}>
            Confirmo haber leído y acepto los Términos y Condiciones
          </button>
        </div>
      </div>
    </div>
  )
}
