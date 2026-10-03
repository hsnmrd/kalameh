import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function TransactionsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, transactions] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/transactions.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        transactions: transactions.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
