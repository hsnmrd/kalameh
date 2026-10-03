"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock, Edit2, Trash2 } from "lucide-react"
import {
  MobileList,
  MobileListItem,
  MobileListItemIcon,
  MobileListItemContent,
  MobileListItemTrailing,
} from "@workspace/ui/components/mobile-list"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@workspace/ui/components/context-menu"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty"
import {
  PERMISSIONS,
  isOperatingPhaseCurrent,
  getCurrentJalaliMonth,
  type OperatingPhaseWithSlots,
} from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

export interface OperatingPhasesListProps {
  phases: OperatingPhaseWithSlots[] | undefined
  isLoading: boolean
  onEdit: (phase: OperatingPhaseWithSlots) => void
  onDelete: (phase: OperatingPhaseWithSlots) => void
}

export function OperatingPhasesList({
  phases,
  isLoading,
  onEdit,
  onDelete,
}: OperatingPhasesListProps) {
  const t = useTranslations("operating-phases")
  const currentJalaliMonth = React.useMemo(() => getCurrentJalaliMonth(), [])

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!phases || phases.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Clock className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("noPhases")}</EmptyTitle>
          <EmptyDescription>{t("noPhasesDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <MobileList>
      {phases.map((phase, index) => {
        const isCurrent = isOperatingPhaseCurrent(phase, currentJalaliMonth)
        return (
          <ContextMenu key={phase.id}>
            <ContextMenuTrigger>
              <MobileListItem
                onClick={() => onEdit(phase)}
                isLast={index === phases.length - 1}
              >
                <MobileListItemIcon>
                  <Clock className="size-5" />
                </MobileListItemIcon>

                <MobileListItemContent
                  primary={phase.title}
                  secondary={`${phase.startTime} تا ${phase.endTime} • ${phase.months.length} ماه`}
                />

                <MobileListItemTrailing>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      {isCurrent ? (
                        <Badge
                          variant="success"
                          className="gap-1 text-[10px] font-medium"
                        >
                          <span className="size-1 animate-pulse rounded-full bg-current" />
                          <span>{t("table.runningNow")}</span>
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          {t("table.notRunning")}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {phase.calculation.fullSlotsCount} زنگ
                    </span>
                  </div>
                </MobileListItemTrailing>
              </MobileListItem>
            </ContextMenuTrigger>

            <ContextMenuContent>
              <PermissionGuard permission={PERMISSIONS.MANAGE_OPERATING_PHASES}>
                <ContextMenuItem
                  onClick={() => onEdit(phase)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="size-4 text-muted-foreground" />
                  <span>{t("editPhase")}</span>
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => onDelete(phase)}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 text-destructive" />
                  <span>{t("deletePhase")}</span>
                </ContextMenuItem>
              </PermissionGuard>
            </ContextMenuContent>
          </ContextMenu>
        )
      })}
    </MobileList>
  )
}
