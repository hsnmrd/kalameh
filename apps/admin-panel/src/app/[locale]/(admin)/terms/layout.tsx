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
  const [common, terms] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/terms.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        terms: terms.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
