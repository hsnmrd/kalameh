"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Lock, LogOut, Settings, Smartphone } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { usePwaContext } from "@/components/pwa-provider"

export interface ProfileActionsCardProps {
  onLogout: () => void
  isLoggingOut?: boolean
  onChangePassword?: () => void
  onSettings?: () => void
}

export function ProfileActionsCard({
  onLogout,
  isLoggingOut,
  onChangePassword,
  onSettings,
}: ProfileActionsCardProps) {
  const t = useTranslations("profile")
  const commonT = useTranslations("common")
  const { isInstallable, installApp } = usePwaContext()

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xs">
      <h3 className="text-sm font-semibold text-foreground">
        {t("accountActions")}
      </h3>

      {isInstallable && (
        <Button
          type="button"
          variant="outline"
          onClick={() => void installApp()}
          className="w-full cursor-pointer justify-start gap-2 border-border text-foreground hover:bg-muted"
        >
          <Smartphone className="size-4 text-primary" />
          <span>{commonT("pwa.install")}</span>
        </Button>
      )}

      {onSettings && (
        <Button
          type="button"
          variant="outline"
          onClick={onSettings}
          className="w-full cursor-pointer justify-start gap-2 border-border text-foreground hover:bg-muted"
        >
          <Settings className="size-4 text-muted-foreground" />
          <span>{t("settings")}</span>
        </Button>
      )}

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
