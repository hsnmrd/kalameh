"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  CalendarDays,
  Clock,
  GraduationCap,
  Info,
  MapPin,
  User,
} from "lucide-react"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogCloseButton,
  ResponsiveDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"
import {
  isJalaliHoliday,
  type InstituteCustomOffDay,
  type TermDto,
  type ClassDto,
} from "@workspace/types"
import {
  toIsoDate,
  formatDisplayDate,
  getActiveTermsForDate,
  getClassesForDate,
  normalizeIsoDate,
} from "../../helper/calendar-schedule.helper"

export interface DayDetailsModalProps {
  open: boolean
  onClose: () => void
  date: Date | null
  locale: "fa" | "en"
  observeOfficialHolidays?: boolean
  customOffDaysList?: InstituteCustomOffDay[]
  terms?: TermDto[]
  classes?: ClassDto[]
}

export function DayDetailsModal({
  open,
  onClose,
  date,
  locale,
  observeOfficialHolidays = true,
  customOffDaysList = [],
  terms = [],
  classes = [],
}: DayDetailsModalProps) {
  const t = useTranslations("setting.offDays")

  if (!date) return null

  const isoDate = toIsoDate(date)
  const displayTitle = formatDisplayDate(date, locale)

  const jalaliCheck = isJalaliHoliday(date)
  const isOfficial = observeOfficialHolidays && jalaliCheck.isHoliday
  const officialTitle =
    locale === "fa"
      ? jalaliCheck.holiday?.titleFa || t("legendOfficialHoliday")
      : jalaliCheck.holiday?.titleEn || t("legendOfficialHoliday")

  const customOff = customOffDaysList.find((c) => c.date === isoDate)
  const isWeekend = locale === "fa" ? date.getDay() === 5 : date.getDay() === 0

  const activeTerms = getActiveTermsForDate(date, terms)
  const scheduledClasses = getClassesForDate(date, classes)

  return (
    <ResponsiveDialog open={open} onOpenChange={(val) => !val && onClose()}>
      <ResponsiveDialogContent className="max-w-lg overflow-hidden p-0 sm:max-w-lg">
        {/* Header with edge-to-edge divider */}
        <ResponsiveDialogHeader className="border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-foreground" />
            <ResponsiveDialogTitle className="text-base font-bold sm:text-lg">
              {displayTitle}
            </ResponsiveDialogTitle>
          </div>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>

        {/* Scrollable Body */}
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {/* Day Status Banner */}
          <div className="flex flex-wrap items-center gap-2">
            {isOfficial && (
              <Badge
                variant="outline"
                className="border-destructive/40 bg-destructive/10 text-xs font-semibold text-destructive"
              >
                {t("legendOfficialHoliday")}: {officialTitle}
              </Badge>
            )}
            {customOff && (
              <Badge
                variant="outline"
                className="border-warning/40 bg-warning/10 text-xs font-semibold text-warning"
              >
                {t("legendCustomOff")}: {customOff.title}
              </Badge>
            )}
            {isWeekend && (
              <Badge
                variant="outline"
                className="border-border bg-muted/30 text-xs font-medium text-muted-foreground"
              >
                {t("fridayWeekend")}
              </Badge>
            )}
            {!isOfficial && !customOff && !isWeekend && (
              <Badge
                variant="outline"
                className="border-success/30 bg-success/10 text-xs font-medium text-success"
              >
                {t("regularWorkingDay")}
              </Badge>
            )}
          </div>

          {/* Active Terms Section */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-muted-foreground">
              {t("activeTermsHeading")}
            </span>
            {activeTerms.length > 0 ? (
              <div className="flex flex-col gap-2">
                {activeTerms.map((term) => (
                  <div
                    key={term.id}
                    className="flex flex-col gap-1.5 rounded-xl border border-primary/30 bg-primary/[0.03] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {term.title}
                      </span>
                      {term.lifecycleStatus && (
                        <Badge
                          variant="outline"
                          className="border-primary/40 bg-primary/10 text-[10px] font-medium text-primary"
                        >
                          {term.lifecycleStatus}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {t("startDate")}: {normalizeIsoDate(term.startDate)}
                      </span>
                      <span>•</span>
                      <span>
                        {t("endDate")}: {normalizeIsoDate(term.endDate)}
                      </span>
                      {typeof term.classesCount === "number" && (
                        <>
                          <span>•</span>
                          <span>
                            {locale === "fa"
                              ? `${formatNumber(term.classesCount, "fa-IR")} کلاس`
                              : t("classesCount", { count: term.classesCount })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border/70 p-3 text-xs text-muted-foreground">
                {t("noTermsOnDay")}
              </p>
            )}
          </div>

          {/* Class Sessions Section */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-muted-foreground">
              {t("classSessionsHeading")}
            </span>
            {scheduledClasses.length > 0 ? (
              <div className="flex flex-col gap-2">
                {scheduledClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {cls.title}
                      </span>
                      {cls.startTime && cls.endTime && (
                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <Clock className="size-3.5 text-muted-foreground" />
                          <span>
                            {cls.startTime} - {cls.endTime}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {cls.course?.title && (
                        <div className="flex items-center gap-1">
                          <GraduationCap className="size-3.5 text-muted-foreground" />
                          <span>{cls.course.title}</span>
                        </div>
                      )}
                      {cls.teacherName && (
                        <div className="flex items-center gap-1">
                          <User className="size-3.5 text-muted-foreground" />
                          <span>{cls.teacherName}</span>
                        </div>
                      )}
                      {cls.classroom?.name && (
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3.5 text-muted-foreground" />
                          <span>{cls.classroom.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border/70 p-3 text-xs text-muted-foreground">
                {t("noClassesOnDay")}
              </p>
            )}
          </div>

          {/* View-Only Consistency Notice */}
          <div className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="leading-relaxed">{t("viewOnlyNotice")}</p>
          </div>
        </div>

        {/* Footer with edge-to-edge divider */}
        <ResponsiveDialogFooter className="border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-6 sm:py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            {t("close")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
