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
} from "lucide-react"
import { PERMISSIONS, type SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"
import { SchedulingProposalActions } from "../scheduling-proposal-actions"
import { SchedulingProposalEditDialog } from "../scheduling-proposal-edit-dialog"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

interface SchedulingPlanCalendarClassCardProps {
  proposal: Proposal
  canEdit: boolean
}

export function SchedulingPlanCalendarClassCard({
  proposal,
  canEdit,
}: SchedulingPlanCalendarClassCardProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [isEditOpen, setIsEditOpen] = React.useState(false)

  const teacherName = `${proposal.teacher.firstName} ${proposal.teacher.lastName}`
  const isOnline = proposal.deliveryMode === "ONLINE"
  const locationName = isOnline
    ? t("deliveryModes.ONLINE")
    : proposal.classroom?.name || proposal.branch?.name || t("location")

  return (
    <>
      <article
        className="group relative flex flex-col gap-2 rounded-xl border border-border bg-card p-2.5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
        aria-label={proposal.course.title}
      >
        {/* Header: Course Title & Actions/Badges */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <h5
              className="truncate text-xs font-bold text-foreground"
              title={proposal.course.title}
            >
              {proposal.course.title}
            </h5>
            {proposal.title && proposal.title !== proposal.course.title && (
              <p
                className="truncate text-[11px] text-muted-foreground"
                title={proposal.title}
              >
                {proposal.title}
              </p>
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
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_CLASSES}
                mode="hide"
              >
                <SchedulingProposalActions
                  proposal={proposal}
                  onEdit={() => setIsEditOpen(true)}
                />
              </PermissionGuard>
            )}
          </div>
        </div>

        {/* Teacher & Location Meta */}
        <div className="flex flex-col gap-1 border-t border-border/60 pt-1.5 text-[11px] text-muted-foreground">
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
            {proposal.classroom?.capacity && (
              <Badge variant="outline" className="h-3.5 px-1 py-0 text-[9px]">
                {formatNumber(proposal.classroom.capacity, locale)}
              </Badge>
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
