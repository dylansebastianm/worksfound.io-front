"use client"

import type React from "react"
import styles from "./DistributionCard.module.css"

export type DistributionItem = {
  name: string
  count?: number
  icon?: React.ReactNode
  inactive?: boolean
  inactiveLabel?: string
}

type Props = {
  title: string
  items: DistributionItem[]
  unitLabelPlural: string
  totalOverride?: number
}

export default function DistributionCard({ title, items, unitLabelPlural, totalOverride }: Props) {
  const activeItems = items.filter((i) => !i.inactive)
  const total = typeof totalOverride === "number" ? totalOverride : activeItems.reduce((acc, i) => acc + (i.count || 0), 0)

  return (
    <div className={styles.card}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.list}>
        {items.map((item) => {
          const isInactive = Boolean(item.inactive)
          const count = item.count || 0
          const percentage = isInactive ? 0 : total > 0 ? Math.round((count / total) * 100) : 0

          return (
            <div key={item.name} className={styles.item}>
              <div className={styles.info}>
                <div className={`${styles.nameWrapper} ${isInactive ? styles.inactive : ""}`}>
                  {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
                  <span className={styles.name}>{item.name}</span>
                </div>
                <span className={styles.rightText}>
                  {isInactive
                    ? item.inactiveLabel || "Próximamente"
                    : `${count.toLocaleString()} ${unitLabelPlural} (${percentage}%)`}
                </span>
              </div>

              {!isInactive && (
                <div className={styles.bar}>
                  <div className={styles.barFill} style={{ width: `${percentage}%` }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


