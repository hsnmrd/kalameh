"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Building2, ArrowLeft, ArrowRight, LogOut } from "lucide-react"
import { Link, useRouter, useIsRtl, usePathname } from "@/i18n/routing"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { ThemeToggle } from "@workspace/ui/components/theme-toggle"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"
import { authResource } from "@/lib/api"

export interface StudentToolbarProps {
  isHomePage: boolean
  instituteName?: string
  instituteLogoUrl?: string | null
  pathname?: string
  locale?: string
  onSwitchLanguage?: () => void
  onLogout: () => void
  isLogoutPending?: boolean
  className?: string
}

function getPageTitle(
  pathname: string,
  t: (key: string) => string,
  instituteName?: string
): string {
  if (!pathname || pathname === "/" || pathname === "/dashboard") {
    return instituteName || t("home")
  }
  if (pathname.startsWith("/classes")) {
    return t("classes")
  }
  if (pathname.startsWith("/flashcards")) {
    return t("practice")
  }
  if (pathname.startsWith("/enrollments")) {
    return t("payments")
  }
  if (pathname.startsWith("/profile")) {
    return t("profile")
  }
  if (pathname.startsWith("/setting")) {
    return t("settings")
  }
  return instituteName || t("appName")
}

export function StudentToolbar({
  isHomePage,
  instituteName,
  instituteLogoUrl,
  pathname,
  onLogout,
  isLogoutPending,
  className,
}: StudentToolbarProps) {
  const t = useTranslations("common")
  const router = useRouter()
  const routerPathname = usePathname()
  const effectivePathname = pathname ?? routerPathname
  const isRtl = useIsRtl()
  const BackIcon = isRtl ? ArrowRight : ArrowLeft

  const { data: user } = useQuery(authResource.me.toQuery())
  const displayName = instituteName ?? user?.institute?.name ?? t("appName")
  const logoUrl = instituteLogoUrl ?? user?.institute?.logoUrl
  const logoSrc = logoUrl ? getAssetUrl(logoUrl) : null
  const pageTitle = getPageTitle(effectivePathname, t, displayName)

  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY =
        window.scrollY || document.documentElement.scrollTop
      setIsScrolled(currentScrollY > 10)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 w-full items-center justify-between px-4 transition-all duration-200",
        isScrolled
          ? "border-b border-border bg-card/90 shadow-2xs backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
        className
      )}
    >
      {/* Start Section (Institute Brand on Home, Back Button + Title on Inner Pages) */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
        {isHomePage ? (
          <Link
            href="/dashboard"
            className="flex min-h-11 min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80 active:scale-95"
            aria-label={displayName}
          >
            <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-primary/10 text-primary shadow-xs">
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={displayName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Building2 className="size-5" />
              )}
            </div>
            <span className="truncate text-base font-bold tracking-tight text-foreground sm:text-lg">
              {displayName}
            </span>
          </Link>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="size-11 shrink-0 cursor-pointer rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
              aria-label={t("back")}
              title={t("back")}
            >
              <BackIcon className="size-5" />
            </Button>
            <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {pageTitle}
            </h1>
          </>
        )}
      </div>

      {/* End Section (Theme Toggle + Logout) */}
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle
          labels={{
            light: t("theme.light"),
            dark: t("theme.dark"),
            system: t("theme.system"),
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onLogout}
          disabled={isLogoutPending}
          className="size-11 cursor-pointer rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-destructive active:scale-95"
          aria-label={t("logout")}
          title={t("logout")}
        >
          {isLogoutPending ? (
            <Spinner className="size-4 shrink-0 text-current" />
          ) : (
            <LogOut className="size-5" />
          )}
        </Button>
      </div>
    </header>
  )
}
