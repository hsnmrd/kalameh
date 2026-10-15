"use client"

import * as React from "react"
import Image from "next/image"
import { Phone } from "lucide-react"
import { getAssetUrl, cn } from "@workspace/ui/lib/utils"

export interface ProfileSquareHeaderProps {
  fullName: string
  phone: string
  avatarUrl?: string | null
  initials?: string
  topLeftBadge?: React.ReactNode
  topRightBadge?: React.ReactNode
  actions?: React.ReactNode
  desktopSecondaryInfo?: React.ReactNode
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
  desktopSecondaryInfo,
  className,
}: ProfileSquareHeaderProps) {
  const assetSrc = avatarUrl ? getAssetUrl(avatarUrl) : null

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Mobile Square Profile Header (< lg) - Full width edge-to-edge out of container */}
      <div className="relative -mx-4 -mt-4 aspect-square w-[calc(100%+2rem)] overflow-hidden rounded-none border-b border-border/60 bg-muted/30 shadow-none sm:mx-0 sm:mt-0 sm:w-full sm:rounded-3xl sm:border sm:shadow-xs lg:hidden">
        {/* Avatar Image or Fallback */}
        {assetSrc ? (
          <Image
            src={assetSrc}
            alt={fullName}
            fill
            sizes="(max-width: 1024px) 100vw, 450px"
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
          <div className="absolute top-3.5 left-3.5 z-10 flex items-center rounded-full border border-white/25 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md [&_*]:!border-none [&_*]:!bg-transparent [&_*]:!text-white [&_*]:!shadow-none [&_svg]:!text-white">
            {topLeftBadge}
          </div>
        )}

        {/* Top-Right Quick Actions */}
        {actions && (
          <div className="absolute top-3.5 right-3.5 z-10 flex items-center">
            {actions}
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

      {/* Desktop Profile Header (lg+) - Clean, no card wrapper */}
      <div className="hidden w-full items-center justify-between gap-6 pb-2 lg:flex">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-muted/40 shadow-2xs">
            {assetSrc ? (
              <Image
                src={assetSrc}
                alt={fullName}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 via-muted/40 to-muted/70 text-2xl font-bold text-primary">
                {initials}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {fullName}
              </h2>
              {topLeftBadge}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium">
                <Phone className="size-3.5 text-muted-foreground" />
                <span dir="ltr">{phone}</span>
              </div>
              {desktopSecondaryInfo}
            </div>
          </div>
        </div>

        {/* Desktop Actions */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}
