"use client"

import { useTranslations } from "next-intl"
import {
  DoorOpen,
  Globe,
  LockKeyhole,
  LockOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Spinner } from "@workspace/ui/components/spinner"
import { useSchedulingProposalDeliveryMode } from "../../hooks/use-scheduling-proposal-delivery-mode"
import { useSchedulingProposalLock } from "../../hooks/use-scheduling-proposal-lock"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export interface SchedulingProposalActionsProps {
  proposal: Proposal
  onEdit: () => void
  onRemoveTeacher?: () => void
  onToggleDeliveryMode?: () => void
  isDeliveryModePending?: boolean
}

export function SchedulingProposalActions({
  proposal,
  onEdit,
  onRemoveTeacher,
  onToggleDeliveryMode,
  isDeliveryModePending: externalDeliveryModePending,
}: SchedulingProposalActionsProps) {
  const t = useTranslations("scheduling.planDetails")
  const { toggleLock, isPending: isLockPending } =
    useSchedulingProposalLock(proposal)
  const defaultDelivery = useSchedulingProposalDeliveryMode(proposal, onEdit)

  const handleToggleDelivery =
    onToggleDeliveryMode ?? defaultDelivery.toggleDeliveryMode
  const isDeliveryPending =
    externalDeliveryModePending ?? defaultDelivery.isPending

  const isPending = isLockPending || isDeliveryPending
  const isOnline = proposal.deliveryMode === "ONLINE"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            data-testid={`proposal-actions-trigger-${proposal.id}`}
            aria-label={t("actions.title")}
            className="size-6 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MoreHorizontal aria-hidden className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        drawerTitle={t("actions.title")}
        className="min-w-52"
      >
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onEdit} disabled={isPending}>
            <Pencil aria-hidden />
            <span>{t("actions.edit")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleLock} disabled={isPending}>
            {isLockPending ? (
              <Spinner aria-hidden />
            ) : proposal.isLocked ? (
              <LockOpen aria-hidden />
            ) : (
              <LockKeyhole aria-hidden />
            )}
            <span>
              {t(proposal.isLocked ? "actions.unlock" : "actions.lock")}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleToggleDelivery}
            disabled={isPending}
            data-testid={`toggle-delivery-mode-btn-${proposal.id}`}
          >
            {isDeliveryPending ? (
              <Spinner aria-hidden />
            ) : isOnline ? (
              <DoorOpen aria-hidden />
            ) : (
              <Globe aria-hidden />
            )}
            <span>
              {t(
                isOnline ? "actions.changeToInPerson" : "actions.changeToOnline"
              )}
            </span>
          </DropdownMenuItem>
          {onRemoveTeacher &&
            Boolean(proposal.teacher || proposal.teacherId) && (
              <DropdownMenuItem
                onClick={onRemoveTeacher}
                disabled={isPending}
                data-testid={`delete-teacher-btn-${proposal.id}`}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 aria-hidden className="text-destructive" />
                <span>{t("actions.removeTeacher")}</span>
              </DropdownMenuItem>
            )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
