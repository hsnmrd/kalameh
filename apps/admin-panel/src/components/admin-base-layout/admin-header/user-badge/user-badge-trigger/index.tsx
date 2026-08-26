"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"

export interface UserBadgeTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  hasActiveInstitute: boolean
  activeInstituteName?: string
  activeInstituteSubdomain?: string
  activeInstituteLogoUrl?: string | null
  activeInstitutePrimaryColor?: string | null
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
    activeInstitutePrimaryColor,
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
  const instituteInitial = activeInstituteName
    ? activeInstituteName.slice(0, 2)
    : "IN"

  const imageSrc = hasActiveInstitute
    ? activeInstituteLogoUrl
      ? getAssetUrl(activeInstituteLogoUrl)
      : null
    : userAvatarUrl
      ? getAssetUrl(userAvatarUrl)
      : null

  const fallbackInitial = hasActiveInstitute ? instituteInitial : userInitial

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "relative flex aspect-square size-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border shadow-xs transition-all select-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden active:scale-95",
        hasActiveInstitute
          ? "border-emerald-500/40 bg-emerald-600 text-white"
          : "border-border bg-primary text-primary-foreground",
        className
      )}
      style={
        hasActiveInstitute && activeInstitutePrimaryColor
          ? {
              backgroundColor: activeInstitutePrimaryColor,
              borderColor: `${activeInstitutePrimaryColor}60`,
              color: "#ffffff",
            }
          : undefined
      }
      aria-label={t("userProfile.title")}
      {...props}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={title ?? ""}
          fill
          unoptimized
          className="size-full object-cover"
        />
      ) : (
        <span className="text-xs font-bold">{fallbackInitial}</span>
      )}
    </button>
  )
})
