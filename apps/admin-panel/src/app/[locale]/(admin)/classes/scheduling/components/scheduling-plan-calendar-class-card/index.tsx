"use client"

import * as React from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowLeftRight,
  DoorOpen,
  Globe,
  GraduationCap,
  LockKeyhole,
  Pencil,
  User,
  Users,
} from "lucide-react"
import { PERMISSIONS, type SchedulingPlanDetailsDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { cn, formatNumber, getAssetUrl } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"
import { SchedulingProposalActions } from "../scheduling-proposal-actions"

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
  canSwap?: boolean
  isSwapping?: boolean
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
  onChangeDeliveryMode?: (proposal: Proposal) => Promise<boolean | void> | void
  isDeliveryModePending?: boolean
  onRoomClick?: (proposal: Proposal) => void
}

export function SchedulingPlanCalendarClassCard({
  proposal,
  canEdit,
  canSwap = true,
  isSwapping = false,
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
  onChangeDeliveryMode,
  isDeliveryModePending = false,
  onRoomClick,
}: SchedulingPlanCalendarClassCardProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const themeIndex =
    colorIndex !== undefined
      ? Math.abs(colorIndex) % CLASS_CARD_THEMES.length
      : getProposalColorIndex(proposal.id, CLASS_CARD_THEMES.length)
  const theme = CLASS_CARD_THEMES[themeIndex]!

  const hasNoTeacher = !(proposal.teacherId ?? proposal.teacher?.id)
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
    <article
      data-testid={`calendar-class-card-${proposal.id}`}
      data-class-id={proposal.id}
      data-color-index={themeIndex}
      data-has-no-teacher={hasNoTeacher ? "true" : undefined}
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
        "group relative flex min-h-[84px] cursor-pointer flex-col justify-between overflow-hidden rounded-xl p-3 shadow-2xs transition-[background-color,border-color,box-shadow,filter,transform] duration-200 ease-in-out select-none",
        hasNoTeacher
          ? cn(
              "border-2 border-dashed",
              isActive
                ? "z-10 scale-[1.01] border-warning bg-warning/25 opacity-100 shadow-md ring-2 ring-warning"
                : "border-warning/70 bg-warning/10 hover:border-warning hover:bg-warning/15"
            )
          : cn(
              "border border-s-4",
              isActive
                ? "border-primary"
                : hasWarnings
                  ? "border-warning/80 hover:border-warning"
                  : theme.border,
              theme.borderStart,
              isActive ? "bg-primary/15 hover:bg-primary/20" : theme.bg,
              isActive &&
                "z-10 scale-[1.01] opacity-100 shadow-md ring-2 ring-primary"
            ),
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
            className={cn(
              "size-2.5 shrink-0 rounded-full",
              hasNoTeacher ? "bg-warning" : theme.dot
            )}
            aria-hidden="true"
          />
          <h5
            className="shrink-0 text-sm font-bold text-foreground"
            title={proposal.course.title}
          >
            {hasSameCourse ? (
              <span
                data-testid={`same-course-badge-${proposal.id}`}
                className="inline-flex shrink-0 items-center rounded border border-warning/50 bg-[#fef08a] px-1.5 py-0.5 text-xs font-bold text-black"
              >
                {t("calendarView.sameCourseBadge")}
              </span>
            ) : (
              <span className="truncate">{proposal.course.title}</span>
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
          {isOnline ? (
            <span
              data-testid={`calendar-class-room-badge-${proposal.id}`}
              title={locationName}
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md",
                hasNoTeacher
                  ? "bg-warning/20 text-warning-foreground"
                  : "bg-muted/40 text-muted-foreground"
              )}
            >
              <Globe aria-hidden className="size-3.5 shrink-0 text-inherit" />
            </span>
          ) : onRoomClick ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              data-testid={`calendar-class-room-badge-${proposal.id}`}
              onClick={(e) => {
                e.stopPropagation()
                onRoomClick(proposal)
              }}
              title={locationName}
              aria-label={
                proposal.classroom?.name
                  ? `${t("calendarView.switchRoomTitle")}: ${proposal.classroom.name}`
                  : t("calendarView.switchRoomTitle")
              }
              className={cn(
                "size-6 rounded-md",
                hasNoTeacher
                  ? "bg-warning/20 text-warning-foreground hover:bg-warning/30 hover:text-warning-foreground"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <DoorOpen
                aria-hidden
                className="size-3.5 shrink-0 text-inherit"
              />
            </Button>
          ) : (
            <span
              data-testid={`calendar-class-room-badge-${proposal.id}`}
              title={locationName}
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md",
                hasNoTeacher
                  ? "bg-warning/20 text-warning-foreground"
                  : "bg-muted/40 text-muted-foreground"
              )}
            >
              <DoorOpen
                aria-hidden
                className="size-3.5 shrink-0 text-inherit"
              />
            </span>
          )}

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
            <div
              className="flex shrink-0 items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_CLASSES}
                mode="hide"
              >
                {canSwap && (
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
                      "size-6 rounded-md",
                      hasNoTeacher
                        ? "text-muted-foreground hover:bg-warning/20 hover:text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      isSwapping &&
                        "bg-primary/25 text-primary ring-1 ring-primary/40 hover:bg-primary/30 hover:text-primary"
                    )}
                  >
                    <ArrowLeftRight aria-hidden className="size-3.5" />
                  </Button>
                )}
                <SchedulingProposalActions
                  proposal={proposal}
                  onRemoveTeacher={
                    onRemoveTeacher
                      ? () => onRemoveTeacher(proposal)
                      : undefined
                  }
                  onToggleDeliveryMode={
                    onChangeDeliveryMode
                      ? () => onChangeDeliveryMode(proposal)
                      : undefined
                  }
                  isDeliveryModePending={isDeliveryModePending}
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
          hasNoTeacher ? "border-warning/20" : theme.divider
        )}
      >
        {/* Start (Right in RTL): Teacher Avatar & Name */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div
            className={cn(
              "relative flex size-7.5 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1",
              hasNoTeacher
                ? "bg-warning/20 text-warning-foreground ring-warning/30"
                : "bg-muted/80 ring-border/80"
            )}
          >
            {proposal.teacher?.avatarUrl ? (
              <Image
                src={getAssetUrl(proposal.teacher.avatarUrl)}
                alt={teacherName}
                width={30}
                height={30}
                unoptimized
                className="size-full object-cover"
              />
            ) : hasNoTeacher ? (
              <GraduationCap
                aria-hidden
                className="size-4 shrink-0 text-inherit"
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
          </div>
        </div>

        {/* End (Left in RTL): Minimal Clean Capacity Badge (No progress bars) */}
        <div
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
            hasNoTeacher
              ? "bg-warning/20 text-warning-foreground"
              : "bg-muted/40 text-foreground/90"
          )}
          title={t("calendarView.capacityLabel", {
            current: formatNumber(proposal.capacity, locale),
            max: formatNumber(maxCapacity, locale),
          })}
        >
          <Users
            aria-hidden
            className={cn(
              "size-3.5 shrink-0",
              hasNoTeacher ? "text-inherit" : "text-muted-foreground"
            )}
          />
          <span>{formatNumber(proposal.capacity, locale)}</span>
          {proposal.classroom?.capacity && (
            <span
              className={cn(
                "text-[11px] font-normal",
                hasNoTeacher
                  ? "text-warning-foreground/80"
                  : "text-muted-foreground"
              )}
            >
              /{formatNumber(maxCapacity, locale)}
            </span>
          )}
          <span
            className={cn(
              "text-[10px] font-normal",
              hasNoTeacher
                ? "text-warning-foreground/80"
                : "text-muted-foreground"
            )}
          >
            نفر
          </span>
        </div>
      </div>
    </article>
  )
}
