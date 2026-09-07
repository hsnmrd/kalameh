"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Layers,
  Users,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  Ban,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@workspace/ui/components/context-menu"
import { toast } from "@workspace/ui/components/sonner"
import type { InstituteWithStats } from "@workspace/types"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { useRouter, useIsRtl } from "@/i18n/routing"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { CardHeader } from "./card-header"

export interface InstituteCardProps {
  institute: InstituteWithStats
  onEdit?: (institute: InstituteWithStats) => void
  onDelete?: (institute: InstituteWithStats) => void
}

export function InstituteCard({
  institute,
  onEdit,
  onDelete,
}: InstituteCardProps) {
  const t = useTranslations("institutes")
  const locale = useLocale()
  const isRtl = useIsRtl()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { activeInstitute, selectInstitute, setActiveInstitute } =
    useActiveInstitute()

  const isSelected = activeInstitute?.id === institute.id
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  const handleManage = () => {
    selectInstitute(institute)
    router.push("/")
  }

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
      if (activeInstitute?.id === institute.id) {
        setActiveInstitute(updated)
      }
    },
  })

  const handleToggleBlock = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    toggleStatusMutation.mutate({
      id: institute.id,
      body: {
        isActive: !institute.isActive,
      },
    })
  }

  const hasPhones = institute.phones && institute.phones.length > 0

  return (
    <ContextMenu>
      <ContextMenuTrigger
        className={cn(
          "flex flex-col justify-between gap-4 rounded-2xl border bg-card p-6 text-card-foreground shadow-xs transition-all",
          !institute.isActive && "border-destructive/30 bg-card/60 opacity-85",
          isSelected
            ? "border-success shadow-md ring-2 ring-success/20"
            : "border-border hover:border-border/80"
        )}
      >
        <div className="flex flex-col gap-4">
          <CardHeader
            institute={institute}
            isSelected={isSelected}
            onEdit={onEdit ? () => onEdit(institute) : undefined}
            onToggleBlock={() => handleToggleBlock()}
            onDelete={onDelete ? () => onDelete(institute) : undefined}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layers className="size-4 text-muted-foreground" />
              <span>
                <strong className="text-foreground">
                  {formatNumber(institute.classesCount, locale)}
                </strong>{" "}
                {t("classesCount")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4 text-muted-foreground" />
              <span>
                <strong className="text-foreground">
                  {formatNumber(institute.usersCount, locale)}
                </strong>{" "}
                {t("usersCount")}
              </span>
            </div>
          </div>

          {/* Contact Snippet (Phones & Address) */}
          {(hasPhones || institute.address) && (
            <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3 text-xs text-muted-foreground">
              {hasPhones && (
                <div
                  className="flex items-center gap-2"
                  dir={locale === "fa" ? "rtl" : "ltr"}
                >
                  <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-mono text-[11px]">
                    {institute.phones.join(" • ")}
                  </span>
                </div>
              )}
              {institute.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-1 text-[11px]">
                    {institute.address}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="border-t border-border/60 pt-4">
          <Button
            type="button"
            variant={isSelected ? "secondary" : "default"}
            onClick={handleManage}
            className={cn(
              "h-10 w-full cursor-pointer justify-center gap-2 rounded-xl text-xs font-semibold",
              isSelected
                ? "border border-success/30 bg-success/10 text-success hover:bg-success/20"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isSelected ? (
              <>
                <Check className="size-4 text-success" />
                <span>{t("currentlyManaging")}</span>
              </>
            ) : (
              <>
                <span>{t("manageInstitute")}</span>
                <ActionArrow className="size-4" />
              </>
            )}
          </Button>
        </div>
      </ContextMenuTrigger>

      {/* Context Menu for rich right-click / contextual actions */}
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onEdit?.(institute)}>
          <Edit2 className="size-4" />
          <span>{t("edit")}</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleToggleBlock()}>
          {institute.isActive ? (
            <>
              <Ban className="size-4" />
              <span>{t("block")}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="size-4" />
              <span>{t("unblock")}</span>
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={() => onDelete?.(institute)}
        >
          <Trash2 className="size-4" />
          <span>{t("delete")}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
