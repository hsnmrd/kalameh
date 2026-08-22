import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function ClassesLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [classes, grades] = await Promise.all([
    import(`@/messages/${locale}/classes.json`),
    import(`@/messages/${locale}/grades.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        classes: classes.default,
        grades: grades.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
