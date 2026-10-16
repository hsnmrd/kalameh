"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { BookOpen, ArrowLeft, ArrowRight, LogOut } from "lucide-react"
import { Link, useRouter, useIsRtl, usePathname } from "@/i18n/routing"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { ThemeToggle } from "@workspace/ui/components/theme-toggle"
import { cn } from "@workspace/ui/lib/utils"

export interface StudentToolbarProps {
  isHomePage: boolean
  pathname?: string
  locale?: string
  onSwitchLanguage?: () => void
  onLogout: () => void
  isLogoutPending?: boolean
  className?: string
}

function getPageTitle(pathname: string, t: (key: string) => string): string {
  if (!pathname || pathname === "/" || pathname === "/dashboard") {
    return t("home")
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
  return t("appName")
}

export function StudentToolbar({
  isHomePage,
  pathname,
  onLogout,
  isLogoutPending,
  className,
}: StudentToolbarProps) {
  const t = useTranslations("common")
  const router = useRouter()
  const routerPathname = usePathname()
  const effectivePathname = pathname ?? routerPathname
  const pageTitle = getPageTitle(effectivePathname, t)
  const isRtl = useIsRtl()
  const BackIcon = isRtl ? ArrowRight : ArrowLeft

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
      {/* Start Section (Brand on Home, Back Button + Title on Inner Pages) */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
        {isHomePage ? (
          <Link
            href="/dashboard"
            className="flex min-h-11 items-center gap-2.5 transition-opacity hover:opacity-80 active:scale-95"
            aria-label={t("appName")}
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <BookOpen className="size-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              {t("appName")}
            </span>
          </Link>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="size-11 cursor-pointer rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
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
