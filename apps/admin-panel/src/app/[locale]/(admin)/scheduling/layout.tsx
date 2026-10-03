import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function SchedulingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, scheduling] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/scheduling.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{ common: common.default, scheduling: scheduling.default }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
