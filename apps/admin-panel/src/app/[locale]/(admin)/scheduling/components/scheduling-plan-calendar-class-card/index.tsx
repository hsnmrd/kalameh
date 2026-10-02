"use client"

import * as React from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import {
  Building2,
  DoorOpen,
  Globe,
  LockKeyhole,
  Pencil,
  TriangleAlert,
  User,
  Users,
} from "lucide-react"
import { PERMISSIONS, type SchedulingPlanDetailsDto } from "@workspace/types"
import { cn, formatNumber, getAssetUrl } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"
import { SchedulingProposalActions } from "../scheduling-proposal-actions"
import { SchedulingProposalEditDialog } from "../scheduling-proposal-edit-dialog"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export interface ClassCardColorTheme {
  border: string
  borderStart: string
  bg: string
  divider: string
  badge: string
  dot: string
}

export const CLASS_CARD_THEMES: readonly ClassCardColorTheme[] = [
  {
    border: "border-border/80 hover:border-border",
    borderStart: "border-s-chart-1",
    bg: "bg-card hover:bg-muted/30",
    divider: "border-border/50",
    badge: "bg-muted text-muted-foreground border-border/60",
    dot: "bg-chart-1",
  },
  {
    border: "border-border/80 hover:border-border",
    borderStart: "border-s-chart-2",
    bg: "bg-card hover:bg-muted/30",
    divider: "border-border/50",
    badge: "bg-muted text-muted-foreground border-border/60",
    dot: "bg-chart-2",
  },
  {
    border: "border-border/80 hover:border-border",
    borderStart: "border-s-chart-3",
    bg: "bg-card hover:bg-muted/30",
    divider: "border-border/50",
    badge: "bg-muted text-muted-foreground border-border/60",
    dot: "bg-chart-3",
  },
  {
    border: "border-border/80 hover:border-border",
    borderStart: "border-s-chart-4",
    bg: "bg-card hover:bg-muted/30",
    divider: "border-border/50",
    badge: "bg-muted text-muted-foreground border-border/60",
    dot: "bg-chart-4",
  },
  {
    border: "border-border/80 hover:border-border",
    borderStart: "border-s-chart-5",
    bg: "bg-card hover:bg-muted/30",
    divider: "border-border/50",
    badge: "bg-muted text-muted-foreground border-border/60",
    dot: "bg-chart-5",
  },
  {
    border: "border-border/80 hover:border-border",
    borderStart: "border-s-chart-6",
    bg: "bg-card hover:bg-muted/30",
    divider: "border-border/50",
    badge: "bg-muted text-muted-foreground border-border/60",
    dot: "bg-chart-6",
  },
  {
    border: "border-border/80 hover:border-border",
    borderStart: "border-s-chart-7",
    bg: "bg-card hover:bg-muted/30",
    divider: "border-border/50",
    badge: "bg-muted text-muted-foreground border-border/60",
    dot: "bg-chart-7",
  },
  {
    border: "border-border/80 hover:border-border",
    borderStart: "border-s-chart-8",
    bg: "bg-card hover:bg-muted/30",
    divider: "border-border/50",
    badge: "bg-muted text-muted-foreground border-border/60",
    dot: "bg-chart-8",
  },
] as const

export function getProposalColorIndex(
  id: string,
  modulo: number = CLASS_CARD_THEMES.length
): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % modulo
}

export interface SchedulingPlanCalendarClassCardProps {
  proposal: Proposal
  canEdit: boolean
  colorIndex?: number
  isActive?: boolean
  isSwappable?: boolean
  isDimmed?: boolean
  isCollapsed?: boolean
  hasSameTeacher?: boolean
  hasSameCourse?: boolean
  sameTeacherCount?: number
  sameCourseCount?: number
  onHover?: (id: string | null) => void
  onClick?: (id: string) => void
}

