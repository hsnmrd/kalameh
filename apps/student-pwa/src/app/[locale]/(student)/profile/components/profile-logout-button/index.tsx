"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { LogOut } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

export interface ProfileLogoutButtonProps {
  onLogout: () => void
  isLoggingOut?: boolean
  className?: string
}

export function ProfileLogoutButton({
  onLogout,
  isLoggingOut,
  className,
}: ProfileLogoutButtonProps) {
  const t = useTranslations("profile")

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onLogout}
      disabled={isLoggingOut}
      className="h-14 w-full cursor-pointer justify-center gap-2.5 rounded-2xl border border-destructive/30 bg-transparent text-base font-semibold text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
      aria-label={t("logout")}
    >
      {isLoggingOut ? (
        <Spinner className="size-5 shrink-0 text-current" />
      ) : (
        <LogOut className="size-5 shrink-0 text-destructive" />
      )}
      <span>{t("logout")}</span>
    </Button>
  )
}
