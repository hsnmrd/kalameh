"use client"

import * as React from "react"
import {
  ThemeProvider as NextThemesProvider,
  useTheme,
  type ThemeProviderProps as NextThemesProviderProps,
} from "next-themes"

export interface ThemeProviderProps extends NextThemesProviderProps {
  themeColorLight?: string
  themeColorDark?: string
  syncThemeColor?: boolean
}

function ThemeColorMeta({
  light = "#f8fafc",
  dark = "#0f172a",
}: {
  light?: string
  dark?: string
}) {
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    if (typeof document === "undefined") return
    const isDark = resolvedTheme === "dark"
    const color = isDark ? dark : light

    const metaTags = document.querySelectorAll('meta[name="theme-color"]')
    if (metaTags.length > 0) {
      metaTags.forEach((tag) => tag.setAttribute("content", color))
    } else {
      const meta = document.createElement("meta")
      meta.setAttribute("name", "theme-color")
      meta.setAttribute("content", color)
      document.head.appendChild(meta)
    }
  }, [resolvedTheme, light, dark])

  return null
}

export function ThemeProvider({
  children,
  themeColorLight = "#f8fafc",
  themeColorDark = "#0f172a",
  syncThemeColor = true,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {syncThemeColor && (
        <ThemeColorMeta light={themeColorLight} dark={themeColorDark} />
      )}
      {children}
    </NextThemesProvider>
  )
}
