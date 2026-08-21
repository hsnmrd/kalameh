import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function ClassesLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const classes = (await import(`@/messages/${locale}/classes.json`)).default

  return (
    <NextIntlClientProvider locale={locale} messages={{ classes }}>
      {children}
    </NextIntlClientProvider>
  )
}
