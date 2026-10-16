import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function BooksLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, books, courses] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/books.json`),
    import(`@/messages/${locale}/courses.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        books: books.default,
        courses: courses.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
