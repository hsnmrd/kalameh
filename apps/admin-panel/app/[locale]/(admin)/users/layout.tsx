import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function UsersLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, users] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/users.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        users: users.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
