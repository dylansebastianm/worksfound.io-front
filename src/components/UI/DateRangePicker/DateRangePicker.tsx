"use client"

import { useState, useRef, useEffect } from "react"
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi"
import styles from "./DateRangePicker.module.css"

interface DateRangePickerProps {
  startDate?: Date | null
  endDate?: Date | null
  onChange?: (startDate: Date | null, endDate: Date | null) => void
  placeholder?: string
}

export const DateRangePicker = ({
  startDate = null,
  endDate = null,
  onChange,
  placeholder = "dd/mm/aaa",
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingStart, setSelectingStart] = useState(true)
  const [localStartDate, setLocalStartDate] = useState<Date | null>(startDate)
  const [localEndDate, setLocalEndDate] = useState<Date | null>(endDate)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const formatDisplayDate = () => {
    if (!localStartDate && !localEndDate) return placeholder

    const formatDate = (date: Date) =>
      date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })

    if (localStartDate && localEndDate) {
      return `${formatDate(localStartDate)} - ${formatDate(localEndDate)}`
    }

    if (localStartDate) {
      return formatDate(localStartDate)
    }

    return placeholder
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

    if (selectingStart || !localStartDate) {
      setLocalStartDate(selectedDate)
      setLocalEndDate(null)
      setSelectingStart(false)
    } else {
      if (selectedDate < localStartDate) {
        setLocalStartDate(selectedDate)
        setLocalEndDate(null)
      } else {
        setLocalEndDate(selectedDate)
        setSelectingStart(true)
      }
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleToday = () => {
    const today = new Date()
    setLocalStartDate(today)
    setLocalEndDate(today)
    setCurrentMonth(today)
    if (onChange) {
      onChange(today, today)
    }
    setIsOpen(false)
  }

  const handleClear = () => {
    setLocalStartDate(null)
    setLocalEndDate(null)
    setSelectingStart(true)
    if (onChange) {
      onChange(null, null)
    }
  }

  const isDateInRange = (day: number) => {
    if (!localStartDate || !localEndDate) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date >= localStartDate && date <= localEndDate
  }

  const isDateSelected = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateString = date.toDateString()
    return (
      (localStartDate && dateString === localStartDate.toDateString()) ||
      (localEndDate && dateString === localEndDate.toDateString())
    )
  }

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className={styles.dayEmpty} />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isDateSelected(day)
      const isInRange = isDateInRange(day)

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          className={`${styles.day} ${isSelected ? styles.daySelected : ""} ${isInRange ? styles.dayInRange : ""}`}
        >
          {day}
        </button>,
      )
    }

    return days
  }

  const monthName = currentMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" })

  return (
    <div className={styles.container} ref={containerRef}>
      <button type="button" className={styles.trigger} onClick={() => setIsOpen(!isOpen)}>
        <FiCalendar className={styles.icon} />
        <span className={styles.displayText}>{formatDisplayDate()}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.calendarHeader}>
            <button type="button" onClick={handlePrevMonth} className={styles.navButton}>
              <FiChevronLeft size={20} />
            </button>
            <span className={styles.monthYear}>{monthName}</span>
            <button type="button" onClick={handleNextMonth} className={styles.navButton}>
              <FiChevronRight size={20} />
            </button>
          </div>

          <div className={styles.weekDays}>
            {["do", "lu", "ma", "mi", "ju", "vi", "sa"].map((day) => (
              <div key={day} className={styles.weekDay}>
                {day}
              </div>
            ))}
          </div>

          <div className={styles.daysGrid}>{renderCalendar()}</div>

          <div className={styles.actions}>
            <button type="button" onClick={handleClear} className={styles.clearButton}>
              Borrar
            </button>
            <button type="button" onClick={handleToday} className={styles.todayButton}>
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
