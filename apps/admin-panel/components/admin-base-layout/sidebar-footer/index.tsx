"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { LogOut } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export interface SidebarFooterProps {
  onLogout: () => void
}

export function SidebarFooter({ onLogout }: SidebarFooterProps) {
  const t = useTranslations("common")

  return (
    <div className="border-t border-slate-100 pt-4">
      <Button
        type="button"
        variant="ghost"
        onClick={onLogout}
        className="flex h-auto w-full cursor-pointer items-center justify-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="size-4 shrink-0" />
        <span>{t("logout")}</span>
      </Button>
    </div>
  )
}
