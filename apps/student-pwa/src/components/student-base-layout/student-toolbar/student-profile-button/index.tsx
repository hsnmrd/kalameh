"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"
import type { AuthUser } from "@workspace/types"

export interface StudentProfileButtonProps {
  user?: Partial<AuthUser> | null
  isActive?: boolean
  className?: string
}

export function StudentProfileButton({
  user,
  isActive,
  className,
}: StudentProfileButtonProps) {
  const t = useTranslations("common")
  const [hasImageError, setHasImageError] = React.useState(false)

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.phone || t("profile")

  const initial = (
    user?.firstName?.[0] ||
    user?.phone?.[0] ||
    "S"
  ).toUpperCase()

  const avatarSrc =
    user?.avatarUrl && !hasImageError ? getAssetUrl(user.avatarUrl) : null

  return (
    <Link
      href="/profile"
      data-testid="student-toolbar-profile-btn"
      aria-label={t("profile")}
      title={fullName}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all select-none hover:opacity-90 active:scale-95",
        className
      )}
    >
      <div
        className={cn(
          "relative flex size-9 items-center justify-center overflow-hidden rounded-full border shadow-xs transition-all",
          isActive
            ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
            : "border-border hover:border-foreground/30",
          "bg-primary font-bold text-primary-foreground"
        )}
      >
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={fullName}
            fill
            unoptimized
            className="size-full object-cover"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <span className="text-xs font-bold">{initial}</span>
        )}
      </div>
    </Link>
  )
}
