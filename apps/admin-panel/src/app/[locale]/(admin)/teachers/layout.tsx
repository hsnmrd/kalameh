import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function TeachersLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, teachers, classes, scheduling] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/teachers.json`),
    import(`@/messages/${locale}/classes.json`),
    import(`@/messages/${locale}/scheduling.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        teachers: teachers.default,
        classes: classes.default,
        scheduling: scheduling.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
