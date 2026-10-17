"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ShieldCheck, Settings } from "lucide-react"
import { authResource } from "@/lib/api"
import { useRouter, usePathname } from "@/i18n/routing"
import type { SupportedLocale } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { ProfileSquareHeader } from "@/components/profile-square-header"
import { ProfileInfoCard } from "./components/profile-info-card"
import { ProfileAcademicCard } from "./components/profile-academic-card"
import { ProfileContactCard } from "./components/profile-contact-card"
import { ProfileLanguageCard } from "./components/profile-language-card"
import { ProfileLogoutButton } from "./components/profile-logout-button"

export default function StudentProfilePage() {
  const t = useTranslations("profile")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery(authResource.me.toQuery())

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
      : user?.phone || t("title")

  const initial = (
    user?.firstName?.[0] ||
    user?.phone?.[0] ||
    "S"
  ).toUpperCase()

  const handleSwitchLanguage = (newLocale: SupportedLocale) => {
    if (newLocale !== locale) {
      router.replace(pathname, { locale: newLocale })
    }
  }

  const formattedCreatedDate = user?.createdAt
    ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(user.createdAt))
    : null

  const formattedBirthDate = user?.studentProfile?.birthDate
    ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(user.studentProfile.birthDate))
    : null

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Profile Square Header (Mobile aspect-square banner matching admin-panel) */}
      <ProfileSquareHeader
        fullName={fullName}
        phone={user?.phone || "—"}
        avatarUrl={user?.avatarUrl}
        initials={initial}
        topLeftBadge={
          <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <ShieldCheck className="size-3.5 text-white" />
            <span>
              {user?.isActive !== false ? t("active") : t("suspended")}
            </span>
          </span>
        }
      />

      {/* Information Cards Stack */}
      <div className="flex flex-col gap-4">
        {/* Personal Details */}
        <ProfileInfoCard
          fullName={fullName}
          nationalCode={user?.nationalCode}
          fatherName={user?.studentProfile?.fatherName}
          birthDate={formattedBirthDate}
          gender={user?.studentProfile?.gender}
        />

        {/* Academic & Institute Details */}
        <ProfileAcademicCard
          instituteName={user?.institute?.name}
          role={user?.role || "STUDENT"}
          isActive={user?.isActive !== false}
          memberSince={formattedCreatedDate}
        />

        {/* Contact Information */}
        <ProfileContactCard
          phone={user?.phone || "—"}
          emergencyPhone={user?.studentProfile?.emergencyPhone}
          address={user?.studentProfile?.address}
        />

        {/* Language Selection */}
        <ProfileLanguageCard
          locale={locale}
          onSwitchLanguage={handleSwitchLanguage}
        />

        {/* Settings Navigation Shortcut */}
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/setting")}
          className="h-14 w-full cursor-pointer justify-start gap-3 rounded-2xl border-border bg-card px-5 text-base font-medium text-foreground hover:bg-muted"
        >
          <Settings className="size-5 text-muted-foreground" />
          <span>{t("settings")}</span>
        </Button>

        {/* Logout Option at the End of the Page */}
        <ProfileLogoutButton
          onLogout={() => logoutMutation.mutate()}
          isLoggingOut={logoutMutation.isPending}
        />
      </div>
    </div>
  )
}
