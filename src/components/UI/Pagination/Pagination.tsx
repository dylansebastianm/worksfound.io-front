"use client"

import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import styles from "./Pagination.module.css"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className={styles.pagination}>
      <button className={styles.navButton} onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        <FiChevronLeft />
      </button>

      <div className={styles.pages}>
        {getPageNumbers().map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index}
              className={`${styles.pageButton} ${page === currentPage ? styles.active : ""}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ) : (
            <span key={index} className={styles.ellipsis}>
              {page}
            </span>
          ),
        )}
      </div>

      <button
        className={styles.navButton}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <FiChevronRight />
      </button>
    </div>
  )
}

export { Pagination }
