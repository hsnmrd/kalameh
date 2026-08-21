import * as React from "react"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages({ locale })
  const authMessages = {
    common: messages.common,
    auth: messages.auth,
  }

  return (
    <NextIntlClientProvider messages={authMessages}>
      {children}
    </NextIntlClientProvider>
  )
}
