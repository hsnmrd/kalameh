import { redirect } from "@/i18n/routing"

export default async function FinancePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect({ href: "/transactions", locale })
}
