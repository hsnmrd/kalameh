"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { authResource } from "@/lib/api"
import { useRouter, usePathname } from "@/i18n/routing"
import { ProfileUserCard } from "./components/profile-user-card"
import { ProfileLanguageCard } from "./components/profile-language-card"
import { ProfileActionsCard } from "./components/profile-actions-card"

export default function StudentProfilePage() {
  const t = useTranslations("profile")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const { data: user } = useQuery(authResource.me.toQuery())

  const logoutMutation = useMutation({
    ...authResource.logout.toMutation(),
    onSettled: () => {
      queryClient.clear()
      router.push("/login")
    },
  })

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : t("title")

  const initial = (user?.firstName?.[0] || "S").toUpperCase()

  const handleSwitchLanguage = (newLocale: "en" | "fa") => {
    if (newLocale !== locale) {
      router.replace(pathname, { locale: newLocale })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-4">
        <ProfileUserCard
          initial={initial}
          fullName={fullName}
          phone={user?.phone || "—"}
          role={user?.role || "STUDENT"}
          isActive={user?.isActive !== false}
        />

        <ProfileLanguageCard
          locale={locale}
          onSwitchLanguage={handleSwitchLanguage}
        />

        <ProfileActionsCard
          onSettings={() => router.push("/setting")}
          onLogout={() => logoutMutation.mutate()}
          isLoggingOut={logoutMutation.isPending}
        />
      </div>
    </div>
  )
}
