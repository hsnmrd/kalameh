import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function TermsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const terms = (await import(`@/messages/${locale}/terms.json`)).default

  return (
    <NextIntlClientProvider locale={locale} messages={{ terms }}>
      {children}
    </NextIntlClientProvider>
  )
}
