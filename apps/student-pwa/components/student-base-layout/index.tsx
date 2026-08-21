"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authResource } from "@/lib/api"
import { usePathname, useRouter } from "@/i18n/routing"
import { StudentToolbar } from "./student-toolbar"
import { StudentBottomNav } from "./student-bottom-nav"

export interface StudentBaseLayoutProps {
  children: React.ReactNode
}

export function StudentBaseLayout({ children }: StudentBaseLayoutProps) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isHomePage = pathname === "/dashboard" || pathname === "/"

  const logoutMutation = useMutation({
    ...authResource.logout.toMutation(),
    onSettled: () => {
      queryClient.clear()
      router.push("/login")
    },
  })

  const handleSwitchLanguage = () => {
    const nextLocale = locale === "en" ? "fa" : "en"
    router.replace(pathname, { locale: nextLocale })
  }

  const handleLogout = () => logoutMutation.mutate()

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Centered Mobile Container */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-slate-50 shadow-xs">
        {/* Top Toolbar */}
        <StudentToolbar
          isHomePage={isHomePage}
          locale={locale}
          onSwitchLanguage={handleSwitchLanguage}
          onLogout={handleLogout}
          isLogoutPending={logoutMutation.isPending}
        />

        {/* Scrollable Page Content Area */}
        <main className="flex-1 px-4 py-6 pb-24">{children}</main>

        {/* Bottom Navigation Bar */}
        <StudentBottomNav pathname={pathname} />
      </div>
    </div>
  )
}
