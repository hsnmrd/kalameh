import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function CoursesLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, courses] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/courses.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        courses: courses.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
