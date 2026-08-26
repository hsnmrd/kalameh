"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"

export interface UserBadgeTriggerProps extends React.ComponentProps<
  typeof Button
> {
  hasActiveInstitute: boolean
  activeInstituteName?: string
  activeInstituteSubdomain?: string
  activeInstituteLogoUrl?: string | null
  userAvatarUrl?: string | null
  fullName: string
  userInitial: string
  roleLabel: string
}

export const UserBadgeTrigger = React.forwardRef<
  HTMLButtonElement,
  UserBadgeTriggerProps
>(function UserBadgeTrigger(
  {
    hasActiveInstitute,
    activeInstituteName,
    activeInstituteSubdomain,
    activeInstituteLogoUrl,
    userAvatarUrl,
    fullName,
    userInitial,
    roleLabel,
    className,
    ...props
  },
  ref
) {
  const t = useTranslations("common")

  const title = hasActiveInstitute ? activeInstituteName : fullName
  const subtitle = hasActiveInstitute
    ? `${activeInstituteSubdomain}.kalameh.ir`
    : roleLabel

  const instituteInitial = activeInstituteName
    ? activeInstituteName.slice(0, 2)
    : "IN"

  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      className={cn(
        "group flex cursor-pointer items-center gap-2.5 rounded-xl border p-1 text-foreground shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden sm:px-2 sm:py-1.5",
        hasActiveInstitute
          ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15"
          : "border-border bg-muted/60 hover:bg-muted",
        className
      )}
      aria-label={t("userProfile.title")}
      {...props}
    >
      <div
        className={cn(
          "relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold shadow-xs"
        )}
      >
        {hasActiveInstitute ? (
          activeInstituteLogoUrl ? (
            <Image
              src={getAssetUrl(activeInstituteLogoUrl)}
              alt={activeInstituteName ?? ""}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <span>{instituteInitial}</span>
          )
        ) : userAvatarUrl ? (
          <Image
            src={getAssetUrl(userAvatarUrl)}
            alt={fullName}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <span>{userInitial}</span>
        )}
      </div>

      <div className="hidden text-start sm:block">
        <p className="max-w-[130px] truncate text-xs leading-tight font-semibold text-foreground">
          {title}
        </p>
        <p className="mt-0.5 max-w-[130px] truncate text-[10px] font-medium text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </Button>
  )
})
