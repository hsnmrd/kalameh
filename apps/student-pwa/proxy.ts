import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { routing } from "./i18n/routing"

const intlMiddleware = createMiddleware(routing)

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore static assets
  const isPublicStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")

  if (isPublicStatic) {
    return NextResponse.next()
  }

  const localeMatch = pathname.match(/^\/(en|fa)(\/.*)?$/)
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value
  const isValidCookieLocale =
    cookieLocale &&
    (routing.locales as readonly string[]).includes(cookieLocale)

  const locale: string =
    localeMatch && localeMatch[1]
      ? localeMatch[1]
      : isValidCookieLocale && cookieLocale
        ? cookieLocale
        : routing.defaultLocale

  const pathWithoutLocale = pathname.replace(/^\/(en|fa)/, "") || "/"

  const isAuthPage = pathWithoutLocale.startsWith("/login")
  const accessToken = request.cookies.get("access_token")?.value

  const createRedirectResponse = (url: URL) => {
    const response = NextResponse.redirect(url)
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
    return response
  }

  // If user is not authenticated and trying to access protected page
  if (!accessToken && !isAuthPage) {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    return createRedirectResponse(loginUrl)
  }

  // If user is authenticated and trying to access login page or root "/"
  if (accessToken && (isAuthPage || pathWithoutLocale === "/")) {
    const defaultUrl = new URL(`/${locale}/dashboard`, request.url)
    return createRedirectResponse(defaultUrl)
  }

  const response = intlMiddleware(request)
  const explicitLocale = localeMatch?.[1]
  if (explicitLocale) {
    response.cookies.set("NEXT_LOCALE", explicitLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
