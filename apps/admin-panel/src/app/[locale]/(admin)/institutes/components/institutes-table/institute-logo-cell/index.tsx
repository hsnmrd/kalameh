"use client"

import * as React from "react"
import Image from "next/image"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"

export interface InstituteLogoCellProps {
  name: string
  logoUrl?: string | null
  primaryColor?: string | null
  className?: string
}

export function InstituteLogoCell({
  name,
  logoUrl,
  primaryColor,
  className,
}: InstituteLogoCellProps) {
  const [failedImageSrc, setFailedImageSrc] = React.useState<string | null>(
    null
  )
  const initial = name ? Array.from(name.trim())[0] || "I" : "I"
  const imageSrc = logoUrl ? getAssetUrl(logoUrl) : null
  const showImage = Boolean(imageSrc && failedImageSrc !== imageSrc)

  return (
    <div
      className={cn(
        "relative flex aspect-square size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold shadow-xs",
        !primaryColor && "bg-success text-success-foreground",
        className
      )}
      style={
        primaryColor
          ? { backgroundColor: primaryColor, color: "#ffffff" }
          : undefined
      }
    >
      {showImage ? (
        <Image
          src={imageSrc!}
          alt={name}
          fill
          unoptimized
          className="size-full object-cover"
          onError={() => setFailedImageSrc(imageSrc)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )
}
