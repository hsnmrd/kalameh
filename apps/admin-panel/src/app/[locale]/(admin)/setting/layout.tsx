import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function SettingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, setting] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/setting.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        setting: setting.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
