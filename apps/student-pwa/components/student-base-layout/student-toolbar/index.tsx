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
    <header className="relative sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md">
      {/* Left Action (Back Button on Inner Pages / Language Toggle) */}
      <div className="z-10 flex min-w-9 items-center gap-1.5">
        {!isHomePage ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="size-9 cursor-pointer rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95"
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
            className="h-8 cursor-pointer gap-1 border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95"
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
          <div className="flex size-8 items-center justify-center rounded-xl bg-black text-white shadow-xs">
            <BookOpen className="size-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            {t("appName")}
          </span>
        </Link>
      </div>

      {/* Right Action (Logout & Language Switcher on inner pages) */}
      <div className="z-10 flex min-w-9 items-center justify-end gap-1.5">
        {!isHomePage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSwitchLanguage}
            className="h-8 cursor-pointer gap-1 border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95"
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
          className="size-9 cursor-pointer rounded-xl text-slate-400 hover:bg-slate-100 hover:text-destructive active:scale-95"
          aria-label={t("logout")}
          title={t("logout")}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  )
}
