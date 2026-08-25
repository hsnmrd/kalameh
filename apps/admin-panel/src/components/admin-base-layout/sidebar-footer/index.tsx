"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { LogOut, Languages } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ThemeToggle } from "@workspace/ui/components/theme-toggle"

export interface SidebarFooterProps {
  onLogout: () => void
  onSwitchLanguage?: () => void
  locale?: string
}

export function SidebarFooter({
  onLogout,
  onSwitchLanguage,
  locale,
}: SidebarFooterProps) {
  const t = useTranslations("common")

  return (
    <div className="space-y-3 border-t border-sidebar-border/60 pt-4">
      {onSwitchLanguage && (
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSwitchLanguage}
            className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 border-sidebar-border bg-sidebar text-xs font-semibold text-sidebar-foreground hover:bg-sidebar-accent active:scale-95"
            aria-label={t("language")}
          >
            <Languages className="size-3.5 shrink-0" />
            <span>{locale === "en" ? "فارسی" : "English"}</span>
          </Button>
        </div>
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
