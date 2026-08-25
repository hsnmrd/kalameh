"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Calendar, Edit2 } from "lucide-react"
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
import { PERMISSIONS, type TermDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { TermStatusBadge } from "../term-status-badge"

export interface TermsListProps {
  terms: TermDto[] | undefined
  isLoading: boolean
  onEdit: (term: TermDto) => void
}

export function TermsList({ terms, isLoading, onEdit }: TermsListProps) {
  const t = useTranslations("terms")
  const locale = useLocale()

  const formatDate = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal)
      return new Intl.DateTimeFormat(
        locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      ).format(d)
    } catch {
      return String(dateVal)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!terms || terms.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Calendar className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("table.empty")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <MobileList>
      {terms.map((term, index) => (
        <ContextMenu key={term.id}>
          <ContextMenuTrigger>
            <MobileListItem
              onClick={() => onEdit(term)}
              isLast={index === terms.length - 1}
            >
              <MobileListItemIcon>
                <Calendar className="size-5" />
              </MobileListItemIcon>

              <MobileListItemContent
                primary={term.title}
                secondary={`${formatDate(term.startDate)} - ${formatDate(term.endDate)}`}
              />

              <MobileListItemTrailing>
                <TermStatusBadge isActive={term.isActive} />
              </MobileListItemTrailing>
            </MobileListItem>
          </ContextMenuTrigger>

          <ContextMenuContent>
            <PermissionGuard permission={PERMISSIONS.MANAGE_TERMS} mode="hide">
              <ContextMenuItem onSelect={() => onEdit(term)}>
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
