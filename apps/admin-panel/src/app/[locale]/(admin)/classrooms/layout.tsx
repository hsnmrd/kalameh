import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function ClassroomsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, classrooms] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/classrooms.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        classrooms: classrooms.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
