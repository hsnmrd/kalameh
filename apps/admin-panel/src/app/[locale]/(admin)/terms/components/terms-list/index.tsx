import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Calendar, Edit2, Trash2, Eye } from "lucide-react"
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
import { PERMISSIONS, isTermDeletable, type TermDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { TermStatusBadge } from "../term-status-badge"

export interface TermsListProps {
  terms: TermDto[] | undefined
  isLoading: boolean
  onView: (term: TermDto) => void
  onEdit: (term: TermDto) => void
  onDelete?: (term: TermDto) => void
}

export function TermsList({
  terms,
  isLoading,
  onView,
  onEdit,
  onDelete,
}: TermsListProps) {
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
              onClick={() => onView(term)}
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
                <TermStatusBadge term={term} allTerms={terms} />
              </MobileListItemTrailing>
            </MobileListItem>
          </ContextMenuTrigger>

          <ContextMenuContent>
            <ContextMenuItem onClick={() => onView(term)}>
              <Eye className="me-2 size-4 text-muted-foreground" />
              {t("table.view")}
            </ContextMenuItem>

            <PermissionGuard permission={PERMISSIONS.MANAGE_TERMS} mode="hide">
              <ContextMenuItem onClick={() => onEdit(term)}>
                <Edit2 className="me-2 size-4 text-muted-foreground" />
                {t("table.actions")}
              </ContextMenuItem>
            </PermissionGuard>

            {onDelete && isTermDeletable(term, terms) && (
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_TERMS}
                mode="hide"
              >
                <ContextMenuItem
                  onClick={() => onDelete(term)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="me-2 size-4 text-destructive" />
                  {t("deleteModal.deleteAction")}
                </ContextMenuItem>
              </PermissionGuard>
            )}
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </MobileList>
  )
}
