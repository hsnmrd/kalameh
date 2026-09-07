"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import { Building2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"
import type { InstituteWithStats } from "@workspace/types"
import { InstituteActionMenu } from "../action-menu"

interface CardHeaderProps {
  institute: InstituteWithStats
  isSelected: boolean
  onEdit?: () => void
  onDelete?: () => void
  onToggleBlock: () => void
}

export function CardHeader({
  institute,
  isSelected,
  onEdit,
  onDelete,
  onToggleBlock,
}: CardHeaderProps) {
  const t = useTranslations("institutes")
  const brandColor = institute.primaryColor || null

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold shadow-2xs",
            isSelected
              ? "bg-success text-success-foreground"
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
          <span className="font-mono text-xs text-muted-foreground" dir="ltr">
            {institute.subdomain}.kalameh.ir
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
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
        <InstituteActionMenu
          isActive={institute.isActive}
          onEdit={onEdit}
          onToggleBlock={onToggleBlock}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}
