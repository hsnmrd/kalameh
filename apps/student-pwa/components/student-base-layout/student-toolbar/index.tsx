"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  LogOut,
  Languages,
} from "lucide-react"
import { Link, useRouter, useIsRtl } from "@/i18n/routing"
import { Button } from "@workspace/ui/components/button"
import { ThemeToggle } from "@workspace/ui/components/theme-toggle"

export interface StudentToolbarProps {
  isHomePage: boolean
  locale: string
  onSwitchLanguage: () => void
  onLogout: () => void
  isLogoutPending?: boolean
}

export function StudentToolbar({
  isHomePage,
  locale,
  onSwitchLanguage,
  onLogout,
  isLogoutPending,
}: StudentToolbarProps) {
  const t = useTranslations("common")
  const router = useRouter()
  const isRtl = useIsRtl()
  const BackIcon = isRtl ? ArrowRight : ArrowLeft

  return (
    <header className="relative sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/80 bg-card/95 px-4 backdrop-blur-md">
      {/* Left Action (Back Button on Inner Pages / Language Toggle) */}
      <div className="z-10 flex min-w-9 items-center gap-1.5">
        {!isHomePage ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="size-9 cursor-pointer rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95"
            aria-label={t("back")}
            title={t("back")}
          >
            <BackIcon className="size-5" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSwitchLanguage}
            className="h-8 cursor-pointer gap-1 border-border bg-background px-2 text-xs font-semibold text-foreground hover:bg-muted active:scale-95"
            title={t("language")}
            aria-label={t("language")}
          >
            <Languages className="size-3.5" />
            <span>{locale === "en" ? "FA" : "EN"}</span>
          </Button>
        )}
      </div>

      {/* Centered Logo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Link
          href="/dashboard"
          className="pointer-events-auto flex items-center gap-2 transition-opacity hover:opacity-80 active:scale-95"
          aria-label={t("appName")}
        >
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <BookOpen className="size-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            {t("appName")}
          </span>
        </Link>
      </div>

      {/* Right Action (Theme Toggle, Logout & Language Switcher) */}
      <div className="z-10 flex min-w-9 items-center justify-end gap-1.5">
        <ThemeToggle />

        {!isHomePage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSwitchLanguage}
            className="h-8 cursor-pointer gap-1 border-border bg-background px-2 text-xs font-semibold text-foreground hover:bg-muted active:scale-95"
            title={t("language")}
            aria-label={t("language")}
          >
            <Languages className="size-3.5" />
            <span>{locale === "en" ? "FA" : "EN"}</span>
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onLogout}
          disabled={isLogoutPending}
          className="size-9 cursor-pointer rounded-xl text-muted-foreground hover:bg-muted hover:text-destructive active:scale-95"
          aria-label={t("logout")}
          title={t("logout")}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  )
}
