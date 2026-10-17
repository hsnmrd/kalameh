"use client"

import * as React from "react"
import Image from "next/image"
import { Phone } from "lucide-react"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"

export interface ProfileSquareHeaderProps {
  fullName: string
  phone: string
  avatarUrl?: string | null
  initials?: string
  topLeftBadge?: React.ReactNode
  topRightBadge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function ProfileSquareHeader({
  fullName,
  phone,
  avatarUrl,
  initials = "U",
  topLeftBadge,
  topRightBadge,
  actions,
  className,
}: ProfileSquareHeaderProps) {
  const assetSrc = avatarUrl ? getAssetUrl(avatarUrl) : null

  return (
    <div
      className={cn(
        "relative aspect-square max-h-[380px] w-full overflow-hidden rounded-3xl border border-border/60 bg-muted/30 shadow-xs",
        className
      )}
    >
      {/* Avatar Image or Fallback Initials */}
      {assetSrc ? (
        <Image
          src={assetSrc}
          alt={fullName}
          fill
          sizes="(max-width: 480px) 100vw, 480px"
          className="object-cover"
          priority
          unoptimized
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 via-muted/40 to-muted/70 text-5xl font-extrabold text-primary">
          <span>{initials}</span>
        </div>
      )}

      {/* Top-Left Badge with Frosted Backdrop Blur */}
      {topLeftBadge && (
        <div className="absolute top-3.5 left-3.5 z-10 flex items-center rounded-full border border-white/25 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white shadow-xs backdrop-blur-md [&_*]:!border-none [&_*]:!bg-transparent [&_*]:!text-white [&_*]:!shadow-none [&_svg]:!text-white">
          {topLeftBadge}
        </div>
      )}

      {/* Top-Right Badge or Actions */}
      {(topRightBadge || actions) && (
        <div className="absolute top-3.5 right-3.5 z-10 flex items-center">
          {topRightBadge || actions}
        </div>
      )}

      {/* Bottom Gradient Shadow with Name & Phone */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-1/2 flex-col justify-end bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 text-white sm:p-5">
        <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-xs sm:text-2xl">
          {fullName}
        </h2>
        <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/90 drop-shadow-xs sm:text-sm">
          <Phone className="size-3.5 shrink-0 text-white/80" />
          <span dir="ltr">{phone}</span>
        </div>
      </div>
    </div>
  )
}
