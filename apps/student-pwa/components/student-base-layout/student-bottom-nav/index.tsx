"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Home, Layers, Sparkles, CreditCard, User } from "lucide-react"
import { Link } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"

export type NavTranslationKey =
  "home" | "classes" | "practice" | "payments" | "profile"

export interface BottomNavItem {
  key: NavTranslationKey
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export const STUDENT_BOTTOM_NAV: BottomNavItem[] = [
  { key: "home", href: "/dashboard", icon: Home },
  { key: "classes", href: "/classes", icon: Layers },
  { key: "practice", href: "/flashcards", icon: Sparkles },
  { key: "payments", href: "/enrollments", icon: CreditCard },
  { key: "profile", href: "/profile", icon: User },
]

export interface StudentBottomNavProps {
  pathname: string
}

export function StudentBottomNav({ pathname }: StudentBottomNavProps) {
  const t = useTranslations("common")

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-30 mx-auto w-full max-w-[480px] border-t border-border/80 bg-card/95 px-2 py-1.5 backdrop-blur-md"
      aria-label={t("appName")}
    >
      <div className="grid grid-cols-5 items-center">
        {STUDENT_BOTTOM_NAV.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard" || pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl py-1 text-center transition-all active:scale-95",
                isActive
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform",
                  isActive && "scale-110 stroke-[2.5]"
                )}
              />
              <span className="text-[11px] font-medium tracking-tight">
                {t(item.key)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
