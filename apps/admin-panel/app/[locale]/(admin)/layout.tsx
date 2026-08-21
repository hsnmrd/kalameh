import * as React from "react"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { AdminBaseLayout } from "@/components/admin-base-layout"

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages({ locale })
  const adminMessages = {
    common: messages.common,
    classes: messages.classes,
    institutes: messages.institutes,
    dashboard: messages.dashboard,
  }

  return (
    <NextIntlClientProvider messages={adminMessages}>
      <AdminBaseLayout>{children}</AdminBaseLayout>
    </NextIntlClientProvider>
  )
}
