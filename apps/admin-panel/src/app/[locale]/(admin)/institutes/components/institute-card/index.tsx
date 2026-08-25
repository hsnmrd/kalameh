"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  Layers,
  Users,
  Phone,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
  Ban,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
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
import { cn, formatNumber, getAssetUrl } from "@workspace/ui/lib/utils"

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

  const brandColor = institute.primaryColor || null
  const hasPhones = institute.phones && institute.phones.length > 0

  return (
    <ContextMenu>
      <ContextMenuTrigger
        className={cn(
          "flex flex-col justify-between space-y-4 rounded-2xl border bg-card p-6 text-card-foreground shadow-xs transition-all",
          !institute.isActive && "border-destructive/30 bg-card/60 opacity-85",
          isSelected
            ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
            : "border-border hover:border-border/80"
        )}
      >
        <div className="space-y-4">
          {/* Header with Logo / Icon, Name, and Subdomain */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold shadow-2xs",
                  isSelected
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-foreground"
                )}
                style={
                  brandColor && !isSelected
                    ? {
                        backgroundColor: `${brandColor}15`,
                        color: brandColor,
                        borderColor: `${brandColor}40`,
                      }
                    : undefined
                }
              >
                {institute.logoUrl ? (
                  <Image
                    src={getAssetUrl(institute.logoUrl)}
                    alt={institute.name}
                    width={48}
                    height={48}
                    className="size-full object-contain p-1"
                    unoptimized
                  />
                ) : (
                  <Building2 className="size-6" />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="line-clamp-1 text-base font-bold text-foreground">
                  {institute.name}
                </h2>
                <span
                  className="font-mono text-xs text-muted-foreground"
                  dir="ltr"
                >
                  {institute.subdomain}.kalameh.ir
                </span>
              </div>
            </div>

            <Badge
              variant={institute.isActive ? "success" : "destructive"}
              className={cn(
                "shrink-0 text-[11px]",
                !institute.isActive &&
                  "border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15"
              )}
            >
              {institute.isActive ? t("status.active") : t("status.blocked")}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layers className="size-4 text-sky-500" />
              <span>
                <strong className="text-foreground">
                  {formatNumber(institute.classesCount, locale)}
                </strong>{" "}
                {t("classesCount")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4 text-emerald-500" />
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
            <div className="space-y-1.5 border-t border-border/40 pt-3 text-xs text-muted-foreground">
              {hasPhones && (
                <div
                  className="flex items-center gap-2"
                  dir={locale === "fa" ? "rtl" : "ltr"}
                >
                  <Phone className="size-3.5 shrink-0 text-muted-foreground/70" />
                  <span className="truncate font-mono text-[11px]">
                    {institute.phones.join(" • ")}
                  </span>
                </div>
              )}
              {institute.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground/70" />
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
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isSelected ? (
              <>
                <Check className="size-4 text-emerald-600" />
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
        <ContextMenuItem onClick={handleManage}>
          <ExternalLink className="size-4" />
          <span>{t("manageInstitute")}</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onEdit?.(institute)}>
          <Edit2 className="size-4" />
          <span>{t("edit")}</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleToggleBlock()}>
          {institute.isActive ? (
            <>
              <Ban className="size-4 text-amber-500" />
              <span>{t("block")}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="size-4 text-emerald-500" />
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
