"use client"

import * as React from "react"
import Image from "next/image"
import { Building2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { useIsRtl } from "@/i18n/routing"
import type { UserInstituteOption } from "@workspace/types"

export interface InstituteCardProps {
  institute: UserInstituteOption
  onSelect: (institute: UserInstituteOption) => void
  isLoading?: boolean
}

export function InstituteCard({
  institute,
  onSelect,
  isLoading,
}: InstituteCardProps) {
  const isRtl = useIsRtl()
  const Chevron = isRtl ? ChevronLeft : ChevronRight
  const logoSrc = institute.logoUrl ? getAssetUrl(institute.logoUrl) : null

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => onSelect(institute)}
      disabled={isLoading}
      className="flex h-auto w-full items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-4 text-start transition-all hover:border-primary/50 hover:bg-muted/40 active:scale-[0.98]"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-muted/30 text-muted-foreground">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={institute.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <Building2 className="size-6 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">
            {institute.name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {institute.subdomain}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-center text-muted-foreground">
        {isLoading ? (
          <Spinner className="size-5 text-foreground" />
        ) : (
          <Chevron className="size-5 text-muted-foreground" />
        )}
      </div>
    </Button>
  )
}
