"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"

export type NavItemKey =
  | "dashboard"
  | "institutes"
  | "classes"
  | "terms"
  | "courses"
  | "students"
  | "staff"
  | "finance"

export interface NavItem {
  key: NavItemKey
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export interface NavListProps {
  items: NavItem[]
  pathname: string
  onItemClick?: () => void
}

export function NavList({ items, pathname, onItemClick }: NavListProps) {
  const t = useTranslations("common.nav")

  return (
    <nav className="space-y-1.5">
      {items.map((item) => {
        const Icon = item.icon
        const isActive =
          item.href === "/"
            ? pathname === "/" || pathname === ""
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{t(item.key)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
