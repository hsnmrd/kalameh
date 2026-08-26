"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Building2, Edit2, Trash2, ShieldCheck, Ban, Check } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import { Badge } from "@workspace/ui/components/badge"
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
  ContextMenuSeparator,
} from "@workspace/ui/components/context-menu"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty"
import type { InstituteWithStats } from "@workspace/types"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { useRouter } from "@/i18n/routing"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"

export interface InstitutesListProps {
  institutes: InstituteWithStats[] | undefined
  isLoading: boolean
  onEdit: (institute: InstituteWithStats) => void
  onDelete: (institute: InstituteWithStats) => void
}

export function InstitutesList({
  institutes,
  isLoading,
  onEdit,
  onDelete,
}: InstitutesListProps) {
  const t = useTranslations("institutes")
  const router = useRouter()
  const queryClient = useQueryClient()
  const { activeInstitute, selectInstitute, setActiveInstitute } =
    useActiveInstitute()

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

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
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
      </Empty>
    )
  }

  const handleSelect = (institute: InstituteWithStats) => {
    selectInstitute(institute)
    router.push("/")
  }

  const handleToggleBlock = (institute: InstituteWithStats) => {
    toggleStatusMutation.mutate({
      id: institute.id,
      body: {
        isActive: !institute.isActive,
      },
    })
  }

  return (
    <MobileList>
      {institutes.map((institute, index) => {
        const isSelected = activeInstitute?.id === institute.id
        const initial = institute.name ? institute.name.slice(0, 2) : "IN"
        const brandColor = institute.primaryColor || null

        return (
          <ContextMenu key={institute.id}>
            <ContextMenuTrigger>
              <MobileListItem
                onClick={() => handleSelect(institute)}
                isLast={index === institutes.length - 1}
                className={cn(isSelected && "bg-emerald-500/5 font-semibold")}
              >
                <MobileListItemIcon>
                  <div
                    className={cn(
                      "relative flex aspect-square size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold shadow-xs",
                      !brandColor && "bg-emerald-600 text-white"
                    )}
                    style={
                      brandColor
                        ? { backgroundColor: brandColor, color: "#ffffff" }
                        : undefined
                    }
                  >
                    {institute.logoUrl ? (
                      <Image
                        src={getAssetUrl(institute.logoUrl)}
                        alt={institute.name}
                        fill
                        unoptimized
                        className="size-full object-cover"
                      />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                </MobileListItemIcon>

                <MobileListItemContent
                  primary={
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{institute.name}</span>
                      {isSelected && (
                        <Check className="size-3.5 shrink-0 text-emerald-600" />
                      )}
                    </div>
                  }
                  secondary={`${institute.subdomain}.kalameh.ir`}
                />

                <MobileListItemTrailing>
                  <Badge
                    variant={institute.isActive ? "success" : "destructive"}
                    className="shrink-0 text-[10px]"
                  >
                    {institute.isActive
                      ? t("status.active")
                      : t("status.inactive")}
                  </Badge>
                </MobileListItemTrailing>
              </MobileListItem>
            </ContextMenuTrigger>

            <ContextMenuContent>
              <ContextMenuItem onSelect={() => handleSelect(institute)}>
                <Building2 className="me-2 size-4 text-muted-foreground" />
                {t("manage")}
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => onEdit(institute)}>
                <Edit2 className="me-2 size-4 text-muted-foreground" />
                {t("edit")}
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => handleToggleBlock(institute)}>
                {institute.isActive ? (
                  <>
                    <Ban className="me-2 size-4 text-destructive" />
                    <span className="text-destructive">{t("block")}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="me-2 size-4 text-emerald-600" />
                    <span>{t("unblock")}</span>
                  </>
                )}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onSelect={() => onDelete(institute)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="me-2 size-4 text-destructive" />
                {t("delete")}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )
      })}
    </MobileList>
  )
}
