import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function InstitutesLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const institutes = (await import(`@/messages/${locale}/institutes.json`))
    .default

  return (
    <NextIntlClientProvider locale={locale} messages={{ institutes }}>
      {children}
    </NextIntlClientProvider>
  )
}
