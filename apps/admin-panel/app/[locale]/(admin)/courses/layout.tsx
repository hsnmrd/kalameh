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
  const courses = (await import(`@/messages/${locale}/courses.json`)).default

  return (
    <NextIntlClientProvider locale={locale} messages={{ courses }}>
      {children}
    </NextIntlClientProvider>
  )
}
