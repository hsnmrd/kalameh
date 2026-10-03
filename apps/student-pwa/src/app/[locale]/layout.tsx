import type { Viewport, Metadata } from "next"
import localFont from "next/font/local"
import { Geist, Geist_Mono } from "next/font/google"
import { notFound } from "next/navigation"
import {
  routing,
  type Locale,
  isRtlLocale,
  getLocaleDirection,
} from "@/i18n/routing"
import { Providers } from "@/components/providers"
import { cn } from "@workspace/ui/lib/utils"
import "@workspace/ui/globals.css"

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kalameh",
  },
}

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })
const yekanBakh = localFont({
  src: [
    {
      path: "../../fonts/YekanBakhFaNum-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/YekanBakhFaNum-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../fonts/YekanBakhFaNum-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../fonts/YekanBakhFaNum-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as Locale)) {
    notFound()
  }

  const isRtl = isRtlLocale(locale)
  const dir = getLocaleDirection(locale)
  const fontVariable = isRtl ? yekanBakh.variable : geist.variable
  const monoVariable = isRtl ? undefined : fontMono.variable

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn("font-sans antialiased", monoVariable, fontVariable)}
    >
      <body className="min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
