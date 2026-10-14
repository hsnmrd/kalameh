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
  const [common, courses, books] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/courses.json`),
    import(`@/messages/${locale}/books.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        courses: courses.default,
        books: books.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
