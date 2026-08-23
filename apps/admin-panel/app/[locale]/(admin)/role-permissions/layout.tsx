import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

export default async function RolePermissionsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [common, rolePermissions] = await Promise.all([
    import(`@/messages/${locale}/common.json`),
    import(`@/messages/${locale}/role-permissions.json`),
  ])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: common.default,
        rolePermissions: rolePermissions.default,
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}
