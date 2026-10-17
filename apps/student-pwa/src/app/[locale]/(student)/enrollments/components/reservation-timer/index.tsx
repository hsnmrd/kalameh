"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock, AlertCircle } from "lucide-react"
import { ReservationStickyBar } from "../reservation-sticky-bar"

export interface ReservationTimerProps {
  initialSeconds: number
  onExpire?: () => void
  tuition?: number
}

export function ReservationTimer({
  initialSeconds,
  onExpire,
  tuition,
}: ReservationTimerProps) {
  const t = useTranslations("enrollments.timer")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [prevInitialSeconds, setPrevInitialSeconds] =
    React.useState(initialSeconds)
  const [secondsLeft, setSecondsLeft] = React.useState(initialSeconds)
  const [isPassed, setIsPassed] = React.useState(false)

  if (initialSeconds !== prevInitialSeconds) {
    setPrevInitialSeconds(initialSeconds)
    setSecondsLeft(initialSeconds)
  }

  React.useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire?.()
      return
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [secondsLeft, onExpire])

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const checkPassed = () => {
      const rect = el.getBoundingClientRect()
      // The section has passed once its bottom has scrolled under the sticky toolbar (height 64px)
      setIsPassed(rect.bottom <= 64)
    }

    checkPassed()

    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (!entry) return
          // If the element is not intersecting and its bottom is at or above the toolbar line (64px)
          const passed =
            !entry.isIntersecting && entry.boundingClientRect.bottom <= 64
          setIsPassed(passed)
        },
        {
          rootMargin: "-64px 0px 0px 0px",
          threshold: [0],
        }
      )
      observer.observe(el)
    }

    window.addEventListener("scroll", checkPassed, { passive: true })
    window.addEventListener("resize", checkPassed, { passive: true })

    return () => {
      observer?.disconnect()
      window.removeEventListener("scroll", checkPassed)
      window.removeEventListener("resize", checkPassed)
    }
  }, [])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const isExpired = secondsLeft <= 0
  const isUrgent = secondsLeft > 0 && secondsLeft <= 300 // < 5 mins

  if (isExpired) {
    return (
      <div
        ref={containerRef}
        className="flex items-center gap-3 border-y border-destructive/40 px-1 py-3.5 text-destructive"
      >
        <AlertCircle className="size-5 shrink-0" />
        <p className="text-xs font-semibold">{t("expired")}</p>
      </div>
    )
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`flex items-center justify-between border-y px-1 py-3.5 transition-colors ${
          isUrgent
            ? "border-destructive/40 text-destructive"
            : "border-warning/40 text-warning"
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock className="size-4.5 shrink-0" />
          <span className="text-xs font-bold text-foreground">
            {t("title")}
          </span>
        </div>

        <div
          dir="ltr"
          className="flex items-baseline gap-1 font-sans text-xl font-extrabold tracking-wider text-foreground tabular-nums"
        >
          <span>{String(minutes).padStart(2, "0")}</span>
          <span>:</span>
          <span>{String(seconds).padStart(2, "0")}</span>
        </div>
      </div>

      <ReservationStickyBar
        minutes={minutes}
        seconds={seconds}
        isUrgent={isUrgent}
        tuition={tuition}
        visible={isPassed && !isExpired}
      />
    </>
  )
}
