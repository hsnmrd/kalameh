"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { BookOpen, Edit2, Trash2 } from "lucide-react"
import type { ClassRequirementDto } from "@workspace/types"
import {
  MobileList,
  MobileListItem,
  MobileListItemIcon,
  MobileListItemContent,
  MobileListItemTrailing,
} from "@workspace/ui/components/mobile-list"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface RequirementsListProps {
  items: ClassRequirementDto[]
  isLoading: boolean
  onEdit: (item: ClassRequirementDto) => void
  onDelete: (item: ClassRequirementDto) => void
}

export function RequirementsList({
  items,
  isLoading,
  onEdit,
  onDelete,
}: RequirementsListProps) {
  const t = useTranslations("scheduling")
  const locale = useLocale()

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <Empty variant="ghost" className="min-h-56">
        <EmptyMedia variant="icon">
          <BookOpen className="size-7" aria-hidden />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{t("requirementsPage.empty")}</EmptyTitle>
          <EmptyDescription>{t("requirementsPage.emptyDesc")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <MobileList>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const isOnline = item.deliveryMode === "ONLINE"

        return (
          <ContextMenu key={item.id}>
            <ContextMenuTrigger>
              <MobileListItem onClick={() => onEdit(item)} isLast={isLast}>
                <MobileListItemIcon>
                  <BookOpen className="size-5" aria-hidden />
                </MobileListItemIcon>

                <MobileListItemContent
                  primary={
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        {item.course?.title ?? "-"}
                      </span>
                      <Badge
                        variant={isOnline ? "outline" : "secondary"}
                        className="text-[10px]"
                      >
                        {t(`demand.deliveryModes.${item.deliveryMode}`)}
                      </Badge>
                      {item.branch && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground"
                        >
                          {item.branch.name}
                        </Badge>
                      )}
                    </div>
                  }
                  secondary={
                    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                      <span>
                        {t("requirementsPage.columns.capacity")}:{" "}
                        {formatNumber(item.capacity, locale)}{" "}
                        {t("planDetails.people", { count: "" }).trim()}
                      </span>
                      {item.sessionsPerWeek && (
                        <span className="text-[11px]">
                          {item.sessionsPerWeek === 3
                            ? t("requirementsPage.fields.cadence3")
                            : item.sessionsPerWeek === 2
                              ? t("requirementsPage.fields.cadence2")
                              : t("requirementsPage.fields.cadence1")}
                        </span>
                      )}
                    </div>
                  }
                />

                <MobileListItemTrailing>
                  <Badge variant="secondary" className="text-xs font-bold">
                    {formatNumber(item.requiredClassCount, locale)}{" "}
                    {t("planDetails.proposalCount", { count: "" }).trim()}
                  </Badge>
                </MobileListItemTrailing>
              </MobileListItem>
            </ContextMenuTrigger>

            <ContextMenuContent>
              <ContextMenuItem onClick={() => onEdit(item)}>
                <Edit2 className="size-4" />
                <span>{t("requirementsPage.editRequirement")}</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onDelete(item)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                <span>{t("requirementsPage.deleteRequirement")}</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )
      })}
    </MobileList>
  )
}
