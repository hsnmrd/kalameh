import * as React from "react"
import { NextIntlClientProvider } from "next-intl"
import { AdminBaseLayout } from "@/components/admin-base-layout"

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const common = (await import(`@/messages/${locale}/common.json`)).default
  const institutes = (await import(`@/messages/${locale}/institutes.json`))
    .default

  return (
    <NextIntlClientProvider locale={locale} messages={{ common, institutes }}>
      <AdminBaseLayout>{children}</AdminBaseLayout>
    </NextIntlClientProvider>
  )
}
