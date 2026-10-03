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
  const [common, institutes] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/institutes.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        institutes: institutes.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
