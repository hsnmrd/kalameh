import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Calendar, Edit2, Trash2, Eye, Plus, Sparkles } from "lucide-react"
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
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
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
  onAdd?: () => void
  onBatch?: () => void
}

export function TermsList({
  terms,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onAdd,
  onBatch,
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
        {(onBatch || onAdd) && (
          <EmptyContent>
            <PermissionGuard permission={PERMISSIONS.MANAGE_TERMS} mode="hide">
              <div className="flex items-center justify-center gap-2.5 sm:gap-3">
                {onBatch && (
                  <Button
                    type="button"
                    onClick={onBatch}
                    className="cursor-pointer gap-2"
                  >
                    <Sparkles className="size-5" />
                    <span>{t("generatePhaseTerms")}</span>
                  </Button>
                )}
                {onAdd && (
                  <Button
                    type="button"
                    variant={onBatch ? "outline" : "default"}
                    onClick={onAdd}
                    className={`cursor-pointer gap-2 ${
                      onBatch ? "size-14 shrink-0 p-0 sm:w-auto sm:px-6" : ""
                    }`}
                    aria-label={t("addTerm")}
                    title={t("addTerm")}
                  >
                    <Plus className="size-5" />
                    <span className={onBatch ? "hidden sm:inline" : ""}>
                      {t("addTerm")}
                    </span>
                  </Button>
                )}
              </div>
            </PermissionGuard>
          </EmptyContent>
        )}
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
