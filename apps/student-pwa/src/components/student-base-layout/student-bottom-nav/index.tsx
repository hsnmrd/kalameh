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
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-[calc(5.5rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-background via-background/80 to-transparent"
      />
      <nav
        aria-label={t("appName")}
        className="fixed inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-40 mx-auto max-w-md rounded-[50px] border border-border bg-card/80 shadow-lg backdrop-blur-md"
      >
        <div className="grid h-16 auto-cols-fr grid-flow-col items-stretch px-1">
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
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] leading-3 font-medium transition-colors",
                  isActive
                    ? "font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="relative">
                  <Icon
                    className={cn(
                      "size-5 transition-transform",
                      isActive && "stroke-[2.5]"
                    )}
                    aria-hidden
                  />
                </span>
                <span className="max-w-full truncate">{t(item.key)}</span>
                {isActive && (
                  <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
