"use client"

import { useTranslations } from "next-intl"
import { UserCheck, Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyContent,
} from "@workspace/ui/components/empty"
import { PERMISSIONS } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

export interface TeachersTableEmptyStateProps {
  onAdd?: () => void
}

export function TeachersTableEmptyState({
  onAdd,
}: TeachersTableEmptyStateProps) {
  const t = useTranslations("teachers")

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UserCheck className="size-8 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>{t("table.empty")}</EmptyTitle>
        <EmptyDescription>{t("subtitle")}</EmptyDescription>
      </EmptyHeader>
      {onAdd && (
        <EmptyContent>
          <PermissionGuard permission={PERMISSIONS.MANAGE_TEACHERS} mode="hide">
            <Button
              type="button"
              onClick={onAdd}
              className="cursor-pointer gap-2"
            >
              <Plus className="size-5" />
              <span>{t("addTeacher")}</span>
            </Button>
          </PermissionGuard>
        </EmptyContent>
      )}
    </Empty>
  )
}
