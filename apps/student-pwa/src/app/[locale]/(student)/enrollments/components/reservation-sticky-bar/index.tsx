"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Clock } from "lucide-react"
import { Price } from "@workspace/ui/components/price"
import { cn } from "@workspace/ui/lib/utils"

export interface ReservationStickyBarProps {
  minutes: number
  seconds: number
  isUrgent?: boolean
  tuition?: number
  visible: boolean
}

export function ReservationStickyBar({
  minutes,
  seconds,
  isUrgent,
  tuition,
  visible,
}: ReservationStickyBarProps) {
  const t = useTranslations("enrollments")
  const locale = useLocale()

  return (
    <div
      data-testid="reservation-sticky-bar"
      aria-hidden={!visible}
      className={cn(
        "fixed top-16 left-1/2 z-25 w-full max-w-[480px] -translate-x-1/2 transition-all duration-300 ease-in-out",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-2.5 shadow-xs backdrop-blur-md transition-colors",
          isUrgent
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-border/80 bg-card/95 text-card-foreground"
        )}
      >
        {/* Timer Section */}
        <div className="flex items-center gap-2">
          <Clock
            className={cn(
              "size-4 shrink-0 transition-colors",
              isUrgent ? "animate-pulse text-destructive" : "text-amber-500"
            )}
            aria-hidden="true"
          />
          <div className="flex flex-col">
            <span className="text-[10px] leading-none font-medium text-muted-foreground">
              {t("timer.stickyTimerLabel")}
            </span>
            <span
              dir="ltr"
              className={cn(
                "mt-0.5 font-sans text-sm leading-none font-extrabold tracking-wider tabular-nums",
                isUrgent ? "text-destructive" : "text-foreground"
              )}
            >
              {String(minutes).padStart(2, "0")}:
              {String(seconds).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Tuition Price Section (Across from timer) */}
        {tuition !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("timer.stickyTuitionLabel")}:
            </span>
            <Price
              amount={tuition}
              locale={locale}
              className="text-sm font-extrabold text-foreground"
            />
          </div>
        )}
      </div>
    </div>
  )
}
