"use client"

import { useTranslations } from "next-intl"
import { LockKeyhole, LockOpen, MoreHorizontal, Pencil } from "lucide-react"
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
import { useSchedulingProposalLock } from "../../hooks/use-scheduling-proposal-lock"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

interface SchedulingProposalActionsProps {
  proposal: Proposal
  onEdit: () => void
}

export function SchedulingProposalActions({
  proposal,
  onEdit,
}: SchedulingProposalActionsProps) {
  const t = useTranslations("scheduling.planDetails")
  const { toggleLock, isPending } = useSchedulingProposalLock(proposal)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={t("actions.title")}
          >
            <MoreHorizontal aria-hidden data-icon="inline-start" />
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
            {isPending ? (
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
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
