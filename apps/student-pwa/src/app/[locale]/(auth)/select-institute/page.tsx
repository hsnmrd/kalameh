"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { ThemeToggle } from "@workspace/ui/components/theme-toggle"
import { authResource } from "@/lib/api"
import { useRouter, usePathname, Link, useIsRtl } from "@/i18n/routing"
import { ArrowRight, ArrowLeft, BookOpen, Languages } from "lucide-react"
import type { UserInstituteOption } from "@workspace/types"
import { InstituteCard } from "./components/institute-card"

export default function SelectInstitutePage() {
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
      const isStudent =
        data.user?.role === "STUDENT" || data.user?.role === "SUPER_STUDENT"

      if (!isStudent) {
        logoutMutation.mutate(undefined)
        toast.error(t("staffNotAllowed"))
        return
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pending_auth")
      }

      queryClient.setQueryData(authResource.me.toQuery().queryKey, data.user)
      toast.success(t("loginSuccess"))
      router.push("/dashboard")
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
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Centered Mobile Container */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background shadow-xs">
        {/* Top Toolbar */}
        <header className="relative sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/80 bg-card/95 px-4 backdrop-blur-md">
          {/* Left Action (Back button & Language Switcher) */}
          <div className="z-10 flex min-w-9 items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBackToLogin}
              className="h-8 cursor-pointer gap-1 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              title={t("selectInstitute.backToLogin")}
              aria-label={t("selectInstitute.backToLogin")}
            >
              <BackArrow className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSwitchLanguage}
              className="h-8 cursor-pointer gap-1 border-border bg-background px-2 text-xs font-semibold text-foreground hover:bg-muted active:scale-95"
              title={tCommon("language")}
              aria-label={tCommon("language")}
            >
              <Languages className="size-3.5" />
              <span>{locale === "en" ? "FA" : "EN"}</span>
            </Button>
          </div>

          {/* Centered Logo */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Link
              href="/login"
              className="pointer-events-auto flex items-center gap-2 transition-opacity hover:opacity-80 active:scale-95"
              aria-label={tCommon("appName")}
            >
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <BookOpen className="size-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">
                {tCommon("appName")}
              </span>
            </Link>
          </div>

          {/* Right Action (Theme Toggle) */}
          <div className="z-10 flex min-w-9 items-center justify-end">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Area */}
        <main className="flex flex-1 flex-col gap-6 px-4 py-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("selectInstitute.title")}
            </h1>
            <p className="text-[15px] text-muted-foreground">
              {t("selectInstitute.description")}
            </p>
          </div>

          {/* List of Institutes */}
          <div className="flex flex-col gap-3">
            {authData.institutes.map((inst) => (
              <InstituteCard
                key={inst.id}
                institute={inst}
                onSelect={handleSelect}
                isLoading={
                  loginMutation.isPending && selectedInstituteId === inst.id
                }
              />
            ))}
          </div>

          {/* Back button */}
          <Button
            type="button"
            variant="ghost"
            onClick={handleBackToLogin}
            className="mt-2 h-14 w-full rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span>{t("selectInstitute.backToLogin")}</span>
          </Button>

          {/* Footer */}
          <footer className="mt-auto pt-4 text-center text-xs text-muted-foreground">
            {tCommon("footer")}
          </footer>
        </main>
      </div>
    </div>
  )
}
