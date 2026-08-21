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
  const dashboard = (await import(`@/messages/${locale}/dashboard.json`))
    .default

  return (
    <NextIntlClientProvider locale={locale} messages={{ dashboard }}>
      {children}
    </NextIntlClientProvider>
  )
}
