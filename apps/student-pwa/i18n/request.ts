import { getRequestConfig } from "next-intl/server"
import { routing, type Locale } from "./routing"

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale
  }

  const [common, auth, dashboard, classes, flashcards, enrollments, profile] =
    await Promise.all([
      import(`../messages/${locale}/common.json`),
      import(`../messages/${locale}/auth.json`),
      import(`../messages/${locale}/dashboard.json`),
      import(`../messages/${locale}/classes.json`),
      import(`../messages/${locale}/flashcards.json`),
      import(`../messages/${locale}/enrollments.json`),
      import(`../messages/${locale}/profile.json`),
    ])

  return {
    locale,
    messages: {
      common: common.default,
      auth: auth.default,
      dashboard: dashboard.default,
      classes: classes.default,
      flashcards: flashcards.default,
      enrollments: enrollments.default,
      profile: profile.default,
    },
  }
})
