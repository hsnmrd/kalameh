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
  const users = (await import(`@/messages/${locale}/users.json`)).default

  return (
    <NextIntlClientProvider locale={locale} messages={{ users }}>
      {children}
    </NextIntlClientProvider>
  )
}
