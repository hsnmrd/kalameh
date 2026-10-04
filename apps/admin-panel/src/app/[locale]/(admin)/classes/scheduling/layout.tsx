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
  const [common, scheduling, classes] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/scheduling.json`),
    import(`@/messages/${locale}/classes.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        scheduling: scheduling.default,
        classes: classes.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
