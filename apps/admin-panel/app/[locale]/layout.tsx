import { Geist, Geist_Mono, Vazirmatn } from "next/font/google"
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

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
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
  const fontVariable = isRtl ? vazirmatn.variable : geist.variable

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn("font-sans antialiased", fontMono.variable, fontVariable)}
    >
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
