"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import {
  Layers,
  GraduationCap,
  Users,
  Building,
  CalendarClock,
  Clock,
  CalendarDays,
  Edit2,
  CalendarCheck,
  DoorOpen,
} from "lucide-react"
import { Link } from "@/i18n/routing"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Price } from "@workspace/ui/components/price"
import { cn, formatDate, formatNumber } from "@workspace/ui/lib/utils"
import { PERMISSIONS, type ClassDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

export interface ClassDetailsModalProps {
  cls: ClassDto | null
  open: boolean
  onClose: () => void
  onEdit?: (cls: ClassDto) => void
}

export function ClassDetailsModal({
  cls,
  open,
  onClose,
  onEdit,
}: ClassDetailsModalProps) {
  const t = useTranslations("classes")
  const locale = useLocale()
  const [showAllDates, setShowAllDates] = React.useState(false)

  if (!cls) return null

  const enrolled = cls.enrolledCount ?? 0
  const capacity = cls.capacity
  const isFull = enrolled >= capacity
  const fillPercent =
    capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0

  const sortedDates = cls.sessionDates ? [...cls.sessionDates].sort() : []
  const hasDates = sortedDates.length > 0
  const firstDate = sortedDates[0]
  const lastDate = sortedDates[sortedDates.length - 1]

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setShowAllDates(false)
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-lg">
        <FormDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="size-5" />
            </div>
            <div>
              <FormDialogTitle className="text-base font-bold text-foreground sm:text-lg">
                {cls.title}
              </FormDialogTitle>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>{cls.course?.title || "-"}</span>
                {cls.term?.title && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-foreground">
                      {cls.term.title}
                    </span>
                  </>
                )}
                {cls.term?.isActive && (
                  <Badge
                    variant="outline"
                    className="h-4 border-success/30 bg-success/15 px-1.5 text-[10px] font-medium text-success"
                  >
                    {t("createModal.activeTermBadge")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Instructor */}
            <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <GraduationCap className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-muted-foreground">
                  {t("detailsModal.teacher")}
                </span>
                <span className="block truncate text-sm font-semibold text-foreground">
                  {cls.teacherName || t("detailsModal.noTeacher")}
                </span>
              </div>
            </div>

            {/* Tuition Fee */}
            <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <span className="text-xs font-bold text-muted-foreground">
                  {locale === "fa" ? "ت" : "$"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-muted-foreground">
                  {t("detailsModal.tuition")}
                </span>
                <Price
                  amount={cls.fee}
                  locale={locale}
                  className="text-sm font-semibold text-foreground"
                />
              </div>
            </div>

            {/* Capacity & Enrollment */}
            <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Users className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-muted-foreground">
                  {t("detailsModal.enrollment")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {formatNumber(enrolled, locale)} /{" "}
                    {formatNumber(capacity, locale)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-4 px-1.5 text-[10px] font-medium",
                      isFull
                        ? "border-rose-500/30 bg-rose-500/15 text-rose-600"
                        : "border-success/30 bg-success/15 text-success"
                    )}
                  >
                    {fillPercent}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Location & Room */}
            <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Building className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-muted-foreground">
                  {t("detailsModal.branch")}
                </span>
                <span className="block truncate text-sm font-semibold text-foreground">
                  {cls.branch?.name || t("detailsModal.noBranch")}
                </span>
                {cls.classroom?.name && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <DoorOpen className="size-3 text-muted-foreground" />
                    <span>{cls.classroom.name}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Schedule & Sessions Overview */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {t("detailsModal.schedule")}
                </span>
              </div>
              {hasDates && (
                <Badge
                  variant="secondary"
                  className="h-5 gap-1 px-2 text-[11px] font-medium"
                >
                  <CalendarCheck className="size-3 text-muted-foreground" />
                  <span>
                    {t("scheduleDetails.sessionCount", {
                      count: sortedDates.length,
                    })}
                  </span>
                </Badge>
              )}
            </div>

            <div className="space-y-3 pt-3">
              {/* Day Badges */}
              {cls.daysOfWeek && cls.daysOfWeek.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {cls.daysOfWeek.map((day) => {
                    const upperDay = day.toUpperCase()
                    let label = day
                    try {
                      label = t(`scheduleWizard.days.${upperDay}` as any) || day
                    } catch {
                      label = day
                    }
                    return (
                      <Badge
                        key={day}
                        variant="outline"
                        className="h-6 rounded-lg border-border/70 bg-background px-2.5 text-xs font-normal text-foreground"
                      >
                        {label}
                      </Badge>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {cls.schedule || t("detailsModal.noSchedule")}
                </p>
              )}

              {/* Time slot & Range */}
              {cls.startTime && cls.endTime && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    {t("scheduleDetails.timeSlot", {
                      start: cls.startTime,
                      end: cls.endTime,
                    })}
                  </span>
                </div>
              )}

              {firstDate && lastDate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    {t("scheduleDetails.dateRange", {
                      start: formatDate(firstDate, locale),
                      end: formatDate(lastDate, locale),
                    })}
                  </span>
                </div>
              )}

              {/* Calendar Session Dates List */}
              {hasDates && (
                <div className="border-t border-border/40 pt-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAllDates((prev) => !prev)}
                    className="flex cursor-pointer items-center justify-between text-[11px] font-medium text-primary hover:underline"
                  >
                    <span>
                      {t("detailsModal.sessionDates", {
                        count: sortedDates.length,
                      })}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {showAllDates ? "▲" : "▼"}
                    </span>
                  </button>

                  {showAllDates && (
                    <div className="mt-2 flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-border/60 bg-background p-2">
                      {sortedDates.map((dateStr, idx) => (
                        <span
                          key={dateStr}
                          className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                        >
                          <span className="me-1 text-[10px] text-muted-foreground">
                            #{formatNumber(idx + 1, locale)}
                          </span>
                          {formatDate(dateStr, locale)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <FormDialogFooter className="justify-between gap-2 sm:justify-between">
          <div className="flex items-center gap-2">
            <PermissionGuard
              permission={[PERMISSIONS.VIEW_GRADES, PERMISSIONS.MANAGE_GRADES]}
              mode="hide"
            >
              <Link href={`/classes/${cls.id}/grades`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl text-xs text-primary"
                >
                  <GraduationCap className="size-4" />
                  <span>{t("detailsModal.viewGrades")}</span>
                </Button>
              </Link>
            </PermissionGuard>

            <PermissionGuard
              permission={PERMISSIONS.MANAGE_CLASSES}
              mode="hide"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onEdit?.(cls)
                }}
                className="gap-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="size-3.5" />
                <span>{t("detailsModal.editClass")}</span>
              </Button>
            </PermissionGuard>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs"
          >
            {t("detailsModal.close")}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
