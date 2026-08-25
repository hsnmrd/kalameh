"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Building2, MapPin } from "lucide-react"
import { Edit2, Trash2 } from "lucide-react"
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
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty"
import { PERMISSIONS, type BranchWithStats } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { BranchStatusBadge } from "../branch-status-badge"

export interface BranchesListProps {
  branches: BranchWithStats[] | undefined
  isLoading: boolean
  onEdit: (branch: BranchWithStats) => void
}

export function BranchesList({
  branches,
  isLoading,
  onEdit,
}: BranchesListProps) {
  const t = useTranslations("branches")

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!branches || branches.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Building2 className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("table.empty")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <MobileList>
      {branches.map((branch, index) => (
        <ContextMenu key={branch.id}>
          <ContextMenuTrigger>
            <MobileListItem
              onClick={() => onEdit(branch)}
              isLast={index === branches.length - 1}
            >
              <MobileListItemIcon>
                <Building2 className="size-5" />
              </MobileListItemIcon>

              <MobileListItemContent
                primary={branch.name}
                secondary={
                  branch.address ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{branch.address}</span>
                    </span>
                  ) : undefined
                }
              />

              <MobileListItemTrailing>
                <BranchStatusBadge isActive={branch.isActive} />
              </MobileListItemTrailing>
            </MobileListItem>
          </ContextMenuTrigger>

          <ContextMenuContent>
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_BRANCHES}
              mode="hide"
            >
              <ContextMenuItem onSelect={() => onEdit(branch)}>
                <Edit2 className="me-2 size-4 text-muted-foreground" />
                {t("table.actions")}
              </ContextMenuItem>
            </PermissionGuard>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </MobileList>
  )
}
