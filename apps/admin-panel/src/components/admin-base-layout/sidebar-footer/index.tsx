"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Download, LogOut } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { usePwaContext } from "@/components/pwa-provider"

export interface SidebarFooterProps {
  onLogout: () => void
  onSwitchLanguage?: () => void
  locale?: string
}

export function SidebarFooter({ onLogout }: SidebarFooterProps) {
  const t = useTranslations("common")
  const { isInstallable, installApp } = usePwaContext()

  return (
    <div className="flex flex-col gap-1 border-t border-sidebar-border/60 pt-4">
      {isInstallable && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => installApp()}
          className="flex h-auto w-full cursor-pointer items-center justify-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Download className="size-4 shrink-0 text-sidebar-foreground" />
          <span>{t("pwa.install")}</span>
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        onClick={onLogout}
        className="flex h-auto w-full cursor-pointer items-center justify-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="size-4 shrink-0 text-destructive" />
        <span>{t("logout")}</span>
      </Button>
    </div>
  )
}