export function SchedulingPlanCalendarClassCard({
  proposal,
  canEdit,
  colorIndex,
  isActive = false,
  isSwappable = false,
  isDimmed = false,
  isCollapsed = false,
  hasSameTeacher = false,
  hasSameCourse = false,
  sameTeacherCount,
  sameCourseCount,
  onHover,
  onClick,
}: SchedulingPlanCalendarClassCardProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [isEditOpen, setIsEditOpen] = React.useState(false)

  const themeIndex =
    colorIndex !== undefined
      ? Math.abs(colorIndex) % CLASS_CARD_THEMES.length
      : getProposalColorIndex(proposal.id, CLASS_CARD_THEMES.length)
  const theme = CLASS_CARD_THEMES[themeIndex]!

  const teacherName = proposal.teacher
    ? `${proposal.teacher.firstName} ${proposal.teacher.lastName}`
    : t("hiringPlan.pendingTeacher")
  const isOnline = proposal.deliveryMode === "ONLINE"
  const locationName = isOnline
    ? t("deliveryModes.ONLINE")
    : proposal.classroom?.name || proposal.branch?.name || t("location")

  const maxCapacity = proposal.classroom?.capacity ?? proposal.capacity
  const capacityPercent =
    maxCapacity > 0 ? Math.round((proposal.capacity / maxCapacity) * 100) : 0

  const hasHighlightTag = hasSameTeacher || hasSameCourse
  const isGrayscale = isDimmed && !isActive && !isSwappable && !hasHighlightTag

  return (
    <>
      <article
        data-testid={`calendar-class-card-${proposal.id}`}
        data-class-id={proposal.id}
        data-color-index={themeIndex}
        data-active={isActive ? "true" : undefined}
        data-swappable={isSwappable ? "true" : undefined}
        data-dimmed={isDimmed ? "true" : undefined}
        data-grayscale={isGrayscale ? "true" : undefined}
        data-collapsed={isCollapsed ? "true" : undefined}
        data-same-teacher={hasSameTeacher ? "true" : undefined}
        data-same-course={hasSameCourse ? "true" : undefined}
        data-same-teacher-count={sameTeacherCount}
        data-same-course-count={sameCourseCount}
        onMouseEnter={() => onHover?.(proposal.id)}
        onMouseLeave={() => onHover?.(null)}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(proposal.id)
        }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClick?.(proposal.id)
          }
        }}
        className={cn(
          "group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-s-2 shadow-2xs transition-[height,padding,background-color,border-color,box-shadow,filter] duration-300 ease-in-out select-none",
          isCollapsed ? "h-[52px] p-2" : "h-[134px] p-2.5",
          theme.border,
          theme.borderStart,
          theme.bg,
          isActive &&
            "z-10 scale-[1.02] opacity-100 shadow-md ring-2 ring-primary",
          isSwappable &&
            "animate-calendar-card-shake z-10 opacity-100 ring-2 ring-primary/60 hover:animate-none",
          isDimmed && "opacity-25 hover:opacity-60",
          isGrayscale && "grayscale hover:grayscale-0"
        )}
        aria-label={proposal.course.title}
      >
        {/* Section 1: Course Title, Location, Quick Capacity, Status & Actions */}
        <div className="flex min-w-0 items-center justify-between gap-2">
          {/* Start (Right): Course Title & Delivery Mode */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className={cn("size-2 shrink-0 rounded-full", theme.dot)}
              aria-hidden="true"
            />
            <h5
              className="truncate text-xs font-bold text-foreground"
              title={proposal.course.title}
            >
              {hasSameCourse ? (
                <mark className="inline-block max-w-full truncate rounded-none bg-[#ffff00] px-0.5 text-black">
                  {proposal.course.title}
                </mark>
              ) : (
                proposal.course.title
              )}
            </h5>
            {hasSameCourse && (
              <span
                data-testid={`same-course-badge-${proposal.id}`}
                className={cn(
                  "shrink-0 rounded border border-primary/40 bg-primary/15 px-1 py-0.5 text-[9px] font-bold text-primary transition-opacity duration-200",
                  isCollapsed && "hidden"
                )}
              >
                {t("calendarView.sameCourseBadge")}
              </span>
            )}
            {proposal.title && proposal.title !== proposal.course.title && (
              <span
                className={cn(
                  "hidden max-w-[130px] truncate rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-opacity duration-200 xl:inline-block",
                  isCollapsed && "hidden",
                  theme.badge
                )}
                title={proposal.title}
              >
                {proposal.title}
              </span>
            )}
            {/* Delivery mode badge pill */}
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {isOnline ? (
                <Globe aria-hidden className="size-2.5 text-inherit" />
              ) : (
                <Building2 aria-hidden className="size-2.5 text-inherit" />
              )}
              <span>
                {isOnline
                  ? t("deliveryModes.ONLINE")
                  : t("deliveryModes.IN_PERSON")}
              </span>
            </span>
          </div>

          {/* Center: Location (Classroom / Room) */}
          <div className="flex shrink-0 items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
            {isOnline ? (
              <Globe
                aria-hidden
                className="size-3 shrink-0 text-muted-foreground"
              />
            ) : (
              <DoorOpen
                aria-hidden
                className="size-3 shrink-0 text-muted-foreground"
              />
            )}
            <span className="max-w-[130px] truncate font-medium text-foreground/90">
              {locationName}
            </span>
          </div>

          {/* End (Left): Capacity Quick Badge, Status Icons & Actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Capacity quick pill */}
            <div
              className="flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-foreground/90 tabular-nums"
              title={t("calendarView.capacityLabel", {
                current: formatNumber(proposal.capacity, locale),
                max: formatNumber(maxCapacity, locale),
              })}
            >
              <Users
                aria-hidden
                className="size-3 shrink-0 text-muted-foreground"
              />
              <span>{formatNumber(proposal.capacity, locale)}</span>
              {proposal.classroom?.capacity && (
                <span className="text-[10px] font-normal text-muted-foreground">
                  /{formatNumber(maxCapacity, locale)}
                </span>
              )}
            </div>

            {proposal.isLocked && (
              <span
                title={t("states.locked")}
                className="flex size-4 items-center justify-center text-muted-foreground"
              >
                <LockKeyhole aria-hidden className="size-3" />
              </span>
            )}
            {proposal.isManuallyEdited && (
              <span
                title={t("states.edited")}
                className="flex size-4 items-center justify-center text-warning"
              >
                <Pencil aria-hidden className="size-3" />
              </span>
            )}
            {proposal.warnings.length > 0 && (
              <span
                title={`${proposal.warnings.length} warning(s)`}
                className="flex size-4 items-center justify-center text-warning"
              >
                <TriangleAlert aria-hidden className="size-3" />
              </span>
            )}
            {canEdit && !proposal.publishedClassId && (
              <div onClick={(e) => e.stopPropagation()}>
                <PermissionGuard
                  permission={PERMISSIONS.MANAGE_CLASSES}
                  mode="hide"
                >
                  <SchedulingProposalActions
                    proposal={proposal}
                    onEdit={() => setIsEditOpen(true)}
                  />
                </PermissionGuard>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Teacher, Branch Meta & Occupancy Progress */}
        <div
          className={cn(
            "flex items-center justify-between gap-2 text-[11px] text-muted-foreground transition-all duration-300",
            !isCollapsed && cn("border-t pt-2", theme.divider)
          )}
        >
          {/* Teacher (Always visible) */}
          <div className="flex min-w-0 items-center gap-1.5 truncate">
            <div className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/70 text-muted-foreground">
              {proposal.teacher?.avatarUrl ? (
                <Image
                  src={getAssetUrl(proposal.teacher.avatarUrl)}
                  alt={teacherName}
                  width={20}
                  height={20}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : (
                <User
                  aria-hidden
                  className={cn(
                    "size-3 shrink-0",
                    hasSameTeacher ? "text-primary" : "text-muted-foreground"
                  )}
                />
              )}
            </div>
            {hasSameTeacher ? (
              <mark className="inline-block max-w-full truncate rounded-none bg-[#67e8f9] px-0.5 font-semibold text-black">
                {teacherName}
              </mark>
            ) : (
              <span className="truncate font-semibold text-foreground/90">
                {teacherName}
              </span>
            )}
            {hasSameTeacher && (
              <span
                data-testid={`same-teacher-badge-${proposal.id}`}
                className={cn(
                  "shrink-0 rounded border border-primary/40 bg-primary/15 px-1 text-[9px] font-bold text-primary",
                  isCollapsed && "hidden"
                )}
              >
                {t("calendarView.sameTeacherBadge")}
              </span>
            )}
          </div>

          {/* Branch / Secondary venue details (Center) */}
          <div className="hidden min-w-0 items-center gap-1 truncate text-[10px] text-muted-foreground sm:flex">
            {proposal.branch?.name && (
              <>
                <Building2
                  aria-hidden
                  className="size-3 shrink-0 text-muted-foreground"
                />
                <span className="truncate">{proposal.branch.name}</span>
              </>
            )}
          </div>

          {/* Occupancy Progress Bar (End) */}
          {proposal.classroom?.capacity ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <div
                className="h-1.5 w-16 overflow-hidden rounded-full bg-muted/80 sm:w-24"
                title={`${capacityPercent}%`}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    proposal.capacity >= maxCapacity
                      ? "bg-warning"
                      : "bg-primary"
                  )}
                  style={{
                    width: `${Math.min(capacityPercent, 100)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                {formatNumber(capacityPercent, locale)}%
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              {formatNumber(proposal.capacity, locale)} نفر
            </span>
          )}
        </div>

        {/* Section 3: Capacity Info & Visual Meter (Expanded View) */}
        <div
          data-testid={`calendar-class-card-details-${proposal.id}`}
          aria-hidden={isCollapsed}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
            isCollapsed
              ? "pointer-events-none grid-rows-[0fr] opacity-0"
              : "grid-rows-[1fr] opacity-100"
          )}
        >
          <div className="overflow-hidden">
            <div
              className={cn(
                "flex items-center justify-between border-t pt-2 text-[11px]",
                theme.divider
              )}
              aria-label={t("calendarView.capacityLabel", {
                current: formatNumber(proposal.capacity, locale),
                max: formatNumber(maxCapacity, locale),
              })}
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users aria-hidden className="size-3.5 shrink-0" />
                <span className="text-[10px] font-medium">{t("capacity")}</span>
              </div>
              <div className="flex items-center gap-2.5">
                {proposal.classroom?.capacity && (
                  <div className="hidden items-center gap-1.5 sm:flex">
                    <div
                      className="h-2 w-24 overflow-hidden rounded-full bg-muted/80 sm:w-32"
                      title={`${capacityPercent}%`}
                    >
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          proposal.capacity >= maxCapacity
                            ? "bg-warning"
                            : "bg-primary"
                        )}
                        style={{
                          width: `${Math.min(capacityPercent, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                      {formatNumber(capacityPercent, locale)}%
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs font-bold text-foreground tabular-nums">
                  <span>{formatNumber(proposal.capacity, locale)}</span>
                  {proposal.classroom?.capacity && (
                    <span className="text-[10px] font-normal text-muted-foreground">
                      / {formatNumber(maxCapacity, locale)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {isEditOpen && (
        <SchedulingProposalEditDialog
          open={isEditOpen}
          proposal={proposal}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </>
  )
}
