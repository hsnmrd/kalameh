import { redirect } from "@/i18n/routing"

/**
 * Localized index route (/[locale]).
 * Redirects authenticated visitors to the primary student dashboard (/dashboard).
 */
export default async function StudentLocaleIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect({ href: "/dashboard", locale })
}
