"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Building2,
  Globe,
  LockKeyhole,
  Pencil,
  TriangleAlert,
  User,
  Users,
} from "lucide-react"
import { PERMISSIONS, type SchedulingPlanDetailsDto } from "@workspace/types"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
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
    border: "border-chart-1/20 hover:border-chart-1/35",
    borderStart: "border-s-chart-1/45",
    bg: "bg-chart-1/[0.04] hover:bg-chart-1/[0.08]",
    divider: "border-chart-1/10",
    badge: "bg-chart-1/10 text-chart-1/75 border-chart-1/20",
    dot: "bg-chart-1/60",
  },
  {
    border: "border-chart-2/20 hover:border-chart-2/35",
    borderStart: "border-s-chart-2/45",
    bg: "bg-chart-2/[0.04] hover:bg-chart-2/[0.08]",
    divider: "border-chart-2/10",
    badge: "bg-chart-2/10 text-chart-2/75 border-chart-2/20",
    dot: "bg-chart-2/60",
  },
  {
    border: "border-chart-3/20 hover:border-chart-3/35",
    borderStart: "border-s-chart-3/45",
    bg: "bg-chart-3/[0.04] hover:bg-chart-3/[0.08]",
    divider: "border-chart-3/10",
    badge: "bg-chart-3/10 text-chart-3/75 border-chart-3/20",
    dot: "bg-chart-3/60",
  },
  {
    border: "border-chart-4/20 hover:border-chart-4/35",
    borderStart: "border-s-chart-4/45",
    bg: "bg-chart-4/[0.04] hover:bg-chart-4/[0.08]",
    divider: "border-chart-4/10",
    badge: "bg-chart-4/10 text-chart-4/75 border-chart-4/20",
    dot: "bg-chart-4/60",
  },
  {
    border: "border-chart-5/20 hover:border-chart-5/35",
    borderStart: "border-s-chart-5/45",
    bg: "bg-chart-5/[0.04] hover:bg-chart-5/[0.08]",
    divider: "border-chart-5/10",
    badge: "bg-chart-5/10 text-chart-5/75 border-chart-5/20",
    dot: "bg-chart-5/60",
  },
  {
    border: "border-chart-6/20 hover:border-chart-6/35",
    borderStart: "border-s-chart-6/45",
    bg: "bg-chart-6/[0.04] hover:bg-chart-6/[0.08]",
    divider: "border-chart-6/10",
    badge: "bg-chart-6/10 text-chart-6/75 border-chart-6/20",
    dot: "bg-chart-6/60",
  },
  {
    border: "border-chart-7/20 hover:border-chart-7/35",
    borderStart: "border-s-chart-7/45",
    bg: "bg-chart-7/[0.04] hover:bg-chart-7/[0.08]",
    divider: "border-chart-7/10",
    badge: "bg-chart-7/10 text-chart-7/75 border-chart-7/20",
    dot: "bg-chart-7/60",
  },
  {
    border: "border-chart-8/20 hover:border-chart-8/35",
    borderStart: "border-s-chart-8/45",
    bg: "bg-chart-8/[0.04] hover:bg-chart-8/[0.08]",
    divider: "border-chart-8/10",
    badge: "bg-chart-8/10 text-chart-8/75 border-chart-8/20",
    dot: "bg-chart-8/60",
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
  isDimmed?: boolean
  onHover?: (id: string | null) => void
  onClick?: (id: string) => void
}

export function SchedulingPlanCalendarClassCard({
  proposal,
  canEdit,
  colorIndex,
  isActive = false,
  isDimmed = false,
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

  return (
    <>
      <article
        data-testid={`calendar-class-card-${proposal.id}`}
        data-class-id={proposal.id}
        data-color-index={themeIndex}
        data-active={isActive ? "true" : undefined}
        data-dimmed={isDimmed ? "true" : undefined}
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
          "group relative flex h-[134px] cursor-pointer flex-col justify-between rounded-xl border-2 border-s-4 p-2.5 shadow-2xs transition-all duration-200 select-none",
          theme.border,
          theme.borderStart,
          theme.bg,
          isActive &&
            "z-10 scale-[1.02] opacity-100 shadow-md ring-2 ring-primary",
          isDimmed && "opacity-25 hover:opacity-60"
        )}
        aria-label={proposal.course.title}
      >
        {/* Header: Indicator, Course Title & Actions/Badges */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={cn("size-2.5 shrink-0 rounded-full", theme.dot)}
                aria-hidden="true"
              />
              <h5
                className="truncate text-xs font-bold text-foreground"
                title={proposal.course.title}
              >
                {proposal.course.title}
              </h5>
            </div>
            {proposal.title && proposal.title !== proposal.course.title && (
              <div className="mt-0.5 ps-4">
                <span
                  className={cn(
                    "inline-block max-w-full truncate rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                    theme.badge
                  )}
                  title={proposal.title}
                >
                  {proposal.title}
                </span>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
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

        {/* Teacher & Location Meta */}
        <div
          className={cn(
            "flex flex-col gap-1 border-t pt-1.5 text-[11px] text-muted-foreground",
            theme.divider
          )}
        >
          <div className="flex items-center gap-1.5 truncate">
            <User aria-hidden className="size-3 shrink-0" />
            <span className="truncate text-foreground/90">{teacherName}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            {isOnline ? (
              <Globe aria-hidden className="size-3 shrink-0" />
            ) : (
              <Building2 aria-hidden className="size-3 shrink-0" />
            )}
            <span className="truncate">{locationName}</span>
          </div>
        </div>

        {/* Capacity Info (Clean Display, No Stepper Buttons) */}
        <div
          className={cn(
            "flex items-center justify-between border-t pt-1.5 text-[11px]",
            theme.divider
          )}
          aria-label={t("calendarView.capacityLabel", {
            current: formatNumber(proposal.capacity, locale),
            max: formatNumber(maxCapacity, locale),
          })}
        >
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users aria-hidden className="size-3 shrink-0" />
            <span className="text-[10px] font-medium">{t("capacity")}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-foreground tabular-nums">
            <span>{formatNumber(proposal.capacity, locale)}</span>
            {proposal.classroom?.capacity && (
              <span className="text-[10px] font-normal text-muted-foreground">
                / {formatNumber(maxCapacity, locale)}
              </span>
            )}
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
