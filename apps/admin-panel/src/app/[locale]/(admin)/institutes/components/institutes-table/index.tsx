"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Building2,
  Check,
  Edit2,
  Layers,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { TableSkeleton } from "@/components/table-skeleton"
import { DataTable } from "@workspace/ui/components/data-table"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty"
import { toast } from "@workspace/ui/components/sonner"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import type { InstituteWithStats } from "@workspace/types"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { useRouter, useIsRtl } from "@/i18n/routing"
import { InstituteLogoCell } from "./institute-logo-cell"

export interface InstitutesTableProps {
  institutes: InstituteWithStats[] | undefined
  isLoading: boolean
  onEdit: (institute: InstituteWithStats) => void
  onDelete: (institute: InstituteWithStats) => void
  onAdd?: () => void
}

export function InstitutesTable({
  institutes,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
}: InstitutesTableProps) {
  const t = useTranslations("institutes")
  const locale = useLocale()
  const isRtl = useIsRtl()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { activeInstitute, selectInstitute, setActiveInstitute } =
    useActiveInstitute()

  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  const handleManage = React.useCallback(
    (institute: InstituteWithStats) => {
      selectInstitute(institute)
      router.push("/overview")
    },
    [router, selectInstitute]
  )

  const toggleStatusMutation = useMutation({
    ...institutesResource.update.toMutation(),
    onSuccess: (updated) => {
      const isNowBlocked = !updated.isActive
      toast.success(
        isNowBlocked
          ? t("blockToggle.blockSuccess")
          : t("blockToggle.unblockSuccess")
      )
      queryClient.invalidateQueries({
        queryKey: institutesResource.list.baseKey(),
      })
      if (activeInstitute?.id === updated.id) {
        setActiveInstitute(updated)
      }
    },
  })

  const handleToggleBlock = React.useCallback(
    (institute: InstituteWithStats) => {
      toggleStatusMutation.mutate({
        id: institute.id,
        body: {
          isActive: !institute.isActive,
        },
      })
    },
    [toggleStatusMutation]
  )

  const columns = React.useMemo<ColumnDef<InstituteWithStats>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("columns.name"),
        cell: ({ row }) => {
          const institute = row.original
          const isSelected = activeInstitute?.id === institute.id

          return (
            <div className="flex items-center gap-3">
              <InstituteLogoCell
                name={institute.name}
                logoUrl={institute.logoUrl}
                primaryColor={institute.primaryColor}
              />
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {institute.name}
                  </span>
                  {isSelected && (
                    <Badge
                      variant="success"
                      className="gap-1 px-1.5 py-0 text-[10px]"
                    >
                      <Check className="size-3" />
                      <span>{t("currentlyManaging")}</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "subdomain",
        header: t("columns.subdomain"),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.subdomain}.kalameh.ir
          </span>
        ),
      },
      {
        accessorKey: "classesCount",
        header: t("classesCount"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Layers className="size-3.5 text-muted-foreground" />
            <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
              {formatNumber(row.original.classesCount ?? 0, locale)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "usersCount",
        header: t("usersCount"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
              {formatNumber(row.original.usersCount ?? 0, locale)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "phones",
        header: t("columns.phones", { defaultValue: "شماره‌های تماس" }),
        cell: ({ row }) => {
          const phones = row.original.phones
          if (!phones || phones.length === 0) {
            return <span className="text-muted-foreground">—</span>
          }
          return (
            <div
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
              dir={locale === "fa" ? "rtl" : "ltr"}
            >
              <Phone className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate font-mono text-[11px]">
                {phones.join(" • ")}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: t("columns.status"),
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? "success" : "destructive"}
            className="text-[10px]"
          >
            {row.original.isActive ? t("status.active") : t("status.inactive")}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-end">{t("columns.actions")}</div>,
        cell: ({ row }) => {
          const institute = row.original
          const isSelected = activeInstitute?.id === institute.id

          return (
            <div className="flex items-center justify-end gap-1.5">
              {isSelected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 gap-1 border-success/30 bg-success/10 px-2.5 text-xs font-medium text-success opacity-90"
                >
                  <Check className="size-3.5" />
                  <span>{t("currentlyManaging")}</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => handleManage(institute)}
                  className="h-8 cursor-pointer gap-1 px-2.5 text-xs font-medium"
                >
                  <span>{t("manage")}</span>
                  <ActionArrow className="size-3.5" />
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onEdit(institute)}
                className="size-8 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={t("edit")}
                title={t("edit")}
              >
                <Edit2 className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleToggleBlock(institute)}
                className={cn(
                  "size-8 cursor-pointer rounded-lg transition-colors hover:bg-muted",
                  institute.isActive
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-success hover:text-success"
                )}
                aria-label={institute.isActive ? t("block") : t("unblock")}
                title={institute.isActive ? t("block") : t("unblock")}
              >
                {institute.isActive ? (
                  <Ban className="size-3.5 text-muted-foreground" />
                ) : (
                  <ShieldCheck className="size-3.5 text-success" />
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(institute)}
                className="size-8 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={t("delete")}
                title={t("delete")}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
          )
        },
      },
    ],
    [
      t,
      locale,
      activeInstitute?.id,
      handleManage,
      onEdit,
      handleToggleBlock,
      onDelete,
      ActionArrow,
    ]
  )

  if (isLoading) {
    return <TableSkeleton rows={5} />
  }

  if (!institutes || institutes.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Building2 className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("noInstitutes")}</EmptyDescription>
        </EmptyHeader>
        {onAdd && (
          <EmptyContent>
            <Button
              type="button"
              onClick={onAdd}
              className="cursor-pointer gap-2"
            >
              <Plus className="size-4" />
              <span>{t("addInstitute")}</span>
            </Button>
          </EmptyContent>
        )}
      </Empty>
    )
  }

  return <DataTable columns={columns} data={institutes} />
}
