import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, auth] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/auth.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        auth: auth.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
