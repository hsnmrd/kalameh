"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock, AlertCircle } from "lucide-react"

export interface ReservationTimerProps {
  initialSeconds: number
  onExpire?: () => void
}

export function ReservationTimer({
  initialSeconds,
  onExpire,
}: ReservationTimerProps) {
  const t = useTranslations("enrollments.timer")
  const [prevInitialSeconds, setPrevInitialSeconds] =
    React.useState(initialSeconds)
  const [secondsLeft, setSecondsLeft] = React.useState(initialSeconds)

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

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const isExpired = secondsLeft <= 0
  const isUrgent = secondsLeft > 0 && secondsLeft <= 300 // < 5 mins

  if (isExpired) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="size-5 shrink-0" />
        <p className="text-xs font-semibold">{t("expired")}</p>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-4 transition-colors ${
        isUrgent
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-warning/40 bg-warning/10 text-warning"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Clock className="size-5 shrink-0" />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground">
            {t("title")}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {t("warning")}
          </span>
        </div>
      </div>

      <div
        dir="ltr"
        className="flex items-baseline gap-1 font-mono text-xl font-extrabold tracking-wider text-foreground tabular-nums"
      >
        <span>{String(minutes).padStart(2, "0")}</span>
        <span>:</span>
        <span>{String(seconds).padStart(2, "0")}</span>
      </div>
    </div>
  )
}
