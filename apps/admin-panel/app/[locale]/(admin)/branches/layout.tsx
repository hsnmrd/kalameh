import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function BranchesLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, branches] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/branches.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        branches: branches.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
