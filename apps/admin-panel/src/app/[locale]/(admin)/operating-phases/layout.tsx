import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function OperatingPhasesLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, operatingPhases] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/operating-phases.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        "operating-phases": operatingPhases.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
