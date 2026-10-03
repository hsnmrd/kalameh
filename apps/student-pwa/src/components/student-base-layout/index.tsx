"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authResource } from "@/lib/api"
import { usePathname, useRouter } from "@/i18n/routing"
import { StudentToolbar } from "./student-toolbar"
import { StudentBottomNav } from "./student-bottom-nav"

export interface StudentBaseLayoutProps {
  children: React.ReactNode
}

export function StudentBaseLayout({ children }: StudentBaseLayoutProps) {
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

  const handleLogout = () => logoutMutation.mutate()

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-foreground">
      {/* Centered Mobile Container */}
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-background shadow-xs">
        {/* Top Toolbar */}
        <StudentToolbar
          isHomePage={isHomePage}
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
