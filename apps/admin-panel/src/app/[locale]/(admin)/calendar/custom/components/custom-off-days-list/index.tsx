"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { CalendarOff, Trash2 } from "lucide-react"
import type { InstituteCustomOffDay } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
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
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@workspace/ui/components/empty"
import { formatDisplayDate } from "../../helper"

export interface CustomOffDaysListProps {
  customOffDays: InstituteCustomOffDay[] | undefined
  isLoading: boolean
  onDelete: (offDay: InstituteCustomOffDay) => void
}

export function CustomOffDaysList({
  customOffDays,
  isLoading,
  onDelete,
}: CustomOffDaysListProps) {
  const t = useTranslations("setting.offDays")
  const locale = useLocale()

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!customOffDays || customOffDays.length === 0) {
    return (
      <Empty
        variant="compact"
        className="min-h-[240px] rounded-2xl border border-dashed border-border"
      >
        <EmptyHeader>
          <EmptyMedia variant="default" className="size-12 rounded-2xl">
            <CalendarOff className="size-6" />
          </EmptyMedia>
          <EmptyDescription>{t("noCustomOffDays")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <MobileList>
      {customOffDays.map((item, index) => (
        <ContextMenu key={item.id}>
          <ContextMenuTrigger>
            <MobileListItem
              isLast={index === customOffDays.length - 1}
              onClick={() => onDelete(item)}
            >
              <MobileListItemIcon>
                <CalendarOff className="size-5" />
              </MobileListItemIcon>

              <MobileListItemContent
                primary={item.title}
                secondary={
                  <span className="font-sans text-xs text-muted-foreground">
                    {formatDisplayDate(item.date, locale)}
                  </span>
                }
              />

              <MobileListItemTrailing>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={t("deleteOffDayLabel", { title: item.title })}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item)
                  }}
                  className="size-8 cursor-pointer p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </MobileListItemTrailing>
            </MobileListItem>
          </ContextMenuTrigger>

          <ContextMenuContent>
            <ContextMenuItem
              variant="destructive"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="me-2 size-4 text-destructive" />
              {t("deleteTitle")}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </MobileList>
  )
}
