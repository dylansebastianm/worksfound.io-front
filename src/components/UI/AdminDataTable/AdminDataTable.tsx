import { FiChevronDown, FiChevronUp, FiExternalLink } from "react-icons/fi"
import styles from "./AdminDataTable.module.css"

export type SortDirection = "asc" | "desc"

export interface AdminTableColumn<T> {
  key: string
  label: string
  width: string
  sortable?: boolean
  render: (row: T) => React.ReactNode
}

export function AdminDataTable<T>({
  columns,
  rows,
  sortField,
  sortDirection,
  onSort,
  emptyText,
}: {
  columns: AdminTableColumn<T>[]
  rows: T[]
  sortField?: string | null
  sortDirection?: SortDirection
  onSort?: (field: string) => void
  emptyText?: string
}) {
  const columnsTemplate = columns.map((c) => c.width).join(" ")

  return (
    <div className={styles.tableCard} style={{ ["--columns" as any]: columnsTemplate }}>
      {rows.length === 0 ? (
        <div className={styles.emptyState}>{emptyText || "No hay registros para mostrar"}</div>
      ) : (
        <div className={styles.gridTable}>
          <div className={styles.headerRow}>
            {columns.map((col) => {
              const isActive = sortField === col.key
              const canSort = !!col.sortable && !!onSort
              return (
                <div
                  key={col.key}
                  className={`${styles.headerCell} ${styles.cell} ${canSort ? styles.sortableHeader : ""}`}
                  onClick={() => (canSort ? onSort!(col.key) : undefined)}
                >
                  <span className={styles.sortableHeader}>
                    {col.label}
                    {canSort ? (
                      <span className={isActive ? styles.sortIconActive : styles.sortIconInactive}>
                        {sortDirection === "asc" ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                      </span>
                    ) : null}
                  </span>
                </div>
              )
            })}
          </div>

          {rows.map((row, idx) => (
            <div key={idx} className={styles.dataRow}>
              {columns.map((col) => (
                <div key={col.key} className={`${styles.bodyCell} ${styles.cell}`}>
                  {col.render(row)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ExternalLinkCell({ href, text }: { href: string; text?: string }) {
  const label = text || href
  return (
    <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer" title={href}>
      <span className={styles.linkText}>{label}</span>
      <FiExternalLink className={styles.linkIcon} size={14} />
    </a>
  )
}

export function MonoCell({ children }: { children: React.ReactNode }) {
  return <span className={styles.mono}>{children}</span>
}


