"use client"

import * as React from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowLeftRight,
  DoorOpen,
  Globe,
  LockKeyhole,
  Pencil,
  Trash2,
  User,
  Users,
} from "lucide-react"
import { PERMISSIONS, type SchedulingPlanDetailsDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { cn, formatNumber, getAssetUrl } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"
import { SchedulingProposalActions } from "../scheduling-proposal-actions"
import { SchedulingProposalEditDialog } from "../scheduling-proposal-edit-dialog"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

const KNOWN_WARNING_CODES = new Set([
  "GENERATION_PENDING",
  "MISSING_SCHEDULED_CLASSES",
  "NEUTRAL_TIME_GROUP_USED",
  "TIME_PATTERN_NOT_DIVERSE",
  "TIME_GROUP_IMBALANCED",
  "MANUAL_EDIT_REQUIRES_VALIDATION",
])

export interface ClassCardColorTheme {
  border: string
  borderStart: string
  bg: string
  divider: string
  badge: string
  dot: string
}

export interface ColorTone {
  borderStart: string
  dot: string
}

export interface ColorFamily {
  name: string
  tones: readonly ColorTone[]
}

export const COLOR_FAMILIES: readonly ColorFamily[] = [
  {
    name: "blue",
    tones: [
      { borderStart: "border-s-blue-500", dot: "bg-blue-500" },
      { borderStart: "border-s-sky-500", dot: "bg-sky-500" },
      { borderStart: "border-s-indigo-500", dot: "bg-indigo-500" },
      { borderStart: "border-s-blue-600", dot: "bg-blue-600" },
      { borderStart: "border-s-sky-400", dot: "bg-sky-400" },
      { borderStart: "border-s-indigo-600", dot: "bg-indigo-600" },
    ],
  },
  {
    name: "emerald",
    tones: [
      { borderStart: "border-s-emerald-500", dot: "bg-emerald-500" },
      { borderStart: "border-s-green-500", dot: "bg-green-500" },
      { borderStart: "border-s-teal-500", dot: "bg-teal-500" },
      { borderStart: "border-s-emerald-600", dot: "bg-emerald-600" },
      { borderStart: "border-s-green-600", dot: "bg-green-600" },
      { borderStart: "border-s-teal-600", dot: "bg-teal-600" },
    ],
  },
  {
    name: "violet",
    tones: [
      { borderStart: "border-s-violet-500", dot: "bg-violet-500" },
      { borderStart: "border-s-purple-500", dot: "bg-purple-500" },
      { borderStart: "border-s-fuchsia-500", dot: "bg-fuchsia-500" },
      { borderStart: "border-s-violet-600", dot: "bg-violet-600" },
      { borderStart: "border-s-purple-600", dot: "bg-purple-600" },
      { borderStart: "border-s-fuchsia-600", dot: "bg-fuchsia-600" },
    ],
  },
  {
    name: "amber",
    tones: [
      { borderStart: "border-s-amber-500", dot: "bg-amber-500" },
      { borderStart: "border-s-orange-500", dot: "bg-orange-500" },
      { borderStart: "border-s-yellow-500", dot: "bg-yellow-500" },
      { borderStart: "border-s-amber-600", dot: "bg-amber-600" },
      { borderStart: "border-s-orange-600", dot: "bg-orange-600" },
      { borderStart: "border-s-yellow-600", dot: "bg-yellow-600" },
    ],
  },
  {
    name: "rose",
    tones: [
      { borderStart: "border-s-rose-500", dot: "bg-rose-500" },
      { borderStart: "border-s-pink-500", dot: "bg-pink-500" },
      { borderStart: "border-s-rose-600", dot: "bg-rose-600" },
      { borderStart: "border-s-pink-600", dot: "bg-pink-600" },
      { borderStart: "border-s-rose-400", dot: "bg-rose-400" },
      { borderStart: "border-s-pink-400", dot: "bg-pink-400" },
    ],
  },
  {
    name: "cyan",
    tones: [
      { borderStart: "border-s-cyan-500", dot: "bg-cyan-500" },
      { borderStart: "border-s-sky-500", dot: "bg-sky-500" },
      { borderStart: "border-s-teal-400", dot: "bg-teal-400" },
      { borderStart: "border-s-cyan-600", dot: "bg-cyan-600" },
      { borderStart: "border-s-sky-600", dot: "bg-sky-600" },
      { borderStart: "border-s-cyan-400", dot: "bg-cyan-400" },
    ],
  },
  {
    name: "coral",
    tones: [
      { borderStart: "border-s-red-500", dot: "bg-red-500" },
      { borderStart: "border-s-rose-600", dot: "bg-rose-600" },
      { borderStart: "border-s-orange-600", dot: "bg-orange-600" },
      { borderStart: "border-s-red-600", dot: "bg-red-600" },
      { borderStart: "border-s-red-400", dot: "bg-red-400" },
      { borderStart: "border-s-rose-700", dot: "bg-rose-700" },
    ],
  },
  {
    name: "lime",
    tones: [
      { borderStart: "border-s-lime-500", dot: "bg-lime-500" },
      { borderStart: "border-s-green-400", dot: "bg-green-400" },
      { borderStart: "border-s-emerald-400", dot: "bg-emerald-400" },
      { borderStart: "border-s-lime-600", dot: "bg-lime-600" },
      { borderStart: "border-s-green-500", dot: "bg-green-500" },
      { borderStart: "border-s-lime-400", dot: "bg-lime-400" },
    ],
  },
  {
    name: "indigo",
    tones: [
      { borderStart: "border-s-indigo-600", dot: "bg-indigo-600" },
      { borderStart: "border-s-blue-700", dot: "bg-blue-700" },
      { borderStart: "border-s-violet-600", dot: "bg-violet-600" },
      { borderStart: "border-s-indigo-500", dot: "bg-indigo-500" },
      { borderStart: "border-s-indigo-400", dot: "bg-indigo-400" },
      { borderStart: "border-s-slate-500", dot: "bg-slate-500" },
    ],
  },
  {
    name: "fuchsia",
    tones: [
      { borderStart: "border-s-fuchsia-600", dot: "bg-fuchsia-600" },
      { borderStart: "border-s-pink-600", dot: "bg-pink-600" },
      { borderStart: "border-s-purple-700", dot: "bg-purple-700" },
      { borderStart: "border-s-fuchsia-500", dot: "bg-fuchsia-500" },
      { borderStart: "border-s-rose-600", dot: "bg-rose-600" },
      { borderStart: "border-s-fuchsia-400", dot: "bg-fuchsia-400" },
    ],
  },
  {
    name: "teal",
    tones: [
      { borderStart: "border-s-teal-600", dot: "bg-teal-600" },
      { borderStart: "border-s-emerald-600", dot: "bg-emerald-600" },
      { borderStart: "border-s-cyan-700", dot: "bg-cyan-700" },
      { borderStart: "border-s-teal-500", dot: "bg-teal-500" },
      { borderStart: "border-s-teal-400", dot: "bg-teal-400" },
      { borderStart: "border-s-emerald-500", dot: "bg-emerald-500" },
    ],
  },
  {
    name: "yellow",
    tones: [
      { borderStart: "border-s-yellow-500", dot: "bg-yellow-500" },
      { borderStart: "border-s-amber-400", dot: "bg-amber-400" },
      { borderStart: "border-s-orange-400", dot: "bg-orange-400" },
      { borderStart: "border-s-yellow-600", dot: "bg-yellow-600" },
      { borderStart: "border-s-amber-500", dot: "bg-amber-500" },
      { borderStart: "border-s-yellow-400", dot: "bg-yellow-400" },
    ],
  },
] as const

export const TONES_PER_FAMILY = 6
export const TOTAL_COLOR_THEMES = COLOR_FAMILIES.length * TONES_PER_FAMILY

export const CLASS_CARD_THEMES: readonly ClassCardColorTheme[] =
  COLOR_FAMILIES.flatMap((family) =>
    family.tones.map((tone) => ({
      border: "border-border/80 hover:border-border",
      borderStart: tone.borderStart,
      bg: "bg-card hover:bg-muted/30",
      divider: "border-border/50",
      badge: "bg-muted text-muted-foreground border-border/60",
      dot: tone.dot,
    }))
  )

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
  onSwapClick?: (id: string) => void
  onRemoveTeacher?: (proposal: Proposal) => void
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
  onSwapClick,
  onRemoveTeacher,
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
    : t("calendarView.newTeacherBadge")
  const isOnline = proposal.deliveryMode === "ONLINE"
  const locationName = isOnline
    ? t("deliveryModes.ONLINE")
    : proposal.classroom?.name || t("location")

  const maxCapacity = proposal.classroom?.capacity ?? proposal.capacity

  const hasHighlightTag = hasSameTeacher || hasSameCourse
  const isGrayscale = isDimmed && !isActive && !isSwappable && !hasHighlightTag
  const hasWarnings = proposal.warnings.length > 0
  const warningTitle = hasWarnings
    ? proposal.warnings
        .map((w) =>
          KNOWN_WARNING_CODES.has(w.code)
            ? t(`warningMessages.${w.code}`)
            : w.code
        )
        .join(" · ")
    : undefined

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
        data-has-warnings={hasWarnings ? "true" : undefined}
        title={warningTitle}
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
          "group relative flex min-h-[84px] cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-s-4 p-3 shadow-2xs transition-[background-color,border-color,box-shadow,filter,transform] duration-200 ease-in-out select-none",
          isActive
            ? "border-primary"
            : hasWarnings
              ? "border-warning/80 hover:border-warning"
              : theme.border,
          theme.borderStart,
          isActive ? "bg-primary/15 hover:bg-primary/20" : theme.bg,
          isActive &&
            "z-10 scale-[1.01] opacity-100 shadow-md ring-2 ring-primary",
          isSwappable &&
            "animate-calendar-card-shake z-10 opacity-100 ring-2 ring-primary/60 hover:animate-none",
          isDimmed && "opacity-25 hover:opacity-60",
          isGrayscale && "grayscale hover:grayscale-0"
        )}
        aria-label={proposal.course.title}
      >
        {/* Row 1: Course Title & Level, Mode, Location, Status & Actions */}
        <div className="flex min-w-0 items-center justify-between gap-2 pb-2.5">
          {/* Start (Right in RTL): Dot, Course Title, Badges */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={cn("size-2.5 shrink-0 rounded-full", theme.dot)}
              aria-hidden="true"
            />
            <h5
              className="truncate text-sm font-bold text-foreground"
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
            {proposal.title && proposal.title !== proposal.course.title && (
              <span
                className={cn(
                  "hidden max-w-[140px] truncate rounded border px-1.5 py-0.5 text-[10px] font-semibold xl:inline-block",
                  theme.badge
                )}
                title={proposal.title}
              >
                {proposal.title}
              </span>
            )}
          </div>

          {/* End (Left in RTL): Location, Status Icons & Actions */}
          <div className="flex min-w-0 shrink items-center gap-1.5">
            {/* Location (Classroom / Room) */}
            <div
              className="flex max-w-[110px] min-w-0 shrink items-center gap-1 rounded-md bg-muted/40 px-1.5 py-0.5 text-xs text-muted-foreground sm:max-w-[130px] md:max-w-[140px]"
              title={locationName}
            >
              {isOnline ? (
                <Globe
                  aria-hidden
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              ) : (
                <DoorOpen
                  aria-hidden
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              )}
              <span className="truncate font-medium text-foreground/90">
                {locationName}
              </span>
            </div>

            {proposal.isLocked && (
              <span
                title={t("states.locked")}
                className="flex size-4 shrink-0 items-center justify-center text-muted-foreground"
              >
                <LockKeyhole aria-hidden className="size-3.5" />
              </span>
            )}
            {proposal.isManuallyEdited && (
              <span
                title={t("states.edited")}
                className="flex size-4 shrink-0 items-center justify-center text-warning"
              >
                <Pencil aria-hidden className="size-3.5" />
              </span>
            )}
            {canEdit && !proposal.publishedClassId && (
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
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

        {/* Row 2: Teacher Focal Point, Branch, and Subtle Capacity Badge */}
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-t pt-2.5 text-xs",
            theme.divider
          )}
        >
          {/* Start (Right in RTL): Teacher Avatar & Name */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="relative flex size-7.5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted/80 ring-1 ring-border/80">
              {proposal.teacher?.avatarUrl ? (
                <Image
                  src={getAssetUrl(proposal.teacher.avatarUrl)}
                  alt={teacherName}
                  width={30}
                  height={30}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : (
                <User
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0",
                    hasSameTeacher ? "text-primary" : "text-muted-foreground"
                  )}
                />
              )}
            </div>
            <div className="flex min-w-0 items-center gap-2 truncate">
              {hasSameTeacher ? (
                <mark className="inline-block max-w-full truncate rounded-none bg-[#67e8f9] px-0.5 text-xs font-bold text-black">
                  {teacherName}
                </mark>
              ) : (
                <span className="truncate text-xs font-bold text-foreground">
                  {teacherName}
                </span>
              )}
              {hasSameTeacher && (
                <span
                  data-testid={`same-teacher-badge-${proposal.id}`}
                  className="shrink-0 rounded border border-primary/40 bg-primary/15 px-1 py-0.5 text-[9px] font-bold text-primary"
                >
                  {t("calendarView.sameTeacherBadge")}
                </span>
              )}
            </div>

            {/* Master Action Buttons: Swap & Delete (when teacher is assigned) */}
            {canEdit &&
              !proposal.publishedClassId &&
              Boolean(proposal.teacher || proposal.teacherId) && (
                <div
                  className="flex shrink-0 items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    data-testid={`swap-teacher-btn-${proposal.id}`}
                    title={t("calendarView.swapTeacher")}
                    aria-label={t("calendarView.swapTeacher")}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSwapClick?.(proposal.id)
                    }}
                    className={cn(
                      "size-6 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
                      isActive &&
                        "bg-primary/20 text-primary hover:bg-primary/25 hover:text-primary"
                    )}
                  >
                    <ArrowLeftRight aria-hidden className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    data-testid={`delete-teacher-btn-${proposal.id}`}
                    title={t("calendarView.removeTeacher")}
                    aria-label={t("calendarView.removeTeacher")}
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveTeacher?.(proposal)
                    }}
                    className="size-6 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                  </Button>
                </div>
              )}
          </div>

          {/* End (Left in RTL): Minimal Clean Capacity Badge (No progress bars) */}
          <div
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-muted/40 px-2 py-0.5 text-xs font-semibold text-foreground/90 tabular-nums"
            title={t("calendarView.capacityLabel", {
              current: formatNumber(proposal.capacity, locale),
              max: formatNumber(maxCapacity, locale),
            })}
          >
            <Users
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground"
            />
            <span>{formatNumber(proposal.capacity, locale)}</span>
            {proposal.classroom?.capacity && (
              <span className="text-[11px] font-normal text-muted-foreground">
                /{formatNumber(maxCapacity, locale)}
              </span>
            )}
            <span className="text-[10px] font-normal text-muted-foreground">
              نفر
            </span>
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
