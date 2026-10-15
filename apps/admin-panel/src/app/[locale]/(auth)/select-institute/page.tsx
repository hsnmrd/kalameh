"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { ThemeToggle } from "@workspace/ui/components/theme-toggle"
import { authResource } from "@/lib/api"
import { useRouter, usePathname, useIsRtl } from "@/i18n/routing"
import {
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
  Languages,
} from "lucide-react"
import type { UserInstituteOption } from "@workspace/types"
import { InstituteCard } from "./components/institute-card"

export default function AdminSelectInstitutePage() {
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const isRtl = useIsRtl()
  const queryClient = useQueryClient()

  const [authData, setAuthData] = React.useState<{
    phone: string
    password: string
    institutes: UserInstituteOption[]
  } | null>(null)
  const [selectedInstituteId, setSelectedInstituteId] = React.useState<
    string | null
  >(null)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem("pending_auth")
      if (!raw) {
        router.replace("/login")
        return
      }
      try {
        const parsed = JSON.parse(raw)
        if (!parsed.phone || !parsed.password || !parsed.institutes?.length) {
          router.replace("/login")
          return
        }
        setAuthData(parsed)
      } catch {
        router.replace("/login")
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logoutMutation = useMutation({
    ...authResource.logout.toMutation(),
  })

  const loginMutation = useMutation({
    ...authResource.login.toMutation(),
    onSuccess: (data) => {
      const isStaffOrAdmin =
        data.user?.role !== "STUDENT" && data.user?.role !== "TEACHER"

      if (!isStaffOrAdmin) {
        logoutMutation.mutate(undefined)
        toast.error(t("studentNotAllowed"))
        return
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pending_auth")
      }

      queryClient.setQueryData(authResource.me.toQuery().queryKey, data.user)
      toast.success(t("loginSuccess"))
      router.push("/")
    },
    onError: () => {
      setSelectedInstituteId(null)
    },
  })

  const handleSelect = (institute: UserInstituteOption) => {
    if (!authData) return
    setSelectedInstituteId(institute.id)
    loginMutation.mutate({
      phone: authData.phone,
      password: authData.password,
      instituteId: institute.id,
    })
  }

  const handleBackToLogin = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("pending_auth")
    }
    router.push("/login")
  }

  const handleSwitchLanguage = () => {
    const nextLocale = locale === "en" ? "fa" : "en"
    router.replace(pathname, { locale: nextLocale })
  }

  const BackArrow = isRtl ? ArrowRight : ArrowLeft

  if (!authData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  return (
    <main className="grid min-h-screen w-full grid-cols-1 bg-background font-sans text-foreground antialiased lg:grid-cols-2">
      {/* Branding Panel (Desktop Only) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-e border-sidebar-border bg-sidebar p-12 text-sidebar-foreground lg:flex xl:p-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <GraduationCap className="size-6" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              {tCommon("appName")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSwitchLanguage}
              className="h-8 cursor-pointer gap-1.5 border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted active:scale-95"
            >
              <Languages className="size-3.5" />
              <span>{locale === "en" ? "FA" : "EN"}</span>
            </Button>
          </div>
        </div>

        <div className="my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/50 px-3.5 py-1.5 text-xs font-medium text-foreground backdrop-blur-xs">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>{t("badge")}</span>
          </div>
          <h1 className="text-3xl leading-tight font-bold tracking-tight text-foreground xl:text-4xl">
            {t("brandingTitle")}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("brandingDesc")}
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
          <span>{t("securityNotice")}</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16">
        {/* Mobile Header Bar */}
        <header className="flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <GraduationCap className="size-5" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              {tCommon("appName")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSwitchLanguage}
              className="h-8 cursor-pointer gap-1 border-border bg-background px-2.5 text-xs font-semibold text-foreground hover:bg-muted active:scale-95"
            >
              <Languages className="size-3.5" />
              <span>{locale === "en" ? "FA" : "EN"}</span>
            </Button>
          </div>
        </header>

        {/* Content Container */}
        <div className="mx-auto my-auto flex w-full max-w-md flex-col gap-6">
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBackToLogin}
              className="-ms-2 mb-4 h-8 cursor-pointer gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <BackArrow className="size-3.5 text-muted-foreground" />
              <span>{t("selectInstitute.backToLogin")}</span>
            </Button>

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {t("selectInstitute.title")}
              </h2>
              <p className="text-[15px] text-muted-foreground">
                {t("selectInstitute.description")}
              </p>
            </div>
          </div>

          {/* Institute List */}
          <div className="flex flex-col gap-3">
            {authData.institutes.map((institute) => (
              <InstituteCard
                key={institute.id}
                institute={institute}
                onSelect={handleSelect}
                isLoading={
                  loginMutation.isPending &&
                  selectedInstituteId === institute.id
                }
              />
            ))}
          </div>
        </div>

        {/* Footer info placeholder */}
        <div className="hidden lg:block" />
      </section>
    </main>
  )
}
