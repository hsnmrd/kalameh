import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function StudentsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, students, courses, classes] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/students.json`),
    import(`@/messages/${locale}/courses.json`),
    import(`@/messages/${locale}/classes.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        students: students.default,
        courses: courses.default,
        classes: classes.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
