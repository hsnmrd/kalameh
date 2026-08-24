import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, dashboard] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/dashboard.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        dashboard: dashboard.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
