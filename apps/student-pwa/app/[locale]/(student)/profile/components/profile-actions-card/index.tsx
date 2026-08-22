"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Lock, LogOut } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export interface ProfileActionsCardProps {
  onLogout: () => void
  isLoggingOut?: boolean
  onChangePassword?: () => void
}

export function ProfileActionsCard({
  onLogout,
  isLoggingOut,
  onChangePassword,
}: ProfileActionsCardProps) {
  const t = useTranslations("profile")

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xs">
      <h3 className="text-sm font-semibold text-foreground">
        {t("accountActions")}
      </h3>

      <Button
        type="button"
        variant="outline"
        onClick={onChangePassword}
        className="w-full cursor-pointer justify-start gap-2 border-border text-foreground hover:bg-muted"
      >
        <Lock className="size-4" />
        <span>{t("changePassword")}</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={onLogout}
        disabled={isLoggingOut}
        className="w-full cursor-pointer justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="size-4" />
        <span>{t("logout")}</span>
      </Button>
    </div>
  )
}
