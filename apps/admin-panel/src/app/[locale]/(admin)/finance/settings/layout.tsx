import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function FinancialSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, transactions, institutes] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/transactions.json`),
    import(`@/messages/${locale}/institutes.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        transactions: transactions.default,
        institutes: institutes.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
